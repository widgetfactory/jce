<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_BASE') or die('RESTRICTED');

// prevent fatal error in legacy versions
if (!class_exists('WFElement')) {
    class WFElement extends JElement
    {
    }
}

/**
 * Renders a select element.
 */
class WFElementFontlist extends WFElement
{
    /*
     * Element type
     *
     * @access	protected
     * @var		string
     */
    public $_name = 'FontList';

    public function fetchElement($name, $value, &$node, $control_name)
    {
        $document = JFactory::getDocument();

        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        $ctrl = $control_name.'['.$name.']';
        $attribs = array();
        $new = '';
        $class = '';

        $options = array();
        $values = array();

        if ($class = (string) $node->attributes()->class) {
            $attribs[] = 'class="fontlist '.$class.'"';
        } else {
            $attribs[] = 'class="fontlist inputbox"';
        }

        $fonts = array();

        $files = JFolder::files(JPATH_ROOT.'/'.(string) $node->attributes()->directory, (string) $node->attributes()->filter);

        // value to string
        $value = (string) $value;

        // must be a ttf font
        if (!preg_match('#\.ttf$#i', $value)) {
            $value = (string) $node->attributes()->defaults;
        }

        foreach ($files as $file) {
            $val = (string) $file;
            $text = (string) $file;

            if (is_array($value)) {
                $key = array_search($val, $value);
                if ($key !== false) {
                    $options[$key] = JHTML::_('select.option', $val, $text, 'value', 'text');
                }
            } else {
                $options[] = JHTML::_('select.option', $val, $text, 'value', 'text');
            }

            // create temp values
            $values[] = $val;
            $fonts[] = '@font-face {font-family: '.basename($file, '.ttf').'; src: url("'.JURI::root(true).'/'.$node->attributes()->directory.'/'.$file.'");}';
            $fonts[] = 'option[value$="'.$file.'"]{font-family:'.basename($file, '.ttf').';font-size:10pt;}';
        }

        if (!empty($fonts)) {
            $document->addStyleDeclaration(implode("\n", $fonts));
        }

        // re-sort options by key
        ksort($options);

        // method to append additional values to options array
        if (is_array($value)) {
            $diff = array_diff($values, $value);
            foreach ($node->children() as $option) {
                $val = (string) $option->attributes()->value;
                $text = (string) $option;

                $text = strpos($text, 'WF_') === false ? $text : WFText::_($text);

                if (in_array($val, $diff)) {
                    $options[] = JHTML::_('select.option', $val, $text);
                }
            }
        }

        // revert to default values
        if ($value === '') {
            $value = (string) $node->attributes()->default;
        }

        // editable lists
        if (strpos($class, 'editable') !== false) {
            // pattern data attribute for editable select input box
            if ((string) $node->attributes()->pattern) {
                $attribs[] = 'data-pattern="'.(string) $node->attributes()->pattern.'"';
            }

            $value = strpos($value, 'WF_') === false ? $value : WFText::_($value);

            // editable lists - add value to list
            if ($value !== '' && !in_array($value, $values)) {
                $options[] = JHTML::_('select.option', $value, $value);
            }
        }

        // pattern data attribute for editable select input box
        if ((string) $node->attributes()->parent) {
            $prefix = preg_replace(array('#^params#', '#([^\w]+)#'), '', $control_name);

            $items = array();

            foreach (explode(';', (string) $node->attributes()->parent) as $item) {
                $items[] = $prefix.$item;
            }

            $attribs[] = 'data-parent="'.implode(';', $items).'"';
        }

        return JHTML::_('select.genericlist', $options, $ctrl, implode(' ', $attribs), 'value', 'text', $value, $control_name.$name);
    }
}
