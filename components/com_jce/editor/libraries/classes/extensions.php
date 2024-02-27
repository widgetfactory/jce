<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Filesystem\File;
use Joomla\CMS\Filesystem\Folder;
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Plugin\PluginHelper;

class WFExtension extends CMSObject
{
    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        parent::__construct();

        // set extension properties
        $this->setProperties($config);
    }

    /**
     * Returns a reference to a WFExtension object.
     *
     * This method must be invoked as:
     *    <pre>  $extension = WFExtension::getInstance();</pre>
     *
     * @return object WFExtension
     */
    /* public static function getInstance()
    {
    static $instance;

    if (!is_object($instance)) {
    $instance = new WFExtension();
    }
    return $instance;
    } */

    /**
     * Display the extension.
     */
    public function display()
    {
    }

    /**
     * Load a plugin extension.
     *
     * @return array
     */
    private static function _load($types = array(), $extension = null, $config = array())
    {
        $language = Factory::getLanguage();

        $extensions = array();

        if (!isset($config['base_path'])) {
            $config['base_path'] = WF_EDITOR;
        }

        // core extensions path
        $path = $config['base_path'] . '/extensions';

        // cast as array
        $types = (array) $types;

        // get all installed plugins
        $installed = PluginHelper::getPlugin('jce');

        if (!empty($installed)) {
            foreach ($installed as $item) {
                // check for delimiter, only load "extensions"
                if (!preg_match('/[-_]/', $item->name) || preg_match('/^editor[-_]/', $item->name)) {
                    continue;
                }

                $p = clone $item;

                // set path
                $p->path = JPATH_PLUGINS . '/jce/' . $p->name;

                // get type and name
                list($p->folder, $p->extension) = preg_split('/[-_]/', $p->name, 2);

                // load the correct type if set
                if (!empty($types) && !in_array($p->folder, $types)) {
                    continue;
                }

                // specific extension
                if ($extension && $p->extension !== $extension) {
                    continue;
                }

                $language->load('plg_jce_' . $p->name, JPATH_ADMINISTRATOR);
                $language->load('plg_jce_' . $p->name, $p->path);

                // add to array
                $extensions[$p->extension] = $p;
            }
        }

        // get legacy extensions
        $legacy = Folder::folders(WF_EDITOR . '/extensions', '.', false, true);

        $core = array(
            'aggregator' => array(
                'dailymotion', 'vimeo', 'youtube',
            ),
            'filesystem' => array(
                'joomla',
            ),
            'links' => array(
                'joomlalinks',
            ),
            'popups' => array(
                'jcemediabox',
            ),
            'search' => array(
                'link',
            ),
        );

        foreach ($legacy as $item) {
            $type = basename($item);

            // unknown type
            if (array_key_exists($type, $core) === false) {
                continue;
            }

            // load the correct type if set
            if (!empty($types) && !in_array($type, $types)) {
                continue;
            }

            // specific extension
            if ($extension && !File::exists($item . '/' . $extension . '.php')) {
                continue;
            }

            if (!empty($extension)) {
                // already loaded as Joomla plugin
                if (isset($extensions[$extension])) {
                    continue;
                }

                $files = array($item . '/' . $extension . '.xml');
            } else {
                $files = Folder::files($item, '\.xml$', false, true);
            }

            foreach ($files as $file) {
                $extension = basename($file, '.xml');

                // unknown extension
                if (!in_array($extension, $core[$type])) {
                    continue;
                }

                $object = new stdClass();
                $object->folder = $type;
                $object->path = dirname($file);
                $object->extension = $extension;

                if (!isset($extensions[$extension])) {
                    $extensions[$extension] = $object;
                }
            }
        }

        return $extensions;
    }

    /**
     * Load & Call an extension.
     *
     * @param array $config
     *
     * @return mixed
     */
    public static function loadExtensions($type, $extension = null, $config = array())
    {
        if (!isset($config['base_path'])) {
            $config['base_path'] = WF_EDITOR;
        }

        // sanitize $type
        $type = preg_replace('#[^A-Z0-9\._-]#i', '', $type);

        // sanitize $extension
        if ($extension) {
            $extension = preg_replace('#[^A-Z0-9\._-]#i', '', $extension);
        }

        // Get all extensions
        $extensions = self::_load((array) $type, $extension, $config);

        $result = array();

        if (!empty($extensions)) {
            foreach ($extensions as $item) {
                $name = isset($item->extension) ? $item->extension : '';

                $type = $item->folder;
                $path = $item->path;

                if ($name) {
                    $root = $path . '/' . basename($path) . '.php';

                    // store name in item object
                    $item->name = $name;

                    // legacy - clean defined path for Windows!!
                    if (WFUtility::cleanPath(dirname($path)) === WFUtility::cleanPath(WF_EDITOR_EXTENSIONS)) {
                        $root = $path . '/' . $name . '.php';
                        // redefine path
                        $item->path = $path . '/' . $name;
                    }

                    if (is_dir($path . '/src')) {
                        $root = $path . '/src/' . $type . '.php'; 
                    }

                    if (file_exists($root)) {
                        // Load root extension file
                        require_once $root;

                        // Return array of extension names
                        $result[$type][] = $item;

                        // if we only want a named extension
                        if ($extension && $extension == $name) {
                            return $item;
                        }
                    }
                }
            }
        }

        // only return extension types requested
        if ($type && array_key_exists($type, $result)) {
            return $result[$type];
        }

        // Return array or extension name
        return $result;
    }

    /**
     * Return a parameter for the current plugin / group.
     *
     * @param object $key   Parameter name
     * @param object $default Default value
     *
     * @return string Parameter value
     */
    public function getParam($key, $default = '')
    {
        $wf = WFApplication::getInstance();

        return $wf->getParam($key, $default);
    }

    public function getView($options = array())
    {
        return new WFView($options);
    }
}
