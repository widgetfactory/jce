<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Editor;

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\LanguageFactoryInterface;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Uri\Uri;
use Joomla\Component\Jce\Administrator\Helper\PluginsHelper;
use Joomla\Database\DatabaseInterface;
use Joomla\Event\Event;
use Joomla\Filesystem\Path;

class Editor
{
    // Editor instance
    protected static $instances;

    /**
     * Application instance.
     *
     * @var \Wfe\Application\Application
     */
    protected $application;

    /**
     * Database connection.
     *
     * @var DatabaseInterface
     */
    protected $db;

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
     * Array of script options.
     *
     * @var array
     */
    private $scriptOptions = array();

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

    private function addScript($url, $name)
    {
        $url = $this->addAssetVersion($url);
        $this->scripts[$url] = $name;
    }

    private function addStyleSheet($url, $name)
    {
        $url = $this->addAssetVersion($url);
        $this->stylesheets[$url] = $name;
    }

    private function addScriptDeclaration($text)
    {
        $this->javascript[] = $text;
    }

    private function addScriptOptions($text)
    {
        $this->scriptOptions[] = $text;
    }

    /**
     * @return array
     */
    public function getScripts()
    {
        return $this->scripts;
    }

    /**
     * @return array
     */
    public function getStyleSheets()
    {
        return $this->stylesheets;
    }

    /**
     * @return array
     */
    public function getScriptDeclaration()
    {
        return $this->javascript;
    }

    /**
     * @return array
     */
    public function getScriptOptions()
    {
        return $this->scriptOptions;
    }

    protected function setDatabase($db)
    {
        $this->db = $db;
    }

    /**
     * @param array $config Optional configuration array (e.g. 'plugin' key)
     */
    public function __construct($config = array())
    {
        $this->application = \Wfe\Factory::getApplication();

        if (!isset($config['plugin'])) {
            $config['plugin'] = '';
        }

        $event = new Event('onWfEditorBeforeLoad', array(
            'config' => $config,
            'subject' => $this,
        ));

        Factory::getApplication()->getDispatcher()->dispatch('onWfEditorBeforeLoad', $event);
        $config = $event->getArgument('config');

        // set profile from "default"
        $this->profile = $this->application->getActiveProfile($config);

        // set context
        $this->context = $this->application->getContext();
    }

    private function addAssetVersion($url)
    {
        $version = $this->getVersion();
        $version = md5($version);

        if (strpos($url, '?') === false) {
            $url .= '?' . $version;
        } else {
            $url .= '&' . $version;
        }

        return $url;
    }

    /**
     * Set up the editor — builds settings and enqueues assets.
     *
     * @param bool $autoInit Automatically initialize the editor
     * @return static
     */
    public function setup($autoInit = true)
    {
        if ($this->initialized) {
            return $this;
        }

        $this->initialized = true;

        $settings = $this->getSettings();

        $event = new Event('onWfEditorBeforeRender', array(
            'settings' => $settings,
            'subject' => $this,
        ));

        Factory::getApplication()->getDispatcher()->dispatch('onWfEditorBeforeRender', $event);
        $settings = $event->getArgument('settings');

        $this->render($settings, $autoInit);

        return $this;
    }

    /**
     * Legacy function to build the editor.
     *
     * @return void
     */
    public function buildEditor()
    {
        $this->setup()->getOutput();
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
        $wf = $this->application;

        $config = Factory::getApplication()->getConfig();

        // check for joomla debug mode
        $debug = $config->get('debug');

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
        $wf = $this->application;

        // assign skin - new default is "modern"
        $settings['skin'] = $wf->getParam('editor.toolbar_theme', 'modern');

        if (empty($settings['skin'])) {
            $settings['skin'] = 'modern';
        }


        if (strpos($settings['skin'], '.') !== false) {
            list($settings['skin'], $settings['skin_variant']) = explode('.', $settings['skin']);

            if (!preg_match('#^[a-z0-9_-]+$#i', $settings['skin_variant'])) {
                unset($settings['skin_variant']);
            }
        }

        // classic has been removed
        if ($settings['skin'] == 'classic') {
            $settings['skin'] = 'default';
        }

        if ($settings['skin'] == 'o2k7') {
            $settings['skin'] = 'office';
        }

        if ($settings['skin'] == 'mobile') {
            $settings['skin'] = 'modern';
            $settings['skin_variant'] = 'touch';
        }
    }

