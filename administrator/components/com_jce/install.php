<?php

/**
 * @copyright     Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

// try to set time limit
@set_time_limit(0);

abstract class WFInstall
{
    public static function install($installer)
    {
        error_reporting(E_ERROR | E_WARNING);

        $app = JFactory::getApplication();

        // load languages
        $language = JFactory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);
        $language->load('com_jce.sys', JPATH_ADMINISTRATOR, null, true);

        // get manifest
        $manifest = $installer->getManifest();
        $new_version = (string) $manifest->version;

        $state = false;

        // the current version
        $current_version = $installer->get('current_version');

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

        // install profiles etc.
        $state = self::installProfiles();

        // perform upgrade
        if (version_compare($current_version, $new_version, '<')) {
            $state = self::upgrade($current_version);
        }

        if ($state) {
            $message = '<div class="ui-jce">';
            $message .= '   <h2>'.JText::_('COM_JCE').' '.$new_version.'</h2>';
            $message .= '   <div>'.JText::_('COM_JCE_XML_DESCRIPTION').'</div>';
            $message .= '</div>';

            $installer->set('message', $message);

            // post-install
            self::addIndexfiles(array(
                __DIR__,
                JPATH_SITE.'/components/com_jce',
                JPATH_PLUGINS.'/content/jce',
                JPATH_PLUGINS.'/editors/jce',
                JPATH_PLUGINS.'/extension/jce',
                JPATH_PLUGINS.'/installer/jce',
                JPATH_PLUGINS.'/quickicon/jce',
                JPATH_PLUGINS.'/system/jce',
            ));
        } else {
            $installer->abort();

            return false;
        }

        return $state;
    }

    private static function loadXMLFile($file)
    {
        $xml = null;

        // Disable libxml errors and allow to fetch error information as needed
        libxml_use_internal_errors(true);

        if (is_file($file)) {
            // Try to load the xml file
            $xml = simplexml_load_file($file);
        }

        return $xml;
    }

    private static function installProfile($name)
    {
        $db = JFactory::getDBO();

        $query = $db->getQuery(true);

        if (is_object($query)) {
            $query->select('COUNT(id)')->from('#__wf_profiles')->where('name = '.$db->Quote($name));
        } else {
            $query = 'SELECT COUNT(id) FROM #__wf_profiles WHERE name = '.$db->Quote($name);
        }

        $db->setQuery($query);
        $id = $db->loadResult();

        if (!$id) {
            // Blogger
            $file = JPATH_ADMINISTRATOR.'/components/com_jce/models/profiles.xml';

            $xml = self::loadXMLFile($file);

            if ($xml) {
                foreach ($xml->profiles->children() as $profile) {
                    if ((string) $profile->attributes()->name == $name) {
                        $row = JTable::getInstance('profiles', 'WFTable');

                        require_once JPATH_ADMINISTRATOR.'/components/com_jce/models/profiles.php';
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
                                case 'checked_out_time':
                                    $row->checked_out_time = $db->getNullDate();
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
     * Upgrade database tables and remove legacy folders.
     *
     * @return bool
     */
    private static function upgrade($version)
    {
        $app = JFactory::getApplication();
        $db = JFactory::getDBO();

        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        $admin = JPATH_ADMINISTRATOR.'/components/com_jce';
        $site = JPATH_SITE.'/components/com_jce';

        // add tables path
        JTable::addIncludePath($admin.'/tables');

        $files = array(
            $admin.'/adapters/language.php',
            $admin.'/classes/lessc.inc.php',
            $admin.'/controller/installer.php',
            $admin.'/install.script.php',
            $admin.'/media/css/global.css',
            $admin.'/media/css/install.css',
            $admin.'/media/css/installer.css',
            $admin.'/media/css/profiles.css',
            $admin.'/media/css/upload.css',
            $admin.'/media/img/cpanel.png',
            $admin.'/media/img/error.png',
            $admin.'/media/img/glyphicons-halflings-white.png',
            $admin.'/media/img/glyphicons-halflings.png',
            $admin.'/media/img/list_label_bg.gif',
            $admin.'/media/img/menu/jce-config.png',
            $admin.'/media/img/menu/jce-cpanel.png',
            $admin.'/media/img/menu/jce-install.png',
            $admin.'/media/img/menu/jce-profiles.png',
            $admin.'/media/img/spacer.gif',
            $admin.'/media/img/tick.png',
            $admin.'/media/js/browser.js',
            $admin.'/media/js/core.js',
            $admin.'/media/js/installer.js',
            $admin.'/media/js/profile.js',
            $admin.'/media/js/uploads.js',
            $admin.'/models/installer.php',
            $admin.'/models/installer.xml',
            $admin.'/models/plugins.xml',
            $admin.'/models/commands.xml',

            $site.'/editor/elements/mediaplayer.php',
            $site.'/editor/libraries/extensions/imgageeditor/picmonkey.php',
            $site.'/editor/libraries/extensions/imgageeditor/picmonkey.xml',
            $site.'/editor/libraries/extensions/imgageeditor/index.html',
            $site.'/editor/libraries/css/colorpicker.css',
            $site.'/editor/libraries/css/editor.css',
            $site.'/editor/libraries/css/files.css',
            $site.'/editor/libraries/css/help.css',
            $site.'/editor/libraries/css/manager.css',
            $site.'/editor/libraries/css/plugin.css',
            $site.'/editor/libraries/css/popup.css',
            $site.'/editor/libraries/img/broken.png',
            $site.'/editor/libraries/img/cloud_upload.png',
            $site.'/editor/libraries/img/drag.png',
            $site.'/editor/libraries/img/icons-24.png',
            $site.'/editor/libraries/img/icons.png',

            $site.'/editor/libraries/jquery/css/jquery-ui.css',
            $site.'/editor/libraries/js/editor.js',
            $site.'/editor/libraries/js/help.js',
            $site.'/editor/libraries/js/link.full.js',
            $site.'/editor/libraries/js/manager.full.js',
            $site.'/editor/libraries/js/plugin.full.js',
            $site.'/editor/libraries/mediaplayer/license.txt',
            $site.'/editor/tiny_mce/plugins/inlinepopups/css/dialog.css',
            $site.'/editor/tiny_mce/themes/advanced/img/icons.gif',
            $site.'/editor/tiny_mce/plugins/source/css/editor.css',
            $site.'/editor/tiny_mce/plugins/source/codemirror/css/codemirror.css',
            $site.'/editor/tiny_mce/plugins/source/js/editor.js',
            $site.'/editor/tiny_mce/plugins/source/js/format.js',

            $site.'/editor/tiny_mce/plugins/visualblocks/css/visualblocks.css'
        );

        $folders = array(
            $admin.'/adapters',
            $admin.'/views/installer',
            $site.'/editor/extensions/mediaplayer',
            $site.'/editor/libraries/jquery/css/images',
            $site.'/editor/libraries/plupload',
            $site.'/editor/libraries/views/browser',
            $site.'/editor/tiny_mce/themes/advanced/skins/classic',
            $site.'/editor/tiny_mce/themes/advanced/skins/highcontrast',
            $site.'/editor/libraries/extensions/imgageeditor',
            $site.'/editor/libraries/extensions/imgageeditor/picmonkey',
        );

        foreach ($folders as $folder) {
            if (JFolder::exists($folder)) {
                if (!JFolder::delete($folder)) {
                    $app->enqueueMessage('Unable to delete folder: '.$folder, 'error');
                }
            }
        }

        foreach ($files as $file) {
            if (JFile::exists($file)) {
                if (!JFile::delete($file)) {
                    $app->enqueueMessage('Unable to delete file: '.$file, 'error');
                }
            }
        }

        // pro cleanup
        if (is_dir($site.'/libraries/pro')) {
            // remove old language files
            $languages = JFolder::files(JPATH_SITE.'/language/en-GB/', '^en-GB\.com_jce_[caption|iframe|filemanager|imgmanager_ext|mediamanager|templatemanager|microdata|emotions|fullpage].*', false, true);

            if (!empty($languages)) {
                JFile::delete($languages);
            }
        }

        // clean up links extension folder
        $files = JFolder::files($site.'/editor/extensions/links', '.', false, true);

        foreach ($files as $file) {
            $name = pathinfo($file, PATHINFO_FILENAME);
            // leave this...
            if ($name === 'joomlalinks') {
                continue;
            }
            // delete others
            JFile::delete($file);

            $path = dirname($file);

            if (is_dir($path.'/'.$name)) {
                JFolder::delete($path.'/'.$name);
            }
        }

        return true;
    }

    private static function getProfiles()
    {
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

    private static function createProfilesTable()
    {
        include_once dirname(__FILE__).'/includes/base.php';
        include_once dirname(__FILE__).'/models/profiles.php';

        $profiles = new WFModelProfiles();

        if (method_exists($profiles, 'createProfilesTable')) {
            return $profiles->createProfilesTable();
        }

        return false;
    }

    private static function installProfiles()
    {
        include_once dirname(__FILE__).'/includes/base.php';
        include_once dirname(__FILE__).'/models/profiles.php';

        $profiles = new WFModelProfiles();

        if (method_exists($profiles, 'installProfiles')) {
            return $profiles->installProfiles();
        }

        return false;
    }

    private static function addIndexfiles($paths)
    {
        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        // get the base file
        $file = JPATH_ADMINISTRATOR.'/components/com_jce/index.html';

        if (is_file($file)) {
            foreach ((array) $paths as $path) {
                if (is_dir($path)) {
                    // admin component
                    $folders = JFolder::folders($path, '.', true, true);

                    foreach ($folders as $folder) {
                        JFile::copy($file, $folder.'/'.basename($file));
                    }
                }
            }
        }
    }

    private static function checkTableColumn($table, $column)
    {
        $db = JFactory::getDBO();

        // use built in function
        if (method_exists($db, 'getTableColumns')) {
            $fields = $db->getTableColumns($table);
        } else {
            $db->setQuery('DESCRIBE '.$table);
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