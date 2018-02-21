<?php


/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

class pkg_jceInstallerScript
{
    private function isPro()
    {
        $file = JPATH_ADMINISTRATOR.'/components/com_jce/includes/constants.php';

        // new install so not pro
        if (!is_file($file)) {
            return false;
        }

        include_once $file;

        return defined('WF_EDITOR_PRO') && WF_EDITOR_PRO;
    }

    private function matchVariant($installer)
    {
        // pro can be installed over core and pro
        if ((string) $installer->manifest->variant === 'pro') {
            return true;
        }

        // core cannot be installed over pro
        if ($this->isPro()) {
            return false;
        }

        // default
        return true;
    }

    public function install($parent)
    {
        // enable plugins
        $plugin = JTable::getInstance('extension');

        foreach (array('content', 'extension', 'installer', 'quickicon', 'system') as $folder) {
            $id = $plugin->find(array('type' => 'plugin', 'folder' => $folder, 'element' => 'jce'));

            if ($id) {
                $plugin->load($id);
                $plugin->enabled = 1;
                $plugin->store();
            }
        }

        $id = $plugin->find(array('type' => 'plugin', 'folder' => 'fields', 'element' => 'mediajce'));

        if ($id) {
            $plugin->load($id);
            $plugin->enabled = 1;
            $plugin->store();
        }

        // get installer reference
        $installer = method_exists($parent, 'getParent') ? $parent->getParent() : $parent->parent;

        require_once JPATH_ADMINISTRATOR.'/components/com_jce/install.php';

        $state = WFInstall::install($installer);

        if ($state) {
            if ((string) $installer->manifest->variant !== 'pro') {
                $message = $installer->get('message');
                $message .= file_get_contents(JPATH_ADMINISTRATOR.'/components/com_jce/views/cpanel/tmpl/default_pro_footer.php');
                $installer->set('message', $message);
            }
        }

        return $state;
    }

    public function uninstall()
    {
        $db = JFactory::getDBO();

        $query = $db->getQuery(true);
        $query->select('COUNT(id)')->from('#__wf_profiles');
        $db->setQuery($query);

        // profiles table is empty, remove...
        if ($db->loadResult() === 0) {
            $db->dropTable('#__wf_profiles', true);
            $db->query();
        }
    }

    public function update($installer)
    {
        return $this->install($installer);
    }

    public function preflight($type, $parent)
    {
        $installer = method_exists($parent, 'getParent') ? $parent->getParent() : $parent->parent;

        if ($this->matchVariant($installer) === false) {
            throw new RuntimeException('JCE Core cannot be installed over JCE Pro. Please install JCE Pro. To downgrade, please first uninstall JCE Pro.');
        }

        $manifest = JPATH_PLUGINS.'/editors/jce/jce.xml';
        $version = 0;

        if (is_file($manifest)) {
            $data = JApplicationHelper::parseXMLInstallFile($manifest);
            $version = isset($data['version']) ? (string) $data['version'] : 0;
        }

        $installer->set('current_version', $version);
    }

    public function postflight($type, $parent)
    {
        $extension = JTable::getInstance('extension');

        // remove "jcefilebrowser" quickicon
        $id = $extension->find(array('type' => 'plugin', 'folder' => 'quickicon', 'element' => 'jcefilebrowser'));

        if ($id) {
            $installer = new JInstaller();
            $installer->uninstall('plugin', $id);
        }

        $plugin = JPluginHelper::getPlugin('extension', 'joomla');

        if ($plugin) {
            $version = new JVersion();

            if ($version->isCompatible('3.0')) {
                $dispatcher = JEventDispatcher::getInstance();
                $installer = $parent;
            } else {
                $dispatcher = JDispatcher::getInstance();
                $installer = $parent->getParent();
            }

            $plg_extension_joomla = new PlgExtensionJoomla($dispatcher, (array) $plugin);

            // find and remove package
            $component_id = $extension->find(array('type' => 'component', 'element' => 'com_jce'));

            if ($component_id) {
                $plg_extension_joomla->onExtensionAfterUninstall($installer, $component_id, true);
            }

            // find and remove package
            $package_id = $extension->find(array('type' => 'package', 'element' => 'pkg_jce'));

            if ($package_id) {
                // remove
                $plg_extension_joomla->onExtensionAfterUninstall($installer, $package_id, true);
                // install
                $plg_extension_joomla->onExtensionAfterInstall($installer, $package_id);
            }
        }
    }
}
