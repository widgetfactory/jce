<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

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

        // process options array
        $browser->getFileSystem()->updateOptions($options);

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

    private function getFileSystem()
    {
        $filesystem = $this->getParam('filesystem.name', '');

        // if an object, get the name
        if (is_object($filesystem)) {
            $filesystem = isset($filesystem->name) ? $filesystem->name : 'joomla';
        }

        // if no value, default to "joomla"
        if (empty($filesystem)) {
            $filesystem = 'joomla';
        }

        return $filesystem;
    }

    public function onUpload($file, $relative = '')
    {
    }

    public function getDimensions($file)
    {
        $browser = $this->getFileBrowser();
        $filesystem = $browser->getFileSystem();

        $path = WFUtility::makePath($filesystem->getBaseDir(), rawurldecode($file));

        $data = array();

        $extension = WFUtility::getExtension($path, true);

        // images and flash
        if (in_array($extension, array('jpg', 'jpeg', 'png', 'gif', 'bmp', 'wbmp', 'tif', 'tiff', 'psd', 'ico', 'webp', 'swf'))) {
            list($data['width'], $data['height']) = getimagesize($path);
            return $data;
        }

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

        // get base directory from editor parameter
        $baseDir = $this->getParam('editor.dir', '', '', false);

        // get directory from plugin parameter, fallback to base directory as it cannot itself be empty
        $dir = $this->getParam($this->getName() . '.dir', $baseDir);

        // check for directory set by caller, eg: Image Manager in Basic Dialog
        if ($this->get('caller')) {
            $dir = $this->getParam($this->get('caller') . '.dir', $dir);
        }

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
            'dir' => $dir,
            'filesystem' => $this->getFileSystem(),
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
