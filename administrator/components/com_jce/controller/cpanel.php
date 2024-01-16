<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Controller\BaseController;

class JceControllerCpanel extends BaseController
{
    public function feed()
    {
        $model = $this->getModel('cpanel');

        echo json_encode(array(
            'feeds' => $model->getFeeds(),
        ));

        // Close the application
        Factory::getApplication()->close();
    }
}
