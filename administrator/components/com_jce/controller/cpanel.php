<?php

/**
 * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\MVC\Controller\AdminController;
use Joomla\CMS\Factory;

class JceControllerCpanel extends AdminController
{
    public function feed()
    {
        $model = $this->getModel('cpanel');

        echo json_encode(array(
            'feeds' => $model->getFeeds()
        ));

        // Close the application
		Factory::getApplication()->close();
    }
}
