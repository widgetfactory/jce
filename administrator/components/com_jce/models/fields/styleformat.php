<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormField;
use Joomla\CMS\Language\Text;

/**
 * Renders a select element.
 */
class JFormFieldStyleFormat extends FormField
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

        $subForm = new Form($this->name);

        // editor manifest
        $manifest = JPATH_ADMINISTRATOR . '/components/com_jce/models/forms/styleformat.xml';
        $xml = simplexml_load_file($manifest);
        $subForm->load($xml);

        $fields = $subForm->getFieldset();

        $output[] = '<div class="styleformat-list">';

        $x = 0;

        foreach ($items as $item) {
            $elements = array('<div class="styleformat border bg-light-subtle">');

            foreach ($fields as $field) {
                $key = (string) $field->element['name'];

                // default value
                $field->value = "";

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
            $elements[] = '<button class="styleformat-item-trash btn btn-link"><i class="icon icon-trash"></i></button>';
            // collapse
            $elements[] = '<button class="close collapse btn btn-link"><i class="icon icon-chevron-up"></i><i class="icon icon-chevron-down"></i></button>';

            $elements[] = '</div>';

            $elements[] = '</div>';

            $output[] = implode('', $elements);

            $x++;
        }

        $output[] = '<button class="btn btn-link styleformat-item-plus border"><span class="text-left">' . Text::_('WF_STYLEFORMAT_NEW') . '</span><i class="icon icon-plus"></i></button>';

        // hidden field
        $output[] = '<input type="hidden" name="' . $this->name . '" value="" />';

        if (!empty($theme_advanced_styles)) {
            $output[] = '<input type="hidden" name="' . $this->getName('theme_advanced_styles') . '" value="" class="isdirty" />';
        }

        $output[] = '</div>';

        return implode("\n", $output);
    }
}
