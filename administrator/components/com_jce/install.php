<?php

/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('_JEXEC') or die('RESTRICTED');

// try to set time limit
@set_time_limit(0);

abstract class WFInstall {
    public static function install($installer) {
        error_reporting(E_ERROR | E_WARNING);

        $app = JFactory::getApplication();

        // load languages
        $language = JFactory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);
        $language->load('com_jce.sys', JPATH_ADMINISTRATOR, null, true);

        // get manifest
        $manifest = $installer->getManifest();
        $new_version = (string) $manifest->version;

        // Joomla! 1.5
        if (!defined('JPATH_PLATFORM') && !$new_version) {
            $new_version = (string) $manifest->document->getElementByPath('version')->data();
        }

        $state = false;

        // the current version
        $current_version = $installer->get('current_version');

        // install profiles etc.
        $state = self::installProfiles();

        // perform upgrade
        if (version_compare($current_version, $new_version, '<')) {
            $state = self::upgrade($current_version);
        }

        // Add device column
        if (self::checkTableColumn('#__wf_profiles', 'device') === false) {
            $db = JFactory::getDBO();

            switch (strtolower($db->name)) {
                case 'mysql':
                case 'mysqli':
                    $query = 'ALTER TABLE #__wf_profiles CHANGE `description` `description` TEXT';
                    $db->setQuery($query);
                    $db->query();

                    // Change types field to TEXT
                    $query = 'ALTER TABLE #__wf_profiles CHANGE `types` `types` TEXT';
                    $db->setQuery($query);
                    $db->query();

                    // Add device field - MySQL
                    $query = 'ALTER TABLE #__wf_profiles ADD `device` VARCHAR(255) AFTER `area`';

                    break;
                case 'sqlsrv':
                case 'sqlazure':
                case 'sqlzure':
                    $query = 'ALTER TABLE #__wf_profiles ADD `device` NVARCHAR(250)';
                    break;
                case 'postgresql':
                    $query = 'ALTER TABLE #__wf_profiles ADD "device" character varying(255) NOT NULL';
                    break;
            }

            $db->setQuery($query);
            $db->query();
        }

        if ($state) {
            $message  = '<div class="ui-jce">';
            $message .= '   <h2>' . JText::_('WF_ADMIN_TITLE') . ' ' . $new_version . '</h2>';
            $message .= '   <div>' . JText::_('WF_ADMIN_DESC') . '</div>';

            // install additional packages for Joomla 1.5
            if (!defined('JPATH_PLATFORM')) {
                // install packages
                $manifest = $installer->getPath('manifest');
                $packages = dirname($manifest) . '/packages';
                
                if (is_dir($packages)) {
                    self::installPackages($packages);
                }
            }
            
            $message .= '</div>';

            $installer->set('message', $message);

            // post-install
            self::addIndexfiles(array(
                __DIR__, 
                JPATH_SITE . '/components/com_jce', 
                JPATH_PLUGINS . '/content/jce', 
                JPATH_PLUGINS . '/editors/jce', 
                JPATH_PLUGINS . '/extension/jce',
                JPATH_PLUGINS . '/installer/jce',
                JPATH_PLUGINS . '/quickicon/jce',
                JPATH_PLUGINS . '/system/jce'
            ));
        } else {
            $installer->abort();
            return false;
        }

