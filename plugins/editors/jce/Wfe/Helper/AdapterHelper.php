<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Helper;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Filesystem\Folder;

class AdapterHelper
{
    protected static $legacyAdapterMap = [
        'aggregator' => 'media',
        'popups' => 'lightbox'
    ];

    /**
     * Load a adapter plugin list.
     *
     * Normalized return structure:
     *  [
     *      'media' => [
     *          'youtube' => (object),
     *          'vimeo'   => (object),
     *      ],
     *      'filesystem' => [
     *          'joomla' => (object),
     *      ],
     *  ]
     *
     * Sources:
     *  1) Core adapter plugins:  WF_PLUGINS/{Type}/{Plugin}/{plugin}.xml + PHP entry points
     *  2) Joomla plugins: plugins/jce/{type}-{plugin}
     *
     * @param  array|string  $types
     * @param  string|null   $plugin
     * @param  array         $config
     *
     * @return array
     */
    private static function load($types = array(), $plugin = null, $config = array())
    {
        static $cache = array();

        $language = Factory::getApplication()->getLanguage();

        // Normalize requested types to lowercase array
        $types = (array) $types;
        $types = array_map('strtolower', $types);

        // Normalize plugin name
        $plugin = !empty($plugin) ? strtolower($plugin) : '';

        // Cache key: base_path + types + plugin
        $cacheKey = md5(implode(',', $types) . '|' . (string) $plugin);

        if (isset($cache[$cacheKey])) {
            return $cache[$cacheKey];
        }

        // the array of adapter plugins by adapter type
        $plugins = array();

        // Core adapter plugins by adapter type: WF_PLUGINS/{Type}
        $adapterFolders = Folder::folders(WF_PLUGINS, '');

        // skip "Editor" folder
        $adapterFolders = array_filter($adapterFolders, function ($folder) {
            return strtolower($folder) !== 'editor';
        });

        foreach ($adapterFolders as $adapterFolder) {
            // get the adapter type from the folder name, eg: "filesystem"
            $adapterType = strtolower($adapterFolder);

            // Filter by type(s) if provided
            if (!empty($types) && !in_array($adapterType, $types, true)) {
                continue;
            }

            if (!isset($plugins[$adapterType])) {
                $plugins[$adapterType] = array();
            }

            // build the adapter path, eg: WF_PLUGINS/{Type}
            $adapterPath = WF_PLUGINS . '/' . $adapterFolder;

            // get all the plugin folders within the adapter path
            $pluginFolders = Folder::folders($adapterPath, '');

            foreach ($pluginFolders as $pluginFolder) {
                $folderPath = $adapterPath . '/' . $pluginFolder;
                $folderName = basename($pluginFolder);

                // normalize to lowercase
                $folderName = strtolower($folderName);

                // build the manifest path
                $manifestFile = $folderPath . '/' . $folderName . '.xml';

                if (!is_file($manifestFile)) {
                    continue;
                }

                // If a specific plugin is requested, only check that plugin folder
                if (!empty($plugin) && $plugin === $folderName) {

                    // read the manifest file to get the title
                    $definition = simplexml_load_file($manifestFile);
                    $title = isset($definition->name) ? (string) $definition->name : 'WF_' . strtoupper($adapterType) . '_' . strtoupper($plugin) . '_TITLE';

                    $object = new \stdClass();
                    $object->folder     = $adapterType;
                    $object->path       = $folderPath;
                    $object->plugin     = $plugin;
                    $object->title      = $title;

                    $plugins[$adapterType][$plugin] = $object;

                    continue;
                }

                // read the manifest file to get the title
                $definition = simplexml_load_file($manifestFile);
                $title = isset($definition->name) ? (string) $definition->name : 'WF_' . strtoupper($adapterType) . '_' . strtoupper($folderName) . '_TITLE';

                $object = new \stdClass();
                $object->folder     = $adapterType;
                $object->path       = $folderPath;
                $object->plugin     = $folderName;
                $object->title      = $title;

                $object->manifest   = $manifestFile;

                $plugins[$adapterType][$folderName] = $object;
            }
        }

        // Joomla plugin adapters: plugins/jce/{type}-{adapter}
        $installed = PluginHelper::getPlugin('jce');

        if (!empty($installed)) {
            foreach ($installed as $item) {
                // Only load adapters with a delimiter in name and not "editor-*"
                if (!preg_match('/[-_]/', $item->name) || preg_match('/^editor[-_]/', $item->name)) {
                    continue;
                }

                $p = clone $item;

                // Set plugin path
                $p->path = JPATH_PLUGINS . '/jce/' . $p->name;

                $parts = preg_split('/[-_]/', $p->name, 2);

                // Split name into type and adapter, eg: media-youtube
                list($p->type, $p->name) = $parts;

                // name
                $p->name = strtolower($p->name);
                $p->type = strtolower($p->type);

                // map to legacy adapter types
                $type = self::mapLegacyAdapterName($p->type);

                // Filter by adapter type(s) if provided, eg: [media, lightbox]
                if (!empty($types) && !in_array($type, $types, true)) {
                    continue;
                }

                // create title from name parts, eg: plg_jce_filesystem_joomla
                $p->title = 'plg_jce_' . $p->type . '_' . $p->name;

                $p->manifest = $p->path . '/' . $p->type . '_' . $p->name . '.xml';

                // Load language strings
                $language->load('plg_jce_' . $p->type . '_' . $p->name, JPATH_ADMINISTRATOR);
                $language->load('plg_jce_' . $p->type . '_' . $p->name, $p->path);

                $p->folder = $type;

                // store legacy type
                if ($p->type !== $type) {
                    $p->folder = $p->type;
                }

                // update the type (may be a legacy type)
                $p->type = $type;

                // Ensure bucket exists
                if (!isset($plugins[$type])) {
                    $plugins[$type] = array();
                }

                // Store by adapter name (normalized structure)
                $plugins[$type][$p->name] = $p;
            }
        }

        // Store in cache and return
        $cache[$cacheKey] = $plugins;

        return $plugins;
    }

