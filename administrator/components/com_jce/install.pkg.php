<?php
/**
 * @copyright     Copyright (c) 2009-2020 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die('RESTRICTED');

class pkg_jceInstallerScript
{    
    private function addIndexfiles($paths)
    {
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

    private function installProfiles()
    {
        include_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/profiles.php';
        return JceProfilesHelper::installProfiles();
    }

    public function install($installer)
    {
        // enable plugins
        $plugin = JTable::getInstance('extension');

        $plugins = array(
            'content' => 'jce',
            'extension' => 'jce',
            'installer' => 'jce',
            'quickicon' => 'jce',
            'system' => 'jce',
            'fields' => 'mediajce',
        );

        $parent = $installer->getParent();

        foreach ($plugins as $folder => $element) {
            $id = $plugin->find(array('type' => 'plugin', 'folder' => $folder, 'element' => $element));

            if ($id) {
                $plugin->load($id);
                $plugin->enabled = 1;
                $plugin->store();
            }
        }

        // install profiles
        $this->installProfiles();

        $language = JFactory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);
        $language->load('com_jce.sys', JPATH_ADMINISTRATOR, null, true);

        // set layout base path
        JLayoutHelper::$defaultBasePath = JPATH_ADMINISTRATOR . '/components/com_jce/layouts';

        // override existing message
        $message  = '';
        $message .= '<div id="jce" class="mt-4 mb-4 p-4 card border-dark well" style="text-align:left;">';
        $message .= '   <div class="card-header"><h1>' . JText::_('COM_JCE') . ' ' . $parent->manifest->version . '</h1></div>';
        $message .= '   <div class="card-body">';

        // variant messates
        if ((string) $parent->manifest->variant != 'pro') {
            $message .= JLayoutHelper::render('message.upgrade');
        } else {
            // show core to pro upgrade message
            if ($parent->isUpgrade()) {
                $variant = (string) $parent->get('current_variant', 'core');
    
                if ($variant == 'core') {
                    $message .= JLayoutHelper::render('message.welcome');
                }
            }
        }

        $message .= JText::_('COM_JCE_XML_DESCRIPTION');

        $message .= '   </div>';
        $message .= '</div>';

        $parent->set('message', $message);

        // add index files to each folder
        $this->addIndexfiles(array(
            __DIR__,
            JPATH_SITE . '/components/com_jce',
            JPATH_PLUGINS . '/jce',
        ));

        return true;
    }

    private function checkTable()
    {
        $db = JFactory::getDBO();

        $tables = $db->getTableList();

        if (!empty($tables)) {
            // swap array values with keys, convert to lowercase and return array keys as values
            $tables = array_keys(array_change_key_case(array_flip($tables)));
            $app = JFactory::getApplication();
            $match = str_replace('#__', strtolower($app->getCfg('dbprefix', '')), '#__wf_profiles');

            return in_array($match, $tables);
        }

        // try with query
        $query = $db->getQuery(true);

        $query->select('COUNT(id)')->from('#__wf_profiles');
        $db->setQuery($query);

        return $db->execute();
    }

    public function uninstall()
    {
        $db = JFactory::getDBO();

        if ($this->checkTable() === false) {
            return true;
        }

        $query = $db->getQuery(true);
        $query->select('COUNT(id)')->from('#__wf_profiles');
        $db->setQuery($query);

        // profiles table is empty, remove...
        if ($db->loadResult() === 0) {
            $db->dropTable('#__wf_profiles', true);
            $db->execute();
        }
    }

    public function update($installer)
    {
        return $this->install($installer);
    }

    protected function getCurrentVersion()
    {
        // get current package version
        $manifest = JPATH_ADMINISTRATOR . '/manifests/packages/pkg_jce.xml';
        $version = 0;
        $variant = "core";

        if (is_file($manifest)) {
            if ($xml = @simplexml_load_file($manifest)) {
                $version = (string) $xml->version;
                $variant = (string) $xml->variant;
            }
        }

        return array($version, $variant);
    }

    public function preflight($route, $installer)
    {
        // skip on uninstall etc.
        if ($route === "remove") {
            return true;
        }

        $requirements = '<a href="https://www.joomlacontenteditor.net/support/documentation/editor/requirements" title="Editor Requirements" target="_blank" rel="noopener">https://www.joomlacontenteditor.net/support/documentation/editor/requirements</a>';

        // php version check
        if (version_compare(PHP_VERSION, '5.6', 'lt')) {
            throw new RuntimeException('JCE requires PHP 5.6 or later - ' . $requirements);
        }

        $jversion = new JVersion();

        // joomla version check
        if (version_compare($jversion->getShortVersion(), '3.6', 'lt')) {
            throw new RuntimeException('JCE requires Joomla 3.6 or later - ' . $requirements);
        }

        $parent = $installer->getParent();

        // set current package version and variant
        list($version, $variant) = $this->getCurrentVersion();

        // set current version
        $parent->set('current_version', $version);

        // set current variant
        $parent->set('current_variant', $variant);

        // core cannot be installed over pro
        if ($variant === "pro" && (string) $parent->manifest->variant === "core") {
            throw new RuntimeException('JCE Core cannot be installed over JCE Pro. Please install JCE Pro. To downgrade, please first uninstall JCE Pro.');
        }

        // end here if not an upgrade
        if ($route != 'update') {
            return true;
        }

        $extension = JTable::getInstance('extension');

        // disable content, system and quickicon plugins. This is to prevent errors if the install fails and some core files are missing
        foreach (array('content', 'system', 'quickicon') as $folder) {
            $plugin = $extension->find(array(
                'type' => 'plugin',
                'element' => 'jce',
                'folder' => $folder,
            ));

            if ($plugin) {
                $extension->publish(null, 0);
            }
        }

        // disable legacy jcefilebrowser quickicon to remove when the install is finished
        $plugin = $extension->find(array(
            'type' => 'plugin',
            'element' => 'jcefilebrowser',
            'folder' => 'quickicon',
        ));

        if ($plugin) {
            $extension->publish(null, 0);
        }
    }

    public function postflight($route, $installer)
    {
        $app = JFactory::getApplication();
        $extension = JTable::getInstance('extension');

        JTable::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_jce/tables');

        $plugin = JPluginHelper::getPlugin('extension', 'joomla');

        if ($plugin) {
            $parent = $installer->getParent();

            // find and remove package
            $component_id = $extension->find(array('type' => 'component', 'element' => 'com_jce'));

            if ($component_id) {
                $app->triggerEvent('onExtensionAfterUninstall', array($parent, $component_id, true));
            }

            // find and remove package
            $package_id = $extension->find(array('type' => 'package', 'element' => 'pkg_jce'));

            if ($package_id) {
                // remove
                $app->triggerEvent('onExtensionAfterUninstall', array($parent, $package_id, true));
                // install
                $app->triggerEvent('onExtensionAfterInstall', array($parent, $package_id));
            }
        }

        // remove legacy jcefilebrowser quickicon
        $plugin = JPluginHelper::getPlugin('quickicon', 'jcefilebrowser');

        if ($plugin) {
            $inst = new JInstaller();
            // try uninstall
            if (!$inst->uninstall('plugin', $plugin->id)) {

                if ($extension->load($plugin->id)) {
                    $extension->publish(null, 0);
                }
            }
        }

        if ($route == 'update') {
            $version = (string) $parent->manifest->version;
            $current_version = (string) $parent->get('current_version');

            // process core to pro upgrade - remove branding plugin
            if ((string) $parent->manifest->variant === "pro") {
                // remove branding plugin
                $branding = JPATH_SITE . '/components/com_jce/editor/tiny_mce/plugins/branding';

                if (is_dir($branding)) {
                    JFolder::delete($branding);
                }
            }

            $theme = '';

            // update toolbar_theme for 2.8.0 and 2.8.1 beta
            if (version_compare($current_version, '2.8.0', '>=') && version_compare($current_version, '2.8.1', '<')) {
                $theme = 'modern';
            }

            // update toolbar_theme for 2.7.x
            if (version_compare($current_version, '2.8', '<')) {
                $theme = 'default';
            }

            // update toolbar_theme if one has been set
            if ($theme) {
                $table = JTable::getInstance('Profiles', 'JceTable');

                $db = JFactory::getDBO();
                $query = $db->getQuery(true);

                $query->select('*')->from('#__wf_profiles');
                $db->setQuery($query);
                $profiles = $db->loadObjectList();

                foreach ($profiles as $profile) {
                    if (empty($profile->params)) {
                        $profile->params = '{}';
                    }

                    $data = json_decode($profile->params, true);

                    if (false !== $data) {
                        if (empty($data)) {
                            $data = array();
                        }

                        // no editor parameters set at all!
                        if (!isset($data['editor'])) {
                            $data['editor'] = array();
                        }

                        $param = array(
                            'toolbar_theme' => $theme
                        );

                        // add variant for "mobile" profile
                        if ($profile->name === "Mobile") {
                            $param['toolbar_theme'] .= '.touch';
                        }
 
                        if (empty($data['editor']['toolbar_theme'])) {
                            $data['editor']['toolbar_theme'] = $param['toolbar_theme'];

                            if (!$table->load($profile->id)) {
                                throw new Exception('Unable to update profile - ' . $profile->name);
                            }

                            $table->params = json_encode($data);

                            if (!$table->store()) {
                                throw new Exception('Unable to update profile - ' . $profile->name);
                            }
                        }
                    }
                }
            }

            // enable content, system and quickicon plugins
            foreach (array('content', 'system', 'quickicon') as $folder) {
                $plugin = $extension->find(array(
                    'type' => 'plugin',
                    'element' => 'jce',
                    'folder' => $folder,
                ));

                if ($plugin) {
                    $extension->publish(null, 1);
                }
            }

            self::cleanupInstall($installer);
        }
    }

    protected static function cleanupInstall($installer)
    {
        $parent = $installer->getParent();
        $current_version = $parent->get('current_version');

        $admin = JPATH_ADMINISTRATOR . '/components/com_jce';
        $site = JPATH_SITE . '/components/com_jce';

        $folders = array();
        $files = array();

        $folders['2.6.38'] = array(
            // admin
            $admin . '/classes',
            $admin . '/elements',
            $admin . '/media/fonts',
            $admin . '/img/menu',
            $admin . '/views/preferences',
            $admin . '/views/users',
            // site
            $site . '/editor/elements',
            $site . '/editor/extensions/aggregator/vine',
            $site . '/editor/extensions/popups/window',
            // site - tinymce plugins
            $site . '/editor/tiny_mce/plugins/advlist/classes',
            $site . '/editor/tiny_mce/plugins/article/classes',
            $site . '/editor/tiny_mce/plugins/browser/classes',
            $site . '/editor/tiny_mce/plugins/caption/classes',
            $site . '/editor/tiny_mce/plugins/charmap/classes',
            $site . '/editor/tiny_mce/plugins/cleanup/classes',
            $site . '/editor/tiny_mce/plugins/clipboard/classes',
            $site . '/editor/tiny_mce/plugins/code/classes',
            $site . '/editor/tiny_mce/plugins/colorpicker/classes',
            $site . '/editor/tiny_mce/plugins/emotions/classes',
            $site . '/editor/tiny_mce/plugins/filemanager/classes',
            $site . '/editor/tiny_mce/plugins/fontcolor/classes',
            $site . '/editor/tiny_mce/plugins/fontselect/classes',
            $site . '/editor/tiny_mce/plugins/fontsizeselect/classes',
            $site . '/editor/tiny_mce/plugins/format/classes',
            $site . '/editor/tiny_mce/plugins/formatselect/classes',
            $site . '/editor/tiny_mce/plugins/iframe/classes',
            $site . '/editor/tiny_mce/plugins/imgmanager/classes',
            $site . '/editor/tiny_mce/plugins/imgmanager_ext/classes',
            $site . '/editor/tiny_mce/plugins/inlinepopups/classes',
            $site . '/editor/tiny_mce/plugins/link/classes',
            $site . '/editor/tiny_mce/plugins/media/classes',
            $site . '/editor/tiny_mce/plugins/mediamanager/classes',
            $site . '/editor/tiny_mce/plugins/microdata/classes',
            $site . '/editor/tiny_mce/plugins/preview/classes',
            $site . '/editor/tiny_mce/plugins/searchreplace/classes',
            $site . '/editor/tiny_mce/plugins/source/classes',
            $site . '/editor/tiny_mce/plugins/style/classes',
            $site . '/editor/tiny_mce/plugins/styleselect/classes',
            $site . '/editor/tiny_mce/plugins/tabfocus/classes',
            $site . '/editor/tiny_mce/plugins/table/classes',
            $site . '/editor/tiny_mce/plugins/templatemanager/classes',
            $site . '/editor/tiny_mce/plugins/textpattern/classes',
            $site . '/editor/tiny_mce/plugins/visualblocks/classes',
            $site . '/editor/tiny_mce/plugins/visualchars/classes',
            $site . '/editor/tiny_mce/plugins/xhtmlxtras/classes',
        );

        // remove flexicontent
        if (!JComponentHelper::isInstalled('com_flexicontent')) {
            $files['2.7'] = array(
                $site . '/editor/extensions/links/flexicontentlinks.php',
                $site . '/editor/extensions/links/flexicontentlinks.xml',
            );

            $folders['2.7'] = array(
                $site . '/editor/extensions/links/flexicontentlinks'
            );
        }

        // remove inlinepopups
        $folders['2.7.13'] = array(
            $site . '/editor/tiny_mce/plugins/inlinepopups',
        );

        // remove classpath / classbar
        $folders['2.8.0'] = array(
            $site . '/editor/tiny_mce/plugins/classpath',
            $site . '/editor/tiny_mce/plugins/classbar',
        );

        // remove help files
        $folders['2.8.6'] = array(
            $admin . '/views/help'
        );

        // remove mediaplayer
        $folders['2.8.11'] = array(
            $site . '/editor/libraries/mediaplayer'
        );

        $files['2.6.38'] = array(
            $admin . '/install.php',
            $admin . '/install.script.php',
            // controller
            $admin . '/controller/preferences.php',
            $admin . '/controller/popups.php',
            $admin . '/controller/updates.php',
            // helpers
            $admin . '/helpers/cacert.pem',
            $admin . '/helpers/editor.php',
            $admin . '/helpers/toolbar.php',
            $admin . '/helpers/updates.php',
            $admin . '/helpers/xml.php',
            // includes
            $admin . '/includes/loader.php',
            // css
            $admin . '/media/css/cpanel.css',
            $admin . '/media/css/legacy.min.css',
            $admin . '/media/css/module.css',
            $admin . '/media/css/preferences.css',
            $admin . '/media/css/updates.css',
            $admin . '/media/css/users.css',
            // js
            $admin . '/media/js/cpanel.js',
            $admin . '/media/js/jce.js',
            $admin . '/media/js/preferences.js',
            $admin . '/media/js/updates.js',
            $admin . '/media/js/users.js',
            // models
            $admin . '/models/commands.json',
            $admin . '/models/config.xml',
            $admin . '/models/cpanel.xml',
            $admin . '/models/model.php',
            $admin . '/models/plugins.json',
            $admin . '/models/plugins.php',
            $admin . '/models/preferences.php',
            $admin . '/models/preferences.xml',
            $admin . '/models/pro.json',
            $admin . '/models/updates.php',
            $admin . '/models/users.php',
            // views
            $admin . '/views/cpanel/tmpl/default_pro_footer.php',
            $admin . '/views/profiles/tmpl/form_editor.php',
            $admin . '/views/profiles/tmpl/form_features.php',
            $admin . '/views/profiles/tmpl/form_plugin.php',
            $admin . '/views/profiles/tmpl/form_setup.php',
            $admin . '/views/profiles/tmpl/form.php',
            // site - extensions
            $site . '/editor/extensions/aggregator/vine.php',
            $site . '/editor/extensions/aggregator/vine.xml',
            $site . '/editor/extensions/popups/window.php',
            $site . '/editor/extensions/popups/window.xml',
            // site - libraries
            $site . '/editor/libraries/classes/token.php',
            // site - fonts
            $site . '/editor/libraries/fonts/fontawesome-webfont.eot',
            $site . '/editor/libraries/fonts/fontawesome-webfont.woff',
            // sites - img
            $site . '/editor/libraries/img/cloud.png',
            $site . '/editor/libraries/img/power.png',
            $site . '/editor/libraries/img/spacer.gif',
            // site - tinymce plugins
            $site . '/editor/tiny_mce/plugins/caption/licence.txt',
            $site . '/editor/tiny_mce/plugins/caption/README',
            $site . '/editor/tiny_mce/plugins/iframe/licence.txt',
            $site . '/editor/tiny_mce/plugins/imgmanager_ext/install.php',
            $site . '/editor/tiny_mce/plugins/imgmanager_ext/licence.txt',
            $site . '/editor/tiny_mce/plugins/imgmanager_ext/README',
            $site . '/editor/tiny_mce/plugins/mediamanager/README',
            $site . '/editor/tiny_mce/plugins/spellchecker/classes/config.php',
            $site . '/editor/tiny_mce/plugins/templatemanager/licence.txt',
            $site . '/editor/tiny_mce/plugins/templatemanager/README',
        );

        // remove help files
        $files['2.8.6'] = array(
            $admin . '/controller/help.php',
            $admin . '/models/help.php',
            $admin . '/media/css/help.min.css',
            $admin . '/media/js/help.min.js'
        );

        $files['2.8.11'] = array(
            $admin . '/views/cpanel/default_pro.php'
        );

        foreach ($folders as $version => $list) {
            // version check
            if (version_compare($version, $current_version, 'gt')) {
                continue;
            }

            foreach ($list as $folder) {
                if (!@is_dir($folder)) {
                    continue;
                }

                $items = JFolder::files($folder, '.', false, true, array(), array());

                foreach ($items as $file) {
                    if (!@unlink($file)) {
                        try {
                            JFile::delete($file);
                        } catch (Exception $e) {}
                    }
                }

                $items = JFolder::folders($folder, '.', false, true, array(), array());

                foreach ($items as $dir) {
                    if (!@rmdir($dir)) {
                        try {
                            JFolder::delete($dir);
                        } catch (Exception $e) {}
                    }
                }

                if (!@rmdir($folder)) {
                    try {
                        JFolder::delete($folder);
                    } catch (Exception $e) {}
                }
            }
        }

        foreach ($files as $version => $list) {
            // version check
            if (version_compare($version, $current_version, 'gt')) {
                continue;
            }

            foreach ($list as $file) {
                if (!@file_exists($file)) {
                    continue;
                }

                if (@unlink($file)) {
                    continue;
                }

                try {
                    JFile::delete($file);
                } catch (Exception $e) {}
            }
        }
    }
}
