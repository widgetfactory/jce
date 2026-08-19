<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Editor\Plugin;

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\Event;
use Joomla\CMS\Form\FormFactoryInterface;

use Wfe\Document\Document;
use Wfe\Document\Tabs;
use Wfe\Language\Language;
use Wfe\Http\Request;
use Wfe\Document\View;
use Wfe\Registry\ConfigurationTrait;

/**
 * Base class for editor plugins.
 *
 * Resolves the plugin name and caller from the request, sets up the document,
 * tabs and view, and provides parameter, default value and access helpers to
 * the plugin implementation.
 */
class AbstractPlugin
{
    use ConfigurationTrait;

    /**
     * Application instance
     * @var    \Wfe\Application\Application
     */
    protected $application;

    /**
     * Document instance
     * @var    \Wfe\Document\Document
     */
    protected $document;

    /**
     * Tabs instance
     * @var    \Wfe\Document\Tabs
     */
    protected $tabs;

    /**
     * Plugin name
     * @var    string
     */
    protected $name = '';

    /**
     * Request methods that remain available when the plugin is restricted.
     *
     * @var array
     */
    protected $core_methods = array();

    /**
     * Constructor activating the default information of the class.
     *
     * The plugin name is taken from the `plugin` request variable, falling back
     * to the class default. A "name.caller" value sets the caller, but only when
     * the caller is a plugin assigned to the active profile. Base, view and
     * template paths are derived from the plugin name where not passed in.
     *
     * @param array $config Plugin configuration values, eg: base_path, layout,
     *                      view_path, template_path.
     */
    public function __construct($config = array())
    {
        // create and store an application instance, registering it as the shared instance
        $this->application = \Wfe\Factory::getApplication();

        // register this plugin instance for BC wrapper access
        \Wfe\Factory::setEditorPlugin($this);
    
        // get plugin name from url, fallback to default name if set
        $name = Factory::getApplication()->input->getCmd('plugin', $this->name);

        // get name and caller from plugin name
        if (strpos($name, '.') !== false) {
            list($name, $caller) = explode('.', $name);

            // validate then store caller
            if ($caller !== $name) {

                $profile = $this->getProfile();

                if (!empty($profile)) {
                    if (in_array($caller, explode(',', $profile->plugins))) {
                        $config['caller'] = $caller;
                    }
                }
            }
        }

        // re-set the "name" value
        $this->name = $name;

        $config['name'] = $name;

        if (!array_key_exists('base_path', $config)) {
            $config['base_path'] = WF_EDITOR_PLUGINS . '/' . ucfirst($name);
        }

        if (!defined('WF_EDITOR_PLUGIN')) {
            define('WF_EDITOR_PLUGIN', $config['base_path']);
        }

        if (!array_key_exists('view_path', $config)) {
            $config['view_path'] = $config['base_path'];
        }

        if (!array_key_exists('layout', $config)) {
            $config['layout'] = 'default';
        }

        if (!array_key_exists('template_path', $config)) {
            $config['template_path'] = $config['base_path'] . '/tmpl';
        }

        $this->setConfiguration($config);
    }

    /**
     * Get the application instance.
     *
     * @return \Wfe\Application\Application
     */
    public function getApplication()
    {
        return $this->application;
    }

    /**
     * Get the document instance.
     *
     * Only available once {@see self::initialize()} has run.
     *
     * @return \Wfe\Document\Document|null
     */
    public function getDocument()
    {
        return $this->document;
    }

    /**
     * Get the tabs instance.
     *
     * Only available once {@see self::initialize()} has run.
     *
     * @return \Wfe\Document\Tabs|null
     */
    public function getTabs()
    {
        return $this->tabs;
    }

    /**
     * Get plugin View, creating it on first call.
     *
     * @return \Wfe\Document\View The plugin view.
     */
    public function getView()
    {
        static $view;

        if (!is_object($view)) {

            // create plugin view
            $view = new View(array(
                'view_path' => $this->getConfig('base_path'),
                'template_path' => $this->getConfig('template_path'),
                'name' => $this->getName(),
                'layout' => $this->getConfig('layout'),
            ));

            $view->setContainer($this);
        }

        return $view;
    }

    /**
     * Get the editor version, used for asset cache busting.
     *
     * @return string
     */
    protected function getVersion()
    {
        return $this->getApplication()->getVersion();
    }

