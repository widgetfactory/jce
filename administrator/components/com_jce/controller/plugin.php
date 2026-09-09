<?php

/**
 * @copyright     Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license       GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
\defined('_JEXEC') or die;

require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Language\Text;
use Joomla\Filesystem\Path;

class JceControllerPlugin extends BaseController
{
    private const ALLOWED_TASKS = ['display', 'xhr', 'loadlanguages', 'pack'];

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

    /**
     * Check that a resolved plugin file is a php file inside a directory plugins live in.
     *
     * The path can come from an onWfPluginExecute handler, which is free to set anything,
     * so it is confined here rather than trusted. Roots are permitted in full: any third
     * party serving its own file from its own plugin folder is allowed.
     *
     * @param string $filepath The resolved plugin file path
     *
     * @return bool
     */
    private function isPluginPath($filepath)
    {
        // normalise separators without resolving symlinks
        $filepath = Path::clean($filepath);

        if (strpos($filepath, '..') !== false || !is_file($filepath)) {
            return false;
        }

        if (strtolower(pathinfo($filepath, PATHINFO_EXTENSION)) !== 'php') {
            return false;
        }

        $roots = array(JPATH_PLUGINS, WF_EDITOR_PLUGINS);

        // only defined when the pro plugin is installed
        if (defined('WF_EDITOR_PRO_PLUGINS')) {
            $roots[] = WF_EDITOR_PRO_PLUGINS;
        }

        $realpath = realpath($filepath);

        foreach ($roots as $root) {
            if (strpos($filepath, Path::clean($root . '/')) === 0) {
                return true;
            }

            $realroot = realpath($root);

            if ($realroot && $realpath && strpos($realpath, Path::clean($realroot . '/')) === 0) {
                return true;
            }
        }

        return false;
    }

    public function execute($task)
    {
        // check for session token
        Session::checkToken('request') or jexit(Text::_('JINVALID_TOKEN'));

        // accept the "controller.task" form too, in case the caller has not stripped the
        // prefix, as JceControllerEditor::execute() already does
        if (strpos($task, '.') !== false) {
            list($name, $task) = explode('.', $task);
        }

        // validate the task against allowed tasks
        if (!in_array($task, self::ALLOWED_TASKS, true)) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }
        
        $wf = WFApplication::getInstance();

        $app = Factory::getApplication();
        $language = Factory::getLanguage();

        $plugin = $this->input->get('plugin', '', 'cmd');
        $caller = '';

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

        // check this is a valid plugin
        if (!$wf->isValidPlugin($plugin)) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // check a valid profile exists
        if (!$wf->checkProfile($plugin)) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // load language files
        $language->load('com_jce', JPATH_ADMINISTRATOR);

        // assume the file does not exist
        $filepath = false;

        // check installed plugins first
        if (preg_match('/^editor[-_]/', $plugin)) {
            $path = JPATH_PLUGINS . '/jce/' . $plugin;
            
            // installed plugin path
            $filepath = $path . '/' . $plugin . '.php';

            // check for alternate path
            if (is_dir($path . '/src')) {
                // rename plugin
                $name = substr($plugin, 7);
                
                // reset filepath
                $filepath = $path . '/src/' . $name . '.php';
            }

            if (!file_exists($filepath)) {
                $filepath = false;
            }
        }

        // check custom and pro plugins
        $app->triggerEvent('onWfPluginExecute', array($plugin, &$filepath));

        // check core plugins
        if (false === $filepath) {
            $filepath = Path::find(
                array(
                    WF_EDITOR_PLUGINS . '/' . $plugin
                ),
                $plugin . '.php'
            );
        }

        // an event handler can set any path, so confine it before including
        if (false === $filepath || !$this->isPluginPath($filepath)) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        include_once $filepath;

        // create classname
        $className = $this->createClassName($plugin);

        if (class_exists($className)) {            
            // load language file if any
            $language->load('plg_jce_' . $plugin, dirname($filepath));

            $instance = new $className(
                array(
                    'base_path' => dirname($filepath)
                )
            );

            $instance->execute($task);
        }

        jexit();
    }
}
