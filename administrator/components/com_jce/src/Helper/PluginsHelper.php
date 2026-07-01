<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Helper;

defined('JPATH_SITE') or die();

use Joomla\Database\DatabaseInterface;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\Event;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;
use Wfe\Helper\AdapterHelper;

abstract class PluginsHelper
{
    public static function getCommands()
    {
        $data = file_get_contents(WF_EDITOR . '/Editor/commands.json');
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
        $plugins = self::getEditorPlugins();
        return isset($plugins[$name]);
    }

    private static function getInstalledPlugins()
    {
        $installed = PluginHelper::getPlugin('jce');

        $installed = array_filter($installed, function ($p) {
            // check for delimiter to remove legacy extensions
            return preg_match('/[-_]/', $p->name);
        });

        return $installed;
    }

    /**
     * Get a list of all code, pro and installed plugins.
     *
     * @return array $plugins
     */
    public static function getEditorPlugins()
    {
        $app = Factory::getApplication();
        $language = $app->getLanguage();

        static $plugins;

        if (!isset($plugins)) {
            $plugins = array();

            // get core json
            $core = file_get_contents(WF_EDITOR . '/Editor/plugins.json');

            // decode to object
            $data = json_decode($core);

            if ($data) {
                foreach ($data as $name => $attribs) {
                    // skip if the plugin file is missing
                    if (!is_file(WF_EDITOR_MEDIA . '/ibis/plugins/' . $name . '/plugin.js')) {
                        continue;
                    }

                    // update attributes
                    $attribs->type = 'plugin';

                    // set plugin path, eg: Plugins/Editor/Foo
                    $attribs->path = WF_EDITOR_PLUGINS . '/' . ucfirst($name);

                    // set manifest path, eg: Plugins/Editor/Foo/foo.xml
                    $attribs->manifest = $attribs->path . '/' . $name . '.xml';

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

            $event = new Event('onWfPluginsHelperGetPlugins', array(
                'plugins' => $plugins,
            ));

            // get plugins external sources via event, eg: JCE Pro System Plugin
            $app->getDispatcher()->dispatch('onWfPluginsHelperGetPlugins', $event);

            $plugins = $event->getArgument('plugins');

            // get all installed plugins
            $installed = self::getInstalledPlugins();

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

                        $attribs = new \StdClass();
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
     * Get installed adapter plugins.
     * @param string $type Optional plugin type
     * @return array $plugins
     */
    public static function getAdapterPlugins($type = '')
    {
        $language = Factory::getApplication()->getLanguage();

        static $plugins = array();

        $type = strtolower($type);

        $cacheKey = serialize($type);

        if (isset($plugins[$cacheKey])) {
            if ($type && isset($plugins[$cacheKey][$type])) {
                return $plugins[$cacheKey][$type];
            }
        
            return $plugins[$cacheKey];
        }

        if (!isset($plugins[$cacheKey])) {
            $plugins[$cacheKey] = array();

            // recursively get all extension files
            $files = Folder::files(WF_PLUGINS, '\.xml$', true, true);

            foreach ($files as $file) {
                $folderPath = dirname($file);
                $folderName = basename($folderPath);

                $adapterType = basename(dirname($folderPath));

                // normalize to lowercase
                $adapterType = strtolower($adapterType);

                // skip "Editor" plugins
                if ($adapterType == 'editor') {
                    continue;
                }

                if ($type && $adapterType !== $type) {
                    continue;
                }

                $name = basename($file, '.xml');

                // normalize to lowercase
                $name = strtolower($name);

                $object = new \StdClass();
                $object->folder = $folderName;
                $object->manifest = $file;
                $object->plugins = array();
                $object->name = $name;
                $object->title = 'WF_' . strtoupper($adapterType) . '_' . strtoupper($name) . '_TITLE';
                $object->description = '';

                // normalize type to lowercase for consistent lookups
                $object->type = strtolower($adapterType);
                $object->id = $object->type . '.' . $object->name;

                // set as non-core by default
                $object->core = 0;

                // set as not editable by default
                $object->editable = 0;

                $plugins[$cacheKey][$object->type][] = $object;
            }

            // get all installed plugins
            $installed = self::getInstalledPlugins('jce');

            if (!empty($installed)) {
                foreach ($installed as $item) {
                    // only load adapter plugins, not editor plugins
                    if (preg_match('/^editor[-_]/', $item->name)) {
                        continue;
                    }

                    $p = clone $item;

                    // set path
                    $p->path = JPATH_PLUGINS . '/jce/' . $p->name;

                    $parts = preg_split('/[-_]/', $p->name, 2);

                    // get type and name
                    list($p->type, $p->name) = $parts;

                    // plugin manifest, eg: filesystem-joomla.xml
                    $p->manifest = $p->path . '/' . $p->type . '_' . $p->name . '.xml';

                    $p->plugins = array();
                    $p->description = '';

                    // load language
                    $language->load('plg_jce_' . $p->type . '_' . $p->name, JPATH_ADMINISTRATOR);
                    $language->load('plg_jce_' . $p->type . '_' . $p->name, $p->path);

                    // create title from name parts, eg: plg_jce_filesystem_joomla
                    $p->title = 'plg_jce_' . $p->type . '_' . $p->name;

                    // map legacy type
                    $mappedType = AdapterHelper::mapLegacyAdapterName($p->type);
 
                    // create plugin id, eg: filesystem.joomla
                    $p->id = $mappedType . '.' . $p->name;

                    // not core
                    $p->core = 0;

                    // set as not editable by default
                    $p->editable = 0;

                    $plugins[$cacheKey][$mappedType][] = $p;
                }
            }
        }

        if ($type && isset($plugins[$cacheKey][$type])) {
            return $plugins[$cacheKey][$type];
        }

        return $plugins[$cacheKey];
    }

    public static function addToProfile($id, $plugin)
    {
        // Add to Default Group
        $db = Factory::getContainer()->get(DatabaseInterface::class);

        $query = $db->getQuery(true);
        $query->select('*')->from('#__wf_profiles')->where('id = ' . $db->quote($id));
        $db->setQuery($query);

        $profile = $db->loadObject();

        if ($profile) {
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

            // store changes
            $query = $db->getQuery(true);
            $query->update('#__wf_profiles')
                ->set('plugins = ' . $db->quote($profile->plugins))
                ->set('rows = ' . $db->quote($profile->rows))
                ->where('id = ' . (int) $profile->id);

            $db->setQuery($query);

            // execute the query
            if (!$db->execute()) {
                throw new \Exception(Text::sprintf('WF_INSTALLER_PLUGIN_PROFILE_ERROR', $plugin->name));
            }
        }

        return true;
    }

    public static function removeFromProfile($id, $plugin)
    {
        // Add to Default Group
        $db = Factory::getContainer()->get(DatabaseInterface::class);

        $query = $db->getQuery(true);
        $query->select('*')->from('#__wf_profiles')->where('id = ' . $db->quote($id));
        $db->setQuery($query);

        $profile = $db->loadObject();

        if ($profile) {
            // remove from plugins list
            $plugins = explode(',', $profile->plugins);
            $key = array_search($plugin->name, $plugins);

            if ($key !== false) {
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
            }

            // store changes
            $query = $db->getQuery(true);
            $query->update('#__wf_profiles')
                ->set('plugins = ' . $db->quote($profile->plugins))
                ->set('rows = ' . $db->quote($profile->rows))
                ->where('id = ' . (int) $profile->id);

            $db->setQuery($query);

            // execute the query
            if (!$db->execute()) {
                throw new \Exception(Text::sprintf('WF_INSTALLER_REMOVE_FROM_GROUP_ERROR', $plugin->name));
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
        $db = Factory::getContainer()->get(DatabaseInterface::class);

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
