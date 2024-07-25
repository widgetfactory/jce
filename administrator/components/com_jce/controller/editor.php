<?php

/**
 * @copyright     Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/copyleft/gpl.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Session\Session;

class JceControllerEditor extends BaseController
{
    public function execute($task)
    {
        // check for session token
        Session::checkToken('get') or jexit(Text::_('JINVALID_TOKEN'));

        $editor = new WFEditor();

        if (strpos($task, '.') !== false) {
            list($name, $task) = explode('.', $task);
        }

        if (method_exists($editor, $task)) {
            $editor->$task();
        }

        jexit();
    }
}
