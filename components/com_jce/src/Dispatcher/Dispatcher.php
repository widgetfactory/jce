<?php

/**
 * @package     JCE
 * @subpackage  JCE Site
 *
 * @copyright   Copyright (c) 2026-2026 Ryan Demmer. All rights reserved
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
        $input = $this->app->getInput();

        // The array form of the task variable (?task[x]=1) is a legacy shape that
        // ComponentDispatcher does not support. Reject it here rather than let it reach
        // strpos() as an array and raise a TypeError.
        if (!\is_string($input->get('task', '', 'raw'))) {
            throw new NotAllowed('Access denied', 403);
        }

        // the cmd filter does not lowercase, so normalise before matching
        $task = strtolower($input->getCmd('task', ''));
        $ctrl = strpos($task, '.') !== false ? strstr($task, '.', true) : '';

        if (!in_array($ctrl, self::ALLOWED_CONTROLLERS, true)) {
            throw new NotAllowed('Access denied', 403);
        }

        // write the normalised task back so the parent resolves the controller that was
        // actually gated, not the raw mixed-case value
        $input->set('task', $task);

        parent::dispatch();
    }
}