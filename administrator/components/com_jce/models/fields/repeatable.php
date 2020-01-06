<?php
/**
 * @package     JCE
 * @subpackage  Component
 *
 * @copyright   Copyright (C) 2005 - 2019 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2006 - 2020 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE
 */

defined('JPATH_PLATFORM') or die;

/**
 * Form Field class for the JCE.
 * Display a field with a repeatable set of defined sub fields
 *
 * @since       2.7
 */
class JFormFieldRepeatable extends JFormField
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
        $subForm = new JForm($this->name, array('control' => $this->formControl));
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

        foreach ($values as $value) {
            $class  = '';

            // highlight grouped fields
            if (count($fields) > 1) {
                $class = ' well well-small p-2 bg-light';
            }
            
            $str[] = '<div class="form-field-repeatable-item">';
            $str[] = '  <div class="form-field-repeatable-item-group' . $class . '">';

            $n = 0;

            foreach ($fields as $field) {
                $field->element['multiple'] = true;

                // substitute for repeatable element
                $field->element['name'] = (string) $this->element['name'];

                if (is_array($value)) {
                    $value = isset($value[$n]) ? $value[$n] : $value[0];
                }
 
                // escape value
                $field->value = htmlspecialchars($value, ENT_COMPAT, 'UTF-8');

                $field->setup($field->element, $field->value, $this->group);

                // reset id
                $field->id .= '_' . $n;

                if (strpos($field->name, '[]') === false) {
                    $field->name .= '[]';
                }

                $str[] = $field->renderField();
                
                $n++;
            }

            $str[] = '  </div>';

            $str[] = '  <div class="form-field-repeatable-item-control">';
            $str[] = '      <button class="btn btn-link form-field-repeatable-add" aria-label="' . JText::_('JGLOBAL_FIELD_ADD') . '"><i class="icon icon-plus pull-right float-right"></i></button>';
            $str[] = '      <button class="btn btn-link form-field-repeatable-remove" aria-label="' . JText::_('JGLOBAL_FIELD_REMOVE') . '"><i class="icon icon-trash pull-right float-right"></i></button>';
            $str[] = '  </div>';

            $str[] = '</div>';
        }

        return implode("", $str);
    }
}
