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

class WFEditor
{
    // Editor instance
    protected static $instances;

    /**
     * Profile object.
     *
     * @var object
     */
    private $profile = null;

    /**
     * Context hash.
     *
     * @var string
     */
    protected $context = '';

    /**
     * Array of linked scripts.
     *
     * @var array
     */
    private $scripts = array();

    /**
     * Array of linked style sheets.
     *
     * @var array
     */
    private $stylesheets = array();

    /**
     * Array of included style declarations.
     *
     * @var array
     */
    private $styles = array();

    /**
     * Array of scripts placed in the header.
     *
     * @var array
     */
    private $javascript = array();

    /**
     * Array of core plugins
     *
     * @var array
     */
    private static $plugins = array('core', 'help', 'autolink', 'effects', 'cleanup', 'code', 'format', 'importcss', 'colorpicker', 'blobupload', 'upload', 'figure', 'ui', 'noneditable', 'branding');

    /**
     * Initialization state
     *
     * @var boolean
     */
    public $initialized = false;

    private function addScript($url)
    {
        $url = $this->addAssetVersion($url);
        $this->scripts[] = $url;
    }

    private function addStyleSheet($url)
    {
        $url = $this->addAssetVersion($url);
        $this->stylesheets[] = $url;
    }

    private function addScriptDeclaration($text)
    {
        $this->javascript[] = $text;
    }

    private function addStyleDeclaration($text)
    {
        $this->styles[] = $text;
    }

    public function getScripts()
    {
        return $this->scripts;
    }

    public function getStyleSheets()
    {
        return $this->stylesheets;
    }

    public function getScriptDeclaration()
    {
        return $this->javascript;
    }

    public function __construct($config = array())
    {
        $app = JFactory::getApplication();
        $wf = WFApplication::getInstance();

        if (!isset($config['plugin'])) {
            $config['plugin'] = '';
        }

        if (!isset($config['profile_id'])) {
            $config['profile_id'] = 0;
        }

        // trigger event
        $app->triggerEvent('onBeforeWfEditorLoad');

        // set profile
        $this->profile = $wf->getProfile($config['plugin'], $config['profile_id']);

        // set context
        $this->context = $wf->getContext();
    }

    /**
     * Returns a reference to a editor object.
     *
     * This method must be invoked as:
     *         <pre>  $editor =WFEditor::getInstance();</pre>
     *
     * @return JCE The editor object
     */
    public static function getInstance($config = array())
    {
        $signature = md5(serialize($config));

        if (empty(self::$instances[$signature])) {
            self::$instances[$signature] = new self($config);
        }

        return self::$instances[$signature];
    }

    private function addAssetVersion($url)
    {
        $version = md5(self::getVersion());

        if (strpos($url, '?') === false) {
            $url .= '?' . $version;
        } else {
            $url .= '&' . $version;
        }

        return $url;
    }

    public function init()
    {
        $this->initialized = true;

        $settings = $this->getSettings();

        JFactory::getApplication()->triggerEvent('onBeforeWfEditorRender', array(&$settings));

        $this->render($settings);

        return $this;
    }

    /**
     * Legacy function to build the editor
     *
     * @return String
     */
    public function buildEditor()
    {
        $this->init()->getOutput();
    }

    /**
     * Legacy function to get the editor settings
     *
     * @return array
     */
    public function getEditorSettings()
    {
        return $this->getSettings();
    }

    private function getCompressionOptions()
    {
        $wf = WFApplication::getInstance();

        // check for joomla debug mode
        $debug = JFactory::getConfig()->get('debug');

        // default compression states
        $options = array(
            'javascript' => 0,
            'css' => 0,
        );

        // set compression states, only if debug mode is off
        if ((int) $debug === 0) {
            $options = array(
                'javascript' => (int) $wf->getParam('editor.compress_javascript', 0, 0),
                'css' => (int) $wf->getParam('editor.compress_css', 0, 0),
            );
        }

        return $options;
    }

    private function assignEditorSkin(&$settings)
    {
        // get an editor instance
        $wf = WFApplication::getInstance();

        // assign skin - new default is "modern"
        $settings['skin'] = $wf->getParam('editor.toolbar_theme', 'modern');

        if (empty($settings['skin'])) {
            $settings['skin'] = 'modern';
        }

        if (strpos($settings['skin'], '.') !== false) {
            list($settings['skin'], $settings['skin_variant']) = explode('.', $settings['skin']);
        }

        // classic has been removed
        if ($settings['skin'] == 'classic') {
            $settings['skin'] = 'default';
        }

        if ($settings['skin'] == 'mobile') {
            $settings['skin'] = 'modern';
            $settings['skin_variant'] = 'touch';
        }
    }

