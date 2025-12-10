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

use Joomla\CMS\Factory;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Path;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Table\Table;
use Joomla\CMS\User\UserHelper;

class WFFileBrowser extends CMSObject
{
    /* @var array */
    private $_buttons = array();

    /* @var array */
    private $_actions = array();

    /* @var array */
    private $_events = array();

    /* @var array */
    private $_result = array('error' => array(), 'files' => array(), 'folders' => array());

    /* @var array */
    public $dir = array();

    /* @var WFFileSystem */
    public $filesystem = null;

    /* @var string */
    public $filetypes = 'jpg,jpeg,png,gif,webp';

    /* @var array */
    public $upload = array(
        'max_size' => 1024,
        'validate_mimetype' => 1,
        'add_random' => 0,
        'total_files' => 0,
        'total_size' => 0,
        'remove_exif' => 0,
    );

    /* @var int */
    public $folder_tree = 1;

    /* @var string */
    public $list_limit = 'all';

    /* @var array */
    public $features = array(
        'help' => 1,
        'upload' => 1,
        'folder' => array(
            'create' => 1,
            'delete' => 1,
            'rename' => 1,
            'move' => 1,
        ),
        'file' => array(
            'rename' => 1,
            'delete' => 1,
            'move' => 1,
        ),
    );
    /* @var string */
    public $date_format = '%d/%m/%Y, %H:%M';

    /* @var string */
    public $websafe_mode = 'utf-8';

    /* @var int */
    public $websafe_spaces = 0;

    /* @var string */
    public $websafe_textcase = '';

    public function __construct($config = array())
    {
        // set file browser config
        $this->setConfig($config);

        // add actions
        $this->addDefaultActions();
        // add buttons
        $this->addDefaultButtons();

        // Setup XHR callback funtions
        $this->setRequest(array($this, 'getItems'));
        $this->setRequest(array($this, 'getFileDetails'));
        $this->setRequest(array($this, 'getFolderDetails'));
        $this->setRequest(array($this, 'getTree'));
        $this->setRequest(array($this, 'getTreeItem'));

        $this->setRequest(array($this, 'searchItems'));

        $this->setRequest(array($this, 'upload'));
    }

    protected function getProfile()
    {
        return WFApplication::getInstance()->getActiveProfile();
    }

    /**
     * Display the browser.
     */
    public function display()
    {
        $filesystem = $this->getFileSystem();
        $buttons    = $filesystem->get('buttons', []);

        if (!empty($buttons)) {
            foreach ($buttons as $type => $items) {
                foreach ($items as $name => $options) {
                    $this->addButton($type, $name, $options);
                }
            }
        }

        $this->setProperties(array(
            'actions' => $this->getActions(),
            'buttons' => $this->getButtons(),
        ));

        // Get the Document instance
        $document = WFDocument::getInstance();

        $document->addScript(array('filebrowser.min'), 'media');
        $document->addStyleSheet(array('filebrowser.min'), 'media');
    }

    /**
     * Render the browser view.
     */
    public function render()
    {
        $session = Factory::getSession();

        $view = new WFView(array(
            'name' => 'filebrowser',
            'layout' => 'default',
        ));

        // assign session data
        $view->session = $session;

        // assign form action
        $view->action = $this->getFormAction();

        $view->list_limit_options = $this->get('list_limit_options', array());
        $view->list_limit = $this->get('list_limit', 25);

        // return view output
        $view->display();
    }

    /**
     * Set a WFRequest item.
     *
     * @param array $request
     */
    public function setRequest($request)
    {
        $xhr = WFRequest::getInstance();
        $xhr->setRequest($request);
    }

    /**
     * Upload form action url.
     *
     * @return string URL
     *
     * @since    1.5
     */
    protected function getFormAction()
    {
        $wf = WFEditorPlugin::getInstance();

        $context = Factory::getApplication()->input->getInt('context');

        $query = '';

        $args = array(
            'plugin' => $wf->getName(),
            'context' => $context,
        );

        foreach ($args as $k => $v) {
            $query .= '&' . $k . '=' . $v;
        }

        return Uri::base(true) . '/index.php?option=com_jce&task=plugin.rpc' . $query;
    }

    public function getFileSystem()
    {
        return $this->filesystem; // filesystem is now passed in from the "manager" class
    }

    private function getViewable()
    {
        return 'jpeg,jpg,gif,png,webp,apng,svg,avi,wmv,wm,asf,asx,wmx,wvx,mov,qt,mpg,mp3,mp4,m4v,mpeg,ogg,ogv,webm,swf,flv,f4v,xml,dcr,rm,ra,ram,divx,html,htm,txt,rtf,pdf,doc,docx,xls,xlsx,ppt,pptx';
    }

    /**
     * Return a list of allowed file extensions in a specific format.
     *
     * @param string $format The desired format of the output ('map', 'array', 'list', 'json').
     * @param string $list Optional string of file types to use instead of the default.
     * @return mixed Formatted extension list.
     */
    public function getFileTypes($format = 'map', $list = '')
    {
        // If $list is empty, use the default filetypes from the object's property
        if (empty($list)) {
            $list = $this->get('filetypes');
        }

        return WFUtility::formatFileTypesList($format, $list);
    }


    /**
     * Converts the extensions map to a list.
     *
     * @param string $list The extensions map eg: images=jpg,jpeg,gif,png
     *
     * @return string jpg,jpeg,gif,png
     */
    private function listFileTypes($list = '')
    {
        return $this->getFileTypes('list', $list);
    }

    /**
     * Set filetypes and update upload properties
     */
    public function setFileTypes($list = 'jpg,jpeg,png,gif')
    {
        if ($list && $list[0] === '=') {
            $list = substr($list, 1);
        }

        // get existing upload values
        $upload = $this->get('upload', array());

        // set updated filetypes
        $upload['filetypes'] = $list;

        // update filetypes
        $this->setProperties(array(
            'upload' => $upload,
        ));

        $this->set('filetypes', $list);
    }

    /**
     * Returns the result variable.
     *
     * @return var $_result
     */
    public function getResult()
    {
        return $this->_result;
    }

    public function setResult($value, $key = null)
    {
        if ($key) {
            $this->_result[$key][] = $value;
        } else {
            $this->_result = $value;
        }
    }

    public function checkFeature($action, $type = null)
    {
        $features = $this->get('features');

        if ($type) {
            if (isset($features[$type])) {
                $type = $features[$type];

                if (isset($type[$action])) {
                    return (bool) $type[$action];
                }
            }
        } else {
            if (isset($features[$action])) {
                return (bool) $features[$action];
            }
        }

        return false;
    }

    /**
     * Get the source directory of a file path.
     */
    public function getSourceDir($path)
    {
        $path = $this->get('source', $path);

        if (empty($path)) {
            return '';
        }

        // return nothing if absolute $path
        if (preg_match('#^(file|http(s)?):\/\/#', $path)) {
            return '';
        }

        $filesystem = $this->getFileSystem();

        $path = $this->extractPath($path);

        // directory path relative base directory, eg: images/2025
        if ($filesystem->is_dir($path)) {
            return $path;
        }

        // file url relative to site root
        if ($filesystem->is_file($path)) {
            return dirname($path);
        }

        return '';
    }

    /**
     * Determine whether a path is in complex "id:relative" form.
     *
     * A complex path begins with a 32-character hexadecimal MD5 prefix,
     * followed by a colon, and an optional relative path.
     *
     * @param   string  $path  The path string to test.
     *
     * @return  bool  True if the path has a valid MD5 prefix, false otherwise.
     */
    private function isComplexPath($path)
    {
        // Fast fail: no colon at all
        $pos = strpos($path, ':');

        // No colon found, so not a complex path
        if ($pos === false) {
            return false;
        }

        // Ignore protocols like "http://", "ftp://", "file://"
        if (strpos($path, '://') !== false) {
            return false;
        }

        // Candidate prefix before the colon
        $candidate = substr($path, 0, $pos);

        // Must be exactly 32 hex characters (MD5 hex)
        if (strlen($candidate) !== 32 || !ctype_xdigit($candidate)) {
            return false;
        }

        return true;
    }

