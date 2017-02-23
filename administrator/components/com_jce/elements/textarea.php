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

/**
 * Renders a textarea element.
 */
class WFElementTextarea extends WFElement
{
    /*
     * Element name
     *
     * @access	protected
     * @var		string
     */
    public $_name = 'Textarea';

    public function fetchElement($name, $value, &$node, $control_name)
    {
        $attribs = array(' ');

        $attributes = array(
            'placeholder' => '',
            'spellcheck' => '',
        );

        foreach ($attributes as $k => $v) {
            $av = (string) $node->attributes()->$k;
            if ($av || $v) {
                $v = !$av ? $v : $av;
                $attribs[] = $k.'="'.$v.'"';
            }
        }

        // pattern data attribute for editable select input box
        if ((string) $node->attributes()->parent) {
            $attribs[] = 'data-parent="'.preg_replace(array('#^params#', '#([^\w]+)#'), '', $control_name).(string) $node->attributes()->parent.'"';
        }

        $attribs[] = 'rows="'.(string) $node->attributes()->rows.'"';
        $attribs[] = 'cols="'.(string) $node->attributes()->cols.'"';

        $attribs[] = 'class="'.(string) $node->attributes()->class.'"';

        // convert <br /> tags so they are not visible when editing
        $value = str_replace('<br />', "\n", $value);

        return '<textarea name="'.$control_name.'['.$name.']" id="'.$control_name.$name.'"'.implode(' ', $attribs).'>'.$value.'</textarea>';
    }
}