    /**
     * Load & call adapters.
     *
     * If $adapter is set and found, returns the single adapter object.
     * Otherwise returns an array of adapter objects keyed by type.
     *
     * @param  string       $type
     * @param  string|null  $adapter
     * @param  array        $config
     *
     * @return mixed
     */
    public static function loadPlugins($type, $adapter = null, $config = array())
    {
        // Sanitize and normalize requested type
        $requestedType = preg_replace('#[^A-Z0-9\._-]#i', '', (string) $type);
        $requestedType = strtolower($requestedType);

        // Sanitize and normalize requested adapter (optional)
        if (!empty($adapter)) {
            $adapter = preg_replace('#[^A-Z0-9\._-]#i', '', (string) $adapter);
            $adapter = strtolower($adapter);
        }

        // Get adapters (normalized structure)
        $adapterPlugins = self::load(array($requestedType), $adapter, $config);

        $result = array();

        if (!isset($result[$requestedType])) {
            $result[$requestedType] = array();
        }

        if (!empty($adapterPlugins)) {
            foreach ($adapterPlugins as $typeKey => $items) {
                if (empty($items) || !is_array($items)) {
                    continue;
                }

                foreach ($items as $nameKey => $item) {
                    if (!is_object($item)) {
                        continue;
                    }

                    $typeFolder = isset($item->folder) ? strtolower($item->folder) : strtolower($typeKey);
                    $name       = isset($item->adapter) ? strtolower($item->adapter) : strtolower($nameKey);
                    $path       = isset($item->path) ? $item->path : '';

                    if (empty($typeFolder) || empty($name) || empty($path)) {
                        continue;
                    }

                    // Store name in item object for downstream usage
                    $item->name = $name;

                    // Store path in item object for downstream usage
                    $item->path = $path;

                    // Determine the root PHP entry file for this adapter.
                    // New convention: WF_PLUGINS/{Type}/{Adapter}/{adapter}.php
                    // Plugin convention: plugins/jce/{type}-{adapter}/{...} (path already points to plugin folder)
                    // Optional modern convention: WF_PLUGINS/{Type}/{Adapter}/src/{Type}.php
                    $root = $path . '/' . ucfirst($name) . '.php';

                    if (is_dir($path . '/src')) {
                        $root = $path . '/src/' . $typeFolder . '.php';
                    }

                    // If this is a Joomla plugin adapter folder, it may not follow the core naming.
                    // Fall back to "{basename(path)}.php" only if the primary root doesn't exist.
                    if (!file_exists($root)) {
                        $fallback = $path . '/' . basename($path) . '.php';

                        if (file_exists($fallback)) {
                            $root = $fallback;
                        }
                    }

                    if (file_exists($root)) {
                        // set the file path
                        $item->path = $root;

                        $result[$type][] = $item;

                        // If a specific adapter was requested, return it immediately
                        if (!empty($adapter) && $adapter === $name) {
                            return $item;
                        }
                    }
                }
            }
        }

        // Return only the requested type if present
        if (!empty($requestedType) && array_key_exists($requestedType, $result)) {
            return $result[$requestedType];
        }

        return $result;
    }

