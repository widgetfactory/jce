<?php
/**
 * @package     JCE
 * @subpackage  System.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\System\Jce\PluginTraits;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;


// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * Handles the onDisplay event for the JCE editor.
 *
 * @since  3.9.59
 */
trait TemplatesTrait
{
    protected $mediaLoaded = false;

    protected $booted = false;

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

    protected function BeforeEditorLoad($config = array())
    {
        $items = glob(JPATH_PLUGINS . '/system/jce/templates/*.php');

        foreach ($items as $item) {
            $name = basename($item, '.php');

            $className = 'WfTemplate' . ucfirst($name);

            require_once $item;

            $this->bootCustomPlugin($className);
        }

        return $config;
    }

    public function onAfterRoute()
    {
        // JCE Pro will load media
        if (PluginHelper::isEnabled('system', 'jcepro')) {
            $this->mediaLoaded = true;
        }
    }
}
