<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Uri\Uri;
use Joomla\Registry\Registry;

class WFFileSystem extends WFExtension
{
    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        if (!isset($config['list_limit'])) {
            $config['list_limit'] = 50;
        }

        if (!isset($config['local'])) {
            $config['local'] = true;
        }

        if (!isset($config['readonly'])) {
            $config['readonly'] = false;
        }

        if (!isset($config['list_limit_options'])) {
            $config['list_limit_options'] = array(10, 25, 50, 0);
        }
        
        parent::__construct($config);
    }

    /**
     * Custom parameter function for Filesystems which contain complex values
     *
     * @param [string] $key Parameter key
     * @param string $default Default value to return
     * @return mixed Parameter value or default
     */
    public function getParam($key, $default = '')
    {
        $wf = WFEditorPlugin::getInstance();

        // get the filesystem plugin name
        $name = $this->get('name');

        // First, try from the editor context
        $value = $wf->getParam('editor.filesystem.' . $name . '.' . $key, $default);

        $fsConfig = $wf->getParam($wf->getName() . '.filesystem.' . $name);

        if (is_object($fsConfig) || $wf->getParam($wf->getName() . '.filesystem.name') == $name) {
            $fs = new Registry($fsConfig);
            $value = $fs->get($key, $default);
        }

        return $value;
    }

    /**
     * Returns a reference to a plugin object.
     */
    public static function getInstance($type = 'joomla', $config = array())
    {
        static $instances = array();

        $signature = md5($type . serialize($config));

        if (!isset($instances[$signature])) {
            $fs = parent::loadExtensions('filesystem', $type);

            // load the default...
            if (empty($fs)) {
                $fs = parent::loadExtensions('filesystem', 'joomla');
            }

            // get the first filesystem extension only
            if (is_array($fs)) {
                $fs = array_shift($fs);
            }

            $classname = 'WF' . ucfirst($fs->name) . 'FileSystem';

            // store the name
            $config['name'] = $fs->name;

            if (class_exists($classname)) {
                $instances[$signature] = new $classname($config);
            } else {
                $instances[$signature] = new self($config);
            }
        }

        return $instances[$signature];
    }

    /**
     * Get the base directory.
     *
     * @return string base dir
     */
    public function getBaseDir()
    {
        return JPATH_SITE;
    }

    /**
     * Get the full base url.
     *
     * @return string base url
     */
    public function getBaseURL()
    {
        return Uri::root(true);
    }

    /**
     * Return default directory for the filesystem.
     *
     * @return Relative path to the root directory
     */
    public function getRootDir()
    {
        $wf = WFEditorPlugin::getInstance();
        $name = $this->get('name');

        $allow_root = $wf->getParam('filesystem.' . $name . '.allow_root', 0);

        if ($allow_root) {
            return '';
        }

        return 'images';
    }

    protected static function sortItemsByKey($items, $type)
    {
        $sortable = array();

        // set default direction
        $direction = 'asc';

        if ($type[0] === '-') {
            $direction = 'desc';
            $type = substr($type, 1);
        }

        foreach ($items as $key => $item) {
            $sortable[$key] = isset($item[$type]) ? $item[$type] : $item['properties'][$type];
        }

        array_multisort($sortable, $direction === 'desc' ? SORT_DESC : SORT_ASC, SORT_NATURAL | SORT_FLAG_CASE, $items);

        return $items;
    }

    public function toAbsolute($path)
    {
        return $path;
    }

    public function toRelative($path)
    {
        return $path;
    }

    public function getTotalSize($path, $recurse = true)
    {
        return 0;
    }

    public function countFiles($path, $recurse = false)
    {
        return 0;
    }

    public function getFiles($path, $filter)
    {
        return array();
    }

    public function getFolders($path, $filter)
    {
        return array();
    }

    public function getSourceDir($path)
    {
        return $path;
    }

    public function getSourceDirFromFile($path)
    {
        if ($this->is_file($path)) {
            return $this->getSourceDir($path);
        }

        return $path;
    }

    public function isMatch($needle, $haystack)
    {
        return $needle == $haystack;
    }

    public function pathinfo($path)
    {
        return pathinfo($path);
    }

    public function delete($path)
    {
        return true;
    }

    public function createFolder($path, $new)
    {
        return true;
    }

    public function rename($src, $dest)
    {
        return true;
    }

    public function copy($src, $dest)
    {
        return true;
    }

    public function move($src, $dest)
    {
        return true;
    }

    public function getFolderDetails($path)
    {
        return array(
            'properties' => array('modified' => ''),
        );
    }

    public function getFileDetails($path)
    {
        $data = array(
            'properties' => array(
                'size' => '',
                'modified' => '',
            ),
        );

        if (preg_match('#\.(jpg|jpeg|bmp|gif|tiff|png)#i', $path)) {
            $image = array(
                'properties' => array(
                    'width' => 0,
                    'height' => 0,
                    'preview' => '',
                ),
            );

            return array_merge_recursive($data, $image);
        }

        return $data;
    }

    public function getDimensions($path)
    {
        return array(
            'width' => '',
            'height' => '',
        );
    }

    public function upload($method, $src, $dir, $name, $chunks = 0, $chunk = 0)
    {
        return true;
    }

    public function exists($path)
    {
        return true;
    }

    public function read($path)
    {
        return '';
    }

    public function write($path, $content)
    {
        return true;
    }

    public function isLocal()
    {
        return $this->get('local') === true;
    }

    public function is_file($path)
    {
        return true;
    }

    public function is_dir($path)
    {
        return true;
    }
}

/**
 * Filesystem Error class.
 */
final class WFFileSystemResult
{
    /*
     * @var Object type eg: file / folder
     */

    public $type = 'files';
    /*
     * @boolean    Result state
     */
    public $state = false;
    /*
     * @int    Error code
     */
    public $code = null;
    /*
     * @var Error message
     */
    public $message = null;
    /*
     * @var File / Folder path
     */
    public $path = null;
    /*
     * @var File / Folder url
     */
    public $url = null;
    /*
     * @var Original Source path
     */
    public $source = null;

    public function __construct() {}
}
