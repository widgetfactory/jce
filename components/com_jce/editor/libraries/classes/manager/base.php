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
    private function getFileSystem()
    {
        static $filesystem = null;

        if ($filesystem !== null) {
            return $filesystem;
        }

        $config = (array) $this->getParam('filesystem', array());

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
     * Build the Directory Store from parameters with correct defaults.
     *
     * Behavior:
     * - Read editor base dir and plugin dir (with optional caller override).
     * - If $dir is empty or an array with no non-blank paths, fall back to $baseDir.
     * - Normalize string $dir to array format.
     * - Only add a default "images" entry when there are no usable (non-blank) paths,
     *   and only if allow_root is false. Otherwise, ignore blank rows.
     *
     * @return array               Associative array keyed by md5(path) => ['path' => ..., 'label' => ...]
     */
    protected function buildDirectoryStoreFromParams(): array
    {
        $filesystem = $this->getFileSystem();

        // get base directory from editor parameter
        $baseDir = $this->getParam('editor.dir', '', '', false);

        // get directory from plugin parameter, fallback to base directory as it cannot itself be empty
        $dir = $this->getParam($this->getName() . '.dir');

        // check for directory set by caller, eg: Image Manager in Basic Dialog
        if ($this->get('caller')) {
            $dir = $this->getParam($this->get('caller') . '.dir', $dir);
        }

        // if no directory is set, or it is an empty array, use the base directory
        if (empty($dir)) {
            $dir = $baseDir;
        }

        // otherwise, if it is an array, check if it has a path value, if not use the base directory
        else if (is_array($dir) && count(array_filter(array_column($dir, 'path'))) === 0) {
            $dir = $baseDir;
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

        $allowRoot = (bool) $filesystem->properties->get('allow_root', 0);
        $dirStore = [];

        // Collect non-blank entries (trimmed)
        $nonBlank = [];

        foreach ($dir as $values) {
            $path = trim($values['path'] ?? '');
            $label = $values['label'] ?? '';

            if ($path !== '') {
                $nonBlank[] = ['path' => $path, 'label' => $label];
            }
        }

        // If no usable entries exist (all blank or effectively empty after normalization)
        if (count($nonBlank) === 0) {
            if ($allowRoot === false) {
                // Default ONLY here to "images"
                $hash = md5('images');

                $dirStore[$hash] = [
                    'path'  => 'images',
                    'label' => 'Images',
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

    /**
     * Get the Media Manager configuration.
     *
     * @return array
     */
    protected function getFileBrowserConfig($config = array())
    {
        $filesystem = $this->getFileSystem();

        $filetypes = $this->getParam('extensions', $this->get('_filetypes'));
        $textcase = $this->getParam('editor.websafe_textcase', '');

        // flatten filetypes
        $filetypes = WFUtility::formatFileTypesList('list', $filetypes);

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

        $dirStore = $this->buildDirectoryStoreFromParams();

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

        $base = array(
            'dir' => $dirStore,
            'filesystem' => $filesystem->name,
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
            'features' => array(
                'upload' => $this->getParam('upload', 1),
                'folder' => array(
                    'create' => $this->getParam('folder_new', 1),
                    'delete' => $this->getParam('folder_delete', 1),
                    'rename' => $this->getParam('folder_rename', 1),
                    'move' => $this->getParam('folder_move', 1),
                ),
                'file' => array(
                    'delete' => $this->getParam('file_delete', 1),
                    'rename' => $this->getParam('file_rename', 1),
                    'move' => $this->getParam('file_move', 1),
                ),
            ),
            'websafe_mode' => $this->getParam('editor.websafe_mode', 'utf-8'),
            'websafe_spaces' => $websafe_spaces,
            'websafe_textcase' => $textcase,
            'date_format' => $this->getParam('editor.date_format', '%d/%m/%Y, %H:%M'),
            'position' => $this->getParam('editor.filebrowser_position', $this->getParam('editor.browser_position', 'bottom')),
            'use_state_cookies' => $this->getParam('editor.use_cookies', true),
            'search_depth' => $this->getParam('editor.filebrowser_search_depth', 3),
            'allow_download' => $this->getParam('allow_download', 0),
        );

        return WFUtility::array_merge_recursive_distinct($base, $config);
    }
}
