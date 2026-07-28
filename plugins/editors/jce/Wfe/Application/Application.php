<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Application;

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Component\Jce\Administrator\Helper\EncryptHelper;
use Joomla\Component\Jce\Administrator\Helper\PluginsHelper;
use Joomla\Database\DatabaseInterface;
use Joomla\Event\Event;
use Joomla\Registry\Registry;

use Wfe\Registry\ConfigurationTrait;
use Wfe\Helper\ArrayHelper;

require_once JPATH_ADMINISTRATOR . '/components/com_jce/includes/base.php';

/**
 * Core JCE application — profile resolution, parameter loading, and plugin validation.
 */
class Application
{
    use ConfigurationTrait;

    /** @var array<string, object> */
    protected static $profiles = array();

    /** @var array<string, Registry> */
    protected static $params = array();

    /** @var \Joomla\Input\Input */
    public $input;

    /**
     * @param array $config Optional configuration values applied via ConfigurationTrait.
     */
    public function __construct($config = array())
    {
        $app = Factory::getApplication();

        // store a reference to the Joomla Application input
        $this->input = $app->getInput();

        $event = new Event('onWfApplicationInit', array(
            'subject' => $this,
            'config' => $config,
        ));

        $app->getDispatcher()->dispatch('onWfApplicationInit', $event);

        $config = $event->getArgument('config');

        $this->setConfiguration($config);
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
        $option = $this->input->getCmd('option');
        $component = ComponentHelper::getComponent($option, true);

        return $component->id;
    }

    /**
     * Builds the context variables used to match an editor profile.
     *
     * @return array{option: string, area: int, device: string, groups: int[]}
     */
    private function getProfileVars()
    {
        $app = Factory::getApplication();
        $user = $app->getIdentity();
        $option = $app->getInput()->getCmd('option', '');

        $settings = array(
            'option' => $option,
            'area' => 2,
            'device' => 'desktop',
            'groups' => array(),
        );

        // find the component if this is called from within the JCE component
        if ($option == 'com_jce') {
            $context = $app->getInput()->getCmd('context');

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

        $mobile = new \Wfe\Utility\DeviceDetect();

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

    /**
     * Returns the raw parameter array stored on the JCE editor plugin record.
     *
     * @return array
     */
    private function getEditorParams()
    {
        $editor = PluginHelper::getPlugin('editors', 'jce');
        $params = json_decode($editor->params ?: '{}', true);

        return is_array($params) ? $params : [];
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
        $plugins = PluginsHelper::getEditorPlugins();

        // installed plugins will have a name prefixed with "editor-", so remove to validate
        if (preg_match('/^editor[-_]/', $name)) {
            $name = preg_replace('/^editor[-_]/', '', $name);
        }

        if (!isset($plugins[$name])) {
            return false;
        }

        $plugin = $plugins[$name];

        if (isset($plugin->checksum) && strlen($plugin->checksum) == 64) {
            // default for core and pro plugins
            $path = $plugin->path . '/Plugin.php';

            if (!is_file($path)) {
                $path = $plugin->path . '/' . $plugin->name . '.php';
            }

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
        static $profiles = null;

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
        $app = Factory::getApplication();
        $user = $app->getIdentity();

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

        // profiles can be assigned to a specific user, so the user must be part of the signature
        $vars['uid'] = (int) $user->id;

        $event = new Event('onWfEditorProfileOptions', array(
            'subject' => $this,
            'options' => $vars,
        ));

        $app->getDispatcher()->dispatch('onWfEditorProfileOptions', $event);

        $vars = $event->getArgument('options');

        // create a unique signature to store
        $signature = md5(serialize($vars));

        // a null value is a valid result, so check the key
        if (array_key_exists($signature, $cache)) {
            return $cache[$signature];
        }

        // published profiles do not change during a request, so only load them once
        if ($profiles === null) {
            $db = Factory::getContainer()->get(DatabaseInterface::class);

            $query = $db->getQuery(true);
            $query->select('*')->from('#__wf_profiles')->where('published = 1')->order('ordering ASC');
            $db->setQuery($query);
            $rows = $db->loadObjectList();

            // a failed query is not cached
            if (!is_array($rows)) {
                return null;
            }

            $profiles = $rows;
        }

        // nothing found...
        if (empty($profiles)) {
            return null;
        }

        // apply global group whitelist if configured; otherwise all user groups are eligible
        $whitelist = array_filter((array) ComponentHelper::getParams('com_jce')->get('profile_groups_whitelist', []));
        $effectiveGroups = !empty($whitelist) ? array_intersect($vars['groups'], $whitelist) : $vars['groups'];

        foreach ($profiles as $profile) {
            // work on a copy as the stored profile is decrypted and passed to events
            $item = clone $profile;

            // at least one user group or user must be set
            if (empty($item->types) && empty($item->users)) {
                continue;
            }

            // decrypt params before firing events so handlers can read them
            if (!empty($item->params)) {
                $item->params = EncryptHelper::decrypt($item->params);
            }

            $event = new Event('onWfEditorBeforeProfileItem', array(
                'item' => $item,
                'subject' => $this,
            ));

            $app->getDispatcher()->dispatch('onWfEditorBeforeProfileItem', $event);

            $item = $event->getArgument('item');

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

            $event = new Event('onWfEditorProfileItem', array(
                'item' => $item,
                'subject' => $this,
            ));

            $app->getDispatcher()->dispatch('onWfEditorProfileItem', $event);

            $item = $event->getArgument('item');

            // event can "cancel" this profile item
            if ($item === false) {
                continue;
            }

            // check against passed in plugin value
            if ($plugin && in_array($plugin, explode(',', $item->plugins)) === false) {
                continue;
            }

            // assign item to profile
            $cache[$signature] = (object) $item;

            // return
            return $cache[$signature];
        }

        // no profile matched this context
        $cache[$signature] = null;

        return null;
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
        $plugin = $app->getInput()->getCmd('plugin', '');

        // reset the plugin value if this is not called from within the JCE component
        if ($app->getInput()->getCmd('option') !== 'com_jce') {
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
            $data = ArrayHelper::array_merge_recursive_distinct($data1, $data2, true);

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
