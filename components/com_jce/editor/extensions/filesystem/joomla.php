<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

jimport('joomla.filesystem.folder');
jimport('joomla.filesystem.file');

class WFJoomlaFileSystem extends WFFileSystem
{
    private static $restricted = array(
        'administrator', 'bin', 'cache', 'components', 'cli', 'includes', 'language', 'layouts', 'libraries', 'logs', 'media', 'modules', 'plugins', 'templates', 'tmp', 'xmlrpc',
    );

    private static $allowroot = false;
    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        parent::__construct($config);

        $safe_mode = false;

        // check for safe mode
        if (function_exists('ini_get')) {
            $safe_mode = ini_get('safe_mode');
            // assume safe mode if can't check ini
        } else {
            $safe_mode = true;
        }

        $this->setProperties(array(
            'local' => true,
        ));
    }

    /**
     * Get the base directory.
     *
     * @return string base dir
     */
    public function getBaseDir()
    {
        return WFUtility::makePath(JPATH_SITE, $this->getRootDir());
    }

    /**
     * Get the full base url.
     *
     * @return string base url
     */
    public function getBaseURL()
    {
        return WFUtility::makePath(JURI::root(true), $this->getRootDir());
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
        static $root;

        if (!isset($root)) {
            $root = parent::getRootDir();
            $wf = WFEditorPlugin::getInstance();

            // list of restricted directories
            $restricted = $wf->getParam('filesystem.joomla.restrict_dir', self::$restricted);

            // explode to array
            if (is_string($restricted)) {
                self::$restricted = explode(',', $restricted);
            } else {
                self::$restricted = $restricted;
            }

            // is root allowed?
            self::$allowroot = (bool) $wf->getParam('filesystem.joomla.allow_root', 0);

            // set $root to empty if it is allowed
            if (self::$allowroot) {
                $root = '';
            } else {
                // Revert to default if empty
                if (empty($root)) {
                    $root = 'images';
                }
            }

            if (!empty($root)) {
                // Create the folder
                $full = WFUtility::makePath(JPATH_SITE, $root);

                if (!JFolder::exists($full)) {
                    $this->folderCreate($full);
                }

                // Fallback
                $root = JFolder::exists($full) ? $root : 'images';
            }
        }

        JFactory::getApplication()->triggerEvent('onWfFileSystemGetRootDir', array(&$root));

        return $root;
    }

    public function toAbsolute($path)
    {
        return WFUtility::makePath($this->getBaseDir(), $path);
    }

    public function toRelative($path, $isabsolute = true)
    {
        // path is absolute
        $base = $this->getBaseDir();

        // path is relative to Joomla! root, eg: images/folder
        if ($isabsolute === false) {
            $base = $this->getRootDir();
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
        jimport('joomla.client.helper');
        $FTPOptions = JClientHelper::getCredentials('ftp');

        return $FTPOptions['enabled'] == 1;
    }

    public function getTotalSize($path, $recurse = true)
    {
        jimport('joomla.filesystem.folder');

        $total = 0;

        if (strpos($path, $this->getBaseDir()) === false) {
            $path = $this->toAbsolute($path);
        }

        if (JFolder::exists($path)) {
            $files = JFolder::files($path, '.', $recurse, true, array('.svn', 'CVS', '.DS_Store', '__MACOSX', 'index.html', 'thumbs.db'));

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
        jimport('joomla.filesystem.folder');

        if (strpos($path, $this->getBaseDir()) === false) {
            $path = $this->toAbsolute($path);
        }

        if (JFolder::exists($path)) {
            $files = JFolder::files($path, '.', $recurse, false, array('.svn', 'CVS', '.DS_Store', '__MACOSX', 'index.html', 'thumbs.db'));

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
        jimport('joomla.filesystem.folder');

        if (strpos($path, $this->getBaseDir()) === false) {
            $path = $this->toAbsolute($path);
        }

        if (JFolder::exists($path)) {
            $folders = JFolder::folders($path, '.', false, false, array('.svn', 'CVS', '.DS_Store', '__MACOSX'));

            return count($folders);
        }

        return 0;
    }

    public function getFolders($relative, $filter = '', $sort = '', $limit = 25, $start = 0, $depth = 0)
    {
        $path = $this->toAbsolute($relative);
        $path = WFUtility::fixPath($path);

        if (!JFolder::exists($path)) {
            $relative = '/';
            $path = $this->getBaseDir();
        }

        $list = JFolder::folders($path, $filter, $depth, true);

        $folders = array();

        if (!empty($list)) {
            // Sort alphabetically by default
            natcasesort($list);

            foreach ($list as $item) {
                $item = rawurldecode($item);

                // clean path to remove multiple slashes
                $item = WFUtility::cleanPath($item);

                $name = WFUtility::mb_basename($item);
                $name = WFUtility::convertEncoding($name);

                $break = false;

                if (self::$allowroot) {
                    foreach (self::$restricted as $val) {
                        if ($item === WFUtility::makePath($path, $val)) {
                            $break = true;
                        }
                    }
                }

                if ($break) {
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
        $path = $this->toAbsolute($relative);
        $path = WFUtility::fixPath($path);

        if (!JFolder::exists($path)) {
            $relative = '/';
            $path = $this->getBaseDir();
        }

        // excluded files
        $exclude = array('.svn', 'CVS', '.DS_Store', '__MACOSX', 'index.html');

        $list = JFolder::files($path, $filter, $depth, true, $exclude);

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

                // create relative file
                $id = WFUtility::makePath($relative, $name, '/');

                // check for file validity - prevent display of files with invalid encoding that have been "cleaned"
                if (!is_file(WFUtility::makePath($this->getBaseDir(), $id, '/'))) {
                    continue;
                }

                if ($depth) {
                    $id = $this->toRelative($item);
                    $id = WFUtility::convertEncoding($id);
                    $name = $id;
                }

                // get basename of file name
                $name = WFUtility::mb_basename($name);

                // create url
                $url = WFUtility::makePath($this->getRootDir(), $id, '/');

                // remove leading slash
                $url = ltrim($url, '/');

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

        // get folder list
        $folders = $this->getFolders($relative, '', 0, 0, $sort, 3);

        // filter based on passed in query
        foreach ($folders as $folder) {
            if (preg_match("/$query/u", $folder['id'])) {
                $result['folders'][] = $folder;
            }
        }

        $filter = '';

        // create filter for filetypes
        if (!empty($filestypes)) {
            $filter .= '\.(?i)(' . implode('|', $filetypes) . ')$';
        }

        // get file list
        $files = $this->getFiles($relative, $filter, 0, 0, $sort, 3);

        // filter based on passed in query
        foreach ($files as $files) {
            if (preg_match("/$query/u", $files['id'])) {
                $result['files'][] = $files;
            }
        }

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
            $dir = isset($dir['id']) ? $dir['id'] : '';
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

        // directory path relative to site root
        if (is_dir(WFUtility::makePath(JPATH_SITE, $path))) {
            if (function_exists('mb_substr')) {
                return mb_substr($path, mb_strlen($this->getRootDir()));
            }

            return substr($path, strlen($this->getRootDir()));
        }

        // file url relative to site root
        if (is_file(WFUtility::makePath(JPATH_SITE, $path))) {
            if (function_exists('mb_substr')) {
                return mb_substr(dirname($path), mb_strlen($this->getRootDir()));
            }

            return substr(dirname($path), strlen($this->getRootDir()));
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
            $file = isset($file['id']) ? $file['id'] : '';
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

        if (preg_match('#\.(jpg|jpeg|bmp|gif|tiff|png|svg)#i', $file)) {
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
        if (self::$allowroot) {
            foreach (self::$restricted as $name) {
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

        JFactory::getApplication()->triggerEvent('onWfFileSystemBeforeDelete', array(&$path));

        if (is_file($path)) {
            $result->type = 'files';
            $result->state = JFile::delete($path);
        } elseif (is_dir($path)) {
            $result->type = 'folders';

            if ($this->countFiles($path) > 0 || $this->countFolders($path) > 0) {
                $result->message = JText::sprintf('WF_MANAGER_FOLDER_NOT_EMPTY', WFUtility::mb_basename($path));
            } else {
                $result->state = JFolder::delete($path);
            }
        }

        JFactory::getApplication()->triggerEvent('onWfFileSystemAfterDelete', array($path, $result->state));

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

        JFactory::getApplication()->triggerEvent('onWfFileSystemBeforeRename', array(&$src, &$dest));

        $result = new WFFileSystemResult();

        if (is_file($src)) {
            $ext = WFUtility::getExtension($src);
            $file = $dest . '.' . $ext;
            $path = WFUtility::makePath($dir, $file);

            // check path does not fall within a restricted folder
            $this->checkRestrictedDirectory($path);

            $result->type = 'files';
            $result->state = JFile::move($src, $path);
            $result->path = $path;
            // include original source path
            $result->source = $src;
        } elseif (is_dir($src)) {
            $path = WFUtility::makePath($dir, $dest);

            $result->type = 'folders';
            $result->state = JFolder::move($src, $path);
            $result->path = $path;
            // include original source path
            $result->source = $src;
        }

        JFactory::getApplication()->triggerEvent('onWfFileSystemAfterRename', array(&$result));

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
    public function copy($file, $destination)
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

        JFactory::getApplication()->triggerEvent('onWfFileSystemBeforeCopy', array(&$src, &$dest));

        // src is a file
        if (is_file($src)) {
            $result->type = 'files';
            $result->state = JFile::copy($src, $dest);
            $result->path = $dest;
            // include original source path
            $result->source = $src;
        } elseif (is_dir($src)) {
            // Folders cannot be copied into themselves as this creates an infinite copy / paste loop
            if ($file === $destination) {
                $result->message = JText::_('WF_MANAGER_COPY_INTO_ERROR');
                return $result;
            }

            $result->type = 'folders';
            $result->state = JFolder::copy($src, $dest);
            $result->path = $dest;
            // include original source path
            $result->source = $src;
        }

        JFactory::getApplication()->triggerEvent('onWfFileSystemAfterCopy', array(&$result));

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

        JFactory::getApplication()->triggerEvent('onWfFileSystemBeforeMove', array(&$src, &$dest));

        if ($src != $dest) {
            // src is a file
            if (is_file($src)) {
                $result->type = 'files';
                $result->state = JFile::move($src, $dest);
                $result->path = $dest;
                // include original source path
                $result->source = $src;
            } elseif (is_dir($src)) {
                // Folders cannot be copied into themselves as this creates an infinite copy / paste loop
                if ($file === $destination) {
                    $result->message = JText::_('WF_MANAGER_COPY_INTO_ERROR');
                    return $result;
                }

                $result->type = 'folders';
                $result->state = JFolder::move($src, $dest);
                $result->path = $dest;
                // include original source path
                $result->source = $src;
            }
        }

        JFactory::getApplication()->triggerEvent('onWfFileSystemAfterMove', array(&$result));

        return $result;
    }

    /**
     * New folder base function. A wrapper for the JFolder::create function.
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

        if (@JFolder::create($folder)) {
            $buffer = '<html><body bgcolor="#FFFFFF"></body></html>';
            JFile::write($folder . '/index.html', $buffer);
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

        JFactory::getApplication()->triggerEvent('onWfFileSystemCreateFolder', array($path, $result->state));

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

    public function upload($method, $src, $dir, $name, $chunks = 1, $chunk = 0)
    {
        jimport('joomla.filesystem.file');

        $app = JFactory::getApplication();

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

        // get overwrite state
        $conflict = $this->get('upload_conflict', 'overwrite');
        // get suffix
        $suffix = $this->get('upload_suffix', '_copy');

        if ($conflict == 'unique') {
            // get extension
            $extension = WFUtility::getExtension($name);
            // get name without extension
            $name = WFUtility::stripExtension($name);
            // create tmp copy
            $tmpname = $name;

            $x = 1;

            while (JFile::exists($dest)) {
                if (strpos($suffix, '$') !== false) {
                    $tmpname = $name . str_replace('$', $x, $suffix);
                } else {
                    $tmpname .= $suffix;
                }

                $dest = WFUtility::makePath($path, $tmpname . '.' . $extension);

                ++$x;
            }
        }

        $app->triggerEvent('onWfFileSystemBeforeUpload', array(&$src, &$dest));

        // create object to pass to joomla event
        $object_file = new JObject(array(
            'name' => WFUtility::mb_basename($dest),
            'tmp_name' => $src,
            'filepath' => $dest,
        ));

        // trigger Joomla event before upload
        $app->triggerEvent('onContentBeforeSave', array('com_jce.file', &$object_file, true));

        if (JFile::upload($src, $dest, false, true)) {
            $result->state = true;
            $result->path = $dest;
        }

        $app->triggerEvent('onWfFileSystemAfterUpload', array(&$result));

        // update $object_file
        $object_file->name = WFUtility::mb_basename($result->path);
        $object_file->filepath = $result->path;

        // trigger Joomla event after upload
        $app->triggerEvent('onContentAfterSave', array('com_jce.file', &$object_file, true));

        return $result;
    }

    public function exists($path)
    {
        return $this->is_dir($path) || $this->is_file($path);
    }

    public function read($file)
    {
        $path = $this->toAbsolute(rawurldecode($file));

        return file_get_contents($path);
    }

    public function write($file, $content)
    {
        $path = $this->toAbsolute(rawurldecode($file));

        // check path does not fall within a restricted folder
        $this->checkRestrictedDirectory($path);

        JFactory::getApplication()->triggerEvent('onWfFileSystemBeforeWrite', array(&$path, &$content));

        $result = JFile::write($path, $content);

        JFactory::getApplication()->triggerEvent('onWfFileSystemAfterWrite', array($path, $result));

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
