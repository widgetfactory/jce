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

class com_jceInstallerScript {

    public function install($parent) {
        require_once(JPATH_ADMINISTRATOR . '/components/com_jce/install.php');

        $installer = method_exists($parent, 'getParent') ? $parent->getParent() : $parent->parent;

        return WFInstall::install($installer);
    }

    public function uninstall() {
        $db = JFactory::getDBO();

        // remove Profiles table if its empty
        if ((int) self::checkTableContents('#__wf_profiles') == 0) {
            if (method_exists($db, 'dropTable')) {
                $db->dropTable('#__wf_profiles', true);
            } else {
                $query = 'DROP TABLE IF EXISTS #__wf_profiles';
                $db->setQuery($query);
            }

            $db->query();
        }

        // remove packages
        self::removePackages();
    }

    public function update($parent) {
        return $this->install($parent);
    }

    public function postflight($type, $parent) {
      $plugin = JTable::getInstance('extension');
      $plugin->find(array('type' => 'plugin', 'folder' => 'quickicon', 'element' => 'jcefilebrowser'));

      if ($plugin) {
        $installer = new JInstaller();
        $installer->uninstall('plugin', $plugin->id);
      }
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

    private static function getModule($name) {
        // Joomla! 2.5
        if (defined('JPATH_PLATFORM')) {
            $module = JTable::getInstance('extension');
            return $module->find(array('type' => 'module', 'element' => $name));

            // Joomla! 1.5
        } else {
            $db = JFactory::getDBO();
            $query = 'SELECT id FROM #__modules' . ' WHERE module = ' . $db->Quote($name);

            $db->setQuery($query);
            return $db->loadResult();
        }
    }

    private static function getPlugin($folder, $element) {
        // Joomla! 2.5
        if (defined('JPATH_PLATFORM')) {
            $plugin = JTable::getInstance('extension');
            return $plugin->find(array('type' => 'plugin', 'folder' => $folder, 'element' => $element));
            // Joomla! 1.5
        } else {
            $plugin = JTable::getInstance('plugin');

            $db = JFactory::getDBO();
            $query = 'SELECT id FROM #__plugins' . ' WHERE folder = ' . $db->Quote($folder) . ' AND element = ' . $db->Quote($element);

            $db->setQuery($query);
            return $db->loadResult();
        }
    }

    /**
     * Uninstall the editor
     * @return boolean
     */
    private static function removePackages() {
        $app = JFactory::getApplication();
        $db = JFactory::getDBO();

        jimport('joomla.module.helper');
        jimport('joomla.installer.installer');

        $plugins = array(
          'editors'    => array('jce'),
          'system'    => array('jce'),
          'content'   => array('jce'),
          'installer' => array('jce'),
          'extension' => array('jce'),
          'quickicon' => array('jce')
        );

        $modules = array('mod_jcefilebrowser');

        // items to remove
        $items = array(
            'plugin' => array(),
            'module' => array()
        );

        foreach ($plugins as $folder => $elements) {
            foreach ($elements as $element) {
                $item = self::getPlugin($folder, $element);

                if ($item) {
                    $items['plugin'][] = $item;
                }
            }
        }

        foreach ($modules as $module) {
            $item = self::getModule($module);

            if ($item) {
                $items['module'][] = $item;
            }
        }

        foreach ($items as $type => $extensions) {
            if ($extensions) {
                foreach ($extensions as $id) {
                    $installer = new JInstaller();
                    $installer->uninstall($type, $id);
                    $app->enqueueMessage($installer->message);
                }
            }
        }
    }
}

/**
 * Installer function
 * @return
 */
function com_install() {

    if (!defined('JPATH_PLATFORM')) {
        require_once(JPATH_ADMINISTRATOR . '/components/com_jce/install.php');

        $installer = JInstaller::getInstance();
        return WFInstall::install($installer);
    }

    return true;
}

/**
 * Uninstall function
 * @return
 */
function com_uninstall() {

    if (!defined('JPATH_PLATFORM')) {
        $script = new com_jceInstallerScript();
        return $script->uninstall();
    }

    return true;
}

?>