    /**
     * Process and assign custom configuration variables.
     *
     * @param array $settings Settings array passed by reference
     * @return void
     */
    private function getCustomConfig(&$settings)
    {
        // get an editor instance
        $wf = $this->application;

        // Other - user specified
        $userParams = $wf->getParam('editor.custom_config', '');

        if ($userParams) {
            // legacy format, eg: key:value;key:value
            if (!\Wfe\Helper\StringHelper::isJson($userParams)) {
                $userParams = explode(';', $userParams);
            } else {
                $userParams = json_decode($userParams, true);
            }

            // Remove values with invalid key, must be indexed array
            $userParams = array_filter($userParams, function ($value, $key) {
                return is_numeric($key) && $value != "";
            }, ARRAY_FILTER_USE_BOTH);

            foreach ($userParams as $userParam) {
                if (empty($userParam)) {
                    continue;
                }

                $name = '';
                $value = '';

                // legacy string
                if (is_string($userParam) && strpos($userParam, ':') !== false) {
                    list($name, $value) = explode(':', $userParam, 2);
                }

                // json associative array
                if (is_array($userParam) && array_key_exists('name', $userParam)) {
                    $name = $userParam['name'];
                    $value = $userParam['value'] ?? '';
                }

                if ($name && $value !== '') {
                    // key must be a plain identifier — no path chars, no dots, no spaces
                    if (!preg_match('#^[a-z_][a-z0-9_]*$#i', $name)) {
                        continue;
                    }

                    // value must be a simple scalar (bool, int, float, string) — no arrays or objects
                    if (!is_scalar($value)) {
                        continue;
                    }

                    // convert to boolean before trimming, while type is still intact
                    if (is_bool($value)) {
                        $value = (bool) $value;
                    } else {
                        $value = trim($value, " \t\n\r\0\x0B'\"");
                        $value = (string) preg_replace('#[^A-Z0-9_\.-]#i', '', $value);
                    }

                    $settings[$name] = $value;
                }
            }
        }
    }

    private function isSkinRtl()
    {
        $app = Factory::getApplication();
        $language = $app->getLanguage();

        if ($language->getTag() === \Wfe\Language\Language::getTag()) {
            return $language->isRTL();
        }

        return false;
    }

    private function getLanguageDirection()
    {
        $app = Factory::getApplication();

        $user = $app->getIdentity();
        $params = ComponentHelper::getParams('com_languages');
        $locale = $user->getParam('language', $params->get('site', 'en-GB'));

        $language = Factory::getContainer()->get(LanguageFactoryInterface::class)->createLanguage($locale);

        return $language->isRTL() ? 'rtl' : 'ltr';
    }

    protected function getLanguageCode()
    {
        return \Wfe\Language\Language::getCode();
    }

    protected function getLanguageTag()
    {
        return \Wfe\Language\Language::getTag();
    }

