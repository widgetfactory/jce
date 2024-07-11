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

use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Uri\Uri;

/**
 * JCE class.
 */
class WFEditorPlugin extends CMSObject
{
    // Editor Plugin instance
    private static $instance;

    // array of alerts
    private $_alerts = array();

    // plugin name
    protected $name = '';

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        // Call parent
        parent::__construct();

        // get plugin name from url, fallback to default name if set
        $name = Factory::getApplication()->input->getCmd('plugin', $this->get('name'));

        // get name and caller from plugin name
        if (strpos($name, '.') !== false) {
            list($name, $caller) = explode('.', $name);

            // validate then store caller
            if ($caller !== $name) {

                $profile = $this->getProfile();

                if (!empty($profile)) {
                    if (in_array($caller, explode(',', $profile->plugins))) {
                        $this->set('caller', $caller);
                    }
                }
            }
        }

        // re-set the "name" value
        $this->set('name', $name);

        if (!array_key_exists('base_path', $config)) {
            $config['base_path'] = WF_EDITOR_PLUGINS . '/' . $name;
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

        $this->setProperties($config);
    }

    /**
     * Returns a reference to a editor object.
     *
     * This method must be invoked as:
     *         <pre>  $browser =JCE::getInstance();</pre>
     *
     * @return JCE The editor object
     *
     * @since    1.5
     */
    public static function getInstance($config = array())
    {
        if (!isset(self::$instance)) {
            self::$instance = new self($config);
        }

        return self::$instance;
    }

    /**
     * Get plugin View.
     *
     * @return WFView
     */
    public function getView()
    {
        static $view;

        if (!is_object($view)) {

            // create plugin view
            $view = new WFView(array(
                'view_path' => $this->get('base_path'),
                'template_path' => $this->get('template_path'),
                'name' => $this->get('name'),
                'layout' => $this->get('layout')
            ));
        }

        $view->plugin = $this;

        return $view;
    }

    protected function getVersion()
    {
        $wf = WFApplication::getInstance();

        return $wf->getVersion();
    }

    protected function getProfile($plugin = '')
    {
        $wf = WFApplication::getInstance();

        $options = array(
            'plugin' => $plugin
        );

        // get all profiles
        return $wf->getActiveProfile($options);
    }

    protected function getPluginVersion()
    {
        $manifest = $this->get('base_path') . '/' . $this->get('name') . '.xml';

        $version = '';

        if (is_file($manifest)) {
            $version = md5_file($manifest);
        }

        return $version;
    }

    protected function isRtl()
    {
        $language = Factory::getLanguage();

        if ($language->getTag() === WFLanguage::getTag()) {
            return $language->isRTL();
        }

        return false;
    }

    protected function initialize()
    {
        $app = Factory::getApplication();
        $wf = WFApplication::getInstance();

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

        // create the document
        $document = WFDocument::getInstance(array(
            'version' => $version,
            'title' => Text::_('WF_' . strtoupper($this->getName() . '_TITLE')),
            'name' => $name,
            'language' => WFLanguage::getTag(),
            'direction' => $this->isRtl() ? 'rtl' : 'ltr',
            'compress_javascript' => $this->getParam('editor.compress_javascript', 0),
            'compress_css' => $this->getParam('editor.compress_css', 0),
            'theme' => 'uk-jce-theme-' . $theme
        ));

        // set standalone mode
        $document->set('standalone', $wf->input->getInt('standalone', 0));

        Factory::getApplication()->triggerEvent('onWfPluginInit', array($this));
    }

    public function execute($task)
    {
        if ($task == 'loadlanguages') {
            return $this->loadlanguages();
        }
        
        $this->initialize();

        // process requests if any - method will end here
        WFRequest::getInstance()->process();

        $this->display();

        $document = WFDocument::getInstance();

        $query = array(
            'task' => 'plugin.loadlanguages', 
            'lang' => WFLanguage::getCode()
        );

        // ini language
        $document->addScript(
            Uri::base(true) . '/index.php?option=com_jce&' . $document->getQueryString($query), 'joomla'
        );

        // pack assets if required
        $document->pack(true, $this->getParam('editor.compress_gzip', 0));

        // get the view
        $view = $this->getView();

        // set body output
        $document->setBody($view->loadTemplate());

        $document->render();
    }

    protected function loadlanguages()
    {
        $name = $this->get('name');

        $parser = new WFLanguageParser(array(
            'plugins' => array('core' => array($name), 'external' => array()),
            'sections' => array('dlg', $name . '_dlg', 'colorpicker'),
            'mode' => 'plugin',
            'language' => WFLanguage::getTag(),
        ));

        $data = $parser->load();
        $parser->output($data);
    }

