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

class AbstractFilesystem extends \Wfe\Adapter\Plugin\AbstractPlugin
{
    /**
     * Constructor activating the default information of the class.
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

    public function upload($method, $src, $dir, $name)
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

    /**
     * Open a readable stream for a file. Adapters with native stream support should override this.
     * The default buffers the whole file into memory via read(), which is a correct but non-optimal
     * fallback for adapters that only implement string read/write.
     *
     * @param  string $path Relative file path.
     * @return resource|false A readable stream resource, or false on failure.
     */
    public function readStream($path)
    {
        $content = $this->read($path);

        if ($content === false || $content === null) {
            return false;
        }

        $stream = fopen('php://temp', 'r+b');

        if ($stream === false) {
            return false;
        }

        fwrite($stream, $content);
        rewind($stream);

        return $stream;
    }

    /**
     * Write a stream to a file. Adapters with native stream support should override this.
     * The default drains the stream into memory and delegates to write().
     *
     * @param  string   $path     Relative destination file path.
     * @param  resource $resource A readable stream resource.
     * @param  string   $conflict Conflict resolution mode ('', 'copy', 'replace').
     * @return FilesystemResult
     */
    public function writeStream($path, $resource, $conflict = 'replace')
    {
        $result = new FilesystemResult();
        $result->type = 'files';

        $content = is_resource($resource) ? stream_get_contents($resource) : '';

        $result->state = (bool) $this->write($path, $content);
        $result->path = $path;

        return $result;
    }

    public function isLocal()
    {
        return $this->getConfig('local') === true;
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
