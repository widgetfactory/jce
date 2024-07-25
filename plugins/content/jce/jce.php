<?php

/**
 * @copyright   Copyright (C) 2015 - 2023 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2024 Open Source Matters, Inc. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Form\Form;

/**
 * JCE.
 *
 * @since       2.5.20
 */
class PlgContentJce extends CMSPlugin
{
    
    /**
     * Process form fields in content.
     * This is included to process Joomla Media Fields in 3rd party extensions that call onContentPrepareForm after the System - JCE plugin has been dispatched.
     *
     * @param Form $form The form to be altered
     * @param mixed $data The associated data for the form
     *
     * @return bool
     *
     */
    public function onContentPrepareForm(Form $form, $data = [])
    {
        Factory::getApplication()->triggerEvent('onWfContentPrepareForm', array($form, $data));
    }
}