    /**
     * Split a complex path "id:relative" into prefix and relative components.
     *
     * Returns true if split occurred, false otherwise. When false, $id will be empty
     * and $relative will contain the original $path value.
     *
     * Examples:
     *   abcdef...1234:images/foo.jpg → $id="abcdef...1234", $relative="images/foo.jpg"
     *   abcdef...1234:               → $id="abcdef...1234", $relative=""
     *   images/foo.jpg               → no split (false)
     *
     * @param   string  $path       The full path to parse.
     * @param   string  &$id        Output parameter for the 32-character prefix.
     * @param   string  &$relative  Output parameter for the relative path.
     *
     * @return  bool  True if the path was successfully split, false otherwise.
     */
    private function splitComplexPath($path, &$id, &$relative)
    {
        $id         = '';
        $relative   = $path;

        if (!$this->isComplexPath($path)) {
            // Not a complex path, so return false
            return false;
        }

        $pos = strpos($path, ':');

        // Candidate prefix before the colon
        $candidate = substr($path, 0, $pos);

        $id = strtolower($candidate);
        $relative = substr($path, $pos + 1);

        return true;
    }

    /**
     * Extract the simple relative path from a possibly complex "id:relative" value.
     * Returns the portion after the colon, or the original path if not complex.
     *
     * @param   string  $path  The path value to process.
     *
     * @return  string  The extracted relative path, or the original value.
     */
    private function extractPath($path)
    {
        if ($this->splitComplexPath($path, $id, $relative)) {
            return $relative;
        }

        return $path;
    }

    /**
     * Parse a path value to extract its prefix.
     *
     * Updates the input $path by reference to remove the prefix,
     * leaving only the relative portion (or empty string for root).
     *
     * @param   string  &$path  The path value to modify.
     *
     * @return  string  The extracted prefix, or an empty string if not complex.
     */
    private function parsePath(&$path)
    {
        $id = '';

        if ($this->splitComplexPath($path, $id, $relative)) {
            $path = $relative;
            return $id;
        }

        return '';
    }

    /**
     * Get the prefix from a complex path without modifying it.
     *
     * @param   string  $path  The path value to parse.
     *
     * @return  string  The prefix if complex, or an empty string otherwise.
     */
    private function getPathPrefix($path)
    {
        if ($this->splitComplexPath($path, $id, $relative)) {
            return $id;
        }

        return '';
    }

    /**
     * Resolve a path into its absolute filesystem location.
     *
     * If the path is in "id:relative" form, it resolves the prefix to its
     * corresponding directory store root and appends the relative portion.
     * If the path is simple, it is returned unchanged.
     *
     * Examples:
     *   abcdef...1234:foo/bar → images/foo/bar
     *   abcdef...1234:        → images
     *   foo/bar               → foo/bar (no change)
     *
     * @param   string  $path  The path to resolve.
     *
     * @return  string  The resolved absolute path or the input if simple.
     */
    public function resolvePath($path)
    {
        if (empty($path)) {
            return '';
        }

        // check for complex path
        if ($this->isComplexPath($path) === false) {
            // no prefix so return the path as is
            return $path;
        }

        // get the store array from the complex source path, eg: prefix:path
        $store = $this->getDirectoryStoreFromPath($path);

        if ($store) {
            // extract the path from the complex source path, eg: prefix:path
            $path = $this->extractPath($path);

            // make the source relative to the store path, eg: stories => images/stories
            $path = WFUtility::makePath($store['path'], $path);
        }

        return $path;
    }

    public function getDefaultPath()
    {
        $store = $this->getDirectoryStore();
        $values = reset($store); // get the first element

        return $values['prefix'] . ':';
    }

    private function getDirectoryStore()
    {
        $filesystem = $this->getFileSystem();

        // If Allow Root is enabled, return a single blank/root entry
        if (empty($filesystem->getRootDir())) {
            $hash = md5('__allow_root_access__');

            return array(
                $hash => array(
                    'path'   => '',
                    'label'  => '',
                    'prefix' => $hash,
                )
            );
        }

        $dir = (array) $this->get('dir');

        // Fallback to a single default directory if none set
        if (empty($dir)) {
            $path  = 'images';
            $label = '';

            Factory::getApplication()->triggerEvent('onWfFileSystemGetRootDir', array(&$path, &$label));

            $hash = md5($path);

            return array(
                $hash => array(
                    'path'   => $path,
                    'label'  => '',
                    'prefix' => $hash,
                )
            );
        }

        $newDir = array();

        foreach ($dir as $origKey => $item) {
            $item['path'] = isset($item['path']) ? trim($item['path']) : '';

            if ($item['path'] === '') {
                $item['path'] = 'images';
            }

            $processedPath = $this->processPath($item['path']);
            $label         = (isset($item['label']) && $item['label'] !== '') ? $item['label'] : basename($processedPath);

            // Process both path and label via the event
            Factory::getApplication()->triggerEvent('onWfFileSystemGetRootDir', array(&$processedPath, &$label));

            // Ensure the folder exists (create if missing)
            if ($filesystem->is_dir($processedPath) === false) {
                $name    = WFUtility::mb_basename($processedPath);
                $pathDir = WFUtility::mb_dirname($processedPath);

                if ($filesystem->createFolder($pathDir, $name) === false) {
                    // Skip this entry if it can't be created
                    continue;
                }
            }

            // New associative key from the (possibly changed) path
            $newKey = md5($processedPath);

            // Finalize fields
            $item['path']   = $processedPath;
            $item['label']  = htmlspecialchars((string) $label, ENT_QUOTES, 'UTF-8');
            $item['prefix'] = $newKey;

            // Write into rebuilt array (last one wins on key collision)
            $newDir[$newKey] = $item;
        }

        return $newDir;
    }

    public function getDirectoryStoreFromPath($path, $withKey = false)
    {
        $prefix = $this->parsePath($path); // get the prefix and remove it from the path value

        $store = $this->getDirectoryStore();

        if (empty($prefix)) {
            // no prefix, so return the default store
            foreach ($store as $key => $value) {
                // is this path with the default store?
                if (WFUtility::safe_strpos($path, $value['path']) === 0) {
                    // set the prefix to the store key
                    $prefix = $key;
                    break;
                }
            }
        }

        if (isset($store[$prefix])) {
            if ($withKey) {
                return $store;
            }

            // return the store entry for the prefix
            return $store[$prefix];
        }

        return array();
    }

    private function getPathFromDirectoryStore($path)
    {
        $path = trim($path, '/');

        // find the correct entry in the directory store
        $store = $this->getDirectoryStore();

        if (empty($path)) {
            return array_values($store);
        }

        // get the path prefix
        $prefix = $this->getPathPrefix($path);

        // no prefix?
        if (empty($prefix)) {
            $default = array_shift(array_values($store));
            return $default;
        }

        if (isset($store[$prefix])) {
            return $store[$prefix];
        }

        // no prefix found, return the path
        return $path;
    }

    private function getPathVariables()
    {
        static $variables;

        if (!isset($variables)) {
            $app = Factory::getApplication();
            $user = Factory::getUser();
            $wf = WFApplication::getInstance();
            $profile = $this->getProfile();

            $groups = UserHelper::getUserGroups($user->id);

            // get keys only
            $groups = array_keys($groups);

            // get the first group
            $group_id = array_shift($groups);

            if (is_int($group_id)) {
                // usergroup table
                $group = Table::getInstance('Usergroup');
                $group->load($group_id);
                // usertype
                $usertype = $group->title;
            } else {
                $usertype = $group_id;
            }

            $context = $app->input->getInt('context', null);

            $contextName = '';

            if (is_int($context)) {
                foreach (ComponentHelper::getComponents() as $component) {
                    if ($context == $component->id) {
                        $contextName = $component->option;
                        break;
                    }
                }
            }

            // Replace any path variables
            $path_pattern = array(
                '/\$id/',
                '/\$username/',
                '/\$name/',
                '/\$user(group|type)/',
                '/\$(group|profile)/',
                '/\$context/',
                '/\$hour/',
                '/\$day/',
                '/\$month/',
                '/\$year/',
            );

            $path_replacement = array(
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'usertype' => $usertype,
                'profile' => $profile->name,
                'context' => $contextName,
                'hour' => date('H'),
                'day' => date('d'),
                'month' => date('m'),
                'year' => date('Y')
            );

            // expose variables
            $variables = compact('path_pattern', 'path_replacement');

            Factory::getApplication()->triggerEvent('onWfFileSystemBeforeGetPathVariables', array(&$variables));

            // convert to array values
            $path_replacement = array_values($variables['path_replacement']);
            $path_pattern = array_values($variables['path_pattern']);

            // get websafe options
            $websafe_textcase = $wf->getParam('editor.websafe_textcase', '');
            $websafe_mode = $wf->getParam('editor.websafe_mode', 'utf-8');
            $websafe_allow_spaces = $wf->getParam('editor.websafe_allow_spaces', '_');

            // implode textcase array to create string
            if (is_array($websafe_textcase)) {
                $websafe_textcase = implode(',', $websafe_textcase);
            }

            // expose variables
            $variables = compact('path_pattern', 'path_replacement', 'websafe_textcase', 'websafe_mode', 'websafe_allow_spaces');
        }

        Factory::getApplication()->triggerEvent('onWfFileSystemGetPathVariables', array(&$variables));

        return $variables;
    }

