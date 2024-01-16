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

use Joomla\CMS\MVC\Controller\FormController;

class JceControllerProfile extends FormController
{
    /**
     * The URL option for the component.
     *
     * @var    string
     */
    protected $option = 'com_jce';

    /**
     * The URL view item variable.
     *
     * @var    string
     */
    protected $view_item = 'profile';

    /**
     * The URL view list variable.
     *
     * @var    string
     */
    protected $view_list = 'profiles';

    public function __construct($config = array())
    {
        parent::__construct($config);

        // only for Joomla 3.x
        if (version_compare(JVERSION, '4', 'lt')) {      
            require_once JPATH_COMPONENT_ADMINISTRATOR . '/includes/classmap.php';
        }
    }
}
