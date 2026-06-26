<?php

/**
 * @package     JCE
 * @subpackage  JCE Site
 *
 * @copyright   Copyright (C) 2026 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Site\Dispatcher;

use Joomla\CMS\Access\Exception\NotAllowed;
use Joomla\CMS\Dispatcher\ComponentDispatcher;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

class Dispatcher extends ComponentDispatcher
{
    private const ALLOWED_CONTROLLERS = ['plugin', 'editor'];

    public function dispatch(): void
    {
        $task = $this->app->getInput()->getCmd('task', '');
        $ctrl = strpos($task, '.') !== false ? strstr($task, '.', true) : '';

        if (!in_array($ctrl, self::ALLOWED_CONTROLLERS, true)) {
            throw new NotAllowed('Access denied', 403);
        }

        parent::dispatch();
    }
}