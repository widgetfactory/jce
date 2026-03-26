<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Filesystem;

\defined('_JEXEC') or die;

use Joomla\CMS\Client\ClientHelper;
use Joomla\CMS\Factory;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\Event;
use Joomla\CMS\Event\Model\BeforeSaveEvent;
use Joomla\CMS\Event\Model\AfterSaveEvent;

use Wfe\Utility\Utility;
use Wfe\Adapter\Plugin\Filesystem\FilesystemResult;

class Joomla extends \Wfe\Adapter\Plugin\Filesystem\AbstractFilesystem
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
    public function __construct($config = array(), $container = null)
    {
        parent::__construct($config, $container);

        $safe_mode = false;

        // check for safe mode
        if (function_exists('ini_get')) {
            $safe_mode = ini_get('safe_mode');
            // assume safe mode if can't check ini
        } else {
            $safe_mode = true;
        }

        // Get default restricted directories and root access setting
        $restricted = $this->getParam('restricted', $this->restricted);
        $allowroot = (bool) $this->getParam('allow_root', 0);

        // Normalize $restricted to array
        if (is_string($restricted)) {
            $restricted = array_map('trim', explode(',', $restricted));
        }

        // Clean empty values
        $restricted = array_filter($restricted);

        // Cast to bool
        $allowroot = (bool) $allowroot;

        // remove root folder restrictions
        if (!$allowroot) {
            $restricted = [];
        }

        $this->setProperties(
            array(
                'local' => true,
                'list_limit' => 0, // "all",
                'allowroot' => (bool) $allowroot,
                'restricted' => $restricted,
            )
        );
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
        if ($this->getConfig('allowroot')) {
            return ''; // return a blank value for allowroot
        }

        return 'images';
    }

    public function toAbsolute($path)
    {
        return Utility::makePath($this->getBaseDir(), $path);
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

        $path = Utility::cleanPath($path);

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
        $path = $this->toAbsolute($relative);
        $path = Utility::fixPath($path);

        if (!is_dir($path)) {
            $relative = '/';
            $path = $this->getBaseDir();
        }

        $list = Folder::folders($path, $filter, $depth, true);

        $folders = array();

        $restrictedPaths = array_map(function ($val) use ($path) {
            return Utility::makePath($path, $val);
        }, $this->restricted);

        if (!empty($list)) {
            // Sort alphabetically by default
            natcasesort($list);

            foreach ($list as $item) {
                $item = rawurldecode($item);

                // clean path to remove multiple slashes
                $item = Utility::cleanPath($item);

                $name = Utility::mb_basename($item);
                $name = Utility::convertEncoding($name);

                if (in_array($item, $restrictedPaths, true)) {
                    continue;
                }

                $id = Utility::makePath($relative, $name, '/');

                if ($depth) {
                    $id = $this->toRelative($item);
                    $id = Utility::convertEncoding($id);
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
        $path = $this->toAbsolute($relative);
        $path = Utility::fixPath($path);

        if (!is_dir($path)) {
            $relative = '/';
            $path = $this->getBaseDir();
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

                $name = Utility::mb_basename($item);
                $name = Utility::convertEncoding($name);

                if ($depth) {
                    $relative = $this->toRelative($item);
                    $relative = Utility::mb_dirname($relative);
                }

                // create relative file
                $id = Utility::makePath($relative, $name, '/');

                // check for file validity - prevent display of files with invalid encoding that have been "cleaned"
                if (!is_file(Utility::makePath($this->getBaseDir(), $id, '/'))) {
                    continue;
                }

                // reset name for recursive search
                if ($depth) {
                    $name = trim($id, '/');
                }

                // create url
                $url = Utility::makePath($id, '/');

                // remove leading slash
                $url = trim($url, '/');

                $data = array(
                    'id' => $id,
                    'url' => $url,
                    'name' => $name,
                    'writable' => is_writable($item) || $this->isFtp(),
                    'type' => 'files',
                    'extension' => Utility::getExtension($name),
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
        $url = Utility::makePath($this->getBaseUrl(), rawurldecode($file));

        $date = @filemtime($path);
        $size = @filesize($path);

        $data = array(
            'size' => $size,
            'modified' => $date,
        );

        $data['preview'] = Utility::cleanPath($url, '/');

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
        if ($this->getConfig('allowroot')) {
            foreach ($this->restricted as $name) {
                $restricted = $this->toAbsolute($name);

                $match = false;

                if (function_exists('mb_substr')) {
                    $match = (mb_substr($path, 0, mb_strlen($restricted)) === $restricted);
                } else {
                    $match = (substr($path, 0, strlen($restricted)) === $restricted);
                }

                if ($match === true) {
                    throw new \Exception('Access to the target directory is restricted');
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
        $result = new FilesystemResult();

        // check path does not fall within a restricted folder
        $this->checkRestrictedDirectory($path);

        $dispatcher = Factory::getApplication()->getDispatcher();

        $event = new Event('onWfFileSystemBeforeDelete', array(
            'path' => $path,
            'subject' => $this
        ));

        Factory::getApplication()->getDispatcher()->dispatch('onWfFileSystemBeforeDelete', $event);

        $path = $event->getArgument('path');

        if (is_file($path)) {
            $result->type = 'files';
            $result->state = File::delete($path);
        } elseif (is_dir($path)) {
            $result->type = 'folders';

            if ($this->countFiles($path) > 0 || $this->countFolders($path) > 0) {
                $result->message = Text::sprintf('WF_MANAGER_FOLDER_NOT_EMPTY', Utility::mb_basename($path));
            } else {
                $result->state = Folder::delete($path);
            }
        }

        $event = new Event('onWfFileSystemAfterDelete', array(
            'state' => $result->state,
            'path' => $path,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemAfterDelete', $event);

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
        $dir = Utility::mb_dirname($src);

        $event = new Event('onWfFileSystemBeforeRename', array(
            'source' => $src,
            'destination' => $dest,
            'subject' => $this
        ));

        Factory::getApplication()->getDispatcher()->dispatch('onWfFileSystemBeforeRename', $event);

        $src = $event->getArgument('source');
        $dest = $event->getArgument('destination');

        $result = new FilesystemResult();

        if (is_file($src)) {
            $ext = Utility::getExtension($src);
            $file = $dest . '.' . $ext;
            $path = Utility::makePath($dir, $file);

            // check path does not fall within a restricted folder
            $this->checkRestrictedDirectory($path);

            $result->type = 'files';
            $result->state = File::move($src, $path);
            $result->path = $path;
            // include original source path
            $result->source = $src;
        } elseif (is_dir($src)) {
            $path = Utility::makePath($dir, $dest);

            $result->type = 'folders';
            $result->state = Folder::move($src, $path);
            $result->path = $path;
            // include original source path
            $result->source = $src;
        }

        $event = new Event('onWfFileSystemAfterRename', array(
            'result' => $result,
            'subject' => $this
        ));

        Factory::getApplication()->getDispatcher()->dispatch('onWfFileSystemAfterRename', $event);

        $result = $event->getArgument('result');

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
        $result = new FilesystemResult();

        // trim to remove leading slash
        $file = trim($file, '/');

        $src = $this->toAbsolute($file);
        // destination relative path
        $dest = Utility::makePath($destination, Utility::mb_basename($file));
        // destination full path
        $dest = $this->toAbsolute($dest);

        // check destination path does not fall within a restricted folder
        $this->checkRestrictedDirectory($dest);

        $dispatcher = Factory::getApplication()->getDispatcher();

        $event = new Event('onWfFileSystemBeforeCopy', array(
            'source' => $src,
            'destination' => $dest,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemBeforeCopy', $event);

        $src = $event->getArgument('source');
        $dest = $event->getArgument('destination');

        // src is a file
        if (is_file($src)) {
            // resolve filename conflict by creating a copy if required
            if ($conflict == 'copy') {
                $name = Utility::mb_basename($file);
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

        $event = new Event('onWfFileSystemAfterCopy', array(
            'result' => $result,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemAfterCopy', $event);

        $result = $event->getArgument('result');

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
        $result = new FilesystemResult();

        // trim to remove leading slash
        $file = trim($file, '/');

        $src = $this->toAbsolute($file);
        // destination relative path
        $dest = Utility::makePath($destination, Utility::mb_basename($file));
        // destination full path
        $dest = $this->toAbsolute($dest);

        // check destination path does not fall within a restricted folder
        $this->checkRestrictedDirectory($dest);

        $dispatcher = Factory::getApplication()->getDispatcher();

        $event = new Event('onWfFileSystemBeforeMove', array(
            'source' => $src,
            'destination' => $dest,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemBeforeMove', $event);

        $src = $event->getArgument('source');
        $dest = $event->getArgument('destination');

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

        $event = new Event('onWfFileSystemAfterMove', array(
            'result' => $result,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemAfterMove', $event);

        $result = $event->getArgument('result');

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
        $dir = Utility::makePath(rawurldecode($dir), $new);
        // full folder path
        $path = $this->toAbsolute($dir);

        // check path does not fall within a restricted folder
        $this->checkRestrictedDirectory($path);

        $dispatcher = Factory::getApplication()->getDispatcher();

        $result = new FilesystemResult();

        $result->state = $this->folderCreate($path);
        $result->path = $path;
        $result->type = 'folders';

        $event = new Event('onWfFileSystemCreateFolder', array(
            'path' => $path,
            'state' => $result->state,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemCreateFolder', $event);

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
        $conflict = $this->getConfig('upload_conflict', 'overwrite');

        // get suffix
        $suffix = $this->getConfig('upload_suffix', '_copy');

        $path = Utility::mb_dirname($destination);

        if ($conflict == 'unique' || $createCopy) {
            // get extension
            $extension = Utility::getExtension($name);
            // get name without extension
            $name = Utility::stripExtension($name);
            // create tmp copy
            $tmpname = $name;

            $x = 1;

            while (is_file($destination)) {
                if (strpos($suffix, '$') !== false) {
                    $tmpname = $name . str_replace('$', $x, $suffix);
                } else {
                    $tmpname .= $suffix;
                }

                $destination = Utility::makePath($path, $tmpname . '.' . $extension);

                ++$x;
            }
        }

        return $destination;
    }

    public function upload($method, $src, $dir, $name, $chunks = 1, $chunk = 0)
    {
        $app = Factory::getApplication();
        $dispatcher = $app->getDispatcher();

        // full destination directory path
        $path = $this->toAbsolute(rawurldecode($dir));

        // full file path
        $dest = Utility::makePath($path, $name);

        // check destination path does not fall within a restricted folder
        $this->checkRestrictedDirectory($dest);

        // check for safe mode
        $safe_mode = false;

        if (function_exists('ini_get')) {
            $safe_mode = ini_get('safe_mode');
        } else {
            $safe_mode = true;
        }

        $result = new FilesystemResult();

        // resolve filename conflict by creating a copy if required
        $dest = $this->resolveFilenameConflict($dest, $name);

        $event = new Event('onWfFileSystemBeforeUpload', array(
            'source' => $src,
            'destination' => $dest,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemBeforeUpload', $event);

        $src = $event->getArgument('source');
        $dest = $event->getArgument('destination');

        // create object to pass to joomla event
        $object_file = new \StdClass;
        $object_file->name = Utility::mb_basename($dest);
        $object_file->tmp_name = $src;
        $object_file->filepath = $dest;

        $event = new BeforeSaveEvent('onContentBeforeSave', array(
            'context' => 'com_jce.file',
            'item' => $object_file,
            'subject' => $this
        ));

        $dispatcher->dispatch('onContentBeforeSave', $event);

        $object_file = $event->getArgument('item');

        if (File::upload($src, $dest, false, true)) {
            $result->state = true;
            $result->path = $dest;
        }

        $event = new Event('onWfFileSystemAfterUpload', array(
            'result' => $result,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemAfterUpload', $event);

        $result = $event->getArgument('result');

        // update $object_file
        $object_file->name = Utility::mb_basename($result->path);
        $object_file->filepath = $result->path;

        $event = new AfterSaveEvent('onContentAfterSave', array(
            'context' => 'com_jce.file',
            'item' => $object_file,
            'subject' => $this
        ));

        $dispatcher->dispatch('onContentBeforeSave', $event);

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
        $dispatcher = Factory::getApplication()->getDispatcher();

        $file = rawurldecode($file);

        $path = $this->toAbsolute($file);

        // check path does not fall within a restricted folder
        $this->checkRestrictedDirectory($path);

        $event = new Event('onWfFileSystemBeforeWrite', array(
            'path' => $path,
            'content' => $content,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemBeforeWrite', $event);

        $path = $event->getArgument('path');
        $content = $event->getArgument('content');

        $result = File::write($path, $content);

        $event = new Event('onWfFileSystemAfterWrite', array(
            'path' => $path,
            'result' => $result,
            'subject' => $this
        ));

        $dispatcher->dispatch('onWfFileSystemAfterWrite', $event);

        $result = $event->getArgument('result');

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
