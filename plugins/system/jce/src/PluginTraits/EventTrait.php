<?php
/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\System\Jce\PluginTraits;

use Joomla\CMS\Factory;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * Handles the onDisplay event for the JCE editor.
 *
 * @since  2.9.70
 */
trait EventTrait
{
    private function getDummyDispatcher()
    {
        $app = Factory::getApplication();

        if (method_exists($app, 'getDispatcher')) {
            $dispatcher = Factory::getApplication()->getDispatcher();
        } else {
            $dispatcher = JEventDispatcher::getInstance();
        }

        return $dispatcher;
    }

    private function bootCustomPlugin($className, $config = array())
    {
        if (class_exists($className)) {
            $dispatcher = $this->getDummyDispatcher();

            // Instantiate and register the event
            $plugin = new $className($dispatcher, $config);

            if ($plugin instanceof \Joomla\CMS\Extension\PluginInterface) {
                $plugin->registerListeners();
            }
        }
    }

    public function onBeforeWfEditorLoad()
    {
        $path = JPATH_PLUGINS . '/system/jce';

        $items = glob($path . '/templates/*.php');

        foreach ($items as $item) {
            $name = basename($item, '.php');

            $className = 'WfTemplate' . ucfirst($name);

            require_once $item;

            $this->bootCustomPlugin($className);
        }
    }
}