    /**
     * Porcess and assign custom configuration variables
     *
     * @param [Array] $settings
     * @return void
     */
    private function getCustomConfig(&$settings)
    {
        // get an editor instance
        $wf = WFApplication::getInstance();

        // Other - user specified
        $userParams = $wf->getParam('editor.custom_config', '');

        if ($userParams) {
            // legacy format, eg: key:value;key:value
            if (!WFUtility::isJson($userParams)) {
                $userParams = explode(';', $userParams);
            } else {
                $userParams = json_decode($userParams, true);
            }

            // Remove values with invalid key
            $userParams = array_filter($userParams, function ($key) {
                return !is_numeric($key);
            }, ARRAY_FILTER_USE_KEY);

            foreach ($userParams as $userParam) {
                $name = '';
                $value = '';

                // legacy string
                if (is_string($userParam)) {
                    list($name, $value) = explode(':', $userParam);
                }

                // json associative array
                if (is_array($userParam) && array_key_exists('name', $userParam)) {
                    extract($userParam);
                }

                if ($name && $value !== '') {
                    $settings[$name] = trim($value, " \t\n\r\0\x0B'\"");
                }
            }
        }
    }

    private function isSkinRtl()
    {
        $language = JFactory::getLanguage();

        if ($language->getTag() === WFLanguage::getTag()) {
            return $language->isRTL();
        }

        return false;
    }

    private function getLanguageDirection()
    {
        $user = JFactory::getUser();
        $params = JComponentHelper::getParams('com_languages');
        $locale = $user->getParam('language', $params->get('site', 'en-GB'));

        $language = JLanguage::getInstance($locale);

        return $language->isRTL() ? 'rtl' : 'ltr';
    }

    protected function getLanguageCode()
    {
        return WFLanguage::getCode();
    }

    protected function getLanguageTag()
    {
        return WFLanguage::getTag();
    }

