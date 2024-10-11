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

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Registry\Registry;

require_once JPATH_ADMINISTRATOR . '/components/com_jce/includes/base.php';

/**
 * JCE class.
 *
 * @static
 *
 * @since    1.5
 */
class WFApplication extends CMSObject
{
    // Editor instance
    protected static $instance;

    // Editor Profile
    protected static $profiles = array();

    // Editor Params
    protected static $params = array();

    // JInput Reference
    public $input;

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        $this->setProperties($config);

        // store a reference to the Joomla Application input
        $this->input = Factory::getApplication()->input;

        Factory::getApplication()->triggerEvent('onWfApplicationInit', array($this));
    }

    /**
     * Returns a reference to a editor object.
     *
     * This method must be invoked as:
     *         <pre>  $browser =JContentEditor::getInstance();</pre>
     *
     * @return JCE The editor object
     */
    public static function getInstance($config = array())
    {
        if (!isset(self::$instance)) {
            self::$instance = new self($config);
        }

        return self::$instance;
    }

    /**
     * Get the current version.
     *
     * @return string
     */
    public function getVersion()
    {
        $manifest = WF_ADMINISTRATOR . '/jce.xml';

        $version = md5_file($manifest);

        return $version;
    }

    protected function getComponent($id = null, $option = null)
    {
        if ($id) {
            $components = ComponentHelper::getComponents();

            foreach ($components as $option => $component) {
                if ($id == $component->id) {
                    return $component;
                }
            }
        }

        return ComponentHelper::getComponent($option);
    }

    public function getContext()
    {
        $option = Factory::getApplication()->input->getCmd('option');
        $component = ComponentHelper::getComponent($option, true);

        return $component->id;
    }

    private function getProfileVars()
    {
        $app = Factory::getApplication();
        $user = Factory::getUser();
        $option = $app->input->getCmd('option', '');

        $settings = array(
            'option' => $option,
            'area' => 2,
            'device' => 'desktop',
            'groups' => array(),
        );

        // find the component if this is called from within the JCE component
        if ($option == 'com_jce') {
            $context = $app->input->getInt('context');

            if ($context) {

                if ($context === 'mediafield') {
                    $settings['option'] = 'mediafield';
                } else {
                    $component = $this->getComponent($context);
                    $settings['option'] = $component->option;
                }
            }

            $profile_id = $app->input->getInt('profile_id');

            if ($profile_id) {
                $settings['profile_id'] = $profile_id;
            }
        }

        // get the Joomla! area, default to "site"
        $settings['area'] = $app->getClientId() === 0 ? 1 : 2;

        $mobile = new Wf\Detection\MobileDetect();

        // phone
        if ($mobile->isMobile()) {
            $settings['device'] = 'phone';
        }

        if ($mobile->isTablet()) {
            $settings['device'] = 'tablet';
        }

        $settings['groups'] = $user->getAuthorisedGroups();

        return $settings;
    }

    private function isCorePlugin($plugin)
    {
        return in_array($plugin, array('core', 'autolink', 'cleanup', 'code', 'format', 'importcss', 'colorpicker', 'upload', 'branding', 'inlinepopups', 'figure', 'ui', 'help'));
    }

    public function isValidPlugin($name)
    {
        $plugins = JcePluginsHelper::getPlugins();

        // installed plugins will have a name prefixed with "editor-", so remove to validate
        if (preg_match('/^editor[-_]/', $name)) {
            $name = preg_replace('/^editor[-_]/', '', $name);
        }

        if (!isset($plugins[$name])) {
            return false;
        }

        $plugin = $plugins[$name];

        if (isset($plugin->checksum) && strlen($plugin->checksum) == 64) {
            $path = $plugin->path . '/' . $plugin->name . '.php';

            if (!is_file($path)) {
                return false;
            }

            return $plugin->checksum === hash_file('sha256', $path);
        }

        return true;
    }

    public function checkProfile($plugin)
    {
        $profile = $this->getActiveProfile(array('plugin' => $plugin));
        return $profile ? true : false;
    }
    /**
     * Return the active profile based on certain conditions.
     *
     * @param array $options An array of options to pass to the getProfile method
     * @return object The active profile
     */
    public function getActiveProfile($options = array())
    {
        // in future this might return an array of profiles by key
        $profiles = $this->getProfiles($options);

        return $profiles;
    }

    /**
     * Legacy getProfile function for backwards compatibility.
     *
     * @param array $options
     * @return void
     */
    public function getProfile($options = array())
    {
        if (is_string($options)) {
            $options = array('plugin' => $options);
        }

        return $this->getActiveProfile($options);
    }

    /**
     * Get an array of editor profiles.
     *
     * @param array $options Array of options to pass to the getProfile method
     * @return array Array of editor profiles by key, with "default" being the default profile
     */
    protected function getProfiles($options = array())
    {
        static $cache = array();

        if (!isset($options['plugin'])) {
            $options['plugin'] = '';
        }

        if (!isset($options['id'])) {
            $options['id'] = 0;
        }

        // get the passed in options as variables
        extract ($options);
        
        // reset the value if it is a core plugin
        if ($this->isCorePlugin($plugin)) {
            $plugin = '';
        }

        // get the profile variables for the current context
        $vars = $this->getProfileVars();

        // installed plugins will have a name prefixed with "editor-", so remove to validate
        if (preg_match('/^editor[-_]/', $plugin)) {
            $plugin = preg_replace('/^editor[-_]/', '', $plugin);
        }

        // add plugin to vars array
        $vars['plugin'] = $plugin;

        // assign profile_id to simple variable
        if (isset($vars['profile_id'])) {
            $id = (int) $vars['profile_id'];
        }

        $db = Factory::getDBO();
        $user = Factory::getUser();
        $app = Factory::getApplication();

        $query = $db->getQuery(true);
        $query->select('*')->from('#__wf_profiles')->where('published = 1')->order('ordering ASC');

        if ($id) {
            $query->where('id = ' . (int) $id);
        }

        $db->setQuery($query);
        $items = $db->loadObjectList();

        // nothing found...
        if (empty($items)) {
            return null;
        }

        // select and return a specific profile by id
        if ($id) {
            return $items[0];
        }

        $app->triggerEvent('onWfEditorProfileOptions', array(&$vars));

        // create a unique signature to store
        $signature = md5(serialize($vars));

        if (!isset($cache[$signature])) {

            foreach ($items as $item) {
                // at least one user group or user must be set
                if (empty($item->types) && empty($item->users)) {
                    continue;
                }

                $app->triggerEvent('onWfBeforeEditorProfileItem', array(&$item));

                // event can "cancel" this profile item
                if ($item === false) {
                    continue;
                }

                // check user groups - a value should always be set
                $groups = array_intersect($vars['groups'], explode(',', $item->types));

                // user not in the current group...
                if (empty($groups)) {
                    // no additional users set or no user match
                    if (empty($item->users) || in_array($user->id, explode(',', $item->users)) === false) {
                        continue;
                    }
                }

                // check component
                if (!empty($item->components)) {
                    $components = explode(',', $item->components);

                    // remove duplicates
                    $components = array_unique($components);

                    if (in_array($vars['option'], $components) === false) {
                        continue;
                    }
                }

                // set device default as 'desktop,tablet,mobile'
                if (empty($item->device)) {
                    $item->device = 'desktop,tablet,phone';
                }

                // check device
                if (in_array($vars['device'], explode(',', $item->device)) === false) {
                    continue;
                }

                // check area
                if (!empty($item->area) && (int) $item->area != $vars['area']) {
                    continue;
                }

                // check against passed in plugin value
                if ($plugin && in_array($plugin, explode(',', $item->plugins)) === false) {
                    continue;
                }

                // decrypt params
                if (!empty($item->params)) {
                    $item->params = JceEncryptHelper::decrypt($item->params);
                }

                $app->triggerEvent('onWfAfterEditorProfileItem', array(&$item));

                // event can "cancel" this profile item
                if ($item === false) {
                    continue;
                }

                // assign item to profile
                $cache[$signature] = (object) $item;

                // return
                return $cache[$signature];
            }

            return null;
        }

        return $cache[$signature];
    }

    /**
     * Get editor parameters.
     *
     * @param array $options
     *
     * @return object
     */
    public function getParams($options = array())
    {
        $app = Factory::getApplication();

        if (!isset(self::$params)) {
            self::$params = array();
        }

        // set blank key if not set
        if (!isset($options['key'])) {
            $options['key'] = '';
        }
        // set blank path if not set
        if (!isset($options['path'])) {
            $options['path'] = '';
        }

        // get plugin name
        $plugin = $app->input->getCmd('plugin', '');

        // reset the plugin value if this is not called from within the JCE component
        if ($app->input->getCmd('option') !== 'com_jce') {
            $plugin = '';
        }

        if ($plugin) {
            // optional caller, eg: Link
            $caller = '';

            // get name and caller from plugin name
            if (strpos($plugin, '.') !== false) {
                list($plugin, $caller) = explode('.', $plugin);

                if ($caller) {
                    $options['caller'] = $caller;
                }
            }

            $options['plugin'] = $plugin;
        }

        $signature = serialize($options);

        if (empty(self::$params[$signature])) {
            // get plugin
            $editor = PluginHelper::getPlugin('editors', 'jce');

            if (empty($editor->params)) {
                $editor->params = '{}';
            }

            // get editor params as an associative array
            $data1 = json_decode($editor->params, true);

            // if null or false, revert to array
            if (empty($data1)) {
                $data1 = array();
            }

            // assign params to "editor" key
            $data1 = array('editor' => $data1);

            // get params data for the active profile
            $profile = $this->getActiveProfile(array('plugin' => $plugin));

            // create empty default if no profile or params are set
            $params = empty($profile->params) ? '{}' : $profile->params;

            // get profile params as an associative array
            $data2 = json_decode($params, true);

            // if null or false, revert to array
            if (empty($data2)) {
                $data2 = array();
            }

            // merge params, but ignore empty values
            $data = WFUtility::array_merge_recursive_distinct($data1, $data2, true);

            // create new registry with params
            $params = new Registry($data);

            self::$params[$signature] = $params;
        }

        return self::$params[$signature];
    }

    private function isEmptyValue($value)
    {
        if (is_null($value)) {
            return true;
        }

        if (is_array($value)) {
            return empty($value);
        }

        return false;
    }

    /**
     * Get a parameter by key.
     *
     * @param $key Parameter key eg: editor.width
     * @param $fallback Fallback value
     * @param $default Default value
     */
    public function getParam($key, $fallback = '', $default = '', $type = 'string')
    {
        // get params for base key
        $params = $this->getParams();

        // get a parameter
        $value = $params->get($key);

        // key not present in params or was empty string or empty array (JRegistry returns null), use fallback value
        if (self::isEmptyValue($value)) {
            // set default as empty string
            $value = '';

            // key does not exist (parameter was not set) - use fallback
            if ($params->exists($key) === false) {
                $value = $fallback;

                // if fallback is empty, revert to system default if it is non-empty
                if ($fallback == '' && $default != '') {
                    $value = $default;

                    // reset $default to prevent clearing
                    $default = '';
                }
                // parameter is set, but is empty, but fallback is not (inherited values)
            } else if ($fallback != '') {
                $value = $fallback;
            }
        }

        // clean string value of whitespace
        if (is_string($value)) {
            $value = trim(preg_replace('#[\n\r\t]+#', '', $value));
        }

        // cast default to float if numeric
        if (is_numeric($default)) {
            $default = (float) $default;
        }

        // cast value to float if numeric
        if (is_numeric($value)) {
            $value = (float) $value;
        }

        // if value is equal to system default, clear $value and return
        if ($value === $default) {
            return '';
        }

        // cast value to boolean
        if ($type == 'boolean') {
            $value = (bool) $value;
        }

        return $value;
    }
}