    /**
     * Get the active profile for the current user and context.
     *
     * @param string $plugin Optional plugin name to check the profile against.
     *                       Defaults to the active profile for any plugin.
     *
     * @return object|null The profile object, or null if none is assigned.
     */
    protected function getProfile($plugin = '')
    {
        $wf = $this->getApplication();

        $options = array(
            'plugin' => $plugin,
        );

        // get all profiles
        return $wf->getActiveProfile($options);
    }

    /**
     * Get a version hash for the plugin, derived from its manifest file.
     *
     * Appended to the editor version so that plugin assets are re-cached when
     * the plugin manifest changes.
     *
     * @return string The manifest hash, or an empty string if there is no manifest.
     */
    protected function getPluginVersion()
    {
        $manifest = $this->getConfig('base_path') . '/' . $this->getName() . '.xml';

        $version = '';

        if (is_file($manifest)) {
            $version = md5_file($manifest);
        }

        return $version;
    }

    /**
     * Check whether the plugin should render right to left.
     *
     * Only true when the editor language matches the Joomla language, as the
     * editor may be displayed in a different language to the site.
     *
     * @return bool
     */
    protected function isRtl()
    {
        $language = Factory::getApplication()->getLanguage();

        if ($language->getTag() === Language::getTag()) {
            return $language->isRTL();
        }

        return false;
    }

    /**
     * Create and register the document and tabs instances for the plugin, then
     * fire the `onWfPluginInit` event.
     *
     * @return void
     */
    protected function initialize()
    {
        $wf = $this->getApplication();

        $version = $this->getVersion();
        $name = $this->getName();

        // set default plugin version
        $plugin_version = $this->getPluginVersion();

        // add plugin version
        if ($plugin_version && $plugin_version != $version) {
            $version .= $plugin_version;
        }

        // default ui theme
        $theme = 'light';

        // get editor theme
        $editor_theme = $wf->getParam('editor.toolbar_theme', 'modern');

        // set ui theme variant
        if ($editor_theme == 'modern.dark') {
            $theme = 'dark';
        }

        // create and register the document on the container
        $this->document = new Document(array(
            'version' => $version,
            'title' => Text::_('WF_' . strtoupper($this->getName() . '_TITLE')),
            'name' => $name,
            'caller' => $this->getConfig('caller'),
            'language' => Language::getTag(),
            'direction' => $this->isRtl() ? 'rtl' : 'ltr',
            'compress_javascript' => $wf->getParam('editor.compress_javascript', 0),
            'compress_css' => $wf->getParam('editor.compress_css', 0),
            'theme' => 'uk-theme-' . $theme,
        ));

        // register for any remaining legacy getInstance() call sites
        Document::register($this->document);

        // set standalone mode
        $this->document->setConfig('standalone', $wf->input->getInt('standalone', 0));

        // create and register the tabs on the container
        $this->tabs = new Tabs(array(
            'base_path' => $this->getConfig('base_path')
        ));

        $this->tabs->setContainer($this);

        Tabs::register($this->tabs);

        $event = new Event('onWfPluginInit', array(
            'subject' => $this
        ));

        Factory::getApplication()->getDispatcher()->dispatch('onWfPluginInit', $event);
    }

    /**
     * Check whether this plugin instance is restricted.
     *
     * A plugin is restricted when its own dialog is not used: replaced by one the editor
     * renders itself, eg: a basic dialog, or not shown at all. Only the methods listed in
     * getCoreMethods() remain available. Plugins opt in by overriding this method.
     *
     * @return bool
     */
    protected function isRestricted()
    {
        return false;
    }

    /**
     * Get the request methods that remain available when the plugin is restricted.
     *
     * @return array
     */
    protected function getCoreMethods()
    {
        return $this->core_methods;
    }

