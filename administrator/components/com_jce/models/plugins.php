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

// load base model
require_once (dirname(__FILE__) . '/model.php');

class WFModelPlugins extends WFModel {

    public function getCommands() {
        //$xml  = JFactory::getXMLParser('Simple');
        $file = dirname(__FILE__) . '/commands.xml';
        $xml = WFXMLElement::load($file);

        $commands = array();

        if ($xml) {
            //$elements = WFXMLHelper::getElements($xml, 'commands');

            foreach ($xml->children() as $command) {
                $name = (string) $command->name;

                if ($name) {
                    $commands[$name] = new StdClass();

                    foreach ($command->children() as $item) {
                        $key = $item->getName();
                        $value = (string) $item;

                        if (is_numeric($value)) {
                            $value = (int) $value;
                        }

                        $commands[$name]->$key = $value;
                    }

                    $commands[$name]->type = 'command';
                }
            }
        }

        return $commands;
    }

    public function getPlugins() {
        jimport('joomla.filesystem.folder');

        $language = JFactory::getLanguage();

        static $plugins;

        if (!isset($plugins)) {
          $plugins = array();

          // get core xml
          $xml = WFXMLElement::load(dirname(__FILE__) . '/plugins.xml');

          if ($xml) {
              foreach ($xml->children() as $plugin) {
                  $name = (string) $plugin->name;

                  if ($name) {
                      $plugins[$name] = new StdClass();

                      foreach ($plugin->children() as $item) {
                          $key = $item->getName();
                          $value = (string) $item;

                          if (is_numeric($value)) {
                              $value = (int) $value;
                          }

                          $plugins[$name]->$key = $value;
                      }

                      $plugins[$name]->type     = 'plugin';
                      $plugins[$name]->path     = str_replace(JPATH_SITE, '', WF_EDITOR_PLUGINS) . '/' . $name;
                      $plugins[$name]->manifest = WF_EDITOR_PLUGINS . '/' . $name . '/' . $name . '.xml';
                  }
              }
          }

          unset($xml);

          // get all core plugins
          $folders = JFolder::folders(WF_EDITOR_PLUGINS, '.', false, true, array_merge(array('.svn', 'CVS'), array_keys($plugins)));

          // get all installed plugins
          $installed = JPluginHelper::getPlugin('jce');

          foreach($installed as $item) {
            // check for delimiter, only load "extensions"
            if (strpos($item->name, '-') === false || strpos($item->name, 'editor-') === false) {
                continue;
            }

            $name = str_replace('editor-', '', $item->name);

            // load language
            $language->load('plg_jce_' . $name, JPATH_ADMINISTRATOR);

            $folders[] = JPATH_PLUGINS . '/jce/' . $item->name;
          }

          foreach ($folders as $folder) {
              $name = basename($folder);
              $file = $folder . '/' . $name . '.xml';

              if (is_file($file)) {
                  $plugins[$name] = new StdClass();
                  $plugins[$name]->name = str_replace('editor-', '', $name);
                  $plugins[$name]->manifest = $file;

                  $xml = WFXMLElement::load($file);

                  if ($xml) {
                    // check xml file is valid
                    if ((string) $xml->getName() != 'extension' && (string) $xml->getName() != 'install') {
                        continue;
                    }

                    $params = $xml->params;

                    $plugins[$name] = new StdClass();

                    $plugins[$name]->name = str_replace('editor-', '', $name);

                    $plugins[$name]->title    = (string) $xml->name;
                    $plugins[$name]->icon     = (string) $xml->icon;
                    $plugins[$name]->editable = 0;

                    // can't be editable without parameters
                    if ($params && count($params->children())) {
                        $plugins[$name]->editable = 1;
                    }

                    $row = (int) $xml->attributes()->row;

                    $plugins[$name]->row = $row ? $row : 4;
                    $plugins[$name]->description = (string) $xml->description;
                    $plugins[$name]->core = (int) $xml->attributes()->core ? 1 : 0;

                    // installer stuff
                    $plugins[$name]->author = (string) $xml->author;
                    $plugins[$name]->version = (string) $xml->version;
                    $plugins[$name]->creationdate = (string) $xml->creationDate;
                    $plugins[$name]->authorUrl = (string) $xml->authorUrl;

                    // relative path
                    $plugins[$name]->path = str_replace(JPATH_SITE, '', $folder);
                    $plugins[$name]->type = 'plugin';
                    $plugins[$name]->manifest = $file;
                  }
              }
          }
        }

        return $plugins;
    }

