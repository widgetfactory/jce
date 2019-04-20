<?php
use Gantry\Framework\Exception;

/**
 * @copyright     Copyright (c) 2009-2019 Ryan Demmer. All rights reserved
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
            foreach ((array)$paths as $path) {
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

        $message = '<div id="jce" class="mt-4 p-4 jumbotron jumbotron-fluid hero-unit" style="text-align:left">';

        $message .= '<h2>' . JText::_('COM_JCE') . ' ' . $parent->manifest->version . '</h2>';
        $message .= JText::_('COM_JCE_XML_DESCRIPTION');

        if ((string)$parent->manifest->variant !== 'pro') {
            $message .= file_get_contents(JPATH_ADMINISTRATOR . '/components/com_jce/views/cpanel/tmpl/default_pro.php');
        }

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

    public function preflight($route, $installer)
    {
        // skip on uninstall etc.
        if ($route === "remove") {
            return true;
        }

        $jversion = new JVersion();

        if (version_compare($jversion->getShortVersion(), '3.7', 'lt')) {
            throw new RuntimeException('JCE requires Joomla 3.7 or later.');
        }

        $parent = $installer->getParent();

        // get current package version
        $manifest = JPATH_ADMINISTRATOR . '/manifests/packages/pkg_jce.xml';
        $version = 0;
        $variant = "core";

        if (is_file($manifest)) {
            if ($xml = @simplexml_load_file($manifest)) {
                $version = (string)$xml->version;

                $variant = (string)$xml->variant;
            }
        }

        // set current version
        $parent->set('current_version', $version);

        // set current variant
        $parent->set('current_variant', $variant);

        // core cannot be installed over pro
        if ($variant === "pro" && (string)$parent->manifest->variant === "core") {
            throw new RuntimeException('JCE Core cannot be installed over JCE Pro. Please install JCE Pro. To downgrade, please first uninstall JCE Pro.');
        }

        // remove branding plugin
        if ((string)$parent->manifest->variant === "pro") {
            $branding = JPATH_SITE . '/components/com_jce/editor/tiny_mce/plugins/branding';

            if (is_dir($branding)) {
                JFolder::delete($branding);
            }
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
                'folder' => $folder
            ));

            if ($plugin) {
                $extension->publish(null, 0);
            }
        }
    }

    public function postflight($route, $installer)
    {
        $app = JFactory::getApplication();
        $extension = JTable::getInstance('extension');

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
            $version = (string)$parent->manifest->version;

            // add contextmenu to profiles in 2.7.x TODO - Remove in 2.7.5
            if ($version && version_compare($version, '2.7.0', '>=') && version_compare($version, '2.7.4', '<')) {
                $db = JFactory::getDBO();

                $query = $db->getQuery(true);
                $query->select('id')->from('#__wf_profiles')->where('name = ' . $db->Quote('Default') . ' OR id = 1');

                $db->setQuery($query);
                $id = $db->loadResult();

                if ($id) {
                    include_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/plugins.php';

                    $plugin = new StdClass;
                    $plugin->name = 'contextmenu';
                    $plugin->icon = '';

                    // add to profile
                    JcePluginsHelper::addToProfile($id, $plugin);
                }
            }

            // enable content, system and quickicon plugins
            foreach (array('content', 'system', 'quickicon') as $folder) {
                $plugin = $extension->find(array(
                    'type' => 'plugin',
                    'element' => 'jce',
                    'folder' => $folder
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
        $site  = JPATH_SITE . '/components/com_jce';

        $folders = array();

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
            $site . '/editor/tiny_mce/plugins/xhtmlxtras/classes'
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
                try {
                    JFolder::delete($folder);
                } catch(Exception $e){}
            }
        }

        $files = array();

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
                } catch(Exception $e){}
            }
        }
    }
}
