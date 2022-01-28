<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_BASE') or die;

use Joomla\Utilities\ArrayHelper;

/**
 * Renders a select element.
 */
class JFormFieldStyleFormat extends JFormField
{
    /*
     * Element type
     *
     * @access    protected
     * @var        string
     */
    protected $type = 'StyleFormat';

    protected function getInput()
    {
        $wf = WFApplication::getInstance();

        $output = array();

        // default item list (remove "attributes" for now)
        $default = array('title' => '', 'element' => '', 'selector' => '', 'classes' => '', 'styles' => '', 'attributes' => '');

        // pass to items
        $items = $this->value;

        if (is_string($items)) {
            $items = json_decode(htmlspecialchars_decode($this->value), true);
        }

        // cast to array
        $items = (array) $items;

        /* Convert legacy styles */
        $theme_advanced_styles = $wf->getParam('editor.theme_advanced_styles', '');

        if (!empty($theme_advanced_styles)) {
            foreach (explode(',', $theme_advanced_styles) as $styles) {
                $style = json_decode('{' . preg_replace('#([^=]+)=([^=]+)#', '"title":"$1","classes":"$2"', $styles) . '}', true);

                if ($style) {
                    $items[] = $style;
                }
            }
        }

        // create default array if no items
        if (empty($items)) {
            $items = array($default);
        }

        $subForm = new JForm($this->name);

        // editor manifest
        $manifest = JPATH_ADMINISTRATOR . '/components/com_jce/models/forms/styleformat.xml';
        $xml = simplexml_load_file($manifest);
        $subForm->load($xml);

        $fields = $subForm->getFieldset();

        $output[] = '<div class="styleformat-list">';

        $x = 0;

        foreach ($items as $item) {
            $elements = array('<div class="styleformat">');

            foreach($fields as $field) {
                $key = (string) $field->element['name'];

                if (array_key_exists($key, $item)) {
                    $field->value = htmlspecialchars_decode($item[$key], ENT_QUOTES);
                }

                $field->setup($field->element, $field->value, $this->group);
                $field->id = '';
                $field->name = '';

                $elements[] = '<div class="styleformat-item-' . $key . '" data-key="' . $key . '">' . $field->renderField(array('description' => $field->description)) . '</div>';
            }

            $elements[] = '<div class="styleformat-header">';

            // handle
            $elements[] = '<span class="styleformat-item-handle"></span>';
            // delete button
            $elements[] = '<button class="styleformat-item-trash btn btn-link pull-right float-right"><i class="icon icon-trash"></i></button>';
            // collapse
            $elements[] = '<button class="close collapse btn btn-link"><i class="icon icon-chevron-up"></i><i class="icon icon-chevron-down"></i></button>';

            $elements[] = '</div>';

            $elements[] = '</div>';

            $output[] = implode('', $elements);

            $x++;
        }

        $output[] = '<button class="btn btn-link styleformat-item-plus"><span class="span10 col-md-10 text-left">' . JText::_('WF_STYLEFORMAT_NEW') . '</span><i class="icon icon-plus pull-right float-right"></i></button>';

        // hidden field
        $output[] = '<input type="hidden" name="' . $this->name . '" value="" />';

        if (!empty($theme_advanced_styles)) {
            $output[] = '<input type="hidden" name="' . $this->getName('theme_advanced_styles') . '" value="" class="isdirty" />';
        }

        $output[] = '</div>';

        return implode("\n", $output);
    }
}
