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
        // check for session token
        Session::checkToken('request') or jexit(Text::_('JINVALID_TOKEN'));
        
        $wf = WFApplication::getInstance();
        $language = Factory::getLanguage();

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

        // check this is a valid plugin
        $wf->isValidPlugin($plugin) or jexit('Invalid Plugin');

        // check a valid profile exists
        $wf->getProfile($plugin) or jexit('Invalid Profile');

        // load language files
        $language->load('com_jce', JPATH_ADMINISTRATOR);
        $language->load('com_jce_pro', JPATH_SITE);

        // create classname
        $className = $this->createClassName($plugin);

        // package plugins
        $path = WF_EDITOR_PLUGINS . '/' . $plugin;

        // fullpath
        $filepath = $path . '/' . $plugin . '.php';

        // installed plugins
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
        }

        if (!file_exists($filepath)) {
            jexit('Invalid Plugin');
        }

        include_once $filepath;

        if (class_exists($className)) {            
            // load language file if any
            $language->load('plg_jce_' . $plugin, $path);

            $instance = new $className();
            $instance->execute($task);
        }

        jexit();
    }
}
