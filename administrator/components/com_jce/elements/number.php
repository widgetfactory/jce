<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2012 Open Source Matters, Inc. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_BASE') or die('RESTRICTED');

require_once __DIR__.'/text.php';

/**
 * Renders a text element.
 */
class WFElementNumber extends WFElementText
{
    /*
     * Element name
     *
     * @access	protected
     * @var		string
     */
    public $_name = 'Number';
}
