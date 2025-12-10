<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

use Joomla\Registry\Registry;

\defined('_JEXEC') or die;

class WFMediaManagerBase extends WFEditorPlugin
{
    protected $_filetypes = 'jpg,jpeg,png,gif';

    private static $browser = array();

    public function __construct($config = array())
    {
        // use the full "manager" layout by default
        if (!array_key_exists('layout', $config)) {
            $config['layout'] = 'manager';
        }

        if (!array_key_exists('view_path', $config)) {
            $config['view_path'] = WF_EDITOR_LIBRARIES . '/views/plugin';
        }

        if (!array_key_exists('template_path', $config)) {
            $config['template_path'] = WF_EDITOR_LIBRARIES . '/views/plugin/tmpl';
        }

        // Call parent
        parent::__construct($config);

        // initialize the browser
        $browser = $this->getFileBrowser();
        $request = WFRequest::getInstance();

        // Setup plugin XHR callback functions
        $request->setRequest(array($this, 'getDimensions'));
    }

    /**
     * Get the File Browser instance.
     *
     * @return object WFBrowserExtension
     */
    public function getFileBrowser()
    {
        $name = $this->getName();
        $caller = $this->get('caller');

        // add caller if set
        if ($caller) {
            $name .= '.' . $caller;
        }

        if (!isset(self::$browser[$name])) {
            self::$browser[$name] = new WFFileBrowser($this->getFileBrowserConfig());
        }

        return self::$browser[$name];
    }

    protected function addFileBrowserAction($name, $options = array())
    {
        $this->getFileBrowser()->addAction($name, $options);
    }

    protected function addFileBrowserButton($type, $name, $options = array())
    {
        $this->getFileBrowser()->addButton($type, $name, $options);
    }

    protected function addFileBrowserEvent($name, $function = array())
    {
        $this->getFileBrowser()->addEvent($name, $function);
    }

    public function getBrowser()
    {
        return $this->getFileBrowser();
    }

    /**
     * Display the plugin.
     */
    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();

        $view = $this->getView();
        $browser = $this->getFileBrowser();

        $browser->display();
        $view->filebrowser = $browser;

        $options = $browser->getProperties();

