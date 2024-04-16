<?php

/**
 * @copyright     Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Filesystem\File;
use Joomla\CMS\Filesystem\Folder;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Uri\Uri;

require_once JPATH_ADMINISTRATOR . '/components/com_jce/includes/base.php';

abstract class JcePluginsHelper
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

    public static function isValidPlugin($name)
    {
        $plugins = self::getPlugins();
        return isset($plugins[$name]);
    }

    /**
     * Get a list of all code, pro and installed plugins.
     *
     * @return array $plugins
     */
    public static function getPlugins()
    {
        $app = Factory::getApplication();
        $language = Factory::getLanguage();

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
                    if (!is_file(WF_EDITOR_MEDIA . '/tinymce/plugins/' . $name . '/plugin.js')) {
                        continue;
                    }

                    // update attributes
                    $attribs->type = 'plugin';

                    $attribs->path = WF_EDITOR_PLUGINS . '/' . $name;
                    $attribs->manifest = WF_EDITOR_PLUGINS . '/' . $name . '/' . $name . '.xml';

                    $attribs->image = '';

                    if (!isset($attribs->class)) {
                        $attribs->class = '';
                    }

                    // compatability
                    $attribs->name = $name;
                    // pass to array
                    $plugins[$name] = $attribs;
                }
            }

            // get plugins external sources via event, eg: JCE Pro System Plugin
            $app->triggerEvent('onWfPluginsHelperGetPlugins', array(&$plugins));

            // get all installed plugins
            $installed = PluginHelper::getPlugin('jce');

            foreach ($installed as $item) {
                // check for delimiter, only load editor plugins
                if (!preg_match('/^editor[-_]/', $item->name)) {
                    continue;
                }

                // create path
                $path = JPATH_PLUGINS . '/jce/' . $item->name;

                // load language
                $language->load('plg_jce_' . $item->name, JPATH_ADMINISTRATOR);
                $language->load('plg_jce_' . $item->name, $path);

                // get xml file
                $file = $path . '/' . $item->name . '.xml';

                if (is_file($file)) {
                    // load xml data
                    $xml = simplexml_load_file($file);

                    if ($xml) {
                        // check xml file is valid
                        if ((string) $xml->getName() != 'extension') {
                            continue;
                        }

                        // remove "editor-" or "editor_"
                        $name = substr($item->name, 7);

                        $attribs = new StdClass();
                        $attribs->name = $name;
                        $attribs->manifest = $file;

                        $params = $xml->fields;

                        $attribs->title = (string) $xml->name;
                        $attribs->icon = (string) $xml->icon;
                        $attribs->editable = 0;

                        // set default values
                        $attribs->image = '';
                        $attribs->class = '';

                        if ($xml->icon->attributes()) {
                            foreach ($xml->icon->attributes() as $key => $value) {
                                $attribs->$key = $value;
                            }
                        }

                        if ($attribs->image) {
                            $attribs->image = Uri::root(true) . '/' . $attribs->image;
                        }

                        // can't be editable without parameters
                        if ($params && count($params->children())) {
                            $attribs->editable = 1;
                        }

                        $row = (int) $xml->attributes()->row;

                        // set row from passed in value or 0
                        $attribs->row = $row;

                        // if an icon is set and no row, default to 4
                        if (!empty($attribs->icon) && !$row) {
                            $attribs->row = 4;
                        }

                        $attribs->description = (string) $xml->description;
                        $attribs->core = 0;

                        // relative path
                        $attribs->path = $path;
                        $attribs->url = 'plugins/jce/' . $item->name;

                        // get snake-case name to check for media folder
                        $snake_case_name = str_replace('-', '_', $item->name);

                        // url in Joomla media folder
                        if (is_dir(JPATH_SITE . '/media/plg_jce_' . $snake_case_name)) {
                            $attribs->url = 'media/plg_jce_' . $snake_case_name;
                        }

                        $attribs->type = 'plugin';

                        $plugins[$name] = $attribs;
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
    public static function getExtensions($type = '')
    {
        $language = Factory::getLanguage();

        static $extensions;

        if (empty($extensions)) {
            $extensions = array();

            // recursively get all extension files
            $files = Folder::files(WF_EDITOR_EXTENSIONS, '\.xml$', true, true);

            foreach ($files as $file) {
                $name = basename($file, '.xml');

                $object = new StdClass();
                $object->folder = basename(dirname($file));
                $object->manifest = $file;
                $object->plugins = array();
                $object->name = $name;
                $object->title = 'WF_' . strtoupper($object->folder) . '_' . strtoupper($name) . '_TITLE';
                $object->description = '';
                $object->id = $object->folder . '.' . $object->name;
                $object->extension = $object->name;
                // set as non-core by default
                $object->core = 0;
                // set as not editable by default
                $object->editable = 0;
                // set type
                $object->type = $object->folder;

                $extensions[$object->type][] = $object;
            }

            // get all installed plugins
            $installed = PluginHelper::getPlugin('jce');

            if (!empty($installed)) {
                foreach ($installed as $p) {
                    // check for delimiter to remove legacy extensions
                    if (!preg_match('/[-_]/', $p->name)) {
                        continue;
                    }

                    // only load "extensions", not editor plugins
                    if (preg_match('/^editor[-_]/', $p->name)) {
                        continue;
                    }

                    // set path
                    $p->path = JPATH_PLUGINS . '/jce/' . $p->name;

                    $parts = preg_split('/[-_]/', $p->name, 2);

                    // get type and name
                    $p->folder = $parts[0];
                    $p->extension = $parts[1];

                    // plugin manifest, eg: filesystem-joomla.xml
                    $p->manifest = $p->path . '/' . $p->name . '.xml';

                    $p->plugins = array();
                    $p->description = '';

                    // load language
                    $language->load('plg_jce_' . $p->name, JPATH_ADMINISTRATOR);
                    $language->load('plg_jce_' . $p->name, $p->path);

                    list($p->type, $p->name) = preg_split('/[-_]/', $p->name, 2);

                    // create title from name parts, eg: plg_jce_filesystem_joomla
                    $p->title = 'plg_jce_' . $p->type . '_' . $p->name;

                    // create plugin id, eg: filesystem.joomla
                    $p->id = $p->type . '.' . $p->name;

                    // not core
                    $p->core = 0;

                    // set as not editable by default
                    $p->editable = 0;

                    $extensions[$p->type][] = $p;
                }
            }
        }

        if ($type && isset($extensions[$type])) {
            return $extensions[$type];
        }

        return $extensions;
    }

    public static function addToProfile($id, $plugin)
    {
        Table::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_jce/tables');

        // Add to Default Group
        $profile = Table::getInstance('Profiles', 'JceTable');

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
            }

            if (!$profile->store()) {
                throw new Exception(Text::_('WF_INSTALLER_PLUGIN_PROFILE_ERROR'));
            }
        }

        return true;
    }

    public static function removeFromProfile($id, $plugin)
    {
        Table::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_jce/tables');

        // Add to Default Group
        $profile = Table::getInstance('Profiles', 'JceTable');

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
                    throw new Exception(Text::sprintf('WF_INSTALLER_REMOVE_FROM_GROUP_ERROR', $plugin->name));
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
        // get the base file
        $file = JPATH_ADMINISTRATOR . '/components/com_jce/index.html';

        if (is_file($file) && is_dir($path)) {
            File::copy($file, $path . '/' . basename($file));

            // admin component
            $folders = Folder::folders($path, '.', true, true);

            foreach ($folders as $folder) {
                File::copy($file, $folder . '/' . basename($file));
            }
        }
    }

    public static function postInstall($route, $plugin, $installer)
    {
        $db = Factory::getDBO();

        // load the plugin and enable
        if (isset($plugin->row) && $plugin->row > 0) {
            $query = $db->getQuery(true);

            $query->select('id')->from('#__wf_profiles')->where('name = ' . $db->Quote('Default') . ' OR id = 1');

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
