<?php

/**
 * @copyright     Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

require_once JPATH_ADMINISTRATOR.'/components/com_jce/includes/base.php';

/**
 * JCE class.
 *
 * @static
 *
 * @since    1.5
 */
class WFEditor extends JObject
{
    // Editor instance
    protected static $instance;

    // Editor Profile
    protected static $profile = array();

    // Editor Params
    protected static $params = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        $this->setProperties($config);
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
        $manifest = WF_ADMINISTRATOR.'/jce.xml';

        $version = md5_file($manifest);

        return $version;
    }

    public function getContext()
    {
        /*if ($this->profile) {
            // get token
            $token = WFToken::getToken();
            // create context hash
            $this->context = md5($token . serialize($this->profile));
            // assign profile id to user session
            $app->setUserState($this->context, $this->profile->id);
        }*/

        $option = JRequest::getCmd('option');
        $extension = WFExtensionHelper::getComponent(null, $option);

        $extension_id = 0;

        if (isset($extension->extension_id)) {
            return $extension->extension_id;
        }

        if (isset($extension->id)) {
            return $extension->id;
        }

        return 0;
    }

    private function getProfileVars($plugin = '')
    {
        $app = JFactory::getApplication();
        $user = JFactory::getUser();
        $option = $this->getComponentOption();

        if ($option == 'com_jce') {
            $context = JRequest::getInt('context');

            if ($context) {
                $component = WFExtensionHelper::getComponent($context);
                $option = isset($component->element) ? $component->element : $component->option;
            }
        }

        // get the Joomla! area (admin or site)
        $area = $app->isAdmin() ? 2 : 1;

        if (!class_exists('Wf_Mobile_Detect')) {
            // load mobile detect class
            require_once dirname(__FILE__).'/mobile.php';
        }

        $mobile = new Wf_Mobile_Detect();

        // desktop - default
        $device = 'desktop';

        // phone
        if ($mobile->isMobile()) {
            $device = 'phone';
        }

        if ($mobile->isTablet()) {
            $device = 'tablet';
        }

        // Joomla! 1.6+
        if (method_exists('JUser', 'getAuthorisedGroups')) {
            $groups = $user->getAuthorisedGroups();
        } else {
            $groups = array($user->gid);
        }

        return array(
            'option' => $option,
            'area' => $area,
            'device' => $device,
            'groups' => $groups,
            'plugin' => $plugin,
        );
    }

    /**
     * Get an appropriate editor profile.
     */
    public function getProfile($plugin = '', $id = 0)
    {
        // get the profile variables for the current context
        $options = $this->getProfileVars($plugin);
        // create a signature to store
        $signature = serialize($options);

        if (!isset(self::$profile[$signature])) {
            $db = JFactory::getDBO();
            $user = JFactory::getUser();
            $app = JFactory::getApplication();

            $query = $db->getQuery(true);

            if (is_object($query)) {
                $query->select('*')->from('#__wf_profiles')->where('published = 1')->order('ordering ASC');

                if ($id) {
                    $query->where('id = '.(int) $id);
                }
            } else {
                $query = 'SELECT * FROM #__wf_profiles WHERE published = 1';

                if ($id) {
                    $query .= ' AND id = '.(int) $id;
                }

                $query .= ' ORDER BY ordering ASC';
            }

            $db->setQuery($query);
            $profiles = $db->loadObjectList();

            if ($id && !empty($profiles)) {
                // assign profile
                self::$profile[$signature] = (object) $profiles[0];

                // return
                return self::$profile[$signature];
            }

            foreach ($profiles as $item) {
                // at least one user group or user must be set
                if (empty($item->types) && empty($item->users)) {
                    continue;
                }

                // check user groups - a value should always be set
                $groups = array_intersect($options['groups'], explode(',', $item->types));

                // user not in the current group...
                if (empty($groups)) {
                    // no additional users set or no user match
                    if (empty($item->users) || in_array($user->id, explode(',', $item->users)) === false) {
                        continue;
                    }
                }

                // check component
                if ($options['option'] !== 'com_jce' && $item->components && in_array($options['option'], explode(',', $item->components)) === false) {
                    continue;
                }

                // set device default as 'desktop,tablet,mobile'
                if (empty($item->device)) {
                    $item->device = 'desktop,tablet,phone';
                }

                // check device
                if (in_array($options['device'], explode(',', $item->device)) === false) {
                    continue;
                }

                // check area
                if (!empty($item->area) && (int) $item->area != $options['area']) {
                    continue;
                }

                if ($options['plugin'] && in_array($options['plugin'], explode(',', $item->plugins)) === false) {
                    continue;
                }

                // decrypt params
                if (!empty($item->params)) {
                    wfimport('admin.helpers.encrypt');
                    $item->params = WFEncryptHelper::decrypt($item->params);
                }

                // assign item to profile
                self::$profile[$signature] = (object) $item;

                // return
                return self::$profile[$signature];
            }

            return null;
        }

        return self::$profile[$signature];
    }

    /**
     * Get the component option.
     *
     * @return string
     */
    public function getComponentOption()
    {
        $option = JRequest::getCmd('option', '');

        switch ($option) {
            case 'com_section':
                $option = 'com_content';
                break;
            case 'com_categories':
                $section = JRequest::getCmd('section');

                if ($section) {
                    $option = $section;
                }

                break;
        }

        return $option;
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
        $plugin = JRequest::getCmd('plugin');

        // optional caller, eg: Link
        $caller = '';

        // get name and caller from plugin name
        if (strpos($plugin, '.') !== false) {
            list($plugin, $caller) = explode('.', $plugin);

            if ($caller) {
                $options['caller'] = $caller;
            }
        }

        if ($plugin) {
            $options['plugin'] = $plugin;
        }

        $signature = serialize($options);

        if (empty(self::$params[$signature])) {
            wfimport('admin.helpers.extension');

            // get plugin
            $editor_plugin = WFExtensionHelper::getPlugin();

            // get params data for this profile
            $profile = $this->getProfile($plugin);

            $profile_params = array();
            $editor_params = array();

            // get params from editor plugin
            if ($editor_plugin->params && $editor_plugin->params !== '{}') {
                $editor_params['editor'] = json_decode($editor_plugin->params, true);
            } else {
                // get component
                $component = WFExtensionHelper::getComponent();

                // get params from component "params" field (legacy)
                if ($component->params && $component->params !== '{}') {
                    $data = json_decode($component->params, true);

                    if (isset($data['editor'])) {
                        $editor_params['editor'] = $data['editor'];
                    }
                }
            }

            if ($profile) {
                $profile_params = json_decode($profile->params, true);
            }

            // make sure we have an empty array if null or false
            if (empty($editor_params)) {
                $editor_params = array();
            }

            // make sure we have an empty array if null or false
            if (empty($profile_params)) {
                $profile_params = array();
            }

            // merge data and convert to json string
            $data = WFParameter::mergeParams($editor_params, $profile_params, true, false);

            self::$params[$signature] = new WFParameter($data, $options['path'], $options['key']);
        }

        return self::$params[$signature];
    }

    /**
     * Get a parameter by key.
     *
     * @param $key Parameter key eg: editor.width
     * @param $fallback Fallback value
     * @param $default Default value
     */
    public function getParam($key, $fallback = '', $default = '', $type = 'string', $allowempty = true)
    {
        // get all keys
        $keys = explode('.', $key);

        // remove base key eg: 'editor'
        $base = array_shift($keys);

        // get params for base key
        $params = self::getParams(array('key' => $base));
        // get a parameter

        $param = $params->get($keys, $fallback, $allowempty);

        if (is_string($param) && $type == 'string') {
            $param = trim(preg_replace('#[\n\r\t]+#', '', $param));
        }

        if (is_numeric($default)) {
            $default = (float) $default;
        }

        if (is_numeric($param)) {
            $param = (float) $param;
        }

        if ($param === $default) {
            return '';
        }

        if ($type == 'boolean') {
            $param = (bool) $param;
        }

        return $param;
    }
}