    public function getSettings()
    {
        // get an editor instance
        $wf = WFApplication::getInstance();

        // create token
        $token = JSession::getFormToken();

        // get editor version
        $version = self::getVersion();

        // get form token
        $token = JSession::getFormToken();

        $settings = array(
            'token' => JSession::getFormToken(),
            'base_url' => JURI::root(),
            'language' => $this->getLanguageCode(),
            'directionality' => $this->getLanguageDirection(),
            'theme' => 'none',
            'plugins' => '',
            'skin' => 'default',
            'query' => array(
                $token => 1,
                'context' => $this->context,
            ),
        );

        // if a profile is set
        if (is_object($this->profile)) {
            jimport('joomla.filesystem.folder');

            $settings['query']['profile_id'] = $this->profile->id;

            $settings = array_merge($settings, array('theme' => 'advanced'), $this->getToolbar());

            // add plugins
            $plugins = $this->getPlugins();

            // add core plugins
            if (!empty($plugins['core'])) {
                $settings['plugins'] = array_values($plugins['core']);
            }

            // add external plugins
            if (!empty($plugins['external'])) {
                $settings['external_plugins'] = $plugins['external'];
            }

            // Theme and skins
            $theme = array(
                'toolbar_location' => array('top', 'top', 'string'),
                'toolbar_align' => array('left', 'left', 'string'),
                'statusbar_location' => array('bottom', 'bottom', 'string'),
                'path' => array(1, 1, 'boolean'),
                'resizing' => array(1, 0, 'boolean'),
                'resize_horizontal' => array(1, 1, 'boolean'),
            );

            // set rows key to pass to plugin config
            $settings['rows'] = $this->profile->rows;

            foreach ($theme as $k => $v) {
                $settings['theme_' . $k] = $wf->getParam('editor.' . $k, $v[0], $v[1], $v[2]);
            }

            $settings['width'] = $wf->getParam('editor.width');
            $settings['height'] = $wf->getParam('editor.height');

            // process and assign the editor skin
            $this->assignEditorSkin($settings);

            // get body class if any
            $body_class = $wf->getParam('editor.body_class', '');

            // check for editor reset - options are 1, 0, auto
            $settings['content_style_reset'] = $wf->getParam('editor.content_style_reset', 'auto');

            // if enabled, add the "mceContentReset" class to the body
            $content_reset = $settings['content_style_reset'] == 1 ? 'mceContentReset' : '';

            // combine body class and reset
            $settings['body_class'] = trim($body_class . ' ' . $content_reset);

            // set body id
            $settings['body_id'] = $wf->getParam('editor.body_id', '');

            // get stylesheets
            $stylesheets = (array) self::getTemplateStyleSheets();

            // set stylesheets as string
            $settings['content_css'] = implode(',', $stylesheets);

            // Editor Toggle
            $settings['toggle'] = $wf->getParam('editor.toggle', 1, 1);
            $settings['toggle_label'] = htmlspecialchars($wf->getParam('editor.toggle_label', ''));
            $settings['toggle_state'] = $wf->getParam('editor.toggle_state', 1, 1);

            // use cookies to store state
            $settings['use_state_cookies'] = (bool) $wf->getParam('editor.use_cookies', 1);

            // Set active tab
            $settings['active_tab'] = 'wf-editor-' . $wf->getParam('editor.active_tab', 'wysiwyg');

            $settings['invalid_elements'] = array();

            // Get all optional plugin configuration options
            $this->getPluginConfig($settings);

            // clean up invalid_elements
            if (!empty($settings['invalid_elements'])) {
                $settings['invalid_elements'] = array_values($settings['invalid_elements']);
            }

        } else {
            $settings['readonly'] = true;
        }

        // get compression options stylesheet
        $settings['compress'] = $this->getCompressionOptions();

        // set css compression
        if ($settings['compress']['css']) {
            $this->addStyleSheet(JURI::base(true) . '/index.php?option=com_jce&task=editor.pack&type=css&' . http_build_query((array) $settings['query']));
        } else {
            // CSS
            $this->addStyleSheet($this->getURL(true) . '/libraries/css/editor.min.css');

            // load default skin
            $this->addStyleSheet($this->getURL(true) . '/tiny_mce/themes/advanced/skins/default/ui.css');

            // load other skin
            if ($settings['skin'] != 'default') {
                $this->addStyleSheet($this->getURL(true) . '/tiny_mce/themes/advanced/skins/' . $settings['skin'] . '/ui.css');
            }

            // load variant
            if (isset($settings['skin_variant'])) {
                $this->addStyleSheet($this->getURL(true) . '/tiny_mce/themes/advanced/skins/' . $settings['skin'] . '/ui_' . $settings['skin_variant'] . '.css');
            }
        }

        if ($this->isSkinRtl()) {
            $settings['skin_directionality'] = 'rtl';
        }

        // set javascript compression script
        if ($settings['compress']['javascript']) {
            $this->addScript(JURI::base(true) . '/index.php?option=com_jce&task=editor.pack&' . http_build_query((array) $settings['query']));
        } else {
            // Tinymce
            $this->addScript($this->getURL(true) . '/tiny_mce/tiny_mce.js');

            // Editor
            $this->addScript($this->getURL(true) . '/libraries/js/editor.min.js');
        }

        // language
        $this->addScript(JURI::base(true) . '/index.php?option=com_jce&task=editor.loadlanguages&lang=' . $settings['language'] . '&' . http_build_query((array) $settings['query']));

        $this->getCustomConfig($settings);

        // process settings
        array_walk($settings, function (&$value, $key) {
            // remove 'rows' key from $settings
            if ($key == "rows") {
                $value = '';
            }

            // implode standard arrays
            if (is_array($value) && $value === array_values($value)) {
                $value = implode(',', $value);
            }

            // convert json strings to objects to prevent encoding
            if (is_string($value)) {
                // decode string
                $val = json_decode($value);

                // valid json
                if ($val) {
                    $value = $val;
                }
            }

            // convert stringified booleans to booleans
            if (is_string($value) && $value == 'true') {
                $value = true;
            }

            if (is_string($value) && $value == 'false') {
                $value = false;
            }
        });

        // Remove empty values
        $settings = array_filter($settings, function ($value) {
            return $value !== '';
        });

        return $settings;
    }

    public function render($settings)
    {
        // get an editor instance
        $wf = WFApplication::getInstance();

        // encode as json string
        $tinymce = json_encode($settings, JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES);

        $this->addScriptDeclaration("try{WfEditor.init(" . $tinymce . ");}catch(e){console.debug(e);}");

        if (is_object($this->profile)) {
            if ($wf->getParam('editor.callback_file')) {
                $this->addScript(JURI::root(true) . '/' . $wf->getParam('editor.callback_file'));
            }
            // add callback file if exists
            if (is_file(JPATH_SITE . '/media/jce/js/editor.js')) {
                $this->addScript(JURI::root(true) . '/media/jce/js/editor.js');
            }

            // add custom editor.css if exists
            if (is_file(JPATH_SITE . '/media/jce/css/editor.css')) {
                $this->addStyleSheet(JURI::root(true) . '/media/jce/css/editor.css');
            }
        }
    }

