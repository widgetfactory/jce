<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Registry\Registry;

require_once JPATH_ADMINISTRATOR . '/components/com_jce/includes/base.php';

/**
 * Core JCE application — profile resolution, parameter loading, and plugin validation.
 *
 * @since   1.5
 */
class WFApplication extends CMSObject
{
    /** @var WFApplication */
    protected static $instance;

    /** @var array<string, object> */
    protected static $profiles = array();

    /** @var array<string, Registry> */
    protected static $params = array();

    /** @var \Joomla\Input\Input */
    public $input;

    /**
     * @param array $config Optional configuration values passed to setProperties().
     */
    public function __construct($config = array())
    {
        $this->setProperties($config);

        // store a reference to the Joomla Application input
        $this->input = Factory::getApplication()->input;

        Factory::getApplication()->triggerEvent('onWfApplicationInit', array($this));
    }

    /**
     * Returns the singleton WFApplication instance.
     *
     * @param array $config Configuration passed to the constructor on first call.
     *
     * @return WFApplication
     */
    public static function getInstance($config = array())
    {
        if (!isset(self::$instance)) {
            self::$instance = new self($config);
        }

        return self::$instance;
    }

    /**
     * Returns an MD5 hash of the component manifest, used as a cache-busting version token.
     *
     * @return string
     */
    public function getVersion()
    {
        $manifest = WF_ADMINISTRATOR . '/jce.xml';

        $version = md5_file($manifest);

        return $version;
    }

    /**
     * Resolves a component object by numeric ID or option string.
     *
     * @param int|null    $id     Component ID to look up.
     * @param string|null $option Component option (e.g. "com_content") used as fallback.
     *
     * @return object
     */
    protected function getComponent($id = null, $option = null)
    {
        if ($id) {
            $components = ComponentHelper::getComponents();

            foreach ($components as $component) {
                if ((int) $id === $component->id) {
                    return $component;
                }
            }
        }

        return ComponentHelper::getComponent($option);
    }

    /**
     * Returns the component ID for the currently active option.
     *
     * @return int
     */
    public function getContext()
    {
        $option = Factory::getApplication()->input->getCmd('option');
        $component = ComponentHelper::getComponent($option, true);

        return $component->id;
    }

    /**
     * Returns true when the current request is a JCE file-browser view.
     *
     * @return bool
     */
    private function isFileBrowser()
    {
        $app = Factory::getApplication();
        $option = $app->input->getCmd('option', '');

        if ($option !== 'com_jce') {
            return false;
        }

        if ($app->input->getCmd('view') === 'browser') {
            return true;
        }

        if ($app->input->getCmd('plugin') === 'browser') {
            return true;
        }

        return false;
    }

    /**
     * Builds the context variables used to match an editor profile.
     *
     * @return array{option: string, area: int, device: string, groups: int[]}
     */
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
            $context = $app->input->getCmd('context');

