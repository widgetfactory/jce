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
 * Renders a text element.
 */
class WFElementText extends WFElement
{
    /*
     * Element name
     *
     * @access	protected
     * @var		string
     */
    public $_name = 'Text';

    public function fetchElement($name, $value, &$node, $control_name)
    {
        $attributes = array();

        foreach ($node->attributes() as $k => $v) {
            if ($k === 'parent') {
                continue;
            }

            if ($v != '') {
                $attributes[$k] = (string) $v;
            }
        }

        $class = (string) $node->attributes()->class;

        if (strpos($name, 'max_size') !== false || strpos($class, 'upload_size') !== false) {
            $uploadsize = intval($this->getUploadValue());
            $attributes['max'] = $uploadsize;
        }

        $attributes['class'] = ($class ? $class : '');

        $control = $control_name.'['.$name.']';

        // create array id repeatable
        if ((string) $node->attributes()->repeatable) {
            $control .= '[]';
        }

        $attributes['type'] = strtolower($this->_name);
        $attributes['name'] = $control;
        $attributes['id'] = preg_replace('#\W+#', '_', $control_name.$name);

        // pattern data attribute for editable select input box
        if ((string) $node->attributes()->parent) {
            $prefix = preg_replace(array('#^params#', '#([^\w]+)#'), '', $control_name);

            $items = array();

            foreach (explode(';', (string) $node->attributes()->parent) as $item) {
                $items[] = $prefix.$item;
            }

            $attributes['data-parent'] = implode(';', $items);
        }

        if ((string) $node->attributes()->repeatable && is_array($value)) {
            $values = $value;
        } else {
            $values = array(htmlspecialchars_decode($value, ENT_QUOTES));
        }

        $html = '';

        if (strpos($class, 'color') !== false) {
            $html .= '<div class="input-append">';
        }

        foreach ($values as $value) {
            $attributes['value'] = $value;

            if ((string) $node->attributes()->repeatable) {
                $html .= '<div class="ui-repeatable form-inline"><div class="input-append">';
            }

            $html .= '<input';

            foreach ($attributes as $k => $v) {
                if (!in_array($k, array('default', 'label', 'description'))) {
                    $html .= ' '.$k.' = "'.$v.'"';
                }
            }

            $html .= ' />';

            if ((string) $node->attributes()->repeatable) {
                $html .= '<button type="button" class="btn btn-link ui-repeatable-create"><i class="icon-plus"></i></button>';
                $html .= '<button type="button" class="btn btn-link ui-repeatable-delete"><i class="icon-trash"></i></button>';
                $html .= '</div></div>';
            }

            if (strpos($name, 'max_size') !== false) {
                $html .= $this->uploadSize();
            }

            if (strpos($class, 'color') !== false) {
                $html .= '</div>';
            }
        }

        return $html;
    }

    public function uploadSize()
    {
        return '<span class="help-block help-block-inline">'.WFText::_('WF_SERVER_UPLOAD_SIZE').' : '.$this->getUploadValue().'</span>';
    }

    public function getUploadValue()
    {
        $upload = trim(ini_get('upload_max_filesize'));
        $post = trim(ini_get('post_max_size'));

        $upload = $this->convertValue($upload);
        $post = $this->convertValue($post);

        if (intval($post) === 0) {
            return $upload;
        }

        if (intval($upload) < intval($post)) {
            return $upload;
        }

        return $post;
    }

    public function convertValue($value)
    {
        $unit   = 'KB';
        $prefix = '';

        preg_match('#([0-9]+)\s?([a-z]*)#i', $value, $matches);

        // get unit
        if (isset($matches[2])) {
            $prefix = $matches[2];
        }
        // get value
        if (isset($matches[1])) {
            $value = (int) $matches[1];
        }

        // Convert to bytes
        switch (strtolower($prefix)) {
            case 'g':
                $value *= 1073741824;
                break;
            case 'm':
                $value *= 1048576;
                break;
            case 'k':
                $value *= 1024;
                break;
        }

        // Convert to unit value
        switch (strtolower($unit)) {
            case 'g':
            case 'gb':
                $value /= 1073741824;
                break;
            case 'm':
            case 'mb':
                $value /= 1048576;
                break;
            case 'k':
            case 'kb':
                $value /= 1024;
                break;
        }

        return (int) $value.' KB';
    }
}