    private function getOutput()
    {
        $document = JFactory::getDocument();

        $end = $document->_getLineEnd();
        $tab = $document->_getTab();

        $version = self::getVersion();

        $output = '';

        foreach ($this->stylesheets as $stylesheet) {

            // don't add hash to dynamic php url
            if (strpos($stylesheet, 'index.php') === false) {
                $version = md5(basename($stylesheet) . $version);

                if (strpos($stylesheet, '?') === false) {
                    $stylesheet .= '?' . $version;
                } else {
                    $stylesheet .= '&' . $version;
                }
            }

            $output .= $tab . '<link rel="stylesheet" href="' . $stylesheet . '" type="text/css" />' . $end;
        }

        foreach ($this->scripts as $script) {

            // don't add hash to dynamic php url
            if (strpos($script, 'index.php') === false) {
                $version = md5(basename($script) . $version);

                if (strpos($script, '?') === false) {
                    $script .= '?' . $version;
                } else {
                    $script .= '&' . $version;
                }
            }
            $output .= $tab . '<script data-cfasync="false" type="text/javascript" src="' . $script . '" defer></script>' . $end;
        }

        foreach ($this->javascript as $script) {
            $output .= $tab . '<script data-cfasync="false" type="text/javascript">' . $script . '</script>' . $end;
        }

        foreach ($this->styles as $style) {
            $output .= $tab . '<style type="text/css">' . $style . '</style>' . $end;
        }

        return $output;
    }

    /**
     * Get the current version from the editor manifest.
     *
     * @return Version
     */
    private static function getVersion()
    {
        return WF_VERSION;
    }

    /**
     * Check if an icon already exists in a toolbar row
     *
     * @param [Array] $rows
     * @param [Mixed] $icon
     * @return Boolean
     */
    private function rowHasIcon($rows, $icon)
    {
        $found = false;

        foreach ($rows as $key => $row) {
            if (in_array($icon, $row)) {
                $found = true;
                break;
            }
        }

        return $found;
    }

    /**
     * Return a list of icons for each JCE editor row.
     *
     * @param string  The number of rows
     *
     * @return The row array
     */
    private function getToolbar()
    {
        $wf = WFApplication::getInstance();
        $rows = array('theme_buttons1' => array(), 'theme_buttons2' => array(), 'theme_buttons3' => array());

        // we need a profile object and some defined rows
        if (!is_object($this->profile) || empty($this->profile->rows)) {
            return $rows;
        }

        // get plugins
        $plugins = JcePluginsHelper::getPlugins();

        // get core commands
        $commands = JcePluginsHelper::getCommands();

        // merge plugins and commands
        $icons = array_merge($commands, $plugins);

        // create an array of rows
        $lists = explode(';', $this->profile->rows);

        // backwards compatability map
        $map = array(
            'paste' => 'clipboard',
            'spacer' => '|',
            'forecolor' => 'fontcolor',
            'backcolor' => 'backcolor',
        );

        $x = 0;

        for ($i = 1; $i <= count($lists); ++$i) {
            $buttons = array();
            $items = explode(',', $lists[$x]);

            // map legacy values etc.
            array_walk($items, function (&$item) use ($map) {
                if (array_key_exists($item, $map)) {
                    $item = $map[$item];
                }
            });

            // remove duplicates
            $items = array_unique($items);

            foreach ($items as $item) {
                // set the plugin/command name
                $name = $item;

                // check if button should be in toolbar
                if ($item !== '|') {
                    if (array_key_exists($item, $icons) === false) {
                        continue;
                    }

                    // assign icon
                    $item = $icons[$item]->icon;
                }

                // check for custom plugin buttons
                if (array_key_exists($name, $plugins)) {
                    $custom = $wf->getParam($name . '.buttons');

                    if (!empty($custom)) {
                        $custom = array_filter((array) $custom);

                        if (empty($custom)) {
                            $item = '';
                        } else {
                            $a = array();

                            foreach (explode(',', $item) as $s) {
                                if (in_array($s, $custom) || $s == '|') {
                                    $a[] = $s;
                                }
                            }

                            $item = implode(',', $a);

                            // remove leading or trailing |
                            $item = trim($item, '|');
                        }
                    }
                }

                if (!empty($item)) {
                    // remove double spacer
                    $item = preg_replace('#(\|,)+#', '|,', $item);

                    if ($this->rowHasIcon($rows, $item)) {
                        continue;
                    }

                    $buttons[] = $item;
                }
            }

            if (!empty($buttons)) {
                $rows['theme_buttons' . $i] = $buttons;
            }

            ++$x;
        }

        return $rows;
    }

    /**
     * Get dependencies for each plugin from its config.php file.
     *
     * @param string $plugin Plugin name
     * @param string $path   Optional pah to plugin folder
     *
     * @return mixed Array of dependencies or false
     */
    protected static function getDependencies($plugin, $path)
    {
        $file = $path . '/' . $plugin . '/config.php';

        // check if plugin has a config file
        if (is_file($file)) {
            include_once $file;
            // create className
            $classname = 'WF' . ucwords($plugin, '_') . 'PluginConfig';

            if (method_exists($classname, 'getDependencies')) {
                return (array) $classname::getDependencies();
            }
        }

        return false;
    }