    public function processPath(&$path)
    {
        $path = preg_replace($this->get('path_pattern', array()), $this->get('path_replacement', array()), $path);

        // split into path parts to preserve /
        $parts = explode('/', $path);

        // clean path parts
        $parts = WFUtility::makeSafe($parts, $this->get('websafe_mode', 'utf-8'), $this->get('websafe_allow_spaces', '_'), $this->get('websafe_textcase', ''));

        // join path parts
        $path = implode('/', $parts);

        $path = trim($path, '/');

        return $path;
    }

    public function checkPathAccess($path)
    {
        $path = trim($path, '/');

        $filters = $this->get('filter');

        // no filters set, allow all
        if (empty($filters)) {
            return true;
        }

        $filesystem = $this->getFileSystem();

        $allowFilters = [];
        $denyFilters = [];

        // Categorize filters into allow and deny lists
        foreach ($filters as $filter) {
            // remove leading and trailing slash    
            $filter = trim($filter, '/');

            if (strpos($filter, '+') === 0) {
                $allowFilters[] = substr($filter, 1);
            } else if (strpos($filter, '-') === 0) {
                $filter = ltrim($filter, '-');

                $denyFilters[] = $filter;
            } else {
                $denyFilters[] = $filter;
            }
        }

        $access = true; // Default deny policy

        // explode path to array
        $path_parts = explode('/', $path);

        // Check allow filters
        foreach ($allowFilters as $filter) {
            $access = false;

            // process path for variables, text case etc.
            $this->processPath($filter);

            // explode to array
            $filter_parts = explode('/', $filter);

            // filter match
            if (false === empty(array_intersect_assoc($filter_parts, $path_parts))) {
                $access = true;
                break;
            }
        }

        if ($access === false) {
            return false;
        }

        // path is empty so no deny filters applied
        if (empty($path)) {
            return true;
        }

        // Check deny filters
        foreach ($denyFilters as $filter) {
            if (strpos($filter, '*') === 0) {
                $filter = substr($filter, 1);

                // process path for variables, text case etc.
                $this->processPath($filter);

                // explode to array
                $filterParts = explode('/', $filter);

                // filter match
                if (false === empty(array_intersect($filter_parts, $path_parts))) {
                    $access = false;
                    break;
                }
            } else {
                // process path for variables, text case etc.
                $this->processPath($filter);

                if ($path === $filter) {
                    $access = false;
                    break;
                }
            }
        }

        return $access;
    }

    public function getBaseDir()
    {
        $filesystem = $this->getFileSystem();

        return $filesystem->getBaseDir();
    }

    /**
     * Get the list of files in a given folder.
     *
     * @param string $relative The relative path of the folder
     * @param string $filter   A regex filter option
     *
     * @return array list array
     */
    private function getFiles($relative, $filter = '.', $sort = '', $limit = 0, $start = 0)
    {
        $filesystem = $this->getFileSystem();
        $list = $filesystem->getFiles($relative, $filter, $sort, $limit, $start);

        $list = array_filter($list, function ($item) {
            // must have an id set
            if (empty($item['id'])) {
                return true;
            }

            $path = dirname($item['id']);

            return $this->checkPathAccess($path);
        });

        return $list;
    }

    /**
     * Get the list of folder in a given folder.
     *
     * @param string $relative The relative path of the folder
     *
     * @return array list array
     */
    private function getFolders($relative, $filter = '', $sort = '', $limit = 0, $start = 0)
    {
        $filesystem = $this->getFileSystem();
        $list = $filesystem->getFolders($relative, $filter, $sort, $limit, $start);

        $list = array_filter($list, function ($item) {
            if (empty($item['id'])) {
                return true;
            }

            return $this->checkPathAccess($item['id']);
        });

        return $list;
    }

    private static function sanitizeSearchTerm($term)
    {
        try {
            $query = preg_replace('#[^a-zA-Z0-9_\.\-\:~\pL\pM\pN\s\* ]#u', '', $term);
        } catch (\Exception $e) {
            $query = preg_replace('#[^a-zA-Z0-9_\.\-\:~\s\* ]#', '', $term);
        }

        if (is_null($query) || $query === false) {
            $query = preg_replace('#[^a-zA-Z0-9_\.\-\:~\s\* ]#', '', $term);
        }

        $query = trim($query);

        // quote first
        $query = preg_quote($query, '/');

        // then restore wildcards (escaped \* becomes real regex .*)
        $query = str_replace('\*', '.*', $query);

        return $query;
    }

    public function searchItems($path, $limit = 25, $start = 0, $query = '', $sort = '')
    {
        $result = array(
            'folders' => array(),
            'files' => array(),
            'total' => array(
                'folders' => 0,
                'files' => 0,
            ),
            'path' => '',
            'search' => true
        );

        // no query value? bail...
        if ($query == '') {
            return $result;
        }

        $filesystem = $this->getFileSystem();

        if (method_exists($filesystem, 'searchItems') === false) {
            return $this->getItems($path, $limit, $start, $query, $sort);
        }

        // define and configure seach parameters
        $filetypes = (array) $this->getFileTypes('array');

        // Split query by "OR" or "|" operators
        $terms = array_map('trim', preg_split('/\s*(?:\bOR\b|\|)\s*/i', $query, -1, PREG_SPLIT_NO_EMPTY));

        $extensions = [];
        $keywords = [];

        foreach ($terms as $term) {
            if (
                strpos($term, '.') === 0 ||                            // ".jpg"
                (strpos($term, '*.') === 0 && strlen($term) > 2)       // "*.jpg"
            ) {
                // It's an extension
                $extensions[] = WFUtility::makeSafe($term);
            } elseif ($term !== '') {
                // It's a keyword, clean and convert wildcards
                foreach (preg_split('/\s+/', $term, -1, PREG_SPLIT_NO_EMPTY) as $subterm) {
                    $keywords[] = self::sanitizeSearchTerm($subterm);
                }
            }
        }

        // Filter filetypes
        if (!empty($extensions)) {
            $filetypes = array_filter($filetypes, function ($value) use ($extensions) {
                return in_array($value, $extensions, true);
            });
        }

        // Build keyword regex (match any of the keywords, case-insensitive)
        $filter = '';

        if (!empty($keywords)) {
            $filter = '^(?i).*(' . implode('|', $keywords) . ').*';
        }

        // query filter
        /*$keyword = '^(?i).*' . $keyword . '.*';

        if ($query[0] === '.') {
            // clean query removing leading .
            $extension = WFUtility::makeSafe($query);

            $filetypes = array_filter($filetypes, function ($value) use ($extension) {
                return $value === $extension;
            });

            $filter = '';
        }*/

        // get search depth
        $depth = $this->get('search_depth', 3);

        // trim the passed in path if any
        $path = trim($path, '/');

        // no path value or root folder so get the default directories
        if (empty($path)) {
            $store = $this->getDirectoryStore();

            if (!empty($store)) {
                // case to array values as we don't need the keys
                $storeArray = array_values($store);
            }
        } else {
            // get the store array from the complex source path, eg: prefix:path
            $store = $this->getPathFromDirectoryStore($path);

            // extract the path from the complex source path, eg: prefix:path
            $path = $this->extractPath($path);

            $storeArray = array($store);
        }

        // search each store item
        foreach ($storeArray as $storeItem) {
            // define the prefix from the store array
            $prefix = $storeItem['prefix'];

            // make the source relative to the store path, eg: stories => images/stories
            $source = WFUtility::makePath($storeItem['path'], $path);

            // trim leading and trailing slash
            $source = trim($source, '/');

            $list = $filesystem->searchItems($source, $filter, $filetypes, $sort, $depth);

            $items = array_merge($list['folders'], $list['files']);

            // get properties for found items by type
            foreach ($items as $item) {
                $type = $item['type'];

                // remove the $store['path'] value from the beginning of the id, must be multibyte safe
                if (WFUtility::safe_strpos($item['id'], $storeItem['path']) === 0) {
                    $item['id'] = WFUtility::safe_substr($item['id'], WFUtility::safe_strlen($storeItem['path']));

                    // trim leading and trailing slash
                    $item['id'] = trim($item['id'], '/');
                }

                if ($type === 'files') {
                    $item['classes'] = '';

                    $item['path'] = WFUtility::makePath($storeItem['path'], $item['id']);

                    if (empty($item['properties'])) {
                        $item['properties'] = $filesystem->getFileDetails($item);
                    }
                }

                if ($type === 'folders') {
                    $item['path'] = WFUtility::makePath($storeItem['path'], $item['id']);

                    if (empty($item['properties'])) {
                        $item['properties'] = $filesystem->getFolderDetails($item);
                    }
                }

                $item['id'] = $prefix . ':' . $item['id'];

                $item['name'] = WFUtility::mb_basename($item['name']);
                $item['name'] = htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8');

                $result[$type][] = $item;
            }
        }

        // walk through the folders and files, reducing the result by the limit value if > 0
        if ($limit > 0) {
            $result['folders']  = array_slice($result['folders'], $start, $limit);
            $result['files']    = array_slice($result['files'], $start, $limit);
        }

        $result['total']['folder'] = count($result['folders']);
        $result['total']['files'] = count($result['files']);

        // Fire Event passing result as reference
        $this->fireEvent('onSearchItems', array(&$result));

        return $result;
    }