    /**
     * Get installed extensions
     * @return array $extensions
     */
    public function getExtensions() {
        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        $language = JFactory::getLanguage();

        static $extensions;

        if (empty($extensions)) {
          $extensions = array();

          // recursively get all extension files
          $files = JFolder::files(WF_EDITOR_EXTENSIONS, '\.xml$', true, true);

          foreach ($files as $file) {
              $name = basename($file, '.xml');

              $object = new StdClass();
              $object->folder = basename(dirname($file));
              $object->manifest = $file;
              $object->plugins = array();
              $object->name   = $name;
              $object->title  = $name;
              $object->description = '';
              $object->id = $object->folder . '.' . $object->name;
              $object->extension = $object->name;
              // set as non-core by default
              $object->core = 0;
              // set as not editable by default
              $object->editable = 0;
              // set type
              $object->type = $object->folder;

              $extensions[] = $object;
          }

          // get all installed plugins
          $installed = JPluginHelper::getPlugin('jce');

          if (!empty($installed)) {
              foreach ($installed as $p) {

                  // check for delimiter, only load "extensions"
                  if (strpos($p->name, '-') === false && strpos($p->name, 'editor-') !== false) {
                      continue;
                  }

                  // set path
                  $p->path = JPATH_PLUGINS . '/jce/' . $p->name;

                  // Joomla 1.5!!
                  if (!defined('JPATH_PLATFORM')) {
                      $p->path = JPATH_PLUGINS . '/jce';
                  }

                  $parts = explode("-", $p->name);
                  // get type and name
                  $p->folder    = $parts[0];
                  $p->extension = $parts[1];

                  // plugin manifest, eg: filesystem-joomla.xml
                  $p->manifest = $p->path . '/' . $p->name . '.xml';

                  $p->plugins = array();
                  $p->description = '';
                  $p->title = $p->name;
                  // create plugin id, eg: filesystem.joomla
                  $p->id = $p->folder . '.' . $p->extension;
                  // not core
                  $p->core = 0;
                  // set as not editable by default
                  $p->editable = 0;
                  // set type
                  $p->type = $p->folder;

                  // load language
                  $language->load('plg_jce_' . $p->folder . '_' . $p->extension, JPATH_ADMINISTRATOR);

                  $extensions[] = $p;
              }
          }

          // process xml for each extension
          for($i = 0; $i < count($extensions); $i++) {
            $extension = $extensions[$i];

            $xml = WFXMLElement::load($extension->manifest);

            if ($xml) {
                // not a valid extension xml file
                if ((string) $xml->getName() != 'extension' && (string) $xml->getName() != 'install') {
                    unset($extensions[$i]);
                    continue;
                }

                // list of plugins this extension is restricted to
                $plugins = (string) $xml->plugins;

                if ($plugins) {
                    $extension->plugins = explode(',', $plugins);
                }

                $extension->title       = (string) $xml->name;
                $extension->description = (string) $xml->description;
                $extension->core        = (int) $xml->attributes()->core ? 1 : 0;

                $params = $xml->params;

                // can't be editable without parameters
                if ($params && count($params->children())) {
                    $extension->editable = 1;
                }

                // installer stuff
                $extension->author = (string) $xml->author;
                $extension->version = (string) $xml->version;
                $extension->creationdate = (string) $xml->creationDate;
                $extension->authorUrl = (string) $xml->authorUrl;
            }
          }
        }

        // reset array
        $extensions = array_values($extensions);

        return $extensions;
    }

    /**
     * Process import data from XML file
     * @param object $file XML file
     * @param boolean $install Can be used by the package installer
     * @return boolean 
     */
    public function processImport($file, $install = false) {
        return true;
    }

