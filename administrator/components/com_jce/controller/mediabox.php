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
use Joomla\CMS\MVC\Controller\FormController;

class JceControllerMediabox extends FormController
{
    public function __construct($config = array())
    {
        parent::__construct($config);
        // return to control panel on cancel/close
        $this->view_list = 'cpanel';

        // only for Joomla 3.x
        if (version_compare(JVERSION, '4', 'lt')) {
            require_once JPATH_COMPONENT_ADMINISTRATOR . '/includes/classmap.php';
        }
    }

    public function display($cachable = false, $urlparams = array())
    {
        if (!Factory::getUser()->authorise('jce.mediabox', 'com_jce')) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }

        return parent::display($cachable, $urlparams);
    }

    protected function allowAdd($data = [])
    {
        return Factory::getUser()->authorise('jce.mediabox', 'com_jce');
    }

    protected function allowEdit($data = [], $key = 'id')
    {
        return Factory::getUser()->authorise('jce.mediabox', 'com_jce');
    }
}
