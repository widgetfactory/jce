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

// load base model
require_once dirname(__FILE__) . '/model.php';

class WFModelPlugins extends WFModel
{
    public static function getCommands()
    {
        $data = file_get_contents(__DIR__ . '/commands.json');
        $json = json_decode($data);

        $commands = array();

        if ($json) {
            foreach ($json as $name => $attribs) {
                $attribs->type = 'command';
                $commands[$name] = $attribs;
            }
        }

        return $commands;
    }

    public static function getPlugins()
    {
        $language = JFactory::getLanguage();

        static $plugins;

        if (!isset($plugins)) {
            $plugins = array();

            // get core json
            $core = file_get_contents(__DIR__ . '/plugins.json');
            // decode to object
            $data = json_decode($core);

            if ($data) {
                foreach ($data as $name => $attribs) {
                    // skip if the plugin file is missing
                    if (!is_file(WF_EDITOR_PLUGINS . '/' . $name . '/editor_plugin.js')) {
                        continue;
                    }
                    // update attributes
                    $attribs->type = 'plugin';
                    $attribs->path = str_replace(JPATH_SITE, '', WF_EDITOR_PLUGINS) . '/' . $name;
                    $attribs->manifest = WF_EDITOR_PLUGINS . '/' . $name . '/' . $name . '.xml';
                    // compatability
                    $attribs->name = $name;
                    // pass to array
                    $plugins[$name] = $attribs;
                }
            }
            // get pro json
            if (is_file(__DIR__ . '/pro.json')) {
                $pro = @file_get_contents(__DIR__ . '/pro.json');
                // decode to object
                if ($pro) {
                    $data = json_decode($pro);

                    if ($data) {
                        foreach ($data as $name => $attribs) {
                            // skip if the plugin file is missing
                            if (!is_file(WF_EDITOR_PLUGINS . '/' . $name . '/editor_plugin.js')) {
                                continue;
                            }
                            // update attributes
                            $attribs->type = 'plugin';
                            $attribs->path = str_replace(JPATH_SITE, '', WF_EDITOR_PLUGINS) . '/' . $name;
                            $attribs->manifest = WF_EDITOR_PLUGINS . '/' . $name . '/' . $name . '.xml';
                            // compatability
                            $attribs->name = $name;
                            // pass to array
                            $plugins[$name] = $attribs;
                        }
                    }
                }
            }

            // get all installed plugins
            $installed = JPluginHelper::getPlugin('jce');

            foreach ($installed as $item) {
                // check for delimiter, only load editor plugins
                if (strpos($item->name, 'editor-') === false) {
                    continue;
                }

                // load language
                $language->load('plg_jce_' . $item->name, JPATH_ADMINISTRATOR);

                // create path
                $path = JPATH_PLUGINS . '/jce/' . $item->name;

                // get xml file
                $file = $path . '/' . $item->name . '.xml';

                if (is_file($file)) {
                    // load xml data
                    $xml = WFXMLElement::load($file);

                    if ($xml) {
                        // check xml file is valid
                        if ((string) $xml->getName() != 'extension' && (string) $xml->getName() != 'install') {
                            continue;
                        }

                        // check for editor_plugins.js file
                        if (!is_file($path . '/editor_plugin.js')) {
                            continue;
                        }

                        $name = str_replace('editor-', '', $item->name);

                        $plugins[$name] = new StdClass();
                        $plugins[$name]->name = $name;
                        $plugins[$name]->manifest = $file;

                        $params = $xml->params;

                        $plugins[$name]->title = (string) $xml->name;
                        $plugins[$name]->icon = (string) $xml->icon;
                        $plugins[$name]->editable = 0;

                        // can't be editable without parameters
                        if ($params && count($params->children())) {
                            $plugins[$name]->editable = 1;
                        }

                        $row = (int) $xml->attributes()->row;

                        $plugins[$name]->row = $row ? $row : 4;
                        $plugins[$name]->description = (string) $xml->description;
                        $plugins[$name]->core = 0;

                        // relative path
                        $plugins[$name]->path = str_replace(JPATH_SITE, '', $path);
                        $plugins[$name]->type = 'plugin';
                    }
                }
            }
        }

        return $plugins;
    }

    /**
     * Get installed extensions.
     *
     * @return array $extensions
     */
    public function getExtensions()
    {
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
                $object->name = $name;
                $object->title = $name;
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

                    $parts = explode('-', $p->name);
                    // get type and name
                    $p->folder = $parts[0];
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
                    $language->load('plg_jce_' . $p->folder . '-' . $p->extension, JPATH_ADMINISTRATOR);

                    $extensions[] = $p;
                }
            }

            // process xml for each extension
            for ($i = 0; $i < count($extensions); ++$i) {
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

                    $extension->title = (string) $xml->name;
                    $extension->description = (string) $xml->description;
                    $extension->core = (int) $xml->attributes()->core ? 1 : 0;

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
     * Process import data from XML file.
     *
     * @param object $file    XML file
     * @param bool   $install Can be used by the package installer
     *
     * @return bool
     */
    public function processImport($file, $install = false)
    {
        return true;
    }

    public static function addToProfile($id, $plugin)
    {
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

    public static function removeFromProfile($id, $plugin)
    {
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
     * Add index.html files to each folder.
     */
    private static function addIndexfiles($path)
    {
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

    public static function postInstall($route, $plugin, $installer)
    {
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