    /**
     * Restrict the request to the plugin's core methods.
     *
     * @return void
     *
     * @throws \Exception If the requested method is not allowed
     */
    private function checkRestricted()
    {
        if ($this->isRestricted() === false) {
            return;
        }

        $method = Request::getInstance()->getMethod();

        // a task with no method, eg: display, is never available when restricted
        if (!in_array($method, $this->getCoreMethods(), true)) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }
    }

    /**
     * Execute a plugin task.
     *
     * Validates the session token, initializes the plugin, processes any XHR
     * request, then renders the document.
     *
     * @param string $task The task to execute, eg: loadlanguages.
     *
     * @return void
     *
     * @throws \Exception If the plugin is restricted and the method is not allowed.
     */
    public function execute($task)
    {
        // check session on get request
        Session::checkToken('request') or jexit(Text::_('JINVALID_TOKEN'));

        // a restricted plugin only allows the methods it declares
        $this->checkRestricted();

        if ($task == 'loadlanguages') {
            return $this->loadlanguages();
        }

        $this->initialize();

        // process requests if any - method will end here
        Request::getInstance()->process();

        $this->display();

        $document = $this->getDocument();

        $query = array(
            'task' => 'plugin.loadlanguages',
            'lang' => Language::getCode(),
            'plugin' => $this->name,
        );

        // ini language
        $document->addScript(
            Uri::base(true) . '/index.php?option=com_jce&' . $document->getQueryString($query),
            'joomla'
        );

        // pack assets if required
        $document->pack(true, $this->getParam('editor.compress_gzip', 0));

        // get the view
        $view = $this->getView();

        // set body output
        $document->setBody($view->loadTemplate());

        $document->render();
    }

    /**
     * Parse and output the plugin language strings as a javascript file.
     *
     * Ends the request, as the parser sends the response directly.
     *
     * @return void
     */
    protected function loadlanguages()
    {
        $name = $this->getName();

        $parser = new \Wfe\Language\Parser(array(
            'plugins' => array('core' => array($name), 'external' => array()),
            'sections' => array('dlg', $name . '_dlg', 'colorpicker'),
            'mode' => 'plugin',
            'language' => \Wfe\Language\Language::getTag(),
        ));

        $data = $parser->load();
        $parser->output($data);
    }

    /**
     * Display the plugin, adding the core plugin scripts and stylesheets and
     * firing the `onWfPluginDisplay` event.
     *
     * @return void
     */
    public function display()
    {
        // check session on get request
        Session::checkToken('get') or jexit(Text::_('JINVALID_TOKEN'));

        $this->initialize();

        $document = $this->getDocument();

        if ($document->getConfig('standalone') == 0) {
            $document->addScript(array('popup'), 'ibis');
        }

        $document->addScript(array('jquery.min'), 'jquery');
        $document->addScript(array('jquery-ui.min'), 'jquery');

        $document->addScript(array('plugin.min.js'));
        $document->addStyleSheet(array('plugin.min.css'), 'media');

        // add custom plugin.css if exists
        if (is_file(JPATH_SITE . '/media/jce/css/plugin.css')) {
            $document->addStyleSheet(array('media/jce/css/plugin.css'), 'joomla');
        }

        $event = new Event('onWfPluginDisplay', array(
            'subject' => $this
        ));

        Factory::getApplication()->getDispatcher()->dispatch('onWfPluginDisplay', $event);
    }

    /**
     * Return the plugin name.
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Return the calling plugin name, eg: the plugin that opened this one in a
     * dialog.
     *
     * @return string The caller name, or an empty value if there is no caller.
     */
    public function getCaller()
    {
        return $this->getConfig('caller');
    }

    /**
     * Get default values for a plugin.
     *
     * Key / Value pairs will be retrieved from the profile or plugin manifest.
     * Custom attributes set on the plugin are validated and appended, with
     * invalid attribute names skipped and values escaped.
     *
     * @param string $fieldset The manifest fieldset to read defaults from.
     * @param array  $options  Optional values:
     *                          - defaults (array): Base values to merge into.
     *                          - exclude (array): Field names to skip.
     *                          - group (string): Parameter sub-group.
     *                          - manifest (string): Alternative manifest path.
     *
     * @return array Associative array of default values.
     */
    public function getDefaults($fieldset = 'defaults', $options = array())
    {
        $name = $this->getName();
        $caller = $this->getConfig('caller');

        if ($caller) {
            $name = $caller;
        }

        $defaults = array();
        $exclude = array();

        if (isset($options['defaults'])) {
            $defaults = $options['defaults'];
        }

        if (isset($options['exclude'])) {
            $exclude = $options['exclude'];
        }

        // get manifest path
        $manifest = $this->getConfig('base_path') . '/' . $name . '.xml';

        // use the plugin name as the form
        $form_id = $name;

        // parameter group
        if (isset($options['group'])) {
            $name .= '.' . $options['group'];
        }

        if (isset($options['manifest'])) {
            $manifest = $options['manifest'];
            // create extension specific form id
            $form_id .= '.' . basename($manifest, '.xml');
        }

        // exclude custom attributes
        $exclude[] = 'attributes';

        // get parameter defaults
        if (is_file($manifest)) {
            $form = Factory::getContainer()->get(FormFactoryInterface::class)->createForm('com_jce.plugin.' . $form_id);

            if ($form) {
                $form->loadFile($manifest, true, '//extension');

                $fields = $form->getFieldset($fieldset);

                foreach ($fields as $field) {
                    $key = $field->getAttribute('name');

                    if (!$key || $key === "buttons") {
                        continue;
                    }

                    if (in_array($key, $exclude)) {
                        continue;
                    }

                    $def = (string) $field->getAttribute('default');

                    // get parameter default value if set, use the specific plugin
                    $value = $this->getParam($name . '.' . $key, $def);

                    // only use non-empty values
                    if ($value !== '') {
                        $defaults[$key] = $value;
                    }
                }
            }
        }

        $customAttributes = $this->getParam($name . '.attributes', '');

        if ($customAttributes) {
            if (is_string($customAttributes)) {
                $customAttributes = json_decode($customAttributes, true);
            }

            if (!is_array($customAttributes)) {
                $customAttributes = array();
            }

            // Remove values with invalid key, must be indexed array
            $customAttributes = array_filter($customAttributes, function ($value, $key) {
                return is_numeric($key) && $value != "";
            }, ARRAY_FILTER_USE_BOTH);

            foreach ($customAttributes as $attribute) {
                if (empty($attribute)) {
                    continue;
                }

                $name = '';
                $value = '';

                // json associative array
                if (is_array($attribute) && array_key_exists('name', $attribute)) {
                    $name = $attribute['name'];
                    $value = $attribute['value'] ?? '';
                }

                if ($name && $value !== '') {
                    if (!preg_match('#^[a-zA-Z][a-zA-Z0-9_-]*$#', $name)) {
                        continue;
                    }

                    $value = trim($value, " \t\n\r\0\x0B'\"");
                    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                    $defaults[$name] = $value;
                }
            }
        }

        return $defaults;
    }

    /**
     * Convert the plugin defaults into html attributes and inline styles.
     *
     * Layout values, eg: align, border and margin, are mapped to css properties
     * and returned under a `styles` key, with px units added to numeric values.
     * Remaining values are returned as attributes, with `direction` mapped to
     * `dir` and `classes` to `class`.
     *
     * @return array Attribute name / value pairs, with a nested `styles` array
     *               where any style values are set.
     */
    public function getDefaultAttributes()
    {
        $defaults = $this->getDefaults();

        $attribs = array();
        $styles = array();

        foreach ($defaults as $key => $value) {
            switch ($key) {
                case 'align':
                    // convert to float
                    if ($value == 'left' || $value == 'right') {
                        $key = 'float';
                    } else {
                        $key = 'vertical-align';
                    }

                    // check for value and exclude border state parameter
                    if ($value != '') {
                        $styles[str_replace('_', '-', $key)] = $value;
                    }
                    break;
                case 'border_width':
                case 'border_style':
                case 'border_color':
                    // only if border state set
                    $value = $defaults['border'] ? $value : '';

                    // add px unit to border-width
                    if ($value && $key == 'border_width' && is_numeric($value)) {
                        $value .= 'px';
                    }

                    // check for value and exclude border state parameter
                    if ($value != '') {
                        $styles[str_replace('_', '-', $key)] = $value;
                    }

                    break;
                case 'margin_left':
                case 'margin_right':
                case 'margin_top':
                case 'margin_bottom':
                    // add px unit to border-width
                    if ($value && is_numeric($value)) {
                        $value .= 'px';
                    }

                    // check for value and exclude border state parameter
                    if ($value != '') {
                        $styles[str_replace('_', '-', $key)] = $value;
                    }

                    break;
                default:
                    if ($key == 'direction') {
                        $key = 'dir';
                    }

                    if ($key == 'classes') {
                        $key = 'class';
                    }

                    if ($value !== '') {
                        $attribs[$key] = $value;
                    }

                    break;
            }
        }

        // styles object
        if (!empty($styles)) {
            $attribs['styles'] = $styles;
        }

        return $attribs;
    }

    /**
     * Check that a plugin is installed and available to the current user.
     *
     * Verifies the plugin directory exists and that the plugin is assigned to a
     * profile the user has access to.
     *
     * @param string|null $plugin The plugin name to check.
     *
     * @return bool True if the plugin is installed and authorized.
     */
    public function checkPlugin($plugin = null)
    {
        if ($plugin) {
            // check existence of plugin directory
            if (is_dir(WF_EDITOR_PLUGINS . '/' . $plugin)) {
                // get profile
                $profile = $this->getProfile($plugin);
                // check for valid object and profile id
                return is_object($profile) && isset($profile->id);
            }
        }

        return false;
    }

    /**
     * Add an alert array to the stack.
     *
     * Alerts are stored in the plugin configuration and passed to the client by
     * {@see self::getSettings()}.
     *
     * @param string $class Alert classname, eg: info, warning, error
     * @param string $title Alert title
     * @param string $text  Alert text
     *
     * @return void
     */
    protected function addAlert($class = 'info', $title = '', $text = '')
    {
        $alerts = $this->getAlerts();

        $alerts[] = array(
            'class' => $class,
            'title' => $title,
            'text' => $text,
        );

        $this->setConfig('_alerts', $alerts);
    }

    /**
     * Get current alerts.
     *
     * @return array Alerts
     */
    private function getAlerts()
    {
        return $this->getConfig('_alerts');
    }

    /**
     * Convert a url to path.
     *
     * @param  string $url The url to convert
     *
     * @return string Full path to file
     */
    public function urlToPath($url)
    {
        return $this->getDocument()->urlToPath($url);
    }

    /**
     * Returns an image url.
     *
     * @param  string $image The file to load including path and extension eg: libaries.image.gif
     * @param  string $root  The root directory
     *
     * @return string Image url
     */
    public function image($image, $root = 'libraries')
    {
        return $this->getDocument()->image($image, $root);
    }

    /**
     * Compile plugin settings from defaults and alerts.
     *
     * @param array $settings Additional settings, merged over the defaults.
     *
     * @return array The compiled settings, passed to the client.
     */
    public function getSettings($settings = array())
    {
        $default = array(
            'alerts' => $this->getAlerts(),
            'defaults' => $this->getDefaults(),
        );

        $settings = array_merge($default, $settings);

        return $settings;
    }

    /**
     * Get the editor parameters.
     *
     * @param array $options Options passed to the application, eg: key, default.
     *
     * @return mixed The parameter values.
     */
    public function getParams($options = array())
    {
        $wf = $this->application;

        return $wf->getParams($options);
    }

    /**
     * Get a parameter by key.
     *
     * Keys rooted on "editor", the plugin name or the caller name are read
     * directly. An unrooted key is treated as a shared parameter and resolved
     * through a fallback chain: the editor value, then the plugin value, then
     * the caller value where a caller is set, so the most specific value wins.
     *
     * @param string $key        Parameter key eg: editor.width
     * @param mixed  $fallback   Fallback value
     * @param mixed  $default    Default value
     * @param string $type       Variable type eg: string, boolean, integer, array
     *
     * @return mixed The parameter value.
     */
    public function getParam($key, $fallback = '', $default = '', $type = 'string')
    {
        // get plugin name
        $name = $this->getName();
        // get caller if any
        $caller = $this->getConfig('caller');

        // get all keys
        $keys = explode('.', $key);
        $wf = $this->application;

        // root key set
        if ($keys[0] == 'editor' || $keys[0] == $name || $keys[0] == $caller) {
            return $wf->getParam($key, $fallback, $default, $type);
        // no root key set, treat as shared param
        } else {
            // get fallback param from editor key
            $fallback = $wf->getParam('editor.' . $key, $fallback, $default, $type);

            if ($caller) {
                // get fallback from plugin (with editor parameter as fallback)
                $fallback = $wf->getParam($name . '.' . $key, $fallback, $default, $type);
                $name = $caller;
            }

            // reset the $default to prevent clearing
            if ($fallback === $default) {
                $default = '';
            }

            // return parameter
            return $wf->getParam($name . '.' . $key, $fallback, $default, $type);
        }
    }

    /**
     * Named wrapper to check access to a feature.
     *
     * @param string  $option  The feature to check, eg: upload
     * @param mixed   $default The default value
     *
     * @return bool
     */
    public function checkAccess($option, $default = 0)
    {
        return (bool) $this->getParam($option, $default);
    }

    /**
     * Check whether javascript event attributes, eg: onclick, are allowed in
     * plugin output.
     *
     * @return bool
     */
    protected function allowEvents()
    {
        if ((bool) $this->getParam('editor.allow_javascript')) {
            return true;
        }

        return (bool) $this->getParam('editor.allow_event_attributes');
    }
}
