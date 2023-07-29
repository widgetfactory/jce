<?php

/**
 * @copyright   Copyright (C) 2015 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2016 Open Source Matters, Inc. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Factory;

/**
 * JCE.
 *
 * @since       2.5.20
 */
class PlgContentJce extends CMSPlugin
{
    public function onContentPrepareForm($form, $data)
    {
        Factory::getApplication()->triggerEvent('onPlgSystemJceContentPrepareForm', array($form, $data));
    }
}
