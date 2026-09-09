<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;

/**
 * Request gate for the com_jce administrator entry point.
 *
 * Joomla 3 has no ComponentDispatcher, and on Joomla 4 a non-namespaced component still
 * routes through jce.php, so this stands in for the Dispatcher class 3.0 uses.
 *
 * @since 2.9.99
 */
class JceDispatcher
{
    /**
     * The complete set of tasks com_jce answers to, as controller => array(action, tasks).
     * Anything not listed here is rejected before a controller is instantiated, so tasks
     * inherited from AdminController and FormController - including any a future Joomla
     * release adds - stay unreachable unless named explicitly.
     * 
     * This mirrors Dispatcher::ALLOWED_TASKS in 3.0. Deltas: 3.0 has no cpanel controller,
     * and names the browser controller "filebrowser".
     *
     * @var array
     */
    private const ALLOWED_TASKS = array(
        // The base JceController, which handles view display and its own per-view checks.
        '' => array('action' => null, 'tasks' => array('display')),
        'cpanel' => array(
            'action' => 'core.manage', 
            'tasks' => array('feed')
        ),
        'profiles' => array(
            'action' => 'jce.profiles',
            'tasks' => array(
                'publish', 'unpublish', 'delete', 'reorder', 'orderup', 'orderdown',
                'saveorder', 'saveorderajax', 'checkin', 'copy', 'export', 'import', 'repair',
            ),
        ),
        'profile' => array(
            'action' => 'jce.profiles',
            'tasks' => array('add', 'edit', 'save', 'apply', 'save2new', 'cancel'),
        ),
        'config' => array(
            'action' => 'jce.config',
            'tasks' => array('display', 'save', 'apply', 'cancel'),
        ),
        'mediabox' => array(
            'action' => 'jce.mediabox',
            'tasks' => array('display', 'save', 'apply', 'cancel'),
        ),
        'browser' => array(
            'action' => 'jce.browser',
            'tasks' => array('display'),
        ),
        // The editor and plugin controllers authorise per profile and per plugin in their own execute()
        'editor' => array('action' => null, 'tasks' => array('loadlanguages', 'pack', 'compileless')),
        'plugin' => array('action' => null, 'tasks' => array('display', 'xhr', 'loadlanguages', 'pack')),
    );

    /**
     * Reject the request unless the task is allowed and the user holds its action.
     *
     * Must run before BaseController::getInstance(), which rewrites the "task" input to
     * the bare task.
     *
     * @return void
     *
     * @throws Exception
     */
    public static function checkAccess()
    {
        list($controller, $task) = self::parseCommand();

        if (!isset(self::ALLOWED_TASKS[$controller]) || !in_array($task, self::ALLOWED_TASKS[$controller]['tasks'], true)) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        // A task-less request lands on the base JceController, which gates on the view
        // instead; see JceController::ALLOWED_VIEWS.
        self::authorise(self::ALLOWED_TASKS[$controller]['action']);
    }

    /**
     * Throw unless the current user holds the given com_jce action.
     *
     * @param string|null $action The action, or null when no permission is needed
     *
     * @return void
     *
     * @throws Exception
     */
    private static function authorise($action)
    {
        if ($action === null) {
            return;
        }

        if (!Factory::getUser()->authorise($action, 'com_jce')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }
    }

    /**
     * Resolve the request to the controller and task that will run.
     *
     * This mirrors BaseController::getInstance(). Unlike ComponentDispatcher, the legacy
     * path has no separate "controller" variable - no prefix means the base controller.
     *
     * @return array array($controller, $task), both lowercase
     *
     * @throws Exception If the task is not a string
     */
    private static function parseCommand()
    {
        $input = Factory::getApplication()->input;

        // The task value should only ever be a string
        if (!is_string($input->get('task', 'display', 'raw'))) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        $command = strtolower($input->getCmd('task', 'display'));

        // The admin forms post an empty task, which BaseController::execute() resolves to
        // its __default handler. Input::get() returns that empty string rather than the
        // default above, so normalise it here.
        if ($command === '') {
            $command = 'display';
        }

        // "plugin" was a legacy bare task; it is only valid as a controller prefix now.
        if (strpos($command, '.') === false) {
            return array('', $command);
        }

        return explode('.', $command);
    }
}
