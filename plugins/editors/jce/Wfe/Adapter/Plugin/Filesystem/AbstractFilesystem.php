<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Adapter\Plugin\Filesystem;

\defined('_JEXEC') or die;

use Joomla\CMS\Uri\Uri;
use Joomla\Registry\Registry;

/**
 * Base filesystem adapter.
 *
 * Defines the contract every filesystem adapter implements and provides safe defaults, so an
 * adapter only overrides what it supports. The defaults are inert: read methods return empty
 * values and write methods report success without touching anything, which keeps the browser
 * working against an adapter that has not implemented an operation.
 *
 * Adapters: the local joomla adapter, plus the s3, azure, webdav and server plugins.
 */
class AbstractFilesystem extends \Wfe\Adapter\Plugin\AbstractPlugin
{
    /**
     * Constructor activating the default information of the class.
     *
     * @param array  $config    Configuration values, merged over the defaults set here.
     * @param object $container The plugin container.
     */
    public function __construct($config = array(), $container = null)
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

        parent::__construct($config, $container);
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
        // get the filesystem plugin name
        $name = $this->getConfig('name');

        $container = $this->getContainer();

        // First, try from the editor context
        $value = $container->getParam('editor.filesystem.' . $name . '.' . $key, $default);

        $fsConfig = $container->getParam($container->getName() . '.filesystem.' . $name);

        if (is_object($fsConfig) || $container->getParam($container->getName() . '.filesystem.name') == $name) {
            $fs = new Registry($fsConfig);
            $value = $fs->get($key, $default);
        }

        return $value;
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
        $name = $this->getConfig('name');

        $allow_root = $this->getContainer()->getParam('filesystem.' . $name . '.allow_root', 0);

        if ($allow_root) {
            return '';
        }

