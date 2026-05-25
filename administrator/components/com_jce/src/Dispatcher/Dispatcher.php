<?php

/**
 * @package     Jce.Administrator
 * @subpackage  com_jce
 *
 * @copyright   Copyright (C) 2026 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Dispatcher;

use Joomla\CMS\Dispatcher\ComponentDispatcher;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * ComponentDispatcher class for com_jce administrator
 *
 * @since  3.0.0
 */
class Dispatcher extends ComponentDispatcher
{
    public function dispatch()
    {
        $wa = $this->app->getDocument()->getWebAssetManager();
        $wa->getRegistry()->addRegistryFile('administrator/components/com_jce/joomla.asset.json');

        parent::dispatch();
    }
}
