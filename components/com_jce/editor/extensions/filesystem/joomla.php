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

use Joomla\CMS\Client\ClientHelper;
use Joomla\CMS\Factory;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;
use Joomla\Registry\Registry;

class WFJoomlaFileSystem extends WFFileSystem
{
    /**
     * A list of restricted directories if allowroot is set to true.
     *
     * @var array
     */
    protected $restricted = array(
        'administrator',
        'api',
        'bin',
        'cache',
        'components',
        'cli',
        'includes',
        'language',
        'layouts',
        'libraries',
        'logs',
        'media',
        'modules',
        'plugins',
        'templates',
        'tmp',
        'xmlrpc',
    );

    /**
     * Allow root access to the filesystem.
     *
     * @var boolean
     */
    protected $allowroot = false;

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        // normalize allow_root as boolean to "allowroot"
        if (isset($config['allow_root'])) {
            $this->allowroot = (bool) $config['allow_root'];
            
            // remove allow_root from config
            unset($config['allow_root']);
        }

        if (isset($config['restrict_dir'])) {
            $restricted = $config['restrict_dir'];

            // Normalize $restricted to array
            if (is_string($restricted)) {
                $restricted = array_map('trim', explode(',', $restricted));
            }

            // Clean empty values
            $restricted = array_filter($restricted);

            // update class property
            $this->restricted = $restricted;
        }

        // remove root folder restrictions
        if ($this->allowroot === false) {
            $this->restricted = [];
        }

        if (!isset($config['root'])) {
            $config['root'] = 'images';
        }

        if (!isset($config['list_limit'])) {
            $config['list_limit'] = 0; // "all
        }

        // this is a "local" filesystem
        $config['local'] = true;        