            if ($context) {
                if ($context === 'mediafield') {
                    $settings['option'] = 'mediafield';
                } else {
                    $component = $this->getComponent((int) $context);
                    $settings['option'] = $component->option;
                }
            }
        }

        // get the Joomla! area, default to "site"
        $settings['area'] = $app->getClientId() === 0 ? 1 : 2;

        // class_exists triggers autoload - fix errors after upgrade from earlier version
        if (class_exists('WFDeviceDetect')) {
            $mobile = new WFDeviceDetect();

            if ($mobile->isPhone()) {
                $settings['device'] = 'phone';
            }

            if ($mobile->isTablet()) {
                $settings['device'] = 'tablet';
            }
        }

        $settings['groups'] = $user->getAuthorisedGroups();

        return $settings;
    }

    /**
     * Returns the raw parameter array stored on the JCE editor plugin record.
     *
     * @return array
     */
    private function getEditorParams()
    {
        $editor = PluginHelper::getPlugin('editors', 'jce');
        $params = json_decode($editor->params ?: '{}', true);

        return is_array($params) ? $params : array();
    }

    /**
     * Returns true for built-in plugins that are always available regardless of profile.
     *
     * @param string $plugin Plugin name.
     *
     * @return bool
     */
    private function isCorePlugin($plugin)
    {
        return in_array($plugin, array('core', 'autolink', 'cleanup', 'code', 'format', 'importcss', 'colorpicker', 'upload', 'branding', 'inlinepopups', 'figure', 'ui', 'help'));
    }

    /**
     * Validates that a plugin is installed and, when a checksum is present, that its main file is unmodified.
     *
     * @param string $name Plugin name, optionally prefixed with "editor-" or "editor_".
     *
     * @return bool
     */
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

    /**
     * Returns true if a profile exists that enables the given plugin.
     *
     * @param string $plugin Plugin name.
     *
     * @return bool
     */
    public function checkProfile($plugin)
    {
        $profile = $this->getActiveProfile(array('plugin' => $plugin));
        return $profile ? true : false;
    }

    /**
     * Returns the first matching editor profile for the current request context.
     *
     * @param array $options Options forwarded to getProfiles(); supports key 'plugin'.
     *
     * @return object|null
     */
    public function getActiveProfile($options = array())
    {
        // in future this might return an array of profiles by key
        $profiles = $this->getProfiles($options);

        return $profiles;
    }

    /**
     * Legacy alias for getActiveProfile().
     *
     * @param array|string $options Plugin name string or options array.
     *
     * @return object|null
     */
    public function getProfile($options = array())
    {
        if (is_string($options)) {
            $options = array('plugin' => $options);
        }

        return $this->getActiveProfile($options);
    }

    /**
     * Iterates published profiles and returns the first one matching the current context.
     *
     * Results are keyed by a context signature and cached for the request lifetime.
     *
     * @param array $options Supports key 'plugin' to filter by plugin name.
     *
     * @return object|null The matched profile row, or null if none qualify.
     */
    protected function getProfiles($options = array())
    {
        static $cache = array();

        if (!isset($options['plugin'])) {
            $options['plugin'] = '';
        }

        $plugin = $options['plugin'];

        // reset the value if it is a core plugin
        if ($this->isCorePlugin($plugin)) {
            $plugin = '';
        }

        // get the profile variables for the current context
        $vars = $this->getProfileVars();

        // block guests unless explicitly enabled in global config
        $user = Factory::getUser();

        if ($user->guest) {
            if (!ComponentHelper::getParams('com_jce')->get('allow_profile_guests', 0)) {
                return null;
            }
        }

        // installed plugins will have a name prefixed with "editor-", so remove to validate
        if (preg_match('/^editor[-_]/', $plugin)) {
            $plugin = preg_replace('/^editor[-_]/', '', $plugin);
        }

        // add plugin to vars array
        $vars['plugin'] = $plugin;

        $db = Factory::getDBO();
        $app = Factory::getApplication();

        $query = $db->getQuery(true);
        $query->select('*')->from('#__wf_profiles')->where('published = 1')->order('ordering ASC');

        $db->setQuery($query);
        $items = $db->loadObjectList();

        // nothing found...
        if (empty($items)) {
            return null;
        }

        $app->triggerEvent('onWfEditorProfileOptions', array(&$vars));

        // create a unique signature to store
        $signature = md5(serialize($vars));

        if (!isset($cache[$signature])) {

            // apply global group whitelist if configured; otherwise all user groups are eligible
            $whitelist = array_filter((array) ComponentHelper::getParams('com_jce')->get('profile_groups_whitelist', []));
            $effectiveGroups = !empty($whitelist) ? array_intersect($vars['groups'], $whitelist) : $vars['groups'];

            foreach ($items as $item) {
                // at least one user group or user must be set
                if (empty($item->types) && empty($item->users)) {
                    continue;
                }

                // decrypt params
                if (!empty($item->params)) {
                    $item->params = JceEncryptHelper::decrypt($item->params);
                }

                $app->triggerEvent('onWfBeforeEditorProfileItem', array(&$item));

                // event can "cancel" this profile item
                if ($item === false) {
                    continue;
                }

                // check user groups - a value should always be set
                $groups = array_intersect($effectiveGroups, explode(',', $item->types));

                // user not in the current group...
                if (empty($groups)) {
                    // no additional users set or no user match
                    if (empty($item->users) || in_array($user->id, array_map('intval', explode(',', $item->users)), true) === false) {
                        continue;
                    }
                }

                // check component, but skip if this is the file browser
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
     * Returns a Registry merging global editor params with the active profile params.
     *
     * Editor plugin params are stored under the 'editor' key; profile params are merged on top.
     * Results are cached by a serialised options signature.
     *
     * @param array $options Supports keys 'key', 'path', 'plugin', 'caller'.
     *
     * @return Registry
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
            $data1 = $this->getEditorParams();

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

    /**
     * Returns true for null or an empty array; intentionally does not treat 0 or '' as empty.
     *
     * @param mixed $value
     *
     * @return bool
     */
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
     * Retrieves a single parameter value with fallback and default resolution.
     *
     * Resolution order: profile value → $fallback → $default.
     * Numeric values are cast to float; 'boolean' type triggers a bool cast.
     * Returns '' when the resolved value equals $default (system default suppressed).
     *
     * @param string $key      Dot-notation key, e.g. "editor.width".
     * @param mixed  $fallback Returned when the key is absent from the merged params.
     * @param mixed  $default  System default; when the resolved value equals this, '' is returned.
     * @param string $type     Pass 'boolean' to cast the result to bool.
     *
     * @return mixed
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
