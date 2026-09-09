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
        // The editor and plugin controllers authorise per profile and per plugin in their own execute()
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
     * Check the requested task, then the component access permission.
     *
     * This gate lives in checkAccess() rather than dispatch() so nothing is instantiated
     * before it runs. The parent's core.manage check is applied per route rather than up
     * front - see isSelfAuthorising() - so it cannot deny a route that is meant to be
     * reachable without it. Every route still ends in a permission check either way.
     *
     * @return  void
     *
     * @throws  NotAllowed
     */
    protected function checkAccess()
    {
        [$controller, $task] = $this->parseCommand();

        if (!isset(self::ALLOWED_TASKS[$controller]) || !\in_array($task, self::ALLOWED_TASKS[$controller]['tasks'], true)) {
            throw new NotAllowed($this->app->getLanguage()->_('JERROR_ALERTNOAUTHOR'), 403);
        }

        if (!$this->isSelfAuthorising($controller)) {
            parent::checkAccess();
        }

        // A task-less request lands on DisplayController, which gates on the view instead;
        // see DisplayController::ALLOWED_VIEWS.
        $this->authorise(self::ALLOWED_TASKS[$controller]['action']);
    }

    /**
     * Whether the resolved route carries its own authorisation instead of core.manage.
     *
     * The editor and plugin controllers authorise per profile, so editor dialogs keep
     * working for authors who do not manage the component. The file browser authorises on
     * jce.browser, which the quickicon grants on its own - requiring core.manage as well
     * would deny the icon it displays.
     *
     * @param   string  $controller  The resolved controller name, lowercase
     *
     * @return  boolean
     */
    private function isSelfAuthorising($controller)
    {
        if (\in_array($controller, ['editor', 'plugin', 'filebrowser'], true)) {
            return true;
        }

        // the file browser is linked task-less as &view=browser, which resolves here
        if ($controller === 'display') {
            $view = strtolower($this->app->getInput()->getCmd('view', ''));

            return \in_array($view, ['browser', 'filebrowser'], true);
        }

        return false;
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

        // The task value should only ever be a string
        if (!\is_string($input->get('task', 'display', 'raw'))) {
            throw new NotAllowed($this->app->getLanguage()->_('JERROR_ALERTNOAUTHOR'), 403);
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