    public static function getPlugins($type = '', $create = false, $config = array())
    {
        // Cache instances by type:
        // [ 'media' => [ 'youtube' => <instance>, ... ] ]
        static $instancesByType = array();

        if (!$type) {
            return array();
        }

        $type = strtolower($type);

        // Return cached instances for this type
        if (isset($instancesByType[$type])) {
            return $instancesByType[$type];
        }

        $instancesByType[$type] = array();

        // Load plugin definitions (objects) for this plugin type
        $definitions = self::loadPlugins($type);

        if (empty($definitions)) {
            return $instancesByType[$type];
        }

        foreach ($definitions as $definition) {
            // Required for other uses, so ensure we use it as the key
            $name = isset($definition->name) ? $definition->name : '';

            if (!$name) {
                continue;
            }

            $name = strtolower($name);

            if ($create) {
                $instance = self::createPlugin($definition, $config);
            } else {
                $instance = $definition;
            }

            if ($instance) {
                $instancesByType[$type][$name] = $instance;
            }
        }

        return $instancesByType[$type];
    }

    public static function createPlugin($definition, $config = array(), $container = null)
    {
        // Cache instances by fully-qualified "type:name" to avoid collisions
        static $instances = array();

        $name = isset($definition->name) ? $definition->name : '';
        $type = isset($definition->folder) ? $definition->folder : '';
        $path = isset($definition->path) ? $definition->path : '';

        if (!$name || !$type || !$path) {
            return null;
        }

        $name = strtolower($name);
        $type = strtolower($type);

        $key = $type . ':' . $name;

        if (isset($instances[$key])) {
            return $instances[$key];
        }

        require_once $path;

        // Class name convention:
        // Wfe\Plugins\{Type}\{Name}
        $classname = 'Wfe\\Plugins\\' . ucfirst($type) . '\\' . ucfirst($name);

        if (!class_exists($classname)) {
            // fallback to legacy class
            $classname = 'WF' . ucfirst($name) . ucfirst($type);

            if ($type == 'links') {
                $classname = 'WFLinkBrowser_' . ucfirst($name);
            }
        }

        // Manual loading: don't trigger autoloading here
        if (class_exists($classname, false)) {
            $config['name']     = $name;
            $config['title']    = isset($definition->title) ? $definition->title : 'WF_' . strtoupper($type) . '_' . strtoupper($name) . '_TITLE';
            $config['path']     = isset($definition->path) ? $definition->path : '';

            $instances[$key]    = new $classname($config, $container);

            return $instances[$key];
        }

        // return null for safe fallback
        $instances[$key] = null;

        return null;
    }

    public static function isLegacyAdapterName($name)
    {
        return array_key_exists($name, self::$legacyAdapterMap);
    }

    public static function mapLegacyAdapterName($name)
    {
        if (self::isLegacyAdapterName($name)) {
            return self::$legacyAdapterMap[$name];
        }

        return $name;
    }

    // AdapterHelper
    private static function resolveParam($application, $key, $default = '')
    {
        $keys = explode('.', $key);
        $type = array_shift($keys);
        $name = $application->getName();

        if (self::isLegacyAdapterName($type)) {
            $default = $application->getParam($name . '.' . $type . '.' . implode('.', $keys), $default);
        }

        $type = self::mapLegacyAdapterName($type);

        return $application->getParam($name . '.' . $type . '.' . implode('.', $keys), $default);
    }

    public static function getParam($application, $key, $default = '')
    {
        return self::resolveParam($application, $key, $default);
    }
}