    public function getRootDir($source)
    {
        return $source;
    }

    /**
     * Get file and folder lists.
     *
     * @return array Array of file and folder list objects
     *
     * @param string $source   Relative or absolute path based either on source url or current directory
     * @param int    $limit    List limit
     * @param int    $start    list start point
     */
    public function getItems($source, $limit = 25, $start = 0, $filter = '', $sort = '')
    {
        $filesystem = $this->getFileSystem();

        $files = array();
        $folders = array();

        clearstatcache();

        // decode path
        $source = rawurldecode($source);

        // check if source is a valid path
        WFUtility::checkPath($source);

        // trim source to path variable
        $path = trim($source, '/');

        // if a value is set process as possible return file, ie: check for prefix
        if ($path) {
            $prefix = $this->getPathPrefix($path);

            // may be a passed in value, eg: images/stories/fruit.jpg
            if (!$prefix) {
                // get source dir from path eg: images/stories/fruit.jpg = images/stories
                $path = $this->getSourceDir($path);
            }
        }

        // get the store array from the complex path path, eg: prefix:path
        $store = $this->getDirectoryStoreFromPath($path);

        // no path so get the default directories
        if (empty($path) || empty($store)) {
            $store = $this->getDirectoryStore();

            if (!empty($store)) {
                $storeArray = array_values($store);

                // defined list of directories
                if (count($storeArray) > 1) {
                    $folders = [];

                    foreach ($storeArray as $items) {
                        $folders[] = array(
                            'id'            => $items['prefix'] . ':',
                            'name'          => $items['label'],
                            'type'          => 'folders',
                            'properties'    => array(),
                        );
                    }

                    // return an array of root folder items
                    return array(
                        'folders' => $folders,
                        'files' => array(),
                        'total' => array(
                            'folders' => count($folders),
                            'files' => 0,
                        ),
                    );
                }

                // no defined directories, so use the first one for backward compatibility
                $store = $storeArray[0];
            }
        } else {
            // get the store array from the complex path path, eg: prefix:path
            if (!$prefix) {
                // make relative to the store path, eg: images/stories => stories
                if (WFUtility::safe_strpos($path, $store['path']) === 0) {
                    $path = WFUtility::safe_substr($path, WFUtility::safe_strlen($store['path']));
                    // trim
                    $path = trim($path, '/');
                }
            } else {
                // extract the path from the complex source path, eg: prefix:path
                $path = $this->extractPath($path);
            }
        }

        // define the prefix from the store array
        $prefix = $store['prefix'];

        // make the source relative to the store path, eg: stories => images/stories
        $fullpath = WFUtility::makePath($store['path'], $path);

        // revert to store path if the path is not a directory
        if (!$filesystem->is_dir($fullpath)) {
            $fullpath = $store['path'];
            $path = ''; // reset path to empty
        }

        // trim leading and trailing slash
        $fullpath = trim($fullpath, '/');

        $filetypes = (array) $this->getFileTypes('array');

        $name = '';

        if ($filter) {
            if ($filter[0] == '.') {
                $ext = WFUtility::makeSafe($filter);

                for ($i = 0; $i < count($filetypes); ++$i) {
                    if (preg_match('#^' . $ext . '#', $filetypes[$i]) === false) {
                        unset($filetypes[$i]);
                    }
                }
            } else {
                $name = '^(?i).*' . WFUtility::makeSafe($filter) . '.*';
            }
        }

        // get file list by filter
        $files = $this->getFiles($fullpath, $name . '\.(?i)(' . implode('|', $filetypes) . ')$', $sort, $limit, $start);

        if (empty($filter) || $filter[0] != '.') {
            // get folder list
            $folders = $this->getFolders($fullpath, '^(?i).*' . WFUtility::makeSafe($filter) . '.*', $sort, $limit, $start);
        }

        $folderArray = array();
        $fileArray = array();

        $items = array_merge($folders, $files);

        if (count($items)) {
            if (intval($limit) > 0) {
                $items = array_slice($items, $start, $limit);
            }

            foreach ($items as $item) {
                $item['classes'] = '';

                // remove the $store['path'] value from the beginning of the id, must be multibyte safe
                if (WFUtility::safe_strpos($item['id'], $store['path']) === 0) {
                    $item['id'] = WFUtility::safe_substr($item['id'], WFUtility::safe_strlen($store['path']));
                }

                // trim $id removing leading and trailing slashes
                $item['id'] = trim($item['id'], '/');
                // encode id for html
                $item['id'] = htmlspecialchars($item['id'], ENT_QUOTES, 'UTF-8');

                // ensure name is relative
                $item['name'] = WFUtility::mb_basename($item['name']);

                // encode name for html
                $item['name'] = htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8');

                // create path
                $item['path'] = WFUtility::makePath($store['path'], $item['id']);

                // add the path prefix to the id
                $item['id'] = $prefix . ':' . $item['id'];

                if ($item['type'] == 'folders') {
                    if (empty($item['properties'])) {
                        $item['properties'] = $filesystem->getFolderDetails($item);
                    }

                    $folderArray[] = $item;
                } else {
                    // check for selected item
                    $item['selected'] = $filesystem->isMatch($item['url'], $source);

                    if (empty($item['properties'])) {
                        $item['properties'] = $filesystem->getFileDetails($item);
                    }

                    $fileArray[] = $item;
                }
            }
        }

        $result = array(
            'folders' => $folderArray,
            'files' => $fileArray,
            'total' => array(
                'folders' => count($folders),
                'files' => count($files),
            ),
            'path' => $prefix . ':' . $path,
        );

        // Fire Event passing result as reference
        $this->fireEvent('onGetItems', array(&$result));

        return $result;
    }

