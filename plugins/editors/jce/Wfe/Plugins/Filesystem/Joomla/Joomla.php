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
     * Directories that are never accessible as a root or browseable path.
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
        'modules',
        'plugins',
        'templates',
        'tmp',
        'xmlrpc',
    );

    public function __construct($config = array(), $container = null)
    {
        parent::__construct($config, $container);

        $this->setProperties(
            array(
                'local' => true,
                'list_limit' => 0, // "all"
            )
        );
    }

    /**
     * Get the base directory.
     * @param string $path The path to get the base directory for
     * @return string The base directory
     */
    public function getBaseDir($path = '')
    {
        return JPATH_SITE;
    }

    /**
     * Get the full base url.
     *
     * @param string $path The path to get the base URL for
     * @return string The full base URL
     */
    public function getBaseURL($path = '')
    {
        return Uri::root(true);
    }

    /**
     * Return the full user directory path. Create if required.
     *
     * @return string Full path to folder
     */
    public function getRootDir()
    {
        return 'images';
    }

    /**
     * Convert a relative path to an absolute path.
     *
     * @param string $path The relative path
     * @return string The absolute path
     */
    public function toAbsolute($path)
    {
        return Utility::makePath($this->getBaseDir(), $path);
    }

    /**
     * Convert an absolute path to a relative path.
     *
     * @param string $path The absolute path
     * @param boolean $isabsolute Whether the path is absolute
     * @return string The relative path
     */
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

    /**
     * Get the total size of a folder.
     *
     * @param string $path The path to the folder
     * @param boolean $recurse Whether to include subfolders
     * @return int The total size in bytes
     */
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
     * @param string $path The path to the folder
     * @param boolean $recurse Whether to include subfolders
     * 
     * @return int The total number of files
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
     * @param string $path The path to the folder
     * @return int The total number of folders
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

    /**
     * Get a list of folders.
     *
     * @param string $relative The relative path
     * @param string $filter The filter for folder names
     * @param string $sort The sort order
     * @param integer $limit The maximum number of folders to return
     * @param integer $start The starting index
     * @param integer $depth The depth of folders to include
     * 
     * @return array The list of folders
     */
    public function getFolders($relative, $filter = '', $sort = '', $limit = 25, $start = 0, $depth = 0)
    {
        $path = $this->toAbsolute($relative);
        $path = Utility::fixPath($path);

        if (!is_dir($path)) {
            $relative = '/';
            $path = $this->getBaseDir();
        }

        $this->checkRestrictedDirectory($path);

        $list = Folder::folders($path, $filter, $depth, true);

        $folders = array();

        if (!empty($list)) {
            // Sort alphabetically by default
            natcasesort($list);

            foreach ($list as $item) {
                $item = rawurldecode($item);

                // clean path to remove multiple slashes
                $item = Utility::cleanPath($item);

                $name = Utility::mb_basename($item);
                $name = Utility::convertEncoding($name);

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

    /**
     * Get a list of files.
     *
     * @param string $relative The relative path
     * @param string $filter The filter for file names
     * @param string $sort The sort order
     * @param integer $limit The maximum number of files to return
     * @param integer $start The starting index
     * @param integer $depth The depth of folders to include
     * 
     * @return array The list of files
     */
    public function getFiles($relative, $filter = '', $sort = '', $limit = 25, $start = 0, $depth = 0)
    {
        $path = $this->toAbsolute($relative);
        $path = Utility::fixPath($path);

        if (!is_dir($path)) {
            $relative = '/';
            $path = $this->getBaseDir();
        }

        $this->checkRestrictedDirectory($path);

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

    /**
     * Search for items.
     *
     * @param string $relative The relative path
     * @param string $query The search query
     * @param array $filetypes The file types to include
     * @param string $sort The sort order
     * @param integer $depth The depth of folders to include
     * 
     * @return array The search results
     */
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
     * @param string $dir Folder relative path
     * 
     * @return array Array of properties
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
     *
     * @param string $path The file path
     * @return string The source directory
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

    /**
     * Check if two values match.
     *
     * @param string $needle
     * @param string $haystack
     * @return boolean
     */
    public function isMatch($needle, $haystack)
    {
        return $needle == $haystack;
    }

    /**
     * Return constituent parts of a file path eg: base directory, file name.
     *
     * @param string $path Relative or absolute path
     * @return array Array of path information
     */
    public function pathinfo($path)
    {
        return pathinfo($path);
    }

    /**
     * Get a files properties.
     * 
     * @param string $file File relative path
     * @param int $count The count of files
     * @return array Array of file properties
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
                    $dimensions = @getimagesize($path);
                    
                    if ($dimensions) {
                        $image['width'] = $dimensions[0];
                        $image['height'] = $dimensions[1];
                    }
                }
            }

            $data['preview'] .= '?' . $date;

            return array_merge_recursive($data, $image);
        }

        return $data;
    }

    /**
     * Check if a directory is restricted.
     *
     * @param string $path The directory path
     * @return void
     * @throws \Exception If access to the directory is restricted
     */
    protected function checkRestrictedDirectory($path)
    {
        // Name-only safety (null/traversal/backslash). The charset whitelist is intentionally
        // NOT applied here: this guards an already-resolved filesystem path for traversal and
        // the restricted-folder boundary, and must not reject legitimate filenames (e.g. with
        // "$", "&", "+") that the listing now permits. See Utility::checkName().
        Utility::checkName($path);

        foreach ($this->restricted as $name) {
            $restricted = rtrim($this->toAbsolute($name), '/') . '/';

            if (strpos(rtrim($path, '/') . '/', $restricted) === 0) {
                throw new \Exception('Access to the target directory is restricted');
            }
        }

        return true;
    }

    /**
     * Delete the relative file(s).
     *
     * @param string $src The relative path to the file name or comma separated list of multiple paths
     *
     * @return FilesystemResult
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
     * @return FilesystemResult
     */
    public function rename($src, $dest)
    {
        $src = $this->toAbsolute(rawurldecode($src));
        $dir = Utility::mb_dirname($src);

        $this->checkRestrictedDirectory($src);

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

            $this->checkRestrictedDirectory($path);

            $result->type = 'files';
            $result->state = File::move($src, $path);
            $result->path = $path;
            // include original source path
            $result->source = $src;
        } elseif (is_dir($src)) {
            $path = Utility::makePath($dir, $dest);

            $this->checkRestrictedDirectory($path);

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
     * @param string $file The relative file or comma separated list of files
     * @param string $destination  The relative path of the destination dir
     * @param string $conflict  The conflict resolution strategy ('replace' or 'copy')
     *
     * @return FilesystemResult
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

        $this->checkRestrictedDirectory($src);
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
     * Move a file.
     *
     * @param string $file The relative file or comma separated list of files
     * @param string $destination  The relative path of the destination dir
     *
     * @return FilesystemResult
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

        $this->checkRestrictedDirectory($src);
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
     * Create a folder.
     *
     * @param string $dir   The base dir
     * @param string $new   The folder to be created
     *
     * @return FilesystemResult
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

    /**
     * Get the dimensions of an image file.
     *
     * @param string $file The relative path to the image file
     * @return array An array containing the width and height of the image
     */
    public function getDimensions($file)
    {
        $path = $this->toAbsolute(rawurldecode($file));

        $this->checkRestrictedDirectory($path);

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

    /**
     * Resolve filename conflict by creating a unique filename if required.
     *
     * @param string $destination The full path of the destination file
     * @param string $name The original name of the file
     * @param boolean $createCopy Whether to create a copy if a conflict exists
     * @return string The resolved filename
     */
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

    /**
     * Upload a file.
     *
     * @param string $method The upload method
     * @param string $src The source file path
     * @param string $dir The destination directory
     * @param string $name The name of the file
     * @return FilesystemResult The result of the upload
     */
    public function upload($method, $src, $dir, $name)
    {
        $app = Factory::getApplication();
        $dispatcher = $app->getDispatcher();

        // full destination directory path
        $path = $this->toAbsolute(rawurldecode($dir));

        // full file path
        $dest = Utility::makePath($path, $name);

        // check destination path does not fall within a restricted folder
        $this->checkRestrictedDirectory($dest);

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
            'subject' => $object_file,
        ));

        $dispatcher->dispatch('onContentBeforeSave', $event);

        $object_file = $event->getItem();

        if (File::upload($src, $dest, false)) {
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
            'subject' => $object_file,
        ));

        $dispatcher->dispatch('onContentAfterSave', $event);

        return $result;
    }

    /**
     * Check if a file or directory exists.
     *
     * @param string $path The path to check
     * @return boolean True if the file or directory exists, false otherwise
     */
    public function exists($path)
    {
        return $this->is_dir($path) || $this->is_file($path);
    }

    /**
     * Read the contents of a file.
     *
     * @param string $file The path to the file
     * @return string The contents of the file
     */
    public function read($file)
    {
        $file = rawurldecode($file);

        $path = $this->toAbsolute($file);

        $this->checkRestrictedDirectory($path);

        return file_get_contents($path);
    }

    /**
     * Write content to a file.
     *
     * @param string $file The path to the file
     * @param string $content The content to write
     * @return boolean True on success, false on failure
     */
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

    /**
     * Check if a path is a file.
     *
     * @param string $path The path to check
     * @return boolean True if the path is a file, false otherwise
     */
    public function is_file($path)
    {
        $path = $this->toAbsolute($path);
        $this->checkRestrictedDirectory($path);
        return is_file($path);
    }

    /**
     * Check if a path is a directory.
     *
     * @param string $path The path to check
     * @return boolean True if the path is a directory, false otherwise
     */
    public function is_dir($path)
    {
        $path = $this->toAbsolute($path);
        $this->checkRestrictedDirectory($path);
        return is_dir($path);
    }
}