<?php

/**
 * @package     Jce.Administrator
 * @subpackage  com_jce
 *
 * @copyright   Copyright (c) 2026-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Dispatcher;

use Joomla\CMS\Access\Exception\NotAllowed;
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
    /**
     * The complete set of tasks com_jce answers to in the administrator, as
     * controller => [action, tasks]. Anything not listed here is rejected before a
     * controller is instantiated, so tasks inherited from AdminController and
     * FormController — including any a future Joomla release adds — stay unreachable
     * unless named explicitly.
     *
     * The action is stated per controller rather than derived from the controller name:
     * "profile" needs jce.profiles and "filebrowser" needs jce.browser, so a derived
     * name would be wrong for two of the five. A null action means the task needs no
     * permission beyond the core.manage check the parent already applies.
     *
     * Keys and task names are lowercase; the request is normalised before comparison.
     *
     * @var array
     */
    private const ALLOWED_TASKS = [
        'display' => [
            'action' => null,
            'tasks' => ['display'],
        ],
        'profiles' => [
            'action' => 'jce.profiles',
            'tasks' => [
                'publish', 'unpublish', 'delete', 'reorder', 'orderup', 'orderdown',
                'saveorder', 'saveorderajax', 'checkin', 'copy', 'export', 'import', 'repair',
            ],
        ],
        'profile' => [
            'action' => 'jce.profiles',
            'tasks' => ['add', 'edit', 'save', 'apply', 'save2new', 'cancel'],
        ],
        'config' => [
            'action' => 'jce.config',
            'tasks' => ['display', 'save', 'apply', 'cancel'],
        ],
        'mediabox' => [
            'action' => 'jce.mediabox',
            'tasks' => ['display', 'save', 'apply', 'cancel'],
        ],
        'filebrowser' => [
            'action' => 'jce.browser',
            'tasks' => ['display', 'cancel'],
        ],
        // The editor and plugin controllers authorise per profile and per plugin in
        // their own execute(), which core.manage alone cannot express.
        'editor' => [
            'action' => null,
            'tasks' => ['loadlanguages', 'pack', 'compileless'],
        ],
        'plugin' => [
            'action' => null,
            'tasks' => ['display', 'xhr', 'loadlanguages', 'pack'],
        ],
    ];

    public function dispatch()
    {
        $wa = $this->app->getDocument()->getWebAssetManager();
        $wa->getRegistry()->addRegistryFile('administrator/components/com_jce/joomla.asset.json');

        parent::dispatch();
    }

    /**
     * Check the component access permission, then the requested task.
     *
     * This gate lives in checkAccess() rather than dispatch() so the parent's core.manage
     * denial still takes precedence, and so nothing is instantiated before it runs.
     *
     * @return  void
     *
     * @throws  NotAllowed
     */
    protected function checkAccess()
    {
        parent::checkAccess();

        [$controller, $task] = $this->parseCommand();

        if (!isset(self::ALLOWED_TASKS[$controller]) || !\in_array($task, self::ALLOWED_TASKS[$controller]['tasks'], true)) {
            throw new NotAllowed($this->app->getLanguage()->_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // A task-less request lands on DisplayController, which gates on the view instead;
        // see DisplayController::ALLOWED_VIEWS.
        $this->authorise(self::ALLOWED_TASKS[$controller]['action']);
    }

    /**
     * Throw unless the current user holds the given com_jce action.
     *
     * @param   string|null  $action  The action, or null when core.manage is sufficient.
     *
     * @return  void
     *
     * @throws  NotAllowed
     */
    private function authorise($action)
    {
        if ($action === null) {
            return;
        }

        if (!$this->app->getIdentity()->authorise($action, $this->option)) {
            throw new NotAllowed($this->app->getLanguage()->_('JERROR_ALERTNOAUTHOR'), 403);
        }
    }

    /**
     * Resolve the request to the controller and task that dispatch() will run.
     *
     * This mirrors ComponentDispatcher::dispatch(), including the separate "controller"
     * request variable used when the task carries no controller prefix — without it a
     * request such as &controller=profiles&task=delete would be checked against the
     * wrong controller.
     *
     * @return  array  [$controller, $task], both lowercase
     */
    private function parseCommand()
    {
        $input = $this->app->getInput();

        // The array form of the task variable (?task[x]=1) is a legacy shape that
        // ComponentDispatcher does not support. Reject it here rather than let it reach
        // strtolower() as an array and raise a TypeError.
        if (!\is_string($input->get('task', 'display', 'raw'))) {
            return ['', ''];
        }

        $command = strtolower($input->getCmd('task', 'display'));

        // The admin forms post an empty task, which BaseController::execute() resolves to
        // its __default handler. Input::get() returns that empty string rather than the
        // default above, so normalise it here.
        if ($command === '') {
            $command = 'display';
        }

        // Check for a controller.task command.
        if (str_contains($command, '.')) {
            [$controller, $task] = explode('.', $command);

            return [$controller, $task];
        }

        return [strtolower($input->getCmd('controller', 'display')), $command];
    }
}