    /**
     * Get a tree node.
     *
     * @param string $dir The relative path of the folder to search
     *
     * @return Tree node array
     */
    public function getTreeItem($path = "")
    {
        $path = rawurldecode($path);

        WFUtility::checkPath($path);

        $path = trim($path, '/');

        $folders = array();

        if (empty($path)) {
            $store = $this->getDirectoryStore();
            $storeArray = array_values($store);

            if (count($storeArray) > 1) {
                foreach ($storeArray as $item) {
                    $folders[] = array(
                        'id'    => $item['prefix'] . ':',
                        'name'  => $item['label'],
                        'path'  => $item['path'],
                        'class' => 'folder'
                    );
                }
            } else {
                $store = $storeArray[0];
                $folders = $this->getFolders($store['path']);

                array_walk($folders, function (&$item) use ($store) {
                    $path = $item['id'];

                    // remove the $store['path'] value from the beginning of the id, must be multibyte safe
                    if (WFUtility::safe_strpos($item['id'], $store['path']) === 0) {
                        $item['id'] = WFUtility::safe_substr($item['id'], WFUtility::safe_strlen($store['path']));
                    }

                    $item['id'] = trim($item['id'], '/');
                    $path = trim($path, '/');

                    $item['id']     = $store['prefix'] . ':' . $item['id'];
                    $item['path']   = $path;
                    $item['class']  = 'folder';
                });
            }
        } else {
            // get the store array from the complex source path, eg: prefix:path
            $store = $this->getDirectoryStoreFromPath($path);

            // extract the path from the complex source path, eg: prefix:path
            $path = $this->extractPath($path);

            // make the source relative to the store path, eg: stories => images/stories
            $path = WFUtility::makePath($store['path'], $path);

            // get source dir from path eg: images/stories/fruit.jpg = images/stories
            $source = $this->getSourceDir($path);

            // get folder list
            $folders = $this->getFolders($source);

            array_walk($folders, function (&$item) use ($store, $path) {
                // remove the $store['path'] value from the beginning of the id, must be multibyte safe
                if (WFUtility::safe_strpos($item['id'], $store['path']) === 0) {
                    $item['id'] = WFUtility::safe_substr($item['id'], WFUtility::safe_strlen($store['path']));
                }

                $item['id'] = trim($item['id'], '/');

                $item['id']     = $store['prefix'] . ':' . $item['id'];
                $item['path']   = WFUtility::makePath($path, $item['name']);
                $item['class']  = 'folder';
            });
        }

        $result = array(
            'folders' => $folders,
        );

        return $result;
    }

    /**
     * Build a tree list.
     *
     * @param string $dir The relative path of the folder to search
     *
     * @return Tree html string
     */
    public function getTree($path = '')
    {
        // decode path
        $path = rawurldecode($path);

        WFUtility::checkPath($path);

        $result = $this->getTreeItems($path);

        return $result;
    }

    /**
     * Get Tree list items as html list.
     *
     * @return Tree list html string
     *
     * @param string $path            Current directory
     * @param bool   $root[optional] Is root directory
     * @param bool   $init[optional] Is tree initialisation
     */
    public function getTreeItems($path, $root = true, $init = true)
    {
        $result = '';

        static $treedir = null;

        $folders = [];

        if ($init) {
            $treedir = $path;

            if ($root) {
                $result .= '
                <ul>
                    <li data-id="/" class="uk-tree-open uk-tree-root uk-padding-remove">
                        <div class="uk-tree-row">
                            <a href="#">
                                <span class="uk-tree-icon" role="presentation">
                                    <i class="uk-icon uk-icon-home"></i>
                                </span>
                                <span class="uk-tree-text">' . Text::_('WF_LABEL_HOME', 'Home') . '</span>
                            </a>
                        </div>
                ';
            }

            $items = $this->getTreeItem();
            $folders = $items['folders'];
        } else {
            $items = $this->getTreeItem($path);
            $folders = $items['folders'];
        }

        if (count($folders)) {
            $result .= '<ul class="uk-tree-node">';

            $open = false;

            foreach ($folders as $folder) {
                $id = trim($folder['id'], '/');

                if ($treedir) {
                    // resolve $treedir
                    $resolved = $this->resolvePath($treedir);

                    // check if the folder is open, ie: the path matches the current directory
                    $open = (bool) preg_match('#' . preg_quote($folder['path']) . '\b#', $resolved);
                }

                $result .= '
                <li data-id="' . htmlspecialchars($id, ENT_QUOTES, 'UTF-8') . '" class="' . ($open ? 'uk-tree-open' : '') . '">
                    <div class="uk-tree-row">
                        <a href="#">
                            <span class="uk-tree-icon" role="presentation"></span>
                            <span class="uk-tree-text uk-text-truncate" title="' . $folder['name'] . '">' . $folder['name'] . '</span>
                        </a>
                    </div>';

                if ($open) {
                    $result .= $this->getTreeItems($id, false, false);
                }

                $result .= '</li>';
            }

            $result .= '</ul>';
        }

        if ($init && $root) {
            $result .= '</li></ul>';
        }

        $init = false;

        return $result;
    }

    /**
     * Get a folders properties.
     *
     * @return array Array of properties
     *
     * @param string $dir Folder relative path
     */
    public function getFolderDetails($dir)
    {
        WFUtility::checkPath($dir);

        $filesystem = $this->getFileSystem();

        // get array with folder date and content count eg: array('date'=>'00-00-000', 'folders'=>1, 'files'=>2);
        return $filesystem->getFolderDetails($dir);
    }

    /**
     * Get a files properties.
     *
     * @return array Array of properties
     *
     * @param string $file File relative path
     */
    public function getFileDetails($file)
    {
        WFUtility::checkPath($file);

        $filesystem = $this->getFileSystem();

        // get array with folder date and content count eg: array('date'=>'00-00-000', 'folders'=>1, 'files'=>2);
        return $filesystem->getFileDetails($file);
    }

    /**
     * Create default actions based on access.
     */
    private function addDefaultActions()
    {
        if ($this->checkFeature('help')) {
            $this->addAction('help', array('title' => Text::_('WF_BUTTON_HELP')));
        }

        if ($this->checkFeature('upload')) {
            $this->addAction('upload');
            $this->setRequest(array($this, 'upload'));
        }

        if ($this->checkFeature('create', 'folder')) {
            $this->addAction('folder_new');
            $this->setRequest(array($this, 'folderNew'));
        }
    }

    /**
     * Add an action to the list.
     *
     * @param string $name    Action name
     * @param array  $options Array of options
     */
    public function addAction($name, $options = array())
    {
        if (!is_array($options)) {
            list($name, $options['icon'], $options['action'], $options['title']) = func_get_args();
        }

        $options = array_merge(array('name' => $name), $options);

        // set some defaults
        if (!array_key_exists('icon', $options)) {
            $options['icon'] = '';
        }

        if (!array_key_exists('action', $options)) {
            $options['action'] = '';
        }

        if (!array_key_exists('title', $options)) {
            $options['title'] = Text::_('WF_BUTTON_' . strtoupper($name));
        }

        $this->_actions[$name] = $options;
    }

    /**
     * Get all actions.
     *
     * @return object
     */
    private function getActions()
    {
        return array_reverse($this->_actions);
    }

    /**
     * Remove an action from the list by name.
     *
     * @param string $name Action name to remove
     */
    public function removeAction($name)
    {
        if (isset($this->_actions[$name])) {
            unset($this->_actions[$name]);
        }
    }

    /**
     * Create all standard buttons based on access.
     */
    private function addDefaultButtons()
    {
        if ($this->checkFeature('delete', 'folder')) {
            $this->addButton('folder', 'delete', array('multiple' => true));

            $this->setRequest(array($this, 'deleteItem'));
        }
        if ($this->checkFeature('rename', 'folder')) {
            $this->addButton('folder', 'rename');

            $this->setRequest(array($this, 'renameItem'));
        }
        if ($this->checkFeature('move', 'folder')) {
            $this->addButton('folder', 'copy', array('multiple' => true));
            $this->addButton('folder', 'cut', array('multiple' => true));

            $this->addButton('folder', 'paste', array('multiple' => true, 'trigger' => true));

            $this->setRequest(array($this, 'copyItem'));
            $this->setRequest(array($this, 'moveItem'));
        }
        if ($this->checkFeature('rename', 'file')) {
            $this->addButton('file', 'rename');

            $this->setRequest(array($this, 'renameItem'));
        }
        if ($this->checkFeature('delete', 'file')) {
            $this->addButton('file', 'delete', array('multiple' => true));

            $this->setRequest(array($this, 'deleteItem'));
        }
        if ($this->checkFeature('move', 'file')) {
            $this->addButton('file', 'copy', array('multiple' => true));
            $this->addButton('file', 'cut', array('multiple' => true));

            $this->addButton('file', 'paste', array('multiple' => true, 'trigger' => true));

            $this->setRequest(array($this, 'copyItem'));
            $this->setRequest(array($this, 'moveItem'));
        }
        $this->addButton('file', 'view', array('restrict' => $this->getViewable()));
    }