        // set global options
        $document->addScriptDeclaration('FileBrowser.options=' . json_encode($options) . ';');
    }

    public function getFileTypes($format = 'array', $list = '')
    {
        return $this->getFileBrowser()->getFileTypes($format, $list);
    }

    protected function setFileTypes($filetypes)
    {
        return $this->getFileBrowser()->setFileTypes($filetypes);
    }

    public function onBeforeUpload(&$file, &$dir, &$name) {}

    public function onUpload($file, $relative = '') {}

    public function getDimensions($file)
    {
        $browser = $this->getFileBrowser();

        $data = array();

        $extension = WFUtility::getExtension($file, true);

        // images and flash
        if (in_array($extension, array('jpg', 'jpeg', 'png', 'apng', 'gif', 'bmp', 'wbmp', 'tif', 'tiff', 'psd', 'ico', 'webp', 'swf'))) {
            list($data['width'], $data['height']) = $browser->getDimensions($file);
            return $data;
        }

        $path = $browser->toAbsolute($file);

        // svg
        if ($extension == 'svg') {
            $svg = @simplexml_load_file($path);

            if ($svg && isset($svg['viewBox'])) {
                list($start_x, $start_y, $end_x, $end_y) = explode(' ', $svg['viewBox']);

                $width = (int) $end_x;
                $height = (int) $end_y;

                if ($width && $height) {
                    $data['width'] = $width;
                    $data['height'] = $height;

                    return $data;
                }
            }
        }

        return $data;
    }

    /**
     * Get the filesystem definition from parameters (with static caching).
     *
     * Reads the `filesystem` parameter to determine the active filesystem name
     * (defaults to "joomla") and returns an object with:
     *  - name (string): The active filesystem name.
     *  - properties (Registry): Configuration for that filesystem.
     *
     * If a section matching the active name exists in the `filesystem` parameter,
     * its values are loaded into the Registry; otherwise an empty Registry is used.
     *
     * The result is cached in a static variable for the lifetime of the request.
     *
     * @return \stdClass Object with `name` (string) and `properties` (Registry).
     */
    private function getFileSystemConfig()
    {
        static $filesystem = null;

        if ($filesystem !== null) {
            return $filesystem;
        }

        // get local (plugin) filesystem config
        $config = (array) $this->getParam('filesystem', array());

        // if no local filesystem name is set, use global config. This is to avoid using the local config values, eg: allow_root, if it has actually been reset to "inherit"
        if (empty($config['name'])) {
            // get global filesystem config
            $config = (array) $this->getParam('editor.filesystem', array());
        }

        // Determine active filesystem name (defaults to "joomla")
        $name = empty($config['name']) ? 'joomla' : $config['name'];

        $item = array(
            'name' => $name,
            'properties' => new Registry(),
        );

        if (isset($config[$name])) {
            $item = array(
                'name' => $name,
                'properties' => new Registry($config[$name]),
            );
        }

        $filesystem = (object) $item;

        return $filesystem;
    }

    private function getFilesystem($config = array())
    {
        static $instances = array();

        $fs = $this->getFileSystemConfig();

        // merge config with filesystem properties
        if (isset($fs->properties)) {
            $config = array_merge($fs->properties->toArray(), $config);
        }

        $signature = md5($fs->name . serialize($config));

        if (!isset($instances[$signature])) {
            $instances[$signature] = WFFileSystem::getInstance($fs->name, $config);
        }

        return $instances[$signature];
    }

    /**
     * Build the Directory Store from parameters with correct defaults.
     *
     * Behavior:
     * - Read editor base dir and plugin dir (with optional caller override).
     * - If $dir is empty or an array with no non-blank paths, fall back to $baseDir.
     * - Normalize string $dir to array format.
     * - Only add a default "images" entry when there are no usable (non-blank) paths,
     *   and only if allow_root is false. Otherwise, ignore blank rows.
     * 
     * @param  WFFileSystem $filesystem The filesystem instance to use.
     *
     * @return array        Associative array keyed by md5(path) => ['path' => ..., 'label' => ...]
     */
    protected function buildDirectoryStoreFromParams($filesystem): array
    {
        // default global filesystem configuration
        $baseFs = (array) $this->getParam('editor.filesystem', array('name' => 'joomla'));

        if (empty($baseFs['name'])) {
            $baseFs['name'] = 'joomla'; // default to joomla filesystem
        }

        // get the global base directory value
        $baseDir = $this->getParam('editor.dir', '', '', false);

        // get directory from plugin parameter, fallback to base directory as it cannot itself be empty
        $dir = $this->getParam($this->getName() . '.dir');

        // check for directory set by caller, eg: Image Manager in Basic Dialog
        if ($this->get('caller')) {
            $dir = $this->getParam($this->get('caller') . '.dir', $dir);
        }

        // allow root: accept both spellings just in case
        $allowRoot = (bool) ($filesystem->get('allowroot', $filesystem->get('allow_root', 0)));

        // if the filesystem name matches the base filesystem name, use the base directory if no directory is set and allowRoot is false
        if ($baseFs['name'] === $filesystem->get('name') && $allowRoot === false) {
            // if no directory is set, or it is an empty array, use the base directory
            if (empty($dir)) {
                $dir = $baseDir;

                // otherwise, if it is an array, check if it has a path value, if not use the base directory    
            } else if (is_array($dir) && count(array_filter(array_column($dir, 'path'))) === 0) {
                $dir = $baseDir;
            }
        }

        // Normalize $dir into an array of directories if it is a string (legacy value)
        if (!is_array($dir)) {
            $dir = [
                [
                    'path' => $dir,
                    'label' => '',
                ],
            ];
        }

        // Collect non-blank entries (trimmed)
        $nonBlank = [];

        foreach ($dir as $values) {
            $path = trim($values['path'] ?? '');
            $label = $values['label'] ?? '';

            if ($path !== '') {
                $nonBlank[] = ['path' => $path, 'label' => $label];
            }
        }

        $dirStore = [];

        // If no usable entries exist (all blank or effectively empty after normalization)
        if (count($nonBlank) === 0) {
            if ($allowRoot === false) {
                $root = $filesystem->get('root', 'images'); // get the default root for the filesystem

                if (empty($root)) {
                    $root = 'images';
                }

                // Default ONLY here to "images"
                $hash = md5($root);

                $dirStore[$hash] = [
                    'path'  => $root,
                    'label' => '' // no label required for a single path
                ];
            } else {
                // Root allowed: a single blank/root entry
                $hash = md5('');

                $dirStore[$hash] = [
                    'path' => '',
                    'label' => '',
                ];
            }

            return $dirStore;
        }

        // Otherwise, at least one non-blank path exists — ignore blank rows
        foreach ($nonBlank as $item) {
            $hash = md5($item['path']);

            $dirStore[$hash] = [
                'path' => $item['path'],
                'label' => $item['label'],
            ];
        }

        return $dirStore;
    }

    private function getFeatures($filesystem)
    {
        $isReadOnly = $filesystem->get('readonly', false);

        $allow = function ($param, $default = 1) use ($isReadOnly) {
            return $isReadOnly ? false : $this->getParam($param, $default);
        };

        $features = array(
            'help' => $allow('help_button', 1),
            'upload' => $allow('upload'),
            'folder' => array(
                'create' => $allow('folder_new'),
                'delete' => $allow('folder_delete'),
                'rename' => $allow('folder_rename'),
                'move'   => $allow('folder_move'),
            ),
            'file' => array(
                'delete' => $allow('file_delete'),
                'rename' => $allow('file_rename'),
                'move'   => $allow('file_move'),
            ),
        );

        return $features;
    }

    /**
     * Get the Media Manager configuration.
     *
     * @return array
     */
    protected function getFileBrowserConfig($config = array())
    {
        $filetypes = $this->getParam('extensions', $this->get('_filetypes'));
        $textcase = $this->getParam('editor.websafe_textcase', '');

        // flatten filetypes
        $filetypes = WFUtility::formatFileTypesList('list', $filetypes);

        $filesystem = $this->getFilesystem(array(
            'upload_conflict'   => $this->getParam('editor.upload_conflict', 'overwrite'),
            'upload_suffix'     => $this->getParam('editor.upload_suffix', '_copy'),
            'filetypes'         => $filetypes
        ));

        // implode textcase array to create string
        if (is_array($textcase)) {
            $textcase = array_filter($textcase, 'strlen');
            $textcase = implode(',', $textcase);
        }

        $filter = $this->getParam('editor.dir_filter', array());

        // explode to array if string - 2.7.x...2.7.11
        if (!is_array($filter)) {
            $filter = explode(',', $filter);
        }

        // remove empty values
        $filter = array_filter((array) $filter);

        $dirStore = $this->buildDirectoryStoreFromParams($filesystem);

        // get websafe spaces parameter and convert legacy values
        $websafe_spaces = $this->getParam('editor.websafe_allow_spaces', '_');

        if (is_numeric($websafe_spaces)) {
            // legacy replacement
            if ($websafe_spaces == 0) {
                $websafe_spaces = '_';
            }
            // convert to space
            if ($websafe_spaces == 1) {
                $websafe_spaces = ' ';
            }
        }

        // fix legacy list limit value
        $list_limit = $this->getParam('editor.list_limit', 0);

        // convert "all" to 0
        if (!is_numeric($list_limit)) {
            $list_limit = 0;
        }

        $features = $this->getFeatures($filesystem);

        $base = array(
            'dir' => $dirStore,
            'filesystem' => $filesystem,
            'filetypes' => $filetypes,
            'filter' => $filter,
            'upload' => array(
                'max_size' => $this->getParam('max_size', 1024),
                'validate_mimetype' => (int) $this->getParam('editor.validate_mimetype', 1),
                'add_random' => (int) $this->getParam('editor.upload_add_random', 0),
                'total_files' => (float) $this->getParam('editor.total_files', 0),
                'total_size' => (float) $this->getParam('editor.total_size', 0),
                'remove_exif' => (int) $this->getParam('editor.upload_remove_exif', 0),
            ),
            'folder_tree' => $this->getParam('editor.folder_tree', 1),
            'list_limit' => $list_limit,
            'features' => $features,
            'websafe_mode' => $this->getParam('editor.websafe_mode', 'utf-8'),
            'websafe_spaces' => $websafe_spaces,
            'websafe_textcase' => $textcase,
            'date_format' => $this->getParam('editor.date_format', '%d/%m/%Y, %H:%M'),
            'position' => $this->getParam('editor.filebrowser_position', $this->getParam('editor.browser_position', 'bottom')),
            'use_state_cookies' => $this->getParam('editor.use_cookies', true),
            'search_depth' => $this->getParam('editor.filebrowser_search_depth', 3),
            'allow_download' => $this->getParam('allow_download', 0),
            'list_limit_options' => $filesystem->get('list_limit_options', array(10, 25, 50, 100, 0))
        );

        return WFUtility::array_merge_recursive_distinct($base, $config);
    }
}
