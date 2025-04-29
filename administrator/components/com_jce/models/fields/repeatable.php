<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormField;
use Joomla\CMS\Language\Text;

/**
 * Form Field class for the JCE.
 * Display a field with a repeatable set of defined sub fields
 *
 * @since       2.7
 */
class JFormFieldRepeatable extends FormField
{
    /**
     * The form field type.
     *
     * @var    string
     * @since  2.7
     */
    protected $type = 'Repeatable';

    /**
     * Method to get the field input markup.
     *
     * @return  string  The field input markup.
     *
     * @since   2.7
     */
    protected function getInput()
    {
        $subForm = new Form($this->name, array('control' => $this->formControl));
        $children = $this->element->children();
        $subForm->load($children);
        $subForm->setFields($children);

        // And finaly build a main container
        $str = array();

        $values = $this->value;

        // explode to array if string
        if (is_string($values)) {
            $values = explode(',', $values);
        }

        $fields = $subForm->getFieldset();

        $str[] = '<div class="form-field-repeatable">';

        $key = 0;

        foreach ($values as $value) {
            $class = '';

            // highlight grouped fields
            if (count($fields) > 1) {
                $class = ' well p-3 card my-2';
            }

            $str[] = '<div class="form-field-repeatable-item">';
            $str[] = '  <div class="form-field-repeatable-item-group' . $class . '">';

            $n = 0;

            foreach ($fields as $field) {
                $tmpField = clone $field;

                $tmpField->element['multiple'] = true;

                // substitute for repeatable element
                if (!isset($tmpField->element['name'])) {
                    $tmpField->element['name'] = (string) $this->element['name'];
                }

                if (is_array($value)) {
                    $value = isset($value[$n]) ? $value[$n] : $value[0];
                }

                // escape value
                $tmpField->value = htmlspecialchars($value, ENT_COMPAT, 'UTF-8');

                $tmpField->setup($tmpField->element, $tmpField->value, $this->group);
                
                // reset id
                $tmpField->id = $field->id .= '_' . $key;

                // add as form array
                if (strpos($tmpField->name, '[]') === false) {
                    $tmpField->name .= '[]';
                }
        
                $str[] = $tmpField->renderField(array('description' => $field->description));

                $n++;
            }

            $str[] = '  </div>';

            $str[] = '  <div class="form-field-repeatable-item-control">';
            $str[] = '      <button class="btn btn-link form-field-repeatable-add" aria-label="' . Text::_('JGLOBAL_FIELD_ADD') . '"><i class="icon icon-plus"></i></button>';
            $str[] = '      <button class="btn btn-link form-field-repeatable-remove" aria-label="' . Text::_('JGLOBAL_FIELD_REMOVE') . '"><i class="icon icon-trash"></i></button>';
            $str[] = '  </div>';

            $str[] = '</div>';

            $key++;
        }

        $str[] = '</div>';

        return implode("", $str);
    }
}
