<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Editor\Plugin\Manager;

\defined('_JEXEC') or die;

use Joomla\Registry\Registry;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;

use Wfe\Http\Request;
use Wfe\Utility\Utility;
use Wfe\Application\Browser as FileBrowser;
use Wfe\Adapter\FilesystemAdapter;
use Wfe\Helper\ArrayHelper;

/**
 * Base class for "manager" type editor plugins, eg: Image Manager, File Manager.
 *
 * Provides a shared File Browser instance, filesystem configuration and the
 * File Browser options passed to the client.
 */
class AbstractManager extends \Wfe\Editor\Plugin\AbstractPlugin
{
    /**
     * File Browser instances, keyed by plugin name (and caller, if set).
     *
     * @var \Wfe\Application\Browser[]
     */
    protected static $browser = array();

    /**
     * Default list of allowed file extensions, used when the plugin has no
     * `extensions` parameter set.
     *
     * @var string
     */
    protected $filetypes = 'jpg,jpeg,png,gif';

    /**
     * Constructor.
     *
     * Applies the "manager" layout and view paths as defaults, creates the File
     * Browser instance and registers the plugin XHR callbacks.
     *
     * @param array $config Plugin configuration values.
     */
    public function __construct($config = array())
    {
        // use the full "manager" layout by default
        if (!array_key_exists('layout', $config)) {
            $config['layout'] = 'manager';
        }

        if (!array_key_exists('view_path', $config)) {
            $config['view_path'] = WF_EDITOR . '/views/plugin';
        }

        if (!array_key_exists('template_path', $config)) {
            $config['template_path'] = WF_EDITOR . '/views/plugin/tmpl';
        }

        // Call parent
        parent::__construct($config);

        // initialize the browser
        $_browser = $this->getFileBrowser();
        $request = Request::getInstance();

        // Setup plugin XHR callback functions
        $request->setRequest(array($this, 'getDimensions'));
    }

    /**
     * Get the File Browser instance for this plugin, creating it if required.
     *
     * Instances are cached statically against the plugin name, and the caller
     * name where one is set, eg: "imgmanager.article".
     *
     * @return \Wfe\Application\Browser The File Browser instance.
     */
    public function getFileBrowser()
    {
        $name = $this->getName();
        $caller = $this->getConfig('caller');

        // add caller if set
        if ($caller) {
            $name .= '.' . $caller;
        }

        if (!isset(self::$browser[$name])) {
            self::$browser[$name] = new FileBrowser(
                $this,
                $this->getFileBrowserConfig()
            );
        }

        return self::$browser[$name];
    }

    /**
     * Add an action to the File Browser toolbar.
     *
     * @param string $name    Action name.
     * @param array  $options Action options, eg: icon, title, multiple.
     *
     * @return void
     */
    protected function addFileBrowserAction($name, $options = array())
    {
        $this->getFileBrowser()->addAction($name, $options);
    }

    /**
     * Add a button to the File Browser.
     *
     * @param string $type    Button type, eg: file, folder.
     * @param string $name    Button name.
     * @param array  $options Button options, eg: icon, title, multiple.
     *
     * @return void
     */
    protected function addFileBrowserButton($type, $name, $options = array())
    {
        $this->getFileBrowser()->addButton($type, $name, $options);
    }

    /**
     * Add an event callback to the File Browser.
     *
     * @param string         $name     Event name.
     * @param array|callable $function Callback to invoke for the event.
     *
     * @return void
     */
    protected function addFileBrowserEvent($name, $function = array())
    {
        $this->getFileBrowser()->addEvent($name, $function);
    }

    /**
     * Get the File Browser instance.
     *
     * @return \Wfe\Application\Browser The File Browser instance.
     */
    public function getBrowser()
    {
        return $this->getFileBrowser();
    }

