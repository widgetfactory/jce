<?php

/**
 * @copyright     Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 3 - http://www.gnu.org/copyleft/gpl.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Filesystem\Path;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Language\Text;

class JceControllerPlugin extends BaseController
{
    private static $map = array(
        'image' => 'imgmanager',
        'imagepro' => 'imgmanager_ext',
    );

    private function createClassName($name)
    {
        $delim = array('-', '_');

        $name = str_replace($delim, ' ', $name);

        $className = 'WF' . ucwords($name) . 'Plugin';

        // remove space
        $className = str_replace(' ', '', $className);

        return $className;
    }

    public function execute($task)
    {
        // Check for request forgeries
        Session::checkToken('request') or jexit(Text::_('JINVALID_TOKEN'));
        
        $wf = WFApplication::getInstance();

        // load language files
        $language = Factory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR);

        $plugin = $this->input->get('plugin');

        // get plugin name
        if (strpos($plugin, '.') !== false) {
            list($plugin, $caller) = explode('.', $plugin);
        }

        // map plugin name to internal / legacy name
        if (array_key_exists($plugin, self::$map)) {
            $plugin = self::$map[$plugin];
            $mapped = $plugin;

            if (!empty($caller)) {
                $mapped = $plugin . '.' . $caller;
            }

            $this->input->set('plugin', $mapped);
        }

        // not a valid plugin
        JcePluginsHelper::isValidPlugin($plugin) or jexit('The request references an invalid plugin.');

        // check a valid profile exists using the given plugin
        $wf->getProfile($plugin) or jexit('The request references an invalid profile');

        // execute early plugin event for system plugins, eg: plg_system_jcepro
        Factory::getApplication()->triggerEvent('onWfPluginBeforeInit', array($plugin));

        // create classname
        $className = $this->createClassName($plugin);

        $filepath = Path::find(
            // search "pro" path first
            array(
                WF_EDITOR_PRO_PLUGINS . '/' . $plugin,
                WF_EDITOR_PLUGINS . '/' . $plugin
            ),
            $plugin . '.php'
        );

        // installed plugins
        if (preg_match('/^editor[-_]/', $plugin)) {
            $path = JPATH_PLUGINS . '/jce/' . $plugin;

            // check for alternate path
            if (is_dir($path . '/src')) {
                // rename plugin, eg: editor-chatgpt -> chatgpt
                $plugin = substr($plugin, 7);
            }

            $filepath = Path::find(
                array(
                    $path,
                    $path . '/src'
                ),
                $plugin . '.php'
            );
        }

        if (!file_exists($filepath)) {
            jexit('The requested references an invalid plugin.');
        }

        include_once $filepath;

        if (class_exists($className)) {            
            // load language file if any
            $language->load('plg_jce_' . $plugin, dirname($filepath));

            $instance = new $className();

            if (strpos($task, '.') !== false) {
                list($name, $task) = explode('.', $task);
            }

            if ($task === 'display') {
                $task = 'execute';
            }

            // default to execute if task is not available
            if (is_callable(array($instance, $task)) === false) {
                $task = 'execute';
            }

            $instance->$task();
        }

        jexit();
    }
}