    /**
     * Build and return the full editor settings array.
     *
     * @return array
     */
    public function getSettings()
    {
        $app = Factory::getApplication();

        // get an editor instance
        $wf = $this->application;

        // create token
        $token = Session::getFormToken();

        $settings = array(
            'token' => $token,
            'base_url' => Uri::root(),
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
            $settings = array_merge($settings, array('theme' => 'core'), $this->getToolbar());

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
            $stylesheets = (array) $this->getTemplateStyleSheets();

            // set stylesheets as string
            $settings['content_css'] = implode(',', $stylesheets);

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

            // get compression options
            $settings['compress'] = $this->getCompressionOptions();
        } else {
            $settings['readonly'] = true;

            // the compression endpoint requires a valid profile
            $settings['compress'] = array('javascript' => 0, 'css' => 0);
        }

        // set css compression
        if ($settings['compress']['css']) {
            $this->addStyleSheet(Uri::base(true) . '/index.php?option=com_jce&task=editor.pack&type=css&' . http_build_query((array) $settings['query']), 'editor.pack');
        } else {
            // CSS
            $this->addStyleSheet($this->getURL(true) . '/css/editor.min.css', 'editor.core');

            // load default skin
            $this->addStyleSheet($this->getURL(true) . '/ibis/themes/core/skins/default/ui.css', 'editor.skin.default');

            // load other skin
            if ($settings['skin'] != 'default') {
                $this->addStyleSheet($this->getURL(true) . '/ibis/themes/core/skins/' . $settings['skin'] . '/ui.css', 'editor.skin.' . $settings['skin']);
            }

            // load variant
            if (isset($settings['skin_variant'])) {
                $this->addStyleSheet($this->getURL(true) . '/ibis/themes/core/skins/' . $settings['skin'] . '/ui.' . $settings['skin_variant'] . '.css', 'editor.skin.' . $settings['skin'] . '.' . $settings['skin_variant']);
            }
        }

        if ($this->isSkinRtl()) {
            $settings['skin_directionality'] = 'rtl';
        }

        $event = new Event('onWfEditorBeforeSettings', array(
            'settings' => $settings,
            'subject' => $this,
        ));

        $app->getDispatcher()->dispatch('onWfEditorBeforeSettings', $event);

        $settings = $event->getArgument('settings');

        // add module
        $this->addScript($this->getURL(true) . '/js/editor.module.js', 'editor.module');

        // set javascript compression script
        if ($settings['compress']['javascript']) {
            $this->addScript(Uri::base(true) . '/index.php?option=com_jce&task=editor.pack&' . http_build_query((array) $settings['query']), 'editor.pack');
        } else {
            // Tinymce
            $this->addScript($this->getURL(true) . '/ibis/ibis.js', 'editor.ibis');

            // Editor
            $this->addScript($this->getURL(true) . '/js/editor.min.js', 'editor.core');
        }

        // language - the endpoint requires a valid profile
        if (is_object($this->profile)) {
            $this->addScript(Uri::base(true) . '/index.php?option=com_jce&task=editor.loadlanguages&lang=' . $settings['language'] . '&' . http_build_query((array) $settings['query']), 'editor.language');
        }

        $this->getCustomConfig($settings);

        // remove rows key - only used internally to pass row data to plugin config
        unset($settings['rows']);

        // process settings
        array_walk($settings, function (&$value) {
            // implode standard arrays
            if (is_array($value) && $value === array_values($value)) {
                $value = implode(',', $value);
            }

            // convert json strings to objects to prevent double-encoding
            if (is_string($value)) {
                $val = json_decode($value);

                if (json_last_error() === JSON_ERROR_NONE) {
                    $value = $val;
                }
            }

            // convert stringified booleans to booleans
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

    /**
     * Enqueue editor scripts and inline init call.
     *
     * @param array $settings  Editor settings
     * @param bool  $autoInit  Whether to emit an inline WfEditor.init() call
     * @return void
     */
    public function render($settings, $autoInit = true)
    {
        // get an editor instance
        $wf = $this->application;

        if ($autoInit) {
            // encode as json string
            $ibis = json_encode($settings, JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES);

            $this->addScriptDeclaration("try{WfEditor.init(" . $ibis . ");}catch(e){console.debug(e);}");
        } else {
            $this->addScriptOptions($settings);
        }

        if (is_object($this->profile)) {
            // add callback file if exists
            if (is_file(JPATH_SITE . '/media/jce/js/editor.js')) {
                $this->addScript(Uri::root(true) . '/media/jce/js/editor.js', 'editor.custom');
            }

            // add custom editor.css if exists
            if (is_file(JPATH_SITE . '/media/jce/css/editor.css')) {
                $this->addStyleSheet(Uri::root(true) . '/media/jce/css/editor.css', 'editor.custom');
            }
        }
    }

    private function getOutput()
    {
        $app = Factory::getApplication();
        $document = $app->getDocument();

        $end = $document->_getLineEnd();
        $tab = $document->_getTab();

        $version = $this->getVersion();

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

            $output .= $tab . '<link rel="stylesheet" href="' . htmlspecialchars($stylesheet, ENT_QUOTES, 'UTF-8') . '" type="text/css" />' . $end;
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
            $output .= $tab . '<script data-cfasync="false" type="text/javascript" src="' . htmlspecialchars($script, ENT_QUOTES, 'UTF-8') . '" defer></script>' . $end;
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
     * @return string
     */
    private function getVersion()
    {
        return WF_VERSION;
    }

    /**
     * Check if an icon already exists in a toolbar row.
     *
     * @param array $rows
     * @param mixed $icon
     * @return bool
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

    protected function mapLegacyPluginName($name)
    {
        $app = Factory::getApplication();

        $event = new Event('onWfEditorMapLegacyPluginName', array(
            'name' => $name,
            'subject' => $this,
        ));

        $app->getDispatcher()->dispatch('onWfEditorMapLegacyPluginName', $event);
        $name = $event->getArgument('name');

        return $name;
    }

    /**
     * Return a list of icons for each JCE editor toolbar row.
     *
     * @return array
     */
    private function getToolbar()
    {
        $wf = $this->application;

        $rows = array(
            'theme_buttons1' => array(),
            'theme_buttons2' => array(),
            'theme_buttons3' => array()
        );

        // we need a profile object and some defined rows
        if (!is_object($this->profile) || empty($this->profile->rows)) {
            return $rows;
        }

        // get plugins
        $plugins = PluginsHelper::getEditorPlugins();

        // get core commands
        $commands = PluginsHelper::getCommands();

        // merge plugins and commands
        $icons = array_merge($commands, $plugins);

        // create an array of rows
        $lists = explode(';', $this->profile->rows);

        $x = 0;

        for ($i = 1; $i <= count($lists); ++$i) {
            $buttons = array();
            $items = explode(',', $lists[$x]);

            // map legacy values etc.
            array_walk($items, function (&$item) {
                $item = $this->mapLegacyPluginName($item);
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
     * Determine whether the editor has a profile assigned
     *
     * @return boolean
     */
    public function hasProfile()
    {
        return is_object($this->profile);
    }

    /**
     * Determine whether a plugin is loaded.
     *
     * @param string $name
     * @return bool
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
     * @return array List of plugins by type, eg: core, external
     */
    public function getPlugins()
    {
        static $plugins;

        $wf = $this->application;

        if (is_object($this->profile)) {
            if (!is_array($plugins)) {
                // get plugin items from profile
                $items = explode(',', $this->profile->plugins);

                // get core and installed plugins list
                $list = PluginsHelper::getEditorPlugins();

                // add advlists plugin if lists are loaded
                if (in_array('lists', $items)) {
                    $items[] = 'advlist';
                }

                // Load wordcount if enabled
                if ($wf->getParam('editor.wordcount', 1)) {
                    $items[] = 'wordcount';
                }

                // reset index
                $items = array_values($items);

                // add core plugins
                $items = array_merge(self::$plugins, $items);

                // remove duplicates and empty values
                $items = array_unique(array_filter($items));

                // create plugins array
                $plugins = array('core' => array(), 'external' => array());

                // check installed plugins are valid
                foreach ($list as $name => $attribs) {
                    if (empty($name)) {
                        continue;
                    }

                    // find plugin key in plugins list
                    $pos = array_search($name, $items);

                    // check it is in profile plugin list
                    if ($pos === false) {
                        continue;
                    }

                    // skip core plugins
                    if ($attribs->core) {
                        continue;
                    }

                    // remove from items array
                    unset($items[$pos]);

                    // reset index
                    $items = array_values($items);

                    $plugins['external'][$name] = Uri::root(true) . '/' . $attribs->url . '/plugin.js';
                }

                // remove missing plugins
                $items = array_filter($items, function ($item) {
                    return is_file(WF_EDITOR_MEDIA . '/ibis/plugins/' . $item . '/plugin.js');
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
     * @param array $settings Settings array passed by reference
     * @return void
     */
    private function getPluginConfig(&$settings)
    {
        $app = Factory::getApplication();

        $core = (array) $settings['plugins'];
        $items = array();

        // Core plugins
        foreach ($core as $plugin) {
            $file = WF_EDITOR_PLUGINS . '/' . ucfirst($plugin) . '/Config.php';

            $file = Path::clean($file);

            if (is_file($file)) {
                // add plugin name to array
                $items[$plugin] = $file;
            }
        }

        // Installed plugins
        if (array_key_exists('external_plugins', $settings)) {
            $installed = (array) $settings['external_plugins'];

            foreach ($installed as $plugin => $path) {
                $file = Path::find(array(
                    // new path
                    JPATH_PLUGINS . '/jce/editor_' . $plugin,
                    // old path
                    JPATH_PLUGINS . '/jce/editor-' . $plugin,
                    // legacy path
                    JPATH_PLUGINS . '/jce/editor-' . $plugin . '/classes',
                ), 'config.php');

                if ($file) {
                    // add plugin name to array
                    $items[$plugin] = $file;
                }
            }
        }

        $event = new Event('onWfEditorBeforePluginConfig', array(
            'settings' => $settings,
            'items' => $items,
            'subject' => $this,
        ));

        $app->getDispatcher()->dispatch('onBeforeWfEditorPluginConfig', $event);
        $items = $event->getArgument('items');
        $settings = $event->getArgument('settings');

        $delim = array('-', '_');

        // loop through list and create/call method
        foreach ($items as $plugin => $item) {
            $name = str_replace($delim, ' ', $plugin);

            if (!is_array($item)) {
                $item = array(
                    'path' => $item,
                    'namespace' => '\\Wfe\\Plugins\\Editor\\' . ucwords($name)
                );
            }

            // Create class name
            $classname = $item['namespace'] . '\\Config';

            // remove space
            $classname = str_replace(' ', '', $classname);

            require_once $item['path'];

            if (!class_exists($classname)) {
                // try legacy class name
                $classname = 'WF' . ucwords($name) . 'PluginConfig';
            }

            // Check class and method are callable, and call
            if (class_exists($classname) && method_exists($classname, 'getConfig')) {
                call_user_func_array(array($classname, 'getConfig'), array(&$settings, $this->application));
            }
        }
    }

    /**
     * Remove keys from an array.
     *
     * @param array        $array Array passed by reference
     * @param array|string $keys  Keys to remove
     * @return void
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
     * @param array        $array Array passed by reference
     * @param array|string $keys  Keys to add
     * @return void
     */
    public function addKeys(&$array, $keys)
    {
        if (!is_array($keys)) {
            $keys = array($keys);
        }
        $array = array_unique(array_merge($array, $keys));
    }

    /**
     * @deprecated 2.3.4
     * @return string
     */
    public function getEditorFonts()
    {
        return '';
    }

    /**
     * Return the active and default site template style objects.
     *
     * @return array
     */
    private function getSiteTemplates()
    {
        $db = Factory::getContainer()->get(DatabaseInterface::class);
        $app = Factory::getApplication();
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
        $query->select('*, template AS name')->from('#__template_styles')->where(array('client_id = 0'));

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

    /**
     * Check whether the named template provides a non-empty editor.css file.
     *
     * @param string $name Template name
     * @return string|false Relative path to editor.css, or false if not found
     */
    private function hasEditorStylesheet($name)
    {
        // editor.css file is not suitable
        if ($name == 'cassiopeia') {
            return false;
        }

        // search for editor.css file using Path
        $file = Path::find(array(
            JPATH_SITE . '/templates/' . $name . '/css',
            JPATH_SITE . '/media/templates/site/' . $name . '/css',
        ), 'editor.css');

        if ($file && filesize($file) > 0) {
            // make relative
            $file = str_replace(JPATH_SITE, '', $file);

            // remove leading slash
            $file = trim($file, '/');

            return $file;
        }

        return false;
    }

    /**
     * Build the list of template stylesheets based on global and profile settings.
     *
     * @param bool $absolute Return absolute filesystem paths instead of relative URLs
     * @return array
     */
    private function getTemplateStyleSheetsList($absolute = false)
    {
        $app = Factory::getApplication();
        $wf = $this->application;

        // set default template as empty value
        $template = (object) array('name' => '');
        // stylesheets
        $stylesheets = array();
        // files
        $files = array();

        // get templates
        $templates = $this->getSiteTemplates();

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

                    // external url (including protocol-relative)
                    if (strpos($tmp, '://') !== false || strpos($tmp, '//') === 0) {
                        continue;
                    }

                    // clean slashes
                    $tmp = preg_replace('#[/\\\\]+#', '/', $tmp);

                    // Replace $template variable with site template name
                    $tmp = str_replace('$template', $template->name, $tmp);

                    $file = JPATH_SITE . '/' . $tmp;
                    $list = array();

                    try {
                        $file = Path::check($file);
                    } catch (\RuntimeException $_) {
                        continue;
                    }

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

                // check editor.css file first
                $file = $this->hasEditorStylesheet($template->name);

                if ($file) {
                    $files[] = $file;
                } else {
                    $event = new Event('onWfGetTemplateStylesheets', array(
                        'files' => $files,
                        'template' => $template,
                        'subject' => $this,
                    ));

                    $app->getDispatcher()->dispatch('onWfGetTemplateStylesheets', $event);

                    $files = $event->getArgument('files');
                }

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

                    // external url (including protocol-relative)
                    if (strpos($tmp, '://') !== false || strpos($tmp, '//') === 0) {
                        continue;
                    }

                    // clean slashes
                    $tmp = preg_replace('#[/\\\\]+#', '/', $tmp);

                    // Replace $template variable with site template name (defaults to 'system')
                    $tmp = str_replace('$template', $template->name, $tmp);

                    $list = array();

                    $file = JPATH_SITE . '/' . $tmp;

                    try {
                        $file = Path::check($file);
                    } catch (\RuntimeException $_) {
                        continue;
                    }

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
        $root = $absolute ? JPATH_SITE : Uri::root(true);

        // check for existence of each file and make array of stylesheets
        foreach ($files as $file) {
            if (empty($file)) {
                continue;
            }

            // remove leading slash
            $file = ltrim($file, '/');

            $fullpath = JPATH_SITE . '/' . $file;

            $fullpath = Path::check($fullpath);

            if (is_file($fullpath)) {
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
     * Get the stylesheets for the editor content area.
     * If the list contains any LESS files, returns a single compile URL instead.
     *
     * @return array|string Array of stylesheet URLs, or a compile endpoint URL when LESS files are present
     */
    public function getTemplateStyleSheets()
    {
        $stylesheets = $this->getTemplateStyleSheetsList();

        // check for less files in the array
        $less = preg_grep('#\.less$#', $stylesheets);

        // process less files etc.
        if (!empty($less)) {
            // create token
            $token = Session::getFormToken();
            return Uri::base(true) . '/index.php?option=com_jce&task=editor.compileless&' . $token . '=1';
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
            return Uri::root(true) . '/media/plg_editors_jce';
        }

        return Uri::root() . 'media/plg_editors_jce';
    }

    /**
     * Pack and compress editor files (JavaScript, CSS, or language).
     *
     * @return void
     */
    public function pack()
    {
        $wf = $this->application;
        $type = $wf->input->getWord('type', 'javascript');

        // javascript
        $packer = new \Wfe\Asset\Packer(array('type' => $type));

        $themes = 'none';
        $plugins = array();

        $suffix = $wf->input->getWord('suffix', '');

        // if a profile is set
        if ($this->profile) {
            $themes = 'core';
            $plugins = $this->getPlugins();
        }

        $themes = explode(',', $themes);

        // toolbar theme
        $toolbar = explode('.', $wf->getParam('editor.toolbar_theme', 'default'));

        // base skin value — strip any path characters before use in file paths
        $skin = preg_replace('/[^a-zA-Z0-9_-]/', '', $toolbar[0]);

        if (empty($skin)) {
            $skin = 'default';
        }

        switch ($type) {
            case 'language':
                $files = array();

                $data = $this->loadLanguages(array(), array(), '(^dlg$|_dlg$)', true);
                $packer->setText($data);

                break;
            case 'javascript':
                $files = array();

                // add core file
                $files[] = WF_EDITOR_MEDIA . '/ibis/ibis' . $suffix . '.js';

                // Add themes in dev mode
                foreach ($themes as $theme) {
                    $files[] = WF_EDITOR_MEDIA . '/ibis/themes/' . $theme . '/theme' . $suffix . '.js';
                }

                // Add core plugins
                foreach ($plugins['core'] as $plugin) {
                    if (in_array($plugin, self::$plugins)) {
                        continue;
                    }

                    $files[] = WF_EDITOR_MEDIA . '/ibis/plugins/' . $plugin . '/plugin' . $suffix . '.js';
                }

                // add external and pro plugins
                foreach ($plugins['external'] as $plugin => $path) {
                    // get base path from plugin path
                    $basepath = dirname($path);

                    $basepath = \Wfe\Utility\Utility::uriToAbsolutePath($basepath);

                    $file = Path::find(
                        array(
                            JPATH_SITE . '/' . $basepath,
                        ),
                        'plugin' . $suffix . '.js'
                    );

                    if ($file) {
                        $files[] = $file;
                    }
                }

                // add Editor file
                $files[] = WF_EDITOR_MEDIA . '/js/editor.min.js';

                break;
            case 'css':
                $slot = $wf->input->getCmd('slot', 'editor');

                if ($slot == 'content') {
                    $files = array();

                    $files[] = WF_EDITOR_THEMES . '/' . $themes[0] . '/skins/' . $skin . '/content.css';

                    // get template stylesheets
                    $styles = $this->getTemplateStyleSheetsList(true);

                    foreach ($styles as $style) {
                        $style = Path::clean($style);

                        if (is_file($style)) {
                            $files[] = $style;
                        }
                    }

                    // Add core plugins
                    foreach ($plugins['core'] as $plugin) {
                        $content = WF_EDITOR_MEDIA . '/ibis/plugins/' . $plugin . '/css/content.css';

                        if (is_file($content)) {
                            $files[] = $content;
                        }
                    }

                    // add external and pro plugins
                    foreach ($plugins['external'] as $plugin => $path) {
                        // get base path from plugin path
                        $basepath = dirname($path);

                        $basepath = \Wfe\Utility\Utility::uriToAbsolutePath($basepath);

                        $content = Path::find(
                            array(
                                $basepath . '/css',
                            ),
                            'content.css'
                        );

                        if ($content) {
                            $files[] = $content;
                        }
                    }
                } elseif ($slot == 'preview') {
                    $files = array();
                    $files[] = WF_EDITOR_MEDIA . '/ibis/plugins/preview/css/preview.css';

                    // get template stylesheets
                    $styles = $this->getTemplateStyleSheetsList(true);

                    foreach ($styles as $style) {
                        $style = Path::clean($style);

                        if (is_file($style)) {
                            $files[] = $style;
                        }
                    }
                } else {
                    $files = array();

                    $files[] = WF_EDITOR_MEDIA . '/css/editor.min.css';

                    $variant = '';

                    if (count($toolbar) > 1) {
                        $variant = preg_replace('/[^a-zA-Z0-9_-]/', '', $toolbar[1]);
                    }

                    // load 'default'
                    $files[] = WF_EDITOR_THEMES . '/' . $themes[0] . '/skins/default/ui.css';

                    if ($skin !== 'default') {
                        $files[] = WF_EDITOR_THEMES . '/' . $themes[0] . '/skins/' . $skin . '/ui.css';
                    }

                    if (isset($variant)) {
                        $files[] = WF_EDITOR_THEMES . '/' . $themes[0] . '/skins/' . $skin . '/ui.' . $variant . '.css';
                    }
                }

                break;
        }

        $cache_validation = (bool) $this->getParam('editor.compress_cache_validation', true);

        $packer->setFiles($files);
        $packer->pack(true, $cache_validation);
    }

    /**
     * Load and output editor language strings as JavaScript.
     *
     * @return void
     */
    public function loadlanguages()
    {
        $parser = new \Wfe\Language\Parser(array('language' => $this->getLanguageTag(), 'plugins' => $this->getPlugins()));
        $data = $parser->load();
        $parser->output($data);
    }

    /**
     * Compile and output LESS/CSS template stylesheets as a single CSS response.
     *
     * @return void
     */
    public function compileless()
    {
        $files = self::getTemplateStyleSheetsList(true);

        if (!empty($files)) {
            $packer = new \Wfe\Asset\Packer(array('files' => $files, 'type' => 'css'));
            $packer->pack(false);
        }
    }

    /**
     * Generate a hidden CSRF token input field.
     *
     * @param string $id Unused; retained for legacy compatibility
     * @return string
     */
    public function getToken($id)
    {
        return '<input type="hidden" name="' . Session::getFormToken() . '" value="1" />';
    }

    /**
     * Proxy function for legacy compatibility with 3rd party extensions that access the API directly.
     *
     * @param string $key
     * @param string $fallback
     * @param string $default
     * @param string $type
     * @param bool   $allowempty
     * @return mixed
     */
    public function getParam($key, $fallback = '', $default = '', $type = 'string', $allowempty = true)
    {
        $wf = $this->application;
        return $wf->getParam($key, $fallback, $default, $type, $allowempty);
    }
}
