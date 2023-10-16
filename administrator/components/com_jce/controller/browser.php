<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\MVC\Controller\BaseController;

class JceControllerBrowser extends BaseController
{
    public function __construct($config = array())
    {
        parent::__construct($config);

        // return to control panel on cancel/close
        $this->view_list = 'cpanel';
    }
}
