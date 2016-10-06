<?php

/**
 * @package     JCE
 * @subpackage  Content.jce
 *
 * @copyright   Copyright (C) 2015 Ryan Demmer. All rights reserved.
 * @copyright   Copyright (C) 2005 - 2016 Open Source Matters, Inc. All rights reserved.
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

/**
 * JCE
 *
 * @package     JCE
 * @subpackage  Content.jce
 * @since       2.5.20
 */
class PlgContentJce extends JPlugin {

    public function onContentPrepareForm($form, $data) {
        JFactory::getApplication()->triggerEvent('onPlgSystemJceContentPrepareForm', array($form, $data));
    }
}