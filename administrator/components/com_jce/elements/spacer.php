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
defined('_JEXEC') or die;

/**
 * Renders a spacer element.
 */
class WFElementSpacer extends WFElement
{
    /**
     * Element name.
     *
     * @var string
     */
    protected $_name = 'Spacer';

    public function fetchTooltip($label, $description, &$node, $control_name = '', $name = '')
    {
        $html = '';
        if ($label) {
            $html .= '<h3>'.WFText::_($label).'</h3>';
        }

        $html .= '<hr />';

        return $html;
    }

    public function fetchElement($name, $value, &$node, $control_name)
    {
        return '';
    }
}