        return $state;
    }

    private static function loadXMLFile($file) {
        $xml = null;

        // Disable libxml errors and allow to fetch error information as needed
        libxml_use_internal_errors(true);

        if (is_file($file)) {
            // Try to load the xml file
            $xml = simplexml_load_file($file);
        }

        return $xml;
    }

    private static function installProfile($name) {
        $db = JFactory::getDBO();

        $query = $db->getQuery(true);

        if (is_object($query)) {
            $query->select('COUNT(id)')->from('#__wf_profiles')->where('name = ' . $db->Quote($name));
        } else {
            $query = 'SELECT COUNT(id) FROM #__wf_profiles WHERE name = ' . $db->Quote($name);
        }

        $db->setQuery($query);
        $id = $db->loadResult();

        if (!$id) {
            // Blogger
            $file = JPATH_ADMINISTRATOR . '/components/com_jce/models/profiles.xml';

            $xml = self::loadXMLFile($file);

            if ($xml) {
                foreach ($xml->profiles->children() as $profile) {
                    if ((string) $profile->attributes()->name == $name) {
                        $row = JTable::getInstance('profiles', 'WFTable');

                        require_once(JPATH_ADMINISTRATOR . '/components/com_jce/models/profiles.php');
                        $groups = WFModelProfiles::getUserGroups((int) $profile->children('area'));

                        foreach ($profile->children() as $item) {
                            switch ((string) $item->getName()) {
                                case 'types':
                                    $row->types = implode(',', $groups);
                                    break;
                                case 'area':
                                    $row->area = (int) $item;
                                    break;
                                case 'rows':
                                    $row->rows = (string) $item;
                                    break;
                                case 'plugins':
                                    $row->plugins = (string) $item;
                                    break;
                                default:
                                    $key = $item->getName();
                                    $row->$key = (string) $item;

                                    break;
                            }
                        }
                        $row->store();
                    }
                }
            }
        }
    }

    /**
     * Upgrade database tables and remove legacy folders
     * @return Boolean
     */
    private static function upgrade($version) {
        $app = JFactory::getApplication();
        $db = JFactory::getDBO();

        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        $admin = JPATH_ADMINISTRATOR . '/components/com_jce';
        $site = JPATH_SITE . '/components/com_jce';

        // add tables path
        JTable::addIncludePath($admin . '/tables');

        $files = array(
            $admin . '/adapters/extension.php',
            $admin . '/adapters/language.php',
            $admin . '/classes/jsmin.php',
            $admin . '/classes/jspacker.php',
            $admin . '/controller/installer.php',
            $admin . '/helpers/system.php',
            $admin . '/helpers/tools.php',
            $admin . '/media/css/colorpicker.css',
            $admin . '/media/css/extensions.css',
            $admin . '/media/css/global.css',
            $admin . '/media/css/help.css',
            $admin . '/media/css/icons.css',
            $admin . '/media/css/installer.css',
            $admin . '/media/css/jquery',
            $admin . '/media/css/layout.css',
            $admin . '/media/css/legend.css',
            $admin . '/media/css/profiles.css',
            $admin . '/media/css/select.css',
            $admin . '/media/css/styles.css',
            $admin . '/media/css/tips.css',
            $admin . '/media/css/upload.css',
            $admin . '/media/img/cpanel.png',
            $admin . '/media/img/list_label_bg.gif',
            $admin . '/media/img/menu/jce-config.png',
            $admin . '/media/img/menu/jce-cpanel.png',
            $admin . '/media/img/menu/jce-install.png',
            $admin . '/media/img/menu/jce-profiles.png',
            $admin . '/media/img/toolbar.png',
            $admin . '/media/img/error.png',
            $admin . '/media/img/glyphicons-halflings-white.png',
            $admin . '/media/img/glyphicons-halflings.png',
            $admin . '/media/img/spacer.gif',
            $admin . '/media/img/tick.png',
            $admin . '/media/js/browser.js',
            $admin . '/media/js/checklist.js',
            $admin . '/media/js/colorpicker.js',
            $admin . '/media/js/extensions.js',
            $admin . '/media/js/help.js',
            $admin . '/media/js/html5.js',
            $admin . '/media/js/core.js',
            $admin . '/media/js/installer.js',
            $admin . '/media/js/profile.js',
            $admin . '/media/js/jce.js',
            $admin . '/media/js/jquery',
            $admin . '/media/js/legend.js', 
            $admin . '/media/js/parameter.js',
            $admin . '/media/js/profiles.js',
            $admin . '/media/js/select.js',
            $admin . '/media/js/tips.js',
            $admin . '/media/js/uploads.js',
            $admin . '/models/installer.php',
            $admin . '/models/installer.xml',
            $admin . '/classes/lessc.inc.php',

            $site . '/editor/elements/mediaplayer.php',
            $site . '/editor/extensions/popups/jcemediabox/css/window.css',
            $site . '/editor/libraries/css/dialog.css',
            $site . '/editor/libraries/css/editor.css',
            $site . '/editor/libraries/css/files.css',
            $site . '/editor/libraries/css/plugin.css',
            $site . '/editor/libraries/css/popup.css',
            $site . '/editor/libraries/css/reset.css',
            $site . '/editor/libraries/css/theme.css',
            $site . '/editor/libraries/css/tree.css',
            $site . '/editor/libraries/css/upload.css',
            $site . '/editor/libraries/js/editor.js',
            $site . '/editor/libraries/js/extensions',
            $site . '/editor/libraries/js/extensions.js',
            $site . '/editor/libraries/js/plugin.js',
            $site . '/editor/libraries/js/tiny_mce_utils.js',
            $site . '/editor/libraries/js/tree.js',
            $site . '/editor/libraries/js/upload.js',
            $site . '/editor/tiny_mce/plugins/article/article.php',
            $site . '/editor/tiny_mce/plugins/article/classes/article.php',
            $site . '/editor/tiny_mce/plugins/article/css/pagebreak.css',
            $site . '/editor/tiny_mce/plugins/inlinepopups/css/dialog.css',
            $site . '/editor/tiny_mce/plugins/searchreplace/tmpl/search.php',
            $site . '/editor/tiny_mce/plugins/spellchecker/classes/googlespell.php',
            $site . '/editor/tiny_mce/plugins/spellchecker/classes/pspellshell.php',
            $site . '/editor/tiny_mce/plugins/xhtmlxtras/tmpl/attributes.php',
            $site . '/editor/tiny_mce/themes/advanced/img/icons.gif',
            $site . '/editor/tiny_mce/themes/advanced/img/layout.png',
            $site . '/editor/tiny_mce/themes/advanced/langs/de.js',
            $site . '/editor/tiny_mce/themes/advanced/langs/de_dlg.js',
            $site . '/editor/tiny_mce/themes/advanced/langs/en_dlg.js',
            $site . '/editor/tiny_mce/themes/advanced/shortcuts.htm',
            $site . '/editor/tiny_mce/themes/advanced/skins/default/img/items.gif',
            $site . '/editor/tiny_mce/themes/advanced/theme.php',
            $site . '/editor/tiny_mce/themes/advanced/tmpl/anchor.php',
            $site . '/popup.php'
        );
        
        $folders = array(
            $admin . '/models/legend.php',
            $admin . '/plugin',
            $admin . '/views/installer',
            $admin . '/views/legend',

            $site . '/controller',
            $site . '/editor/extensions/browser',
            $site . '/editor/extensions/links/docmanlinks',
            $site . '/editor/libraries/js/extensions',
            $site . '/editor/libraries/plupload',
            $site . '/editor/tiny_mce/langs',
            $site . '/editor/tiny_mce/plugins/article/js',
            $site . '/editor/tiny_mce/plugins/article/langs',
            $site . '/editor/tiny_mce/plugins/article/tmpl',
            $site . '/editor/tiny_mce/plugins/browser/langs',
            $site . '/editor/tiny_mce/plugins/imgmanager/langs',
            $site . '/editor/tiny_mce/plugins/link/langs',
            $site . '/editor/tiny_mce/plugins/paste',
            $site . '/editor/tiny_mce/plugins/searchreplace/langs',
            $site . '/editor/tiny_mce/plugins/style/langs',
            $site . '/editor/tiny_mce/plugins/table/langs',
            $site . '/editor/tiny_mce/plugins/visualchars/css',
            $site . '/editor/tiny_mce/plugins/visualchars/img',
            $site . '/editor/tiny_mce/plugins/xhtmlxtras/langs',
            $site . '/editor/tiny_mce/themes/advanced/css',
            $site . '/editor/tiny_mce/themes/advanced/js',
            $site . '/editor/tiny_mce/themes/advanced/skins/classic',
            $site . '/editor/tiny_mce/themes/advanced/skins/highcontrast'
        );

        foreach ($folders as $folder) {
            if (JFolder::exists($folder)) {
              if (!JFolder::delete($folder)) {
                  $app->enqueueMessage('Unable to delete folder: ' . $folder, 'error');
              }
            }
        }

        foreach ($files as $file) {
            if (JFile::exists($file)) {
                if (!JFile::delete($file)) {
                  $app->enqueueMessage('Unable to delete file: ' . $file, 'error');
                }
            }
        }

        // 2.1 - Add visualblocks plugin
        if (version_compare($version, '2.1', '<')) {
            $profiles = self::getProfiles();
            $profile = JTable::getInstance('Profiles', 'WFTable');

            if (!empty($profiles)) {
                foreach ($profiles as $item) {
                    $profile->load($item->id);

                    if (strpos($profile->rows, 'visualblocks') === false) {
                        $profile->rows = str_replace('visualchars', 'visualchars,visualblocks', $profile->rows);
                    }
                    if (strpos($profile->plugins, 'visualblocks') === false) {
                        $profile->plugins = str_replace('visualchars', 'visualchars,visualblocks', $profile->plugins);
                    }

                    $profile->store();
                }
            }
        }

        // 2.1.1 - Add anchor plugin
        if (version_compare($version, '2.1.1', '<')) {
            $profiles = self::getProfiles();
            $profile = JTable::getInstance('Profiles', 'WFTable');

            if (!empty($profiles)) {
                foreach ($profiles as $item) {
                    $profile->load($item->id);

                    // add anchor to end of plugins list
                    if (strpos($profile->rows, 'anchor') !== false) {
                        $profile->plugins .= ',anchor';
                    }

                    $profile->store();
                }
            }
        }

        // 2.2.1 - Add "Blogger" profile
        if (version_compare($version, '2.2.1', '<')) {
            self::installProfile('Blogger');
        }

        // 2.2.1 to 2.2.5 - Remove K2Links partial install
        if (version_compare($version, '2.2.1', '>') && version_compare($version, '2.2.5', '<')) {
            $path = $site . '/editor/extensions/links';

            if (is_file($path . '/k2links.php') && is_file($path . '/k2links.xml') && !is_dir($path . '/k2links')) {
                @JFile::delete($path . '/k2links.php');
                @JFile::delete($path . '/k2links.xml');
            }
        }

        // replace some profile row items
        if (version_compare($version, '2.2.8', '<')) {
            $profiles = self::getProfiles();
            $profile = JTable::getInstance('Profiles', 'WFTable');

            if (!empty($profiles)) {
                foreach ($profiles as $item) {
                    $profile->load($item->id);

                    $profile->rows = str_replace('paste', 'clipboard', $profile->rows);
                    $profile->plugins = str_replace('paste', 'clipboard', $profile->plugins);

                    $data = json_decode($profile->params, true);

                    // swap paste data to 'clipboard'
                    if ($data && array_key_exists('paste', $data)) {
                        $params = array();

                        // add 'paste_' prefix
                        foreach ($data['paste'] as $k => $v) {
                            $params['paste_' . $k] = $v;
                        }

                        // remove paste parameters
                        unset($data['paste']);

                        // assign new params to clipboard
                        $data['clipboard'] = $params;
                    }

                    $profile->params = json_encode($data);

                    $profile->store();
                }
            }
        }

        if (version_compare($version, '2.3.0beta', '<')) {
            // add Mobile profile
            self::installProfile('Mobile');
        }

        if (version_compare($version, '2.2.9', '<') || version_compare($version, '2.3.0beta3', '<')) {
            $profiles = self::getProfiles();
            $profile = JTable::getInstance('Profiles', 'WFTable');

            if (!empty($profiles)) {
                foreach ($profiles as $item) {
                    $profile->load($item->id);

                    $buttons = array('buttons' => array());

                    if (strpos($profile->rows, 'numlist') !== false) {
                        $buttons['buttons'][] = 'numlist';

                        $profile->rows = str_replace('numlist', 'lists', $profile->rows);
                    }

                    if (strpos($profile->rows, 'bullist') !== false) {
                        $buttons['buttons'][] = 'bullist';

                        if (strpos($profile->rows, 'lists') === false) {
                            $profile->rows = str_replace('bullist', 'lists', $profile->rows);
                        }
                    }
                    // remove bullist and numlist
                    $profile->rows = str_replace(array('bullist', 'numlist'), '', $profile->rows);
                    // replace multiple commas with a single one
                    $profile->rows = preg_replace('#,+#', ',', $profile->rows);
                    // fix rows
                    $profile->rows = str_replace(',;', ';', $profile->rows);

                    if (!empty($buttons['buttons'])) {
                        $profile->plugins .= ',lists';

                        $data = json_decode($profile->params, true);
                        $data['lists'] = $buttons;

                        $profile->params = json_encode($data);

                        $profile->store();
                    }
                }
            }
        }
        // transfer charmap to a plugin
        if (version_compare($version, '2.3.2', '<')) {
            $profiles = self::getProfiles();
            $table = JTable::getInstance('Profiles', 'WFTable');

            if (!empty($profiles)) {
                foreach ($profiles as $item) {
                    $table->load($item->id);

                    if (strpos($table->rows, 'charmap') !== false) {
                        $table->plugins .= ',charmap';
                        $table->store();
                    }
                }
            }
        }

        // transfer styleselect, fontselect, fontsize etc. to a plugin
        if (version_compare($version, '2.3.5', '<')) {
            $profiles = self::getProfiles();
            $table = JTable::getInstance('Profiles', 'WFTable');

            if (!empty($profiles)) {
                foreach ($profiles as $item) {
                    $table->load($item->id);

                    $plugins = explode(',', $table->plugins);

                    if (strpos($table->rows, 'formatselect') !== false) {
                        $plugins[] = 'formatselect';
                    }

                    if (strpos($table->rows, 'styleselect') !== false) {
                        $plugins[] = 'styleselect';
                    }

                    if (strpos($table->rows, 'fontselect') !== false) {
                        $plugins[] = 'fontselect';
                    }

                    if (strpos($table->rows, 'fontsizeselect') !== false) {
                        $plugins[] = 'fontsizeselect';
                    }

                    if (strpos($table->rows, 'forecolor') !== false || strpos($table->rows, 'backcolor') !== false) {
                        $plugins[] = 'fontcolor';
                    }

                    $table->plugins = implode(',', $plugins);

                    $table->store();
                }
            }
        }

        // transfer hr to a plugin
        if (version_compare($version, '2.5.8', '<')) {
            $profiles = self::getProfiles();
            $table = JTable::getInstance('Profiles', 'WFTable');

            if (!empty($profiles)) {
                foreach ($profiles as $item) {
                    $table->load($item->id);

                    $plugins = explode(',', $table->plugins);

                    if (strpos($table->rows, 'hr') !== false) {
                        $plugins[] = 'hr';
                    }

                    $table->plugins = implode(',', $plugins);

                    $table->store();
                }
            }
        }

        return true;
    }

    private static function getProfiles() {
        $db = JFactory::getDBO();

        $query = $db->getQuery(true);

        if (is_object($query)) {
            $query->select('id')->from('#__wf_profiles');
        } else {
            $query = 'SELECT id FROM #__wf_profiles';
        }

        $db->setQuery($query);
        return $db->loadObjectList();
    }

    private static function createProfilesTable() {
        include_once (dirname(__FILE__) . '/includes/base.php');
        include_once (dirname(__FILE__) . '/models/profiles.php');

        $profiles = new WFModelProfiles();

        if (method_exists($profiles, 'createProfilesTable')) {
            return $profiles->createProfilesTable();
        }

        return false;
    }

    private static function installProfiles() {
        include_once (dirname(__FILE__) . '/includes/base.php');
        include_once (dirname(__FILE__) . '/models/profiles.php');

        $profiles = new WFModelProfiles();

        if (method_exists($profiles, 'installProfiles')) {
            return $profiles->installProfiles();
        }

        return false;
    }

    /**
     * Install additional packages
     * @return Array or false
     * @param object $path[optional] Path to package folder
     */
    private static function installPackages($source) {
        jimport('joomla.installer.installer');

        $db = JFactory::getDBO();

        JTable::addIncludePath(JPATH_LIBRARIES . '/joomla/database/table');

        $packages = array(
            'editors'   => array('jce'),
            'module'    => array('mod_jce_quickicon')
        );

        foreach ($packages as $folder => $element) {
            $installer = new JInstaller();
            $installer->setOverwrite(true);

            $language = JFactory::getLanguage();

            if ($installer->install($source . '/' . $folder)) {
                // enable module
                if ($folder == 'module') {
                    $module = JTable::getInstance('module');

                    $query = 'SELECT id FROM #__modules' . ' WHERE module = ' . $db->Quote($folder);
                    $db->setQuery($query);
                    $id = $db->loadResult();

                    $module->load($id);
                    $module->position = 'icon';
                    $module->ordering = 100;
                    $module->published = 1;
                    $module->store();
                }

                // rename editor manifest
                if ($folder == 'editor') {
                    $manifest = $installer->getPath('manifest');

                    if (basename($manifest) == 'legacy.xml') {
                        // rename legacy.xml to jce.xml
                        JFile::move($installer->getPath('extension_root') . '/' . basename($manifest), $installer->getPath('extension_root') . '/jce.xml');
                    }
                }
            }
        }

        return $result;
    }

    private static function addIndexfiles($paths) {
        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        // get the base file
        $file = JPATH_ADMINISTRATOR . '/components/com_jce/index.html';

        if (is_file($file)) {

            foreach ((array) $paths as $path) {
                if (is_dir($path)) {
                    // admin component
                    $folders = JFolder::folders($path, '.', true, true);

                    foreach ($folders as $folder) {
                        JFile::copy($file, $folder . '/' . basename($file));
                    }
                }
            }
        }
    }

    private static function checkTable($table) {
        $db = JFactory::getDBO();

        $tables = $db->getTableList();

        if (!empty($tables)) {
            // swap array values with keys, convert to lowercase and return array keys as values
            $tables = array_keys(array_change_key_case(array_flip($tables)));
            $app = JFactory::getApplication();
            $match = str_replace('#__', strtolower($app->getCfg('dbprefix', '')), $table);

            return in_array($match, $tables);
        }

        // try with query
        $query = $db->getQuery(true);

        if (is_object($query)) {
            $query->select('COUNT(id)')->from($table);
        } else {
            $query = 'SELECT COUNT(id) FROM ' . $table;
        }

        $db->setQuery($query);

        return $db->query();
    }

    /**
     * Check table contents
     * @return integer
     * @param string $table Table name
     */
    private static function checkTableContents($table) {
        $db = JFactory::getDBO();

        $query = $db->getQuery(true);

        if (is_object($query)) {
            $query->select('COUNT(id)')->from($table);
        } else {
            $query = 'SELECT COUNT(id) FROM ' . $table;
        }

        $db->setQuery($query);

        return $db->loadResult();
    }

    private static function checkTableColumn($table, $column) {
        $db = JFactory::getDBO();

        // use built in function
        if (method_exists($db, 'getTableColumns')) {
            $fields = $db->getTableColumns($table);
        } else {
            $db->setQuery('DESCRIBE ' . $table);
            if (method_exists($db, 'loadColumn')) {
                $fields = $db->loadColumn();
            } else {
                $fields = $db->loadResultArray();
            }

            // we need to check keys not values
            $fields = array_flip($fields);
        }

        return array_key_exists($column, $fields);
    }

}

?>
