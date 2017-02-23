<?php

/**
 * @copyright     Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_BASE') or die('RESTRICTED');

/**
 * Renders a text element.
 */
class WFElementExtension extends WFElement
{
    /*
     * Element name
     *
     * @access    protected
     * @var        string
     */
    public $_name = 'Extension';

    private static function array_flatten($array, $return)
    {
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $return = self::array_flatten($value, $return);
            } else {
                $return[] = $value;
            }
        }

        return $return;
    }

    private function mapValue($value)
    {
        $data = array();

        // no grouping
        if (strpos($value, '=') === false) {
            return array(explode(',', $value));
        }

        foreach (explode(';', $value) as $group) {
            $items = explode('=', $group);
            $name = $items[0];
            $values = explode(',', $items[1]);

            array_walk($values, function (&$item, $name) {
                if ($name{0} === '-') {
                    $item = '-'.$item;
                }
            }, $name);

            $data[$name] = $values;
        }

        return $data;
    }

    private function cleanValue($value)
    {
        $data = $this->mapValue($value);
        // get array values only
        $values = self::array_flatten($data, array());
        // convert to string
        $string = implode(',', $values);
        // return single array
        return explode(',', $string);
    }

    public function fetchElement($name, $value, &$node, $control_name)
    {
        $value = htmlspecialchars_decode($value, ENT_QUOTES);
        $class = ((string) $node->attributes()->class ? 'class="'.(string) $node->attributes()->class.'"' : '');

        // default extensions list
        $default = (string) $node->attributes()->default;
        // create default array
        $default = $this->mapValue($default);

        if ($value && $value{0} === '=') {
            $value = substr($value, 1);
        }

        if (!empty($value)) {
            $data = $this->mapValue($value);
        }

        $output = array();

        $output[] = '<div class="extensions input-append">';
        $output[] = '<input type="text" name="'.$control_name.'['.$name.']" id="'.$control_name.$name.'" value="'.$value.'" '.$class.' /><button class="btn btn-link extension_edit"><i class="icon-edit icon-apply"></i></button>';

        foreach ($data as $group => $items) {
            $custom = array();

            $output[] = '<dl>';

            if (is_string($group)) {
                $checked = '';

                $is_default = isset($default[$group]);

                if (empty($value) || $is_default || (!$is_default && $group{0} !== '-')) {
                    $checked = ' checked="checked"';
                }

                // clear minus sign
                $group = str_replace('-', '', $group);

                $output[] = '<dt data-extension-group="'.$group.'"><label><input type="checkbox" value="'.$group.'"'.$checked.' />'.$group.'</label></dt>';
            }

            foreach ($items as $item) {
                $checked = '';

                $item = strtolower($item);

                // clear minus sign
                $mod = str_replace('-', '', $item);

                $is_default = isset($default[$group]) && in_array($item, $default[$group]);

                if (empty($value) || $is_default || (!$is_default && $mod === $item)) {
                    $checked = ' checked="checked"';
                }

                $output[] = '<dd><label><input type="checkbox" value="'.$mod.'"'.$checked.' /><span class="file '.$mod.'"></span>&nbsp;'.$mod.'</label>';

                if (!$is_default) {
                    $output[] = '<button class="btn btn-link extension-remove"><span class="icon-trash"></span></button>';
                }

                $output[] = '</dd>';
            }

            $output[] = '<dd class="extension-custom"><span class="file"></span><input type="text" value="" pattern="[a-zA-Z0-9]{2,4}" placeholder="'.WFText::_('WF_EXTENSION_MAPPER_TYPE_NEW', 'Add new type...').'" /><button class="btn btn-link extension-add"><span class="icon-plus"></span></button><button class="btn btn-link extension-remove"><span class="icon-trash"></span></button></dd>';

            $output[] = '</dl>';
        }

        $output[] = '</div>';

        return implode("\n", $output);
    }
}