    /**
     * Display plugin.
     */
    public function display()
    {
        // check session on get request
        Session::checkToken('get') or jexit(Text::_('JINVALID_TOKEN'));

        $this->initialize();

        $document = WFDocument::getInstance();

        if ($document->get('standalone') == 0) {
            $document->addScript(array('tinymce.popup'), 'tinymce');
        }

        $document->addScript(array('jquery.min'), 'jquery');
        $document->addScript(array('jquery-ui.min'), 'jquery');
        $document->addScript(array('jquery-ui.touch.min'), 'jquery');

        $document->addScript(array('plugin.min.js'));
        $document->addStyleSheet(array('plugin.min.css'), 'media');

        // add custom plugin.css if exists
        if (is_file(JPATH_SITE . '/media/jce/css/plugin.css')) {
            $document->addStyleSheet(array('media/jce/css/plugin.css'), 'joomla');
        }

        Factory::getApplication()->triggerEvent('onWfPluginDisplay', array($this));
    }

    /**
     * Return the plugin name.
     *
     * @return string
     */
    public function getName()
    {
        return $this->get('name');
    }

    /**
     * Return the plugin name.
     *
     * @return string
     */
    public function getCaller()
    {
        return $this->get('caller');
    }

    /**
     * Get default values for a plugin.
     * Key / Value pairs will be retrieved from the profile or plugin manifest.
     *
     * @param array $defaults
     *
     * @return array
     */
    public function getDefaults($fieldset = 'defaults', $options = array())
    {
        $name = $this->getName();
        $caller = $this->get('caller');

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
        $manifest = $this->get('base_path') . '/' . $name . '.xml';

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

        // get parameter defaults
        if (is_file($manifest)) {
            $form = Form::getInstance('com_jce.plugin.' . $form_id, $manifest, array('load_data' => false), true, '//extension');
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

        return $defaults;
    }

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
     * Check the user is in an authorized group
     * Check the users group is authorized to use the plugin.
     *
     * @return bool
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
     * @param object $class Alert classname
     * @param object $title Alert title
     * @param object $text  Alert text
     */
    protected function addAlert($class = 'info', $title = '', $text = '')
    {
        $alerts = $this->getAlerts();

        $alerts[] = array(
            'class' => $class,
            'title' => $title,
            'text' => $text,
        );

        $this->set('_alerts', $alerts);
    }

    /**
     * Get current alerts.
     *
     * @return array Alerts
     */
    private function getAlerts()
    {
        return $this->get('_alerts');
    }

    /**
     * Convert a url to path.
     *
     * @param    string     The url to convert
     *
     * @return string Full path to file
     */
    public function urlToPath($url)
    {
        $document = WFDocument::getInstance();

        return $document->urlToPath($url);
    }

    /**
     * Returns an image url.
     *
     * @param    string     The file to load including path and extension eg: libaries.image.gif
     *
     * @return string Image url
     */
    public function image($image, $root = 'libraries')
    {
        $document = WFDocument::getInstance();

        return $document->image($image, $root);
    }

    /**
     * Load & Call an extension.
     *
     * @param array $config
     *
     * @return array
     */
    protected function loadExtensions($type, $extension = null, $config = array())
    {
        return WFExtension::loadExtensions($type, $extension, $config);
    }

    /**
     * Compile plugin settings from defaults and alerts.
     *
     * @param array $settings
     *
     * @return array
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

    public function getParams($options = array())
    {
        $wf = WFApplication::getInstance();

        return $wf->getParams($options);
    }

    /**
     * Get a parameter by key.
     *
     * @param string $key        Parameter key eg: editor.width
     * @param mixed  $fallback   Fallback value
     * @param mixed  $default    Default value
     * @param string $type       Variable type eg: string, boolean, integer, array
     *
     * @return mixed
     */
    public function getParam($key, $fallback = '', $default = '', $type = 'string')
    {
        // get plugin name
        $name = $this->getName();
        // get caller if any
        $caller = $this->get('caller');

        // get all keys
        $keys = explode('.', $key);
        $wf = WFApplication::getInstance();

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
     * @param string    The feature to check, eg: upload
     * @param mixed        The defalt value
     *
     * @return bool
     */
    public function checkAccess($option, $default = 0)
    {
        return (bool) $this->getParam($option, $default);
    }

    protected function allowEvents()
    {
        if ((bool) $this->getParam('editor.allow_javascript')) {
            return true;
        }

        return (bool) $this->getParam('editor.allow_event_attributes');
    }
}