    /**
     * Add a button.
     *
     * @param string $type[optional]     Button type (file or folder)
     * @param string $name               Button name
     * @param string $icon[optional]     Button icon
     * @param string $action[optional]   Button action / function
     * @param string $title              Button title
     * @param bool   $multiple[optional] Supports multiple file selection
     * @param bool   $trigger[optional]
     */
    public function addButton($type, $name, $options = array())
    {
        $options = array_merge(array('name' => $name), $options);

        // set some defaults
        if (!array_key_exists('icon', $options)) {
            $options['icon'] = '';
        }

        if (!array_key_exists('action', $options)) {
            $options['action'] = '';
        }

        if (!array_key_exists('title', $options)) {
            $options['title'] = Text::_('WF_BUTTON_' . strtoupper($name));
        }

        if (!array_key_exists('multiple', $options)) {
            $options['multiple'] = false;
        }

        if (!array_key_exists('trigger', $options)) {
            $options['trigger'] = false;
        }

        if (!array_key_exists('restrict', $options)) {
            $options['restrict'] = '';
        }

        $this->_buttons[$type][$name] = $options;
    }

    /**
     * Return an object list of all buttons.
     *
     * @return object
     */
    private function getButtons()
    {
        return $this->_buttons;
    }

    /**
     * Remove a button.
     *
     * @param string $type Button type
     * @param string $name Button name
     */
    public function removeButton($type, $name)
    {
        if (array_key_exists($name, $this->_buttons[$type])) {
            unset($this->_buttons[$type][$name]);
        }
    }

    /**
     * Change a buttons properties.
     *
     * @param string $type Button type
     * @param string $name Button name
     * @param string $keys Button keys
     */
    public function changeButton($type, $name, $keys)
    {
        foreach ($keys as $key => $value) {
            if (isset($this->_buttons[$type][$name][$key])) {
                $this->_buttons[$type][$name][$key] = $value;
            }
        }
    }

    /**
     * Add an event.
     *
     * @param string $name     Event name
     * @param string $function Event function name
     */
    public function addEvent($name, $function)
    {
        $this->_events[$name] = $function;
    }

    /**
     * Execute an event.
     *
     * @return array result
     *
     * @param object $name           Event name
     * @param array  $args[optional] Optional arguments
     */
    protected function fireEvent($name, $args = null)
    {
        if (array_key_exists($name, $this->_events)) {
            $event = $this->_events[$name];

            if (is_array($event)) {
                return call_user_func_array($event, $args);
            } else {
                return call_user_func($event, $args);
            }
        }

        return array();
    }

    private function validateUploadedFile($file)
    {
        // check the POST data array
        if (empty($file) || empty($file['tmp_name'])) {
            throw new InvalidArgumentException('Upload Failed: No data');
        }

        // check for tmp_name and is valid uploaded file
        if (!is_uploaded_file($file['tmp_name'])) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException('Upload Failed: Not an uploaded file');
        }

        $upload = $this->get('upload');

