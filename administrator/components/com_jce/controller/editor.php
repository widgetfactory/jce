<?php

/**
 * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 3 - http://www.gnu.org/copyleft/gpl.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\MVC\Controller\AdminController;
use Joomla\CMS\Factory;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Language\Text;

require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

class JceControllerEditor extends AdminController
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