    public static function addToProfile($id, $plugin) {
        JTable::addIncludePath(dirname(dirname(__FILE__)) . '/tables');
        // Add to Default Group
        $profile = JTable::getInstance('profiles', 'WFTable');

        if ($profile->load($id)) {
            // Add to plugins list
            $plugins = explode(',', $profile->plugins);

            if (!in_array($plugin->name, $plugins)) {
                $plugins[] = $plugin->name;
            }

            $profile->plugins = implode(',', $plugins);

            if ($plugin->icon) {
                if (in_array($plugin->name, preg_split('/[;,]+/', $profile->rows)) === false) {
                    // get rows as array
                    $rows = explode(';', $profile->rows);

                    if (count($rows)) {
                        // get key (row number)
                        $key = count($rows) - 1;
                        // get row contents as array
                        $row = explode(',', $rows[$key]);
                        // add plugin name to end of row
                        $row[] = $plugin->name;
                        // add row data back to rows array
                        $rows[$key] = implode(',', $row);

                        $profile->rows = implode(';', $rows);
                    }
                }

                if (!$profile->store()) {
                    JError::raiseWarning(100, 'WF_INSTALLER_PLUGIN_PROFILE_ERROR');
                }
            }
        }

        return true;
    }

    public static function removeFromProfile($id, $plugin) {
        JTable::addIncludePath(dirname(dirname(__FILE__)) . '/tables');
        // Add to Default Group
        $profile = JTable::getInstance('profiles', 'WFTable');

        if ($profile->load($id)) {
            // remove from plugins list
            $plugins = explode(',', $profile->plugins);
            $key = array_search($plugin->name, $plugins);

            if ($key) {
                unset($plugins[$key]);
                $profile->plugins = implode(',', array_values($plugins));
            }

            if ($plugin->icon) {
                // check if its in the profile
                if (in_array($plugin->name, preg_split('/[;,]+/', $profile->rows))) {
                    $lists = array();
                    foreach (explode(';', $profile->rows) as $list) {
                        $icons = explode(',', $list);
                        foreach ($icons as $k => $v) {
                            if ($plugin->name == $v) {
                                unset($icons[$k]);
                            }
                        }
                        $lists[] = implode(',', $icons);
                    }
                    $profile->rows = implode(';', $lists);
                }

                if (!$profile->store()) {
                    JError::raiseWarning(100, JText::sprintf('WF_INSTALLER_REMOVE_FROM_GROUP_ERROR', $plugin->name));
                }
            }
        }

        return true;
    }

    /**
     * Add index.html files to each folder
     * @access private
     */
    private static function addIndexfiles($path) {
        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        // get the base file
        $file = dirname(dirname(__FILE__)) . '/index.html';

        if (is_file($file) && is_dir($path)) {

            JFile::copy($file, $path . '/' . basename($file));

            // admin component
            $folders = JFolder::folders($path, '.', true, true);

            foreach ($folders as $folder) {
                JFile::copy($file, $folder . '/' . basename($file));
            }
        }
    }

    public static function postInstall($route, $plugin, $installer) {
        $db = JFactory::getDBO();

        jimport('joomla.filesystem.folder');

        // load the plugin and enable
        if (isset($plugin->row) && $plugin->row > 0) {
            $query = $db->getQuery(true);

            if (is_object($query)) {
                $query->select('id')->from('#__wf_profiles')->where('name = ' . $db->Quote('Default') . ' OR id = 1');
            } else {
                $query = 'SELECT id'
                        . ' FROM #__wf_profiles'
                        . ' WHERE name = ' . $db->Quote('Default') . ' OR id = 1';
            }

            $db->setQuery($query);
            $id = $db->loadResult();

            if ($id) {
                if ($route == 'install') {
                    // add to profile
                    self::addToProfile($id, $plugin);
                } else {
                    // remove from profile
                    self::removeFromProfile($id, $plugin);
                }
            }
        }

        if ($route == 'install') {
            if ($plugin->type == 'extension') {
                $plugin->path = $plugin->path . '/' . $plugin->name;
            }

            // add index.html files
            self::addIndexfiles($plugin->path);
        }

        return true;
    }

}