        parent::__construct($config);
    }

    /**
     * Get the base directory.
     *
     * @return string base dir
     */
    public function getBaseDir($path = '')
    {
        return JPATH_SITE;
    }

    /**
     * Get the full base url.
     *
     * @return string base url
     */
    public function getBaseURL($path = '')
    {
        return Uri::root(true);
    }

    /**
     * Return the full user directory path. Create if required.
     *
     * @param string    The base path
     *
     * @return Full path to folder
     */
    public function getRootDir()
    {        
        if ($this->get('allowroot')) {
            return ''; // return a blank value for allowroot
        }

        return $this->get('root', 'images');
    }

    public function toAbsolute($path)
    {
        if (empty($path)) {
            $path = $this->getRootDir();
        }
        
        return WFUtility::makePath($this->getBaseDir(), $path);
    }

    public function toRelative($path, $isabsolute = true)
    {
        // path is absolute
        $base = $this->getBaseDir();

        // path is relative to Joomla! root, eg: images/folder
        if ($isabsolute === false) {
            $base = '';
        }

        if (function_exists('mb_substr')) {
            $path = mb_substr($path, mb_strlen($base));
        } else {
            $path = substr($path, strlen($base));
        }

        $path = WFUtility::cleanPath($path);

        return ltrim($path, '/');
    }

    /**
     * Determine whether FTP mode is enabled.
     *
     * @return bool
     */
    public function isFtp()
    {
        // Initialize variables
        $FTPOptions = ClientHelper::getCredentials('ftp');

        return $FTPOptions['enabled'] == 1;
    }

    public function getTotalSize($path, $recurse = true)
    {
        $total = 0;

        if (strpos($path, $this->getBaseDir()) === false) {
            $path = $this->toAbsolute($path);
        }

        if (is_dir($path)) {
            $files = Folder::files($path, '.', $recurse, true, array('.svn', 'CVS', '.DS_Store', '__MACOSX', 'index.html', 'thumbs.db'));

            foreach ($files as $file) {
                $total += filesize($file);
            }
        }

        return $total;
    }

    /**
     * Count the number of files in a folder.
     *
     * @return int File total
     *
     * @param string $path Absolute path to folder
     */
    public function countFiles($path, $recurse = false)
    {
        if (strpos($path, $this->getBaseDir()) === false) {
            $path = $this->toAbsolute($path);
        }

        if (is_dir($path)) {
            $files = Folder::files($path, '.', $recurse, false, array('.svn', 'CVS', '.DS_Store', '__MACOSX', 'index.html', 'thumbs.db'));

            return count($files);
        }

        return 0;
    }

    /**
     * Count the number of folders in a folder.
     *
     * @return int Folder total
     *
     * @param string $path Absolute path to folder
     */
    public function countFolders($path)
    {
        if (strpos($path, $this->getBaseDir()) === false) {
            $path = $this->toAbsolute($path);
        }

        if (is_dir($path)) {
            $folders = Folder::folders($path, '.', false, false, array('.svn', 'CVS', '.DS_Store', '__MACOSX'));

            return count($folders);
        }

        return 0;
    }

    public function getFolders($relative, $filter = '', $sort = '', $limit = 25, $start = 0, $depth = 0)
    {
        // trim to remove leading and trailing slashes
        $relative = trim($relative, '/');

        // resolve to absolute path, defaulting to root directory if empty
        $path = $this->toAbsolute($relative);
        $path = WFUtility::fixPath($path);

        // if the path does not exist, set to root directory
        if (!is_dir($path)) {
            $relative = '';
            $path = $this->toAbsolute($relative);
        }

        $list = Folder::folders($path, $filter, $depth, true);

        $folders = array();

        $restrictedPaths = array_map(function ($val) use ($relative) {
            $absolute = $this->toAbsolute($val);
            $absolute = WFUtility::makePath($absolute, $relative);

            // trim trailing slashes
            $absolute = rtrim($absolute, '/');

            return $absolute;
        }, $this->restricted);

        if (!empty($list)) {
            // Sort alphabetically by default
            natcasesort($list);

            foreach ($list as $item) {
                $item = rawurldecode($item);

                // clean path to remove multiple slashes
                $item = WFUtility::cleanPath($item);

                $name = WFUtility::mb_basename($item);
                $name = WFUtility::convertEncoding($name);

                if (in_array($item, $restrictedPaths, true)) {
                    continue;
                }

                $id = WFUtility::makePath($relative, $name, '/');

                if ($depth) {
                    $id = $this->toRelative($item);
                    $id = WFUtility::convertEncoding($id);
                    $name = $id;
                }

                // trim leading slash
                $id = ltrim($id, '/');

                $data = array(
                    'id' => $id,
                    'name' => $name,
                    'writable' => is_writable($item) || $this->isFtp(),
                    'type' => 'folders',
                    'properties' => $this->getFolderDetails($id),
                );

                $folders[] = $data;
            }
        }

        if ($sort && strpos($sort, 'extension') === false) {
            $folders = self::sortItemsByKey($folders, $sort);
        }

        return $folders;
    }

    public function getFiles($relative, $filter = '', $sort = '', $limit = 25, $start = 0, $depth = 0)
    {
        // trim to remove leading and trailing slashes
        $relative = trim($relative, '/');

        // resolve to absolute path, defaulting to root directory if empty
        $path = $this->toAbsolute($relative);
        $path = WFUtility::fixPath($path);

        // if the path does not exist, set to root directory
        if (!is_dir($path)) {
            $relative = '';
            $path = $this->toAbsolute($relative);
        }

        // excluded files
        $exclude = array('.svn', 'CVS', '.DS_Store', '__MACOSX', 'index.html');

        $list = Folder::files($path, $filter, $depth, true, $exclude);

        $files = array();

        // get the total files in the list
        $count = count($list);

        if (!empty($list)) {
            // Sort alphabetically by default
            natcasesort($list);

            foreach ($list as $item) {
                $item = rawurldecode($item);

                $name = WFUtility::mb_basename($item);
                $name = WFUtility::convertEncoding($name);

                if ($depth) {
                    $relative = $this->toRelative($item);
                    $relative = WFUtility::mb_dirname($relative);
                }

                // create relative file
                $id = WFUtility::makePath($relative, $name, '/');

                // check for file validity - prevent display of files with invalid encoding that have been "cleaned"
                if (!is_file(WFUtility::makePath($this->getBaseDir(), $id, '/'))) {
                    continue;
                }

                // reset name for recursive search
                if ($depth) {
                    $name = trim($id, '/');
                }

                // create url from absolute path
                $url = $this->toRelative($item);

                // remove leading slash
                $url = trim($url, '/');

                $data = array(
                    'id' => $id,
                    'url' => $url,
                    'name' => $name,
                    'writable' => is_writable($item) || $this->isFtp(),
                    'type' => 'files',
                    'extension' => WFUtility::getExtension($name),
                    'properties' => $this->getFileDetails($id, $count),
                );

                $files[] = $data;
            }
        }

        if ($sort) {
            $files = self::sortItemsByKey($files, $sort);
        }

        return $files;
    }

    public function searchItems($relative, $query = '', $filetypes = array(), $sort = '', $depth = 3)
    {
        $result = array(
            'folders' => array(),
            'files' => array(),
        );

        if ($query) {
            // get folder list
            $result['folders'] = $this->getFolders($relative, $query, 0, 0, $sort, $depth);
        }
        
        $filter = $query;

        // create filter for filetypes
        if (!empty($filetypes)) {
            $filter .= '\.(?i)(' . implode('|', $filetypes) . ')$';
        }

        // get file list
        $result['files'] = $this->getFiles($relative, $filter, 0, 0, $sort, $depth);

        return $result;
    }

    /**
     * Get a folders properties.
     *
     * @return array Array of properties
     *
     * @param string $dir   Folder relative path
     * @param string $types File Types
     */
    public function getFolderDetails($dir)
    {
        clearstatcache();

        if (is_array($dir)) {
            $dir = isset($dir['path']) ? $dir['path'] : '';
        }

        if (empty($dir)) {
            return array();
        }

        $path = $this->toAbsolute(rawurldecode($dir));
        $date = @filemtime($path);

        return array('modified' => $date, 'size' => '');
    }

    /**
     * Get the source directory of a file path.
     */
    public function getSourceDir($path)
    {
        // return nothing if absolute $path
        if (preg_match('#^(file|http(s)?):\/\/#', $path)) {
            return '';
        }

        // directory path relative base directory
        if ($this->is_dir($path)) {
            return $path;
        }

        // file url relative to site root
        if ($this->is_file($path)) {
            return dirname($path);
        }

        return '';
    }

    public function isMatch($needle, $haystack)
    {
        return $needle == $haystack;
    }

    /**
     * Return constituent parts of a file path eg: base directory, file name.
     *
     * @param $path Relative or absolute path
     */
    public function pathinfo($path)
    {
        return pathinfo($path);
    }

    /**
     * Get a files properties.
     *
     * @return array Array of properties
     *
     * @param string $file File relative path
     */
    public function getFileDetails($file, $count = 1)
    {
        clearstatcache();

        if (is_array($file)) {
            $file = isset($file['path']) ? $file['path'] : '';
        }

        if (empty($file)) {
            return array();
        }

        $path = $this->toAbsolute(rawurldecode($file));
        $url = WFUtility::makePath($this->getBaseUrl(), rawurldecode($file));

        $date = @filemtime($path);
        $size = @filesize($path);

        $data = array(
            'size' => $size,
            'modified' => $date,
        );

        $data['preview'] = WFUtility::cleanPath($url, '/');

        if (preg_match('#\.(jpg|jpeg|bmp|gif|tiff|png|apng|webp|svg)#i', $file)) {
            $image = array();

            if ($count <= 100) {
                if (preg_match('#\.svg$#i', $file)) {
                    $svg = @simplexml_load_file($path);

                    if ($svg && isset($svg['viewBox'])) {
                        list($start_x, $start_y, $end_x, $end_y) = explode(' ', $svg['viewBox']);

                        $width = (int) $end_x;
                        $height = (int) $end_y;

                        if ($width && $height) {
                            $image['width'] = $width;
                            $image['height'] = $height;
                        }
                    }
                } else {
                    list($image['width'], $image['height']) = @getimagesize($path);
                }
            }

            $data['preview'] .= '?' . $date;

            return array_merge_recursive($data, $image);
        }

        return $data;
    }

    private function checkRestrictedDirectory($path)
    {
        if ($this->allowroot) {
            foreach ($this->restricted as $name) {
                $restricted = $this->toAbsolute($name);

                $match = false;

                if (function_exists('mb_substr')) {
                    $match = (mb_substr($path, 0, mb_strlen($restricted)) === $restricted);
                } else {
                    $match = (substr($path, 0, strlen($restricted)) === $restricted);
                }

                if ($match === true) {
                    throw new Exception('Access to the target directory is restricted');
                }
            }
        }

        return true;
    }

    /**
     * Delete the relative file(s).
     *
     * @param $files the relative path to the file name or comma seperated list of multiple paths
     *
     * @return string $error on failure
     */
    public function delete($src)
    {
        $path = $this->toAbsolute($src);

        // get error class
        $result = new WFFileSystemResult();

        // check path does not fall within a restricted folder
        $this->checkRestrictedDirectory($path);

        Factory::getApplication()->triggerEvent('onWfFileSystemBeforeDelete', array(&$path));

        if (is_file($path)) {
            $result->type = 'files';
            $result->state = File::delete($path);
        } elseif (is_dir($path)) {
            $result->type = 'folders';

            if ($this->countFiles($path) > 0 || $this->countFolders($path) > 0) {
                $result->message = Text::sprintf('WF_MANAGER_FOLDER_NOT_EMPTY', WFUtility::mb_basename($path));
            } else {
                $result->state = Folder::delete($path);
            }
        }

        Factory::getApplication()->triggerEvent('onWfFileSystemAfterDelete', array($path, $result->state));

        return $result;
    }

    /**
     * Rename a file.
     *
     * @param string $src  The relative path of the source file
     * @param string $dest The name of the new file
     *
     * @return string $error
     */
    public function rename($src, $dest)
    {
        $src = $this->toAbsolute(rawurldecode($src));
        $dir = WFUtility::mb_dirname($src);

        Factory::getApplication()->triggerEvent('onWfFileSystemBeforeRename', array(&$src, &$dest));

        $result = new WFFileSystemResult();

        if (is_file($src)) {
            $ext = WFUtility::getExtension($src);
            $file = $dest . '.' . $ext;
            $path = WFUtility::makePath($dir, $file);

            // check path does not fall within a restricted folder
            $this->checkRestrictedDirectory($path);

            $result->type = 'files';
            $result->state = File::move($src, $path);
            $result->path = $path;
            // include original source path
            $result->source = $src;
        } elseif (is_dir($src)) {
            $path = WFUtility::makePath($dir, $dest);

            $result->type = 'folders';
            $result->state = Folder::move($src, $path);
            $result->path = $path;
            // include original source path
            $result->source = $src;
        }

        Factory::getApplication()->triggerEvent('onWfFileSystemAfterRename', array(&$result));

        return $result;
    }

    /**
     * Copy a file.
     *
     * @param string $files The relative file or comma seperated list of files
     * @param string $dest  The relative path of the destination dir
     *
     * @return string $error on failure
     */
    public function copy($file, $destination, $conflict = 'replace')
    {
        $result = new WFFileSystemResult();

        // trim to remove leading slash
        $file = trim($file, '/');

        $src = $this->toAbsolute($file);
        // destination relative path
        $dest = WFUtility::makePath($destination, WFUtility::mb_basename($file));
        // destination full path
        $dest = $this->toAbsolute($dest);

        // check destination path does not fall within a restricted folder
        $this->checkRestrictedDirectory($dest);

        Factory::getApplication()->triggerEvent('onWfFileSystemBeforeCopy', array(&$src, &$dest));

        // src is a file
        if (is_file($src)) {
            // resolve filename conflict by creating a copy if required
            if ($conflict == 'copy') {
                $name = WFUtility::mb_basename($file);
                $dest = $this->resolveFilenameConflict($dest, $name, true);
            }

            $result->type = 'files';
            $result->state = File::copy($src, $dest);
            $result->path = $dest;
            // include original source path
            $result->source = $src;
        } elseif (is_dir($src)) {
            // Folders cannot be copied into themselves as this creates an infinite copy / paste loop
            if ($file === $destination) {
                $result->message = Text::_('WF_MANAGER_COPY_INTO_ERROR');
                return $result;
            }

            $result->type = 'folders';
            $result->state = Folder::copy($src, $dest);
            $result->path = $dest;
            // include original source path
            $result->source = $src;
        }

        Factory::getApplication()->triggerEvent('onWfFileSystemAfterCopy', array(&$result));

        return $result;
    }

    /**
     * Copy a file.
     *
     * @param string $files The relative file or comma seperated list of files
     * @param string $dest  The relative path of the destination dir
     *
     * @return string $error on failure
     */
    public function move($file, $destination)
    {
        $result = new WFFileSystemResult();

        // trim to remove leading slash
        $file = trim($file, '/');

        $src = $this->toAbsolute($file);
        // destination relative path
        $dest = WFUtility::makePath($destination, WFUtility::mb_basename($file));
        // destination full path
        $dest = $this->toAbsolute($dest);

        // check destination path does not fall within a restricted folder
        $this->checkRestrictedDirectory($dest);

        Factory::getApplication()->triggerEvent('onWfFileSystemBeforeMove', array(&$src, &$dest));

        if ($src != $dest) {
            // src is a file
            if (is_file($src)) {
                $result->type = 'files';
                $result->state = File::move($src, $dest);
                $result->path = $dest;
                // include original source path
                $result->source = $src;
            } elseif (is_dir($src)) {
                // Folders cannot be copied into themselves as this creates an infinite copy / paste loop
                if ($file === $destination) {
                    $result->message = Text::_('WF_MANAGER_COPY_INTO_ERROR');
                    return $result;
                }

                $result->type = 'folders';
                $result->state = Folder::move($src, $dest);
                $result->path = $dest;
                // include original source path
                $result->source = $src;
            }
        }

        Factory::getApplication()->triggerEvent('onWfFileSystemAfterMove', array(&$result));

        return $result;
    }

    /**
     * New folder base function. A wrapper for the Folder::create function.
     *
     * @param string $folder The folder to create
     *
     * @return bool true on success
     */
    public function folderCreate($folder)
    {
        if (is_dir($folder)) {
            return false;
        }

        if (@Folder::create($folder)) {
            $buffer = '<html><body bgcolor="#FFFFFF"></body></html>';
            File::write($folder . '/index.html', $buffer);
        } else {
            return false;
        }

        return true;
    }

    /**
     * New folder.
     *
     * @param string $dir     The base dir
     * @param string $new_dir The folder to be created
     *
     * @return string $error on failure
     */
    public function createFolder($dir, $new)
    {
        // relative new folder path
        $dir = WFUtility::makePath(rawurldecode($dir), $new);
        // full folder path
        $path = $this->toAbsolute($dir);

        // check path does not fall within a restricted folder
        $this->checkRestrictedDirectory($path);

        $result = new WFFileSystemResult();

        $result->state = $this->folderCreate($path);
        $result->path = $path;
        $result->type = 'folders';

        Factory::getApplication()->triggerEvent('onWfFileSystemCreateFolder', array($path, $result->state));

        return $result;
    }

    public function getDimensions($file)
    {
        $path = $this->toAbsolute(utf8_decode(rawurldecode($file)));

        $data = array(
            'width' => '',
            'height' => '',
        );

        if (file_exists($path)) {
            $dim = @getimagesize($path);
            $data = array(
                'width' => $dim[0],
                'height' => $dim[1],
            );
        }

        return $data;
    }

    protected function resolveFilenameConflict($destination, $name, $createCopy = false)
    {
        // get overwrite state
        $conflict = $this->get('upload_conflict', 'overwrite');

        // get suffix
        $suffix = $this->get('upload_suffix', '_copy');

        $path = WFUtility::mb_dirname($destination);

        if ($conflict == 'unique' || $createCopy) {
            // get extension
            $extension = WFUtility::getExtension($name);
            // get name without extension
            $name = WFUtility::stripExtension($name);
            // create tmp copy
            $tmpname = $name;

            $x = 1;

            while (is_file($destination)) {
                if (strpos($suffix, '$') !== false) {
                    $tmpname = $name . str_replace('$', $x, $suffix);
                } else {
                    $tmpname .= $suffix;
                }

                $destination = WFUtility::makePath($path, $tmpname . '.' . $extension);

                ++$x;
            }
        }

        return $destination;
    }

    public function upload($method, $src, $dir, $name, $chunks = 1, $chunk = 0)
    {
        $app = Factory::getApplication();

        // full destination directory path
        $path = $this->toAbsolute(rawurldecode($dir));
        // full file path
        $dest = WFUtility::makePath($path, $name);

        // check destination path does not fall within a restricted folder
        $this->checkRestrictedDirectory($dest);

        // check for safe mode
        $safe_mode = false;

        if (function_exists('ini_get')) {
            $safe_mode = ini_get('safe_mode');
        } else {
            $safe_mode = true;
        }

        $result = new WFFileSystemResult();

        // resolve filename conflict by creating a copy if required
        $dest = $this->resolveFilenameConflict($dest, $name);

        $app->triggerEvent('onWfFileSystemBeforeUpload', array(&$src, &$dest));

        // create object to pass to joomla event
        $object_file = new StdClass;
        $object_file->name = WFUtility::mb_basename($dest);
        $object_file->tmp_name = $src;
        $object_file->filepath = $dest;

        // vars for Joomla events
        $vars = array('com_jce.file', &$object_file, true, array());

        // trigger Joomla event before upload
        $app->triggerEvent('onContentBeforeSave', $vars);

        if (File::upload($src, $dest, false, true)) {
            $result->state = true;
            $result->path = $dest;
        }

        $app->triggerEvent('onWfFileSystemAfterUpload', array(&$result));

        // update $object_file
        $object_file->name = WFUtility::mb_basename($result->path);
        $object_file->filepath = $result->path;

        // trigger Joomla event after upload
        $app->triggerEvent('onContentAfterSave', $vars);

        return $result;
    }

    public function exists($path)
    {
        return $this->is_dir($path) || $this->is_file($path);
    }

    public function read($file)
    {
        $file = rawurldecode($file);

        $path = $this->toAbsolute($file);

        return file_get_contents($path);
    }

    public function write($file, $content)
    {
        $file = rawurldecode($file);

        $path = $this->toAbsolute($file);

        // check path does not fall within a restricted folder
        $this->checkRestrictedDirectory($path);

        Factory::getApplication()->triggerEvent('onWfFileSystemBeforeWrite', array(&$path, &$content));

        $result = File::write($path, $content);

        Factory::getApplication()->triggerEvent('onWfFileSystemAfterWrite', array($path, $result));

        return $result;
    }

    public function is_file($path)
    {
        $path = $this->toAbsolute($path);
        return is_file($path);
    }

    public function is_dir($path)
    {
        $path = $this->toAbsolute($path);
        return is_dir($path);
    }
}