        return 'images';
    }

    /**
     * Sort a list of items by a property key.
     *
     * The key is read from the item, or from its 'properties' array. A leading "-" reverses the
     * order, eg: "-modified". Sorting is natural and case insensitive.
     *
     * @param array  $items The items to sort
     * @param string $type  The property to sort by, optionally prefixed with "-"
     *
     * @return array The sorted items
     */
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

    /**
     * Convert a relative path to an absolute path.
     *
     * @param string $path Relative path
     *
     * @return string Absolute path
     */
    public function toAbsolute($path)
    {
        return $path;
    }

    /**
     * Convert an absolute path to a relative path.
     *
     * @param string $path Absolute path
     *
     * @return string Relative path
     */
    public function toRelative($path)
    {
        return $path;
    }

    /**
     * Get the total size of a folder in bytes.
     *
     * @param string  $path    Folder path
     * @param boolean $recurse Whether to include subfolders
     *
     * @return int Total size in bytes
     */
    public function getTotalSize($path, $recurse = true)
    {
        return 0;
    }

    /**
     * Count the files in a folder.
     *
     * @param string  $path    Folder path
     * @param boolean $recurse Whether to include subfolders
     *
     * @return int Number of files
     */
    public function countFiles($path, $recurse = false)
    {
        return 0;
    }

    /**
     * Get a list of files in a directory.
     *
     * @param string $path   Relative directory path
     * @param string $filter File name filter pattern
     *
     * @return array List of file data arrays
     */
    public function getFiles($path, $filter)
    {
        return array();
    }

    /**
     * Get a list of folders in a directory.
     *
     * @param string $path   Relative directory path
     * @param string $filter Folder name filter pattern
     *
     * @return array List of folder data arrays
     */
    public function getFolders($path, $filter)
    {
        return array();
    }

    /**
     * Resolve the directory a path belongs to.
     *
     * @param string $path Relative path
     *
     * @return string The directory path
     */
    public function getSourceDir($path)
    {
        return $path;
    }

    /**
     * Resolve the directory holding a file, or return the path unchanged if it is not a file.
     *
     * @param string $path Relative path
     *
     * @return string The directory path
     */
    public function getSourceDirFromFile($path)
    {
        if ($this->is_file($path)) {
            return $this->getSourceDir($path);
        }

        return $path;
    }

    /**
     * Compare two paths for equality.
     *
     * Adapters that are case insensitive or that normalise separators override this.
     *
     * @param string $needle   The path to find
     * @param string $haystack The path to compare against
     *
     * @return bool True if the paths refer to the same item
     */
    public function isMatch($needle, $haystack)
    {
        return $needle == $haystack;
    }

    /**
     * Get the parts of a path.
     *
     * @param string $path The path to inspect
     *
     * @return array The dirname, basename, extension and filename values
     */
    public function pathinfo($path)
    {
        return pathinfo($path);
    }

    /**
     * Delete a file or folder.
     *
     * @param string $path Relative path to the item
     *
     * @return FilesystemResult|bool The result object, or true when nothing was done
     */
    public function delete($path)
    {
        return true;
    }

    /**
     * Create a folder.
     *
     * @param string $path Relative path to the parent directory
     * @param string $new  Name of the folder to create
     *
     * @return FilesystemResult|bool The result object, or true when nothing was done
     */
    public function createFolder($path, $new)
    {
        return true;
    }

    /**
     * Rename a file or folder within its own directory.
     *
     * $dest is a name, not a path. For a file the source extension is appended by the adapter.
     *
     * @param string $src  Relative path to the item
     * @param string $dest The new name, without an extension
     *
     * @return FilesystemResult|bool The result object, or true when nothing was done
     */
    public function rename($src, $dest)
    {
        return true;
    }

    /**
     * Copy a file or folder into a directory.
     *
     * @param string $src  Relative path to the item
     * @param string $dest Relative path to the destination directory
     *
     * @return FilesystemResult|bool The result object, or true when nothing was done
     */
    public function copy($src, $dest)
    {
        return true;
    }

    /**
     * Move a file or folder into a directory.
     *
     * @param string $src  Relative path to the item
     * @param string $dest Relative path to the destination directory
     *
     * @return FilesystemResult|bool The result object, or true when nothing was done
     */
    public function move($src, $dest)
    {
        return true;
    }

    /**
     * Get a folder's properties.
     *
     * @param string $path Folder relative path
     *
     * @return array Array with a 'properties' key holding the modified date
     */
    public function getFolderDetails($path)
    {
        return array(
            'properties' => array('modified' => ''),
        );
    }

    /**
     * Get a file's properties.
     *
     * Image types gain width, height and preview values on top of the standard set.
     *
     * @param string $path File relative path
     *
     * @return array Array with a 'properties' key holding the size and modified date
     */
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

    /**
     * Get the pixel dimensions of an image.
     *
     * @param string $path File relative path
     *
     * @return array Array with 'width' and 'height' keys
     */
    public function getDimensions($path)
    {
        return array(
            'width' => '',
            'height' => '',
        );
    }

    /**
     * Upload a file to the filesystem.
     *
     * @param string $method Upload method
     * @param string $src    Temporary source file path
     * @param string $dir    Destination directory (relative)
     * @param string $name   Destination filename
     *
     * @return FilesystemResult|bool The result object, or true when nothing was done
     */
    public function upload($method, $src, $dir, $name)
    {
        return true;
    }

    /**
     * Check whether a path exists.
     *
     * @param string $path Relative path
     *
     * @return bool True if the item exists
     */
    public function exists($path)
    {
        return true;
    }

    /**
     * Read a file's contents.
     *
     * @param string $path Relative file path
     *
     * @return string|false The contents, or false on failure
     */
    public function read($path)
    {
        return '';
    }

    /**
     * Write data to a file, creating or replacing it.
     *
     * @param string $path    Relative file path
     * @param string $content The data to write
     *
     * @return bool True on success
     */
    public function write($path, $content)
    {
        return true;
    }

    /**
     * Determine whether the filesystem is on the local server.
     *
     * @return bool True for a local filesystem
     */
    public function isLocal()
    {
        return $this->getConfig('local') === true;
    }

    /**
     * Check whether a path is a file.
     *
     * @param string $path Relative path
     *
     * @return bool True if the path is a file
     */
    public function is_file($path)
    {
        return true;
    }

    /**
     * Check whether a path is a directory.
     *
     * @param string $path Relative path
     *
     * @return bool True if the path is a directory
     */
    public function is_dir($path)
    {
        return true;
    }
}