        // check file for various issues
        if (WFUtility::isSafeFile($file) !== true) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException('Upload Failed: Invalid file');
        }

        // get extension
        $ext = WFUtility::getExtension($file['name'], true);

        // check extension is allowed
        $allowed = (array) $this->getFileTypes('array');

        if (is_array($allowed) && !empty($allowed) && in_array($ext, $allowed) === false) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException(Text::_('WF_MANAGER_UPLOAD_INVALID_EXT_ERROR'));
        }

        $size = round(filesize($file['tmp_name']) / 1024);

        if (empty($upload['max_size'])) {
            $upload['max_size'] = 1024;
        }

        // validate size
        if ($size > (int) $upload['max_size']) {
            @unlink($file['tmp_name']);

            throw new InvalidArgumentException(Text::sprintf('WF_MANAGER_UPLOAD_SIZE_ERROR', $file['name'], $size, $upload['max_size']));
        }

        // validate mimetype
        if ($upload['validate_mimetype']) {
            if (WFMimeType::check($file['name'], $file['tmp_name']) === false) {
                @unlink($file['tmp_name']);
                throw new InvalidArgumentException(Text::_('WF_MANAGER_UPLOAD_MIME_ERROR'));
            }
        }

        return true;
    }

    /**
     * Upload a file.
     *
     * @return array $error on failure or uploaded file name on success
     */
    public function upload()
    {
        // Check for request forgeries
        Session::checkToken('request') or jexit(Text::_('JINVALID_TOKEN'));

        // check for feature access
        if (!$this->checkFeature('upload')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
        }

        $app = Factory::getApplication();

        $filesystem = $this->getFileSystem();

        // create a filesystem result object
        $result = new WFFileSystemResult();

        // get uploaded file
        $file = $app->input->files->get('file', array(), 'raw');

        // validate file
        $this->validateUploadedFile($file);

        // get file name
        $name = (string) $app->input->get('name', $file['name'], 'STRING');

        // decode
        $name = rawurldecode($name);

        // check name
        if (WFUtility::validateFileName($name) === false) {
            throw new InvalidArgumentException('Upload Failed: The file name is invalid.');
        }

        // check file name
        WFUtility::checkPath($name);

        // get extension from file name
        $ext = WFUtility::getExtension($file['name']);

        // trim extension
        $ext = trim($ext);

        // make extension websafe
        $ext = WFUtility::makeSafe($ext, $this->get('websafe_mode', 'utf-8'), $this->get('websafe_spaces'), $this->get('websafe_textcase'));

        // check extension exists
        if (empty($ext) || $ext === $file['name']) {
            throw new InvalidArgumentException('Upload Failed: The file name does not contain a valid extension.');
        }

        // strip extension
        $name = WFUtility::stripExtension($name);

        // make file name 'web safe'
        $name = WFUtility::makeSafe($name, $this->get('websafe_mode', 'utf-8'), $this->get('websafe_spaces'), $this->get('websafe_textcase'));

        // check name
        if (WFUtility::validateFileName($name) === false) {
            throw new InvalidArgumentException('Upload Failed: The file name is invalid.');
        }

        // target directory
        $dir = (string) $app->input->get('upload-dir', '', 'STRING');

        // decode and cast as string
        $dir = rawurldecode($dir);

        // get upload settings from the config
        $upload = $this->get('upload');

        // add random string
        if ($upload['add_random']) {
            $name = $name . '_' . substr(md5(uniqid(rand(), 1)), 0, 5);
        }

        // rebuild file name - name + extension
        $name = $name . '.' . $ext;

        // pass to onBeforeUpload
        $this->fireEvent('onBeforeUpload', array(&$file, &$dir, &$name));

        // check destination path
        WFUtility::checkPath($dir);

        // if directory is empty, use the default complex path
        if (empty($dir)) {
            $dir = $this->getDefaultPath();
        }

        // extract the path from the complex path, remove prefix
        $dir = $this->resolvePath($dir);

        // an upload cannot be made into the primary directory tree
        if (empty($dir)) {
            throw new InvalidArgumentException('Upload Failed: Invalid target directory');
        }

        // check path exists
        if (!$filesystem->is_dir($dir)) {
            throw new InvalidArgumentException('Upload Failed: The target directory does not exist');
        }

        // check access
        if (!$this->checkPathAccess($dir)) {
            throw new InvalidArgumentException('Upload Failed: Access to the target directory is restricted');
        }

        // Check file number limits
        if (!empty($upload['total_files'])) {
            if ($filesystem->countFiles($dir, true) > $upload['total_files']) {
                throw new InvalidArgumentException(Text::_('WF_MANAGER_FILE_LIMIT_ERROR'));
            }
        }

        // Check total file size limit
        if (!empty($upload['total_size'])) {
            $size = $filesystem->getTotalSize($dir);

            if (($size / 1024 / 1024) > $upload['total_size']) {
                throw new InvalidArgumentException(Text::_('WF_MANAGER_FILE_SIZE_LIMIT_ERROR'));
            }
        }

        $contentType = $_SERVER['CONTENT_TYPE'];

        // Only multipart uploading is supported for now
        if ($contentType && strpos($contentType, 'multipart') !== false) {
            // upload file with filesystem
            $result = $filesystem->upload('multipart', trim($file['tmp_name']), $dir, $name);

            if (!$result->state) {
                if (empty($result->message)) {
                    $result->message = Text::_('WF_MANAGER_UPLOAD_ERROR');
                }

                $result->code = 103;
            }

            @unlink($file['tmp_name']);
        } else {
            $result->state = false;
            $result->code = 103;
            $result->message = Text::_('WF_MANAGER_UPLOAD_ERROR');
        }

        // upload finished
        if ($result instanceof WFFileSystemResult) {
            if ($result->state === true) {
                $name = WFUtility::mb_basename($result->path);

                if (empty($result->url)) {
                    /*$relative = WFUtility::makePath($dir, $name);
                    $result->url = WFUtility::makePath($filesystem->getBaseURL(), $relative);*/

                    $result->url = WFUtility::makePath($dir, $name);
                }

                // trim slashes
                $result->url = trim($result->url, '/');

                // run events
                $data = $this->fireEvent('onUpload', array($result->path, $result->url));

                $data['name'] = $name;

                $this->setResult($data, 'files');
            } else {
                $this->setResult($result->message, 'error');
            }
        }

        return $this->getResult();
    }

    /**
     * Delete the relative file(s).
     *
     * @param $files the relative path to the file name or comma seperated list of multiple paths
     *
     * @return string $error on failure
     */
    public function deleteItem($items)
    {
        // check for feature access
        if (!$this->checkFeature('delete', 'folder') && !$this->checkFeature('delete', 'file')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
        }

        $filesystem = $this->getFileSystem();
        $items = explode(',', rawurldecode((string) $items));

        foreach ($items as $item) {
            // decode and cast as string
            $item = (string) rawurldecode($item);

            // check path
            WFUtility::checkPath($item);

            $item = $this->resolvePath($item);

            if ($filesystem->is_file($item)) {
                if ($this->checkFeature('delete', 'file') === false) {
                    throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
                }

                $path = $item;
            } elseif ($filesystem->is_dir($item)) {
                if ($this->checkFeature('delete', 'folder') === false) {
                    throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
                }

                $path = dirname($item);
            }

            // check access
            if (!$this->checkPathAccess($path)) {
                throw new InvalidArgumentException('Delete Failed: Access to the target directory is restricted');
            }

            $result = $filesystem->delete($item);

            if ($result instanceof WFFileSystemResult) {
                if (!$result->state) {
                    if ($result->message) {
                        $this->setResult($result->message, 'error');
                    } else {
                        $this->setResult(Text::sprintf('WF_MANAGER_DELETE_' . strtoupper($result->type) . '_ERROR', WFUtility::mb_basename($item)), 'error');
                    }
                } else {
                    $this->fireEvent('on' . ucfirst($result->type) . 'Delete', array($item));
                    $this->setResult($item, $result->type);
                }
            }
        }

        return $this->getResult();
    }

    /**
     * Rename a file.
     *
     * @param string $src  The relative path of the source file
     * @param string $dest The name of the new file
     *
     * @return string $error
     */
    public function renameItem()
    {
        // check for feature access
        if (!$this->checkFeature('rename', 'folder') && !$this->checkFeature('rename', 'file')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
        }

        $args = func_get_args();

        $source = array_shift($args);
        $destination = array_shift($args);

        // decode and cast as string
        $source = (string) rawurldecode($source);

        // decode and cast as string
        $destination = (string) rawurldecode($destination);

        WFUtility::checkPath($source);
        WFUtility::checkPath($destination);

        // check for extension in destination name
        if (WFUtility::validateFileName($destination) === false) {
            throw new InvalidArgumentException('Rename Failed: The file name is invalid.');
        }

        // extract the path from the complex path, removing the prefix
        $source = $this->resolvePath($source);

        $filesystem = $this->getFileSystem();

        if ($filesystem->is_file($source)) {
            if ($this->checkFeature('rename', 'file') === false) {
                throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
            }

            $path = dirname($source);
        } elseif ($filesystem->is_dir($source)) {
            if ($this->checkFeature('rename', 'folder') === false) {
                throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
            }

            $path = $source;
        }

        // check access
        if (!$this->checkPathAccess($path)) {
            throw new InvalidArgumentException('Rename Failed: Access to the target directory is restricted');
        }

        // apply filesystem options
        $destination = WFUtility::makeSafe($destination, $this->get('websafe_mode'), $this->get('websafe_spaces'), $this->get('websafe_textcase'));
        $result = $filesystem->rename($source, $destination, $args);

        if ($result instanceof WFFileSystemResult) {
            if (!$result->state) {
                $this->setResult(Text::sprintf('WF_MANAGER_RENAME_' . strtoupper($result->type) . '_ERROR', WFUtility::mb_basename($source)), 'error');
                if ($result->message) {
                    $this->setResult($result->message, 'error');
                }
            } else {
                $data = array(
                    'name' => WFUtility::mb_basename($result->path),
                );

                $event = $this->fireEvent('on' . ucfirst($result->type) . 'Rename', array($destination));

                // merge event data with default values
                $data = array_merge($data, $event);

                $this->setResult($data, $result->type);
            }
        }

        return $this->getResult();
    }

    /**
     * Copy a file.
     *
     * @param string $files The relative file or comma seperated list of files
     * @param string $dest  The relative path of the destination dir
     * @param string $conflict The conflict action copy|replace or blank to confirm
     *
     * @return string $error on failure
     */
    public function copyItem($items, $destination, $conflict = '')
    {
        // check for feature access
        if (!$this->checkFeature('move', 'folder') && !$this->checkFeature('move', 'file')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
        }

        $filesystem = $this->getFileSystem();

        $items = explode(',', rawurldecode((string) $items));

        // decode and cast as string
        $destination = (string) rawurldecode($destination);

        // check destination path
        WFUtility::checkPath($destination);

        // extract the path from the complex path, removing the prefix
        $destination = $this->resolvePath($destination);

        if (empty($destination)) {
            throw new InvalidArgumentException('Copy Failed:Invalid destination path.');
        }

        // check for extension in destination name
        if (WFUtility::validateFileName($destination) === false) {
            throw new InvalidArgumentException('Copy Failed: The file name is invalid.');
        }

        // check path exists
        if (!$filesystem->is_dir($destination)) {
            throw new InvalidArgumentException('Copy Failed: The target directory does not exist');
        }

        // check access
        if (!$this->checkPathAccess($destination)) {
            throw new InvalidArgumentException('Copy Failed: Access to the target directory is restricted');
        }

        foreach ($items as $item) {
            // decode and cast as string
            $item = (string) rawurldecode($item);

            // check source path
            WFUtility::checkPath($item);

            if (WFUtility::validateFileName($item) === false) {
                throw new InvalidArgumentException('Copy Failed: The file name is invalid.');
            }

            $item = $this->resolvePath($item);

            if ($filesystem->is_file($item)) {
                if ($this->checkFeature('move', 'file') === false) {
                    throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
                }

                $path = dirname($item);
            } elseif ($filesystem->is_dir($item)) {
                if ($this->checkFeature('move', 'folder') === false) {
                    throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
                }

                $path = $item;
            }

            $target = WFUtility::makePath($destination, WFUtility::mb_basename($item));

            if ($filesystem->is_file($target)) {
                // target is the same as the source so paste as copy
                if ($target === $item) {
                    $conflict = 'copy';
                    // file exists and is being copied into a new folder
                } else {
                    // conflict action not set so confirm
                    if (!$conflict) {
                        $this->setResult($item, 'confirm');
                        return $this->getResult();
                    }
                }
            }

            // check access
            if (!$this->checkPathAccess($path)) {
                throw new InvalidArgumentException('Copy Failed: Access to the target directory is restricted');
            }

            $result = $filesystem->copy($item, $destination, $conflict);

            if ($result instanceof WFFileSystemResult) {
                if (!$result->state) {
                    if ($result->message) {
                        $this->setResult($result->message, 'error');
                    } else {
                        $this->setResult(Text::sprintf('WF_MANAGER_COPY_' . strtoupper($result->type) . '_ERROR', WFUtility::mb_basename($item)), 'error');
                    }
                } else {
                    $data = array(
                        'name' => $filesystem->toRelative($result->path),
                    );

                    $event = $this->fireEvent('on' . ucfirst($result->type) . 'Copy', array($item));

                    // merge event data with default values
                    $data = array_merge($data, $event);

                    $this->setResult($data, $result->type);
                }
            }
        }

        return $this->getResult();
    }

    /**
     * Copy a file.
     *
     * @param string $files The relative file or comma seperated list of files
     * @param string $dest  The relative path of the destination dir
     *
     * @return string $error on failure
     */
    public function moveItem($items, $destination, $overwrite = false)
    {
        // check for feature access
        if (!$this->checkFeature('move', 'folder') && !$this->checkFeature('move', 'file')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
        }

        $filesystem = $this->getFileSystem();

        $items = explode(',', rawurldecode((string) $items));

        // decode and cast as string
        $destination = (string) rawurldecode($destination);

        // check destination path
        WFUtility::checkPath($destination);

        // resolve the path to the directory store, eg: files/foo.pdf => images/files/foo.pdf
        $destination = $this->resolvePath($destination);

        if (empty($destination)) {
            throw new InvalidArgumentException('Move Failed: The destination path is invalid.');
        }

        // check for extension in destination name
        if (WFUtility::validateFileName($destination) === false) {
            throw new InvalidArgumentException('Move Failed: The file name is invalid.');
        }

        // check path exists
        if (!$filesystem->is_dir($destination)) {
            throw new InvalidArgumentException('Move Failed: The target directory does not exist');
        }

        // check access
        if (!$this->checkPathAccess($destination)) {
            throw new InvalidArgumentException('Move Failed: Access to the target directory is restricted');
        }

        foreach ($items as $item) {
            // decode and cast as string
            $item = (string) rawurldecode($item);

            // check source path
            WFUtility::checkPath($item);

            // extract the path from the complex path, removing the prefix
            $item = $this->resolvePath($item);

            if (WFUtility::validateFileName($item) === false) {
                throw new InvalidArgumentException('Move Failed: The file name is invalid.');
            }

            if ($filesystem->is_file($item)) {
                if ($this->checkFeature('move', 'file') === false) {
                    throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
                }
            } elseif ($filesystem->is_dir($item)) {
                if ($this->checkFeature('move', 'folder') === false) {
                    throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
                }
            }

            if ($filesystem->is_file(WFUtility::makePath($destination, WFUtility::mb_basename($item))) && $overwrite === false) {
                $this->setResult($item, 'confirm');

                return $this->getResult();
            }

            $result = $filesystem->move($item, $destination);

            if ($result instanceof WFFileSystemResult) {
                if (!$result->state) {
                    if ($result->message) {
                        $this->setResult($result->message, 'error');
                    } else {
                        $this->setResult(Text::sprintf('WF_MANAGER_MOVE_' . strtoupper($result->type) . '_ERROR', WFUtility::mb_basename($item)), 'error');
                    }
                } else {
                    $data = array(
                        'name' => $filesystem->toRelative($result->path),
                    );

                    $event = $this->fireEvent('on' . ucfirst($result->type) . 'Move', array($item));

                    // merge event data with default values
                    $data = array_merge($data, $event);

                    $this->setResult($data, $result->type);
                }
            }
        }

        return $this->getResult();
    }

    /**
     * Create a new folder
     * @return string $error on failure
     */
    public function folderNew()
    {
        // check if the user has access to create a folder
        if ($this->checkFeature('create', 'folder') === false) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'));
        }

        $args = func_get_args();

        // path where the new folder will be created
        $target = array_shift($args);

        // a folder cannot be created in the primary directory tree
        if (empty($target)) {
            throw new InvalidArgumentException('Action Failed: Invalid target directory');
        }

        // the name of the new folder
        $new = array_shift($args);

        // decode and cast as string
        $target = (string) rawurldecode($target);
        $new = (string) rawurldecode($new);

        $target = $this->resolvePath($target);

        // check access
        if (!$this->checkPathAccess($target)) {
            throw new InvalidArgumentException('Action Failed: Access to the target directory is restricted');
        }

        $filesystem = $this->getFileSystem();

        $name = WFUtility::makeSafe($new, $this->get('websafe_mode'), $this->get('websafe_spaces'), $this->get('websafe_textcase'));

        // check for extension in destination name
        if (WFUtility::validateFileName($name) === false) {
            throw new InvalidArgumentException('Action Failed: The file name is invalid.');
        }

        $result = $filesystem->createFolder($target, $name, $args);

        if ($result instanceof WFFileSystemResult) {
            if (!$result->state) {
                if ($result->message) {
                    $this->setResult($result->message, 'error');
                } else {
                    $this->setResult(Text::sprintf('WF_MANAGER_NEW_FOLDER_ERROR', WFUtility::mb_basename($new)), 'error');
                }
            } else {
                $data = array(
                    'name'  => WFUtility::mb_basename($new),
                    'id'    => WFUtility::mb_basename($new),
                );

                $event = $this->fireEvent('onFolderNew', array($new));

                // merge event data with default values
                $data = array_merge($data, $event);

                $this->setResult($data, $result->type);
            }
        }

        return $this->getResult();
    }

    /**
     * Get the dimensions of a file.
     *
     * @param string $file The file to get dimensions for
     * @return array The dimensions of the file
     */
    public function getDimensions($file)
    {
        return $this->getFileSystem()->getDimensions($path);
    }

    /**
     * Convert a file to an absolute path.
     *
     * @param string $file The file to convert
     * @return string The absolute path
     */
    public function toAbsolute($file)
    {
        $path = $this->resolvePath($file);

        return $this->getFileSystem()->toAbsolute($path);
    }

    /**
     * Convert a file to a relative path.
     *
     * @param string $file The file to convert
     * @return string The relative path
     */
    public function toRelative($file)
    {
        $path = $this->resolvePath($file);

        return $this->getFileSystem()->toRelative($path);
    }

    /**
     * Proxy for the filesystem read method.
     *
     * @param string $file The file to read
     * @return string The file contents
     */
    public function readFile($file)
    {
        $path = $this->resolvePath($file);

        return $this->getFileSystem()->read($path);
    }

    public function writeFile($file, $data)
    {
        $path = $this->resolvePath($file);

        return $this->getFileSystem()->write($path, $data);
    }

    /**
     * Proxy for the filesystem is_file method.
     * @param string $file The file to check
     * @return bool True if the file exists
     */
    public function is_file($file)
    {
        $path = $this->resolvePath($file);

        return $this->getFileSystem()->is_file($path);
    }

    /**
     * Proxy for the filesystem is_dir method.
     *
     * @param string $path The path to check
     * @return boolean True if the path is a directory
     */
    public function is_dir($path)
    {
        $path = $this->resolvePath($path);

        return $this->getFileSystem()->is_dir($path);
    }

    private function getUploadValue()
    {
        $upload = trim(ini_get('upload_max_filesize'));
        $post = trim(ini_get('post_max_size'));

        $upload = WFUtility::convertSize($upload);
        $post = WFUtility::convertSize($post);

        if (intval($upload) <= intval($post)) {
            return $upload;
        }

        return $post;
    }

    private function getUploadDefaults()
    {
        $filesystem = $this->getFileSystem();
        $features = $filesystem->get('upload');

        $upload_max = $this->getUploadValue();

        $upload = $this->get('upload');

        // get max size as kilobytes
        if (empty($upload['max_size'])) {
            $upload['max_size'] = 1024;
        }

        // get upload size as integer
        $size = intval(preg_replace('/[^0-9]/', '', $upload['max_size']));

        // must not exceed server maximum if > 0
        if (!empty($upload_max)) {
            if ((int) $size * 1024 > (int) $upload_max) {
                $size = $upload_max / 1024;
            }
        }

        $upload = array_merge($upload, array(
            'max_size' => $size,
            'filetypes' => $this->listFileTypes(),
        ));

        if (isset($features['elements'])) {
            $upload['elements'] = $features['elements'];
        }

        if (isset($features['dialog'])) {
            $upload['dialog'] = $features['dialog'];
        }

        return $upload;
    }

    // Set File Browser config
    private function setConfig($config = array())
    {
        // apply passed in properties (this must be done before initialising filesystem!)
        if (!empty($config)) {
            $this->setProperties($config);
        }

        $filesystem = $this->getFileSystem();

        $default = array(
            'upload' => $this->getUploadDefaults(),
        );

        $properties = array('base', 'delete', 'rename', 'folder_new', 'copy', 'move', 'list_limit');

        foreach ($properties as $property) {
            if ($filesystem->get($property)) {
                $default[$property] = $filesystem->get($property);
            }
        }

        $pathVariables = $this->getPathVariables();

        foreach ($pathVariables as $key => $value) {
            $default[$key] = $value;
        }

        // apply default properties
        $this->setProperties($default);
    }
}