    /**
     * Add dependencies for each plugin to the main plugins array.
     *
     * @param array  $items Array of plugin names
     * @param string $path  Optional path to check, defaults to TinyMCE plugin path
     */
    protected static function addDependencies(&$items, $path = '')
    {
        // set default path
        if (empty($path)) {
            $path = WF_EDITOR_PLUGINS;
        }

        $x = count($items);

        // loop backwards through items
        while ($x--) {
            // get dependencies for each item
            $dependencies = self::getDependencies($items[$x], $path);

            if (!empty($dependencies)) {
                foreach ($dependencies as $dependency) {
                    // add to beginning of items
                    array_unshift($items, $dependency);
                }
            }
        }
    }

    /**
     * Determine whether the editor has a profile assigned
     *
     * @return boolean
     */
    public function hasProfile()
    {
        return is_object($this->profile);
    }

    /**
     * Determine whether a plugin is loaded
     *
     * @param [string] $name
     * @return boolean
     */
    public function hasPlugin($name)
    {
        $plugins = $this->getPlugins();

        if (in_array($name, $plugins['core'])) {
            return true;
        }

        if (!empty($plugins['external'])) {
            if (array_key_exists($name, $plugins['external'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Return a list of published JCE plugins.
     *
     * @return string list
     */
    public function getPlugins()
    {
        static $plugins;

        $wf = WFApplication::getInstance();

        if (is_object($this->profile)) {
            if (!is_array($plugins)) {
                // get plugin items from profile
                $items = explode(',', $this->profile->plugins);

                // get core and installed plugins list
                $list = JcePluginsHelper::getPlugins();

                // check that the plugin is available
                $items = array_filter($items, function ($item) use ($list) {
                    return in_array($item, array_keys($list));
                });

                // add advlists plugin if lists are loaded
                if (in_array('lists', $items)) {
                    $items[] = 'advlist';
                }

                // Load wordcount if path is enabled
                if ($wf->getParam('editor.path', 1)) {
                    $items[] = 'wordcount';
                }

                // reset index
                $items = array_values($items);

                // add plugin dependencies
                self::addDependencies($items);

                // add core plugins
                $items = array_merge(self::$plugins, $items);

                // remove duplicates and empty values
                $items = array_unique(array_filter($items));

                // create plugins array
                $plugins = array('core' => array(), 'external' => array());

                // check installed plugins are valid
                foreach ($list as $name => $attribs) {
                    // skip core plugins
                    if ($attribs->core) {
                        continue;
                    }

                    // find plugin key in plugins list
                    $pos = array_search($name, $items);

                    // check it is in profile plugin list
                    if ($pos === false) {
                        continue;
                    }

                    // remove from items array
                    unset($items[$pos]);

                    // reset index
                    $items = array_values($items);

                    // add to array
                    $plugins['external'][$name] = JURI::root(true) . '/' . $attribs->url . '/editor_plugin.js';
                }

                // remove missing plugins
                $items = array_filter($items, function ($item) {
                    if (WF_EDITOR_PRO && $item == 'branding') {
                        return false;
                    }

                    return is_file(WF_EDITOR_PLUGINS . '/' . $item . '/editor_plugin.js');
                });

                // update core plugins
                $plugins['core'] = $items;
            }
        }

        return $plugins;
    }

    /**
     * Get all loaded plugins config options.
     *
     * @param array $settings passed by reference
     */
    private function getPluginConfig(&$settings)
    {
        $core = (array) $settings['plugins'];
        $items = array();

        // Core plugins
        foreach ($core as $plugin) {
            $file = WF_EDITOR_PLUGINS . '/' . $plugin . '/config.php';

            if (is_file($file)) {
                require_once $file;
                // add plugin name to array
                $items[] = $plugin;
            }
        }

        // Installed plugins
        if (array_key_exists('external_plugins', $settings)) {
            $installed = (array) $settings['external_plugins'];

            foreach ($installed as $plugin => $path) {
                $path = dirname($path);
                $root = JURI::root(true);

                if (empty($root)) {
                    $path = WFUtility::makePath(JPATH_SITE, $path);
                } else {
                    $path = str_replace($root, JPATH_SITE, $path);
                }

                $file = $path . '/config.php';

                // try legacy path...
                if (!is_file($file)) {
                    $file = $path . '/classes/config.php';
                }

                if (is_file($file)) {
                    require_once $file;
                    // add plugin name to array
                    $items[] = $plugin;
                }
            }
        }

        $delim = array('-', '_');

        // loop through list and create/call method
        foreach ($items as $plugin) {
            $name = str_replace($delim, ' ', $plugin);

            // Create class name
            $classname = 'WF' . ucwords($name) . 'PluginConfig';

            // remove space
            $classname = str_replace(' ', '', $classname);

            // Check class and method are callable, and call
            if (class_exists($classname) && method_exists($classname, 'getConfig')) {
                call_user_func_array(array($classname, 'getConfig'), array(&$settings));
            }
        }
    }

    /**
     * Remove keys from an array.
     */
    public function removeKeys(&$array, $keys)
    {
        if (!is_array($keys)) {
            $keys = array($keys);
        }

        $array = array_diff($array, $keys);
    }

    /**
     * Add keys to an array.
     *
     * @return The string list with added key or the key
     *
     * @param string  The array
     * @param string  The keys to add
     */
    public function addKeys(&$array, $keys)
    {
        if (!is_array($keys)) {
            $keys = array($keys);
        }
        $array = array_unique(array_merge($array, $keys));
    }

    /**
     * Get a list of editor font families.
     *
     * @return string font family list
     *
     * @param string $add    Font family to add
     * @param string $remove Font family to remove
     *
     * Deprecated in 2.3.4
     */
    public function getEditorFonts()
    {
        return '';
    }

    /**
     * Return the current site template name.
     */
    private static function getSiteTemplates()
    {
        $db = JFactory::getDBO();
        $app = JFactory::getApplication();
        $id = 0;

        // only process when front-end editing
        if ($app->getClientId() == 0) {
            $menus = $app->getMenu();
            $menu = $menus->getActive();

            if ($menu) {
                $id = isset($menu->template_style_id) ? $menu->template_style_id : $menu->id;
            }
        }

        $query = $db->getQuery(true);
        $query->select('id, template AS name, params, home')->from('#__template_styles')->where(array('client_id = 0'));

        $db->setQuery($query);
        $templates = $db->loadObjectList();

        $assigned = array();

        foreach ($templates as $template) {
            // default template
            if ((string) $template->home == '1') {
                $assigned[] = $template;
                continue;
            }

            // assigned template
            if ($id == $template->id) {
                array_unshift($assigned, $template);
            }
        }

        // return templates
        return $assigned;
    }

    private static function isEditorStylesheet($path)
    {
        // check for editor.css file and return first one found
        $file = $path . '/editor.css';

        // editor.css only contains basic styles...
        if (preg_match('#\/cassiopeia\/#', $path)) {
            return false;
        }

        if (is_file($file) && filesize($file) > 0) {
            return $file;
        }

        return false;
    }

    private static function getTemplateStyleSheetsList($absolute = false)
    {
        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        // set default url as empty value
        $url = '';
        // set default template as empty value
        $template = (object) array('name' => '');
        // use editor default styles
        $styles = '';
        // stylesheets
        $stylesheets = array();
        // files
        $files = array();

        // get templates
        $templates = self::getSiteTemplates();

        foreach ($templates as $item) {
            // Template CSS
            $path = JPATH_SITE . '/templates/' . $item->name;

            // get the first path that exists
            if (is_dir($path)) {
                // assign template
                $template = $item;
                break;
            }
        }

        require_once WF_EDITOR_CLASSES . '/editor.php';

        $wf = WFApplication::getInstance();

        $global = intval($wf->getParam('editor.content_css', 1));
        $profile = intval($wf->getParam('editor.profile_content_css', 2));

        switch ($global) {
            // Custom template css files
            case 0:
                // use getParam so result is cleaned
                $global_custom = $wf->getParam('editor.content_css_custom', '');

                if (is_string($global_custom)) {
                    $global_custom = explode(',', $global_custom);
                }

                foreach ($global_custom as $tmp) {
                    $tmp = trim($tmp);

                    if (empty($tmp)) {
                        continue;
                    }

                    // external url
                    if (strpos($tmp, '://') !== false) {
                        $files[] = $tmp;
                        continue;
                    }

                    // clean slashes
                    $tmp = preg_replace('#[/\\\\]+#', '/', $tmp);

                    // Replace $template variable with site template name
                    $tmp = str_replace('$template', $template->name, $tmp);

                    $file = JPATH_SITE . '/' . $tmp;
                    $list = array();

                    // check if path is a file
                    if (is_file($file)) {
                        $list[] = $file;
                        // find files using pattern
                    } else {
                        $list = glob($file);
                    }

                    if (!empty($list)) {
                        foreach ($list as $item) {
                            if (is_file($item) && preg_match('#\.(css|less)$#', $item)) {
                                $files[] = substr($item, strlen(JPATH_SITE) + 1);
                            }
                        }
                    }
                }

                break;
            // Template css (template.css or template_css.css)
            case 1:
                $files = array();

                $path = JPATH_SITE . '/templates/' . $template->name;

                // check editor.css file first
                $file = self::isEditorStylesheet($path . '/css');

                if ($file) {
                    $files[] = 'templates/' . $template->name . '/css/editor.css';
                } else {
                    JFactory::getApplication()->triggerEvent('onWfGetTemplateStylesheets', array(&$files, $template));
                }

                // clean up $files array
                $files = array_unique(array_filter($files));

                break;
            // Nothing, use editor default
            case 2:
                break;
        }

        switch ($profile) {
            // add to global config value
            case 0:
            case 1:
                $profile_custom = $wf->getParam('editor.profile_content_css_custom', '');

                if (is_string($profile_custom)) {
                    $profile_custom = explode(',', $profile_custom);
                }

                $custom = array();

                foreach ($profile_custom as $tmp) {
                    $tmp = trim($tmp);

                    if (empty($tmp)) {
                        continue;
                    }

                    // external url
                    if (strpos($tmp, '://') !== false) {
                        $custom[] = $tmp;
                        continue;
                    }

                    // clean slashes
                    $tmp = preg_replace('#[/\\\\]+#', '/', $tmp);

                    // Replace $template variable with site template name (defaults to 'system')
                    $tmp = str_replace('$template', $template->name, $tmp);

                    $list = array();

                    $file = JPATH_SITE . '/' . $tmp;

                    // check if path is a file
                    if (is_file($file)) {
                        $list[] = $file;
                        // find files using pattern
                    } else {
                        $list = glob($file);
                    }

                    if (!empty($list)) {
                        foreach ($list as $item) {
                            if (is_file($item) && preg_match('#\.(css|less)$#', $item)) {
                                $custom[] = substr($item, strlen(JPATH_SITE) + 1);
                            }
                        }
                    }
                }

                // add to existing list
                if ($profile === 0) {
                    $files = array_merge($files, $custom);
                    // overwrite global config value
                } else {
                    $files = (array) $custom;
                }
                break;
            // inherit global config value
            case 2:
                break;
        }

        // remove duplicates
        $files = array_unique(array_filter($files));

        // get the root directory
        $root = $absolute ? JPATH_SITE : JURI::root(true);

        // check for existence of each file and make array of stylesheets
        foreach ($files as $file) {
            if (empty($file)) {
                continue;
            }

            // full path
            if (strpos($file, '://') !== false) {
                $stylesheets[] = $file;
                continue;
            }

            // remove leading slash
            $file = ltrim($file, '/');

            $fullpath = JPATH_SITE . '/' . $file;

            if (JFile::exists($fullpath)) {
                // less
                if (pathinfo($file, PATHINFO_EXTENSION) == 'less') {
                    $stylesheets[] = $fullpath;
                    continue;
                }

                $stylesheets[] = $root . '/' . $file;
            }
        }

        // remove duplicates
        $stylesheets = array_unique(array_filter($stylesheets));

        return $stylesheets;
    }

    /**
     * Get an array of stylesheets used by the editor.
     * References the WFEditor class.
     * If the list contains any LESS stylesheets, the list is returned as a URL to compile.
     *
     * @return string
     */
    public static function getTemplateStyleSheets()
    {
        $stylesheets = self::getTemplateStyleSheetsList();

        // check for less files in the array
        $less = preg_grep('#\.less$#', $stylesheets);

        // process less files etc.
        if (!empty($less)) {
            // create token
            $token = JSession::getFormToken();
            $version = self::getVersion();

            return JURI::base(true) . '/index.php?option=com_jce&task=editor.compileless&' . $token . '=1';
        }

        return $stylesheets;
    }

    /**
     * Get the URL of the editor.
     *
     * @param bool $relative
     *
     * @return string
     */
    private function getURL($relative = false)
    {
        if ($relative) {
            return JURI::root(true) . '/components/com_jce/editor';
        }

        return JURI::root() . 'components/com_jce/editor';
    }

    /**
     * Pack / compress editor files.
     */
    public function pack()
    {
        require_once WF_EDITOR_CLASSES . '/packer.php';
        require_once WF_EDITOR_CLASSES . '/language.php';

        $wf = WFApplication::getInstance();
        $type = $wf->input->getWord('type', 'javascript');

        // javascript
        $packer = new WFPacker(array('type' => $type));

        $themes = 'none';
        $plugins = array();

        $suffix = $wf->input->getWord('suffix', '');

        // if a profile is set
        if ($this->profile) {
            $themes = 'advanced';
            $plugins = $this->getPlugins();
        }

        $themes = explode(',', $themes);

        // toolbar theme
        $toolbar = explode('.', $wf->getParam('editor.toolbar_theme', 'default'));

        // base skin value
        $skin = $toolbar[0];

        switch ($type) {
            case 'language':
                $files = array();

                $data = $this->loadLanguages(array(), array(), '(^dlg$|_dlg$)', true);
                $packer->setText($data);

                break;
            case 'javascript':
                $files = array();

                // add core file
                $files[] = WF_EDITOR . '/tiny_mce/tiny_mce' . $suffix . '.js';

                // Add themes in dev mode
                foreach ($themes as $theme) {
                    $files[] = WF_EDITOR . '/tiny_mce/themes/' . $theme . '/editor_template' . $suffix . '.js';
                }

                // Add core plugins
                foreach ($plugins['core'] as $plugin) {
                    if (in_array($plugin, self::$plugins)) {
                        continue;
                    }

                    $files[] = WF_EDITOR_PLUGINS . '/' . $plugin . '/editor_plugin' . $suffix . '.js';
                }

                // add external plugins
                foreach ($plugins['external'] as $plugin => $path) {
                    $files[] = JPATH_SITE . '/plugins/jce/editor-' . $plugin . '/editor_plugin' . $suffix . '.js';
                }

                // add Editor file
                $files[] = WF_EDITOR . '/libraries/js/editor.min.js';

                break;
            case 'css':
                $slot = $wf->input->getCmd('slot', 'editor');

                if ($slot == 'content') {
                    $files = array();

                    $files[] = WF_EDITOR_THEMES . '/' . $themes[0] . '/skins/' . $skin . '/content.css';

                    // get template stylesheets
                    $styles = self::getTemplateStyleSheetsList(true);

                    foreach ($styles as $style) {
                        if (JFile::exists($style)) {
                            $files[] = $style;
                        }
                    }

                    // Add core plugins
                    foreach ($plugins['core'] as $plugin) {
                        $content = WF_EDITOR_PLUGINS . '/' . $plugin . '/css/content.css';

                        if (JFile::exists($content)) {
                            $files[] = $content;
                        }
                    }

                    // add external plugins
                    foreach ($plugins['external'] as $plugin => $path) {
                        $content = JPATH_SITE . '/plugins/jce/editor-' . $plugin . '/css/content.css';

                        if (JFile::exists($content)) {
                            $files[] = $content;
                        }
                    }
                } elseif ($slot == 'preview') {
                    $files = array();
                    $files[] = WF_EDITOR_PLUGINS . '/preview/css/preview.css';
                    // get template stylesheets
                    $styles = self::getTemplateStyleSheetsList(true);
                    foreach ($styles as $style) {
                        if (JFile::exists($style)) {
                            $files[] = $style;
                        }
                    }
                } else {
                    $files = array();

                    $files[] = WF_EDITOR_LIBRARIES . '/css/editor.min.css';

                    $variant = '';

                    if (count($toolbar) > 1) {
                        $variant = $toolbar[1];
                    }

                    // load 'default'
                    $files[] = WF_EDITOR_THEMES . '/' . $themes[0] . '/skins/default/ui.css';

                    if ($skin !== 'default') {
                        $files[] = WF_EDITOR_THEMES . '/' . $themes[0] . '/skins/' . $skin . '/ui.css';
                    }

                    if (isset($variant)) {
                        $files[] = WF_EDITOR_THEMES . '/' . $themes[0] . '/skins/' . $skin . '/ui_' . $variant . '.css';
                    }
                }

                break;
        }

        $cache_validation = (bool) $this->getParam('editor.compress_cache_validation', true);

        $packer->setFiles($files);
        $packer->pack(true, $cache_validation);
    }

    public function loadlanguages()
    {
        $parser = new WFLanguageParser(array('language' => $this->getLanguageTag(), 'plugins' => $this->getPlugins()));
        $data = $parser->load();
        $parser->output($data);
    }

    public function compileless()
    {
        $files = self::getTemplateStyleSheetsList(true);

        if (!empty($files)) {
            $packer = new WFPacker(array('files' => $files, 'type' => 'css'));
            $packer->pack(false);
        }
    }

    public function getToken($id)
    {
        return '<input type="hidden" name="' . JSession::getFormToken() . '" value="1" />';
    }

    /**
     * Proxy function for legacy compatablity with 3rd party extensions that access the API directly
     *
     * @param string $key
     * @param string $fallback
     * @param string $default
     * @param string $type
     * @param boolean $allowempty
     * @return void
     */
    public function getParam($key, $fallback = '', $default = '', $type = 'string', $allowempty = true)
    {
        $wf = WFApplication::getInstance();
        return $wf->getParam($key, $fallback, $default, $type, $allowempty);
    }
}
