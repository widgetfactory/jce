<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Language\Text;
/**
 * Releases Main Controller
 *
 * @since  1.5
 */
class EditorController extends BaseController
{
    public function execute($task)
    {
        // check for session token
        Session::checkToken('get') or jexit(Text::_('JINVALID_TOKEN'));

        $editor = new \Wfe\Editor\Editor();

        if (strpos($task, '.') !== false) {
            list($name, $task) = explode('.', $task);
        }

        if (method_exists($editor, $task)) {
            $editor->$task();
        }

        jexit();
    }
}