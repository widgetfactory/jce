<?php

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

        $message = '<div id="jce" class="mt-4 p-4 jumbotron jumbotron-fluid hero-unit" style="text-align:left">';

        $message .= '<h2>' . JText::_('COM_JCE') . ' ' . $parent->manifest->version . '</h2>';
        $message .= JText::_('COM_JCE_XML_DESCRIPTION');

        if ((string) $parent->manifest->variant !== 'pro') {
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

    public function preflight($type, $installer)
    {
        // skip on uninstall etc.
        if ($type === "remove") {
            return true;
        }

        $parent = $installer->getParent();

        // get current package version
        $manifest   = JPATH_ADMINISTRATOR . '/manifests/packages/pkg_jce.xml';
        $version    = 0;
        $variant    = "core";

        if (is_file($manifest)) {
            if ($xml = @simplexml_load_file($manifest)) {
                $version = (string) $xml->version;

                $variant = (string) $xml->variant;
            }
        }

        // set current version
        $parent->set('current_version', $version);

        // set current variant
        $parent->set('current_variant', $variant);

        // core cannot be installed over pro
        if ($variant === "pro" && (string) $parent->manifest->variant === "core") {
            throw new RuntimeException('JCE Core cannot be installed over JCE Pro. Please install JCE Pro. To downgrade, please first uninstall JCE Pro.');
        }

        // remove branding plugin
        if ((string) $parent->manifest->variant === "pro") {
            $branding = JPATH_SITE . '/components/com_jce/editor/tiny_mce/plugins/branding';

            if (is_dir($branding)) {
                JFolder::delete($branding);
            }
        }

        // clean up for legacy upgrade
        if ($version && version_compare($version, '2.7.1', '<')) {
            // remove admin folder
            JFolder::delete(JPATH_ADMINISTRATOR . '/components/com_jce');

            // remove site folder
            JFolder::delete(JPATH_SITE . '/components/com_jce');
        }
    }

    public function postflight($type, $installer)
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
    }
}