    /**
     * Execute a plugin task.
     *
     * When the plugin is running as a "basic dialog", only the inline upload XHR
     * task is permitted, and only if uploading and inline uploading are enabled.
     *
     * @param string $task The task to execute.
     *
     * @return void
     *
     * @throws \Exception If the task is not allowed in a basic dialog.
     */
    public function execute($task)
    {
        $app = Factory::getApplication();

        if ((int) $this->getParam('basic_dialog', 0) === 1) {

            // allow xhr task if uploading is allowed, eg: inline uploading
            if ($task === 'xhr' && $app->input->getWord('method') === 'upload') {
                if ((int) $this->getParam('upload', 1) && (int) $this->getParam('inline_upload', 1)) {
                    return parent::execute($task);
                }
            }

            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        parent::execute($task);
    }

    /**
     * Display the plugin, rendering the File Browser and passing its
     * configuration to the client as `FileBrowser.options`.
     *
     * @return void
     */
    public function display()
    {
        parent::display();

        $document = $this->getDocument();
        $browser = $this->getFileBrowser();

        $browser->display();
        
        // get all file browser config values
        $options = $browser->getProperties();

        // set global options
        $document->addScriptDeclaration('FileBrowser.options=' . json_encode($options) . ';');
    }

    /**
     * Get the list of allowed file types.
     *
     * @param string $format Return format, eg: "array" or "list".
     * @param string $list   Optional file type list to format instead of the
     *                       File Browser value.
     *
     * @return array|string The file types in the requested format.
     */
    public function getFileTypes($format = 'array', $list = '')
    {
        return $this->getFileBrowser()->getFileTypes($format, $list);
    }

    /**
     * Set the list of allowed file types on the File Browser.
     *
     * @param array|string $filetypes The file types to allow.
     *
     * @return void
     */
    protected function setFileTypes($filetypes)
    {
        return $this->getFileBrowser()->setFileTypes($filetypes);
    }

    /**
     * Event fired before a file is uploaded, allowing the plugin to modify the
     * upload before it is written.
     *
     * @param object $file The uploaded file data, passed by reference.
     * @param string $dir  The target directory, passed by reference.
     * @param string $name The target file name, passed by reference.
     *
     * @return void
     */
    public function onBeforeUpload(&$file, &$dir, &$name) {}

    /**
     * Event fired after a file has been uploaded.
     *
     * @param string $file     The absolute path to the uploaded file.
     * @param string $relative The path to the uploaded file, relative to the
     *                         filesystem root.
     *
     * @return void
     */
    public function onUpload($file, $relative = '') {}

    /**
     * Get the dimensions of an image file.
     *
     * Raster images are measured by the File Browser, which validates the path.
     * SVG files are parsed for a `viewBox` attribute, with the DOCTYPE stripped
     * and network access disabled to prevent entity based XXE.
     *
     * @param string $file Relative path to the image file.
     *
     * @return array Array with `width` and `height` keys, or an empty array if
     *               the dimensions could not be determined.
     */
    public function getDimensions($file)
    {
        $browser    = $this->getFileBrowser();
        $path       = $browser->preparePath($file, true);

        $data = array();

        $extension = Utility::getExtension($path, true);

        // images, the browser validates the path and returns a width/height array
        if (in_array($extension, array('jpg', 'jpeg', 'png', 'apng', 'gif', 'bmp', 'wbmp', 'tif', 'tiff', 'psd', 'ico', 'webp'))) {
            return $browser->getDimensions($file);
        }

        // svg
        if ($extension == 'svg') {
            // readFile validates the name, the file type and directory access
            $svg = $browser->readFile($path);

            if ($svg === false) {
                return $data;
            }

            // Strip DOCTYPE to prevent entity-based XXE (local file:// and network) on all PHP versions
            $svg = preg_replace('/<!DOCTYPE[^[>]*(\[[^\]]*\])?>/is', '', $svg);

            libxml_use_internal_errors(true);
            $xml = simplexml_load_string($svg, 'SimpleXMLElement', LIBXML_NONET);
            libxml_clear_errors();
            libxml_use_internal_errors(false);

            if ($xml && isset($xml['viewBox'])) {
                list($start_x, $start_y, $end_x, $end_y) = explode(' ', $xml['viewBox']);

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
     * Reads the plugin `filesystem` parameter to determine the active filesystem
     * name, falling back to the global `editor.filesystem` parameter when the
     * plugin value has no name set, and returns an object with:
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

    /**
     * Get the filesystem adapter instance for the active filesystem.
     *
     * The passed configuration is merged over the filesystem properties from
     * {@see self::getFileSystemConfig()}, and instances are cached statically
     * against a signature of the resulting configuration.
     *
     * @param array $config Additional configuration values, eg: filetypes,
     *                      upload_conflict.
     *
     * @return \Wfe\Adapter\FilesystemAdapter The filesystem adapter instance.
     */
    private function getFilesystem($config = array())
    {
        static $instances = array();

        $fs = $this->getFileSystemConfig();

        // merge config with filesystem properties
        if (isset($fs->properties)) {
            $config = array_merge($fs->properties->toArray(), $config);
        }

        $config['name'] = isset($fs->name) ? $fs->name : 'joomla';

        $signature = md5($fs->name . serialize($config));

        if (!isset($instances[$signature])) {
            $instances[$signature] = FilesystemAdapter::getInstance($this, $config);
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
     * - Label each entry with the folder basename where no label is set.
     *
     * @param \Wfe\Adapter\FilesystemAdapter $filesystem The filesystem instance to use.
     *
     * @return array Associative array keyed by md5(path) => ['path' => ..., 'label' => ...]
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
        if ($this->getConfig('caller')) {
            $dir = $this->getParam($this->getConfig('caller') . '.dir', $dir);
        }

        // allow root: accept both spellings just in case
        $allowRoot = (bool) ($filesystem->getConfig('allowroot', $filesystem->getConfig('allow_root', 0)));

        // if the filesystem name matches the base filesystem name, use the base directory if no directory is set and allowRoot is false
        if ($baseFs['name'] === $filesystem->getConfig('name') && $allowRoot === false) {
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
                $root = $filesystem->getConfig('root', 'images'); // get the default root for the filesystem

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

            if (empty($item['label'])) {
                $item['label'] = basename($item['path']) ?: $item['path'];
            }

            $dirStore[$hash] = [
                'path' => $item['path'],
                'label' => $item['label'],
            ];
        }

        return $dirStore;
    }

    /**
     * Build the File Browser feature map from the plugin parameters.
     *
     * All features are disabled when the filesystem is read only.
     *
     * @param \Wfe\Adapter\FilesystemAdapter $filesystem The filesystem instance to use.
     *
     * @return array Feature map with `help`, `upload`, `folder` and `file` keys.
     */
    private function getFeatures($filesystem)
    {
        $isReadOnly = $filesystem->getConfig('readonly', false);

        $allow = function ($param, $default = 1) use ($isReadOnly) {
            return $isReadOnly ? false : (bool) $this->getParam($param, $default);
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
     * Build the File Browser configuration from the plugin and global editor
     * parameters, eg: directories, file types, upload limits and websafe naming.
     *
     * Legacy parameter values, eg: a comma separated directory filter or a
     * numeric websafe spaces value, are converted to their current format.
     *
     * @param array $config Configuration values to merge over the defaults.
     *
     * @return array The File Browser configuration.
     */
    protected function getFileBrowserConfig($config = array())
    {
        $filetypes = $this->getParam('extensions', $this->filetypes);
        $textcase = $this->getParam('editor.websafe_textcase', '');

        // flatten filetypes
        $filetypes = Utility::formatFileTypesList('list', $filetypes);

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
                'max_size' => $this->getParam('max_size', 10240),
                'validate_mimetype' => (int) $this->getParam('editor.validate_mimetype', 1),
                'add_random' => (int) $this->getParam('editor.upload_add_random', 0),
                'random_length' => (int) $this->getParam('editor.upload_random_length', 16),
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
            'list_limit_options' => $filesystem->getConfig('list_limit_options', array(10, 25, 50, 100, 0))
        );

        return ArrayHelper::array_merge_recursive_distinct($base, $config);
    }
}
