<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Session\Session;

class JceControllerCpanel extends BaseController
{
    public function feed()
    {
        Session::checkToken('get') or jexit(Text::_('JINVALID_TOKEN'));

        $user = Factory::getUser();

        if (!$user->authorise('core.manage', 'com_jce')) {
            throw new Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        $model = $this->getModel('cpanel');

        echo json_encode(array(
            'feeds' => $model->getFeeds(),
        ));

        // Close the application
        Factory::getApplication()->close();
    }
}
