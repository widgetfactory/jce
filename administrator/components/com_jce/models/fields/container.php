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
 * @since       2.8.13
 */
class JFormFieldContainer extends JFormField
{
    /**
     * The form field type.
     *
     * @var    string
     * @since  2.8.13
     */
    protected $type = 'Container';

    /**
     * Method to get the field label markup for a spacer.
     * Use the label text or name from the XML element as the spacer or
     * Use a hr="true" to automatically generate plain hr markup.
     *
     * @return string The field label markup
     *
     * @since   11.1
     */
    protected function getLabel()
    {
        return '';
    }

    /**
     * Method to get the field input markup.
     *
     * @return  string  The field input markup.
     *
     * @since   2.8.13
     */
    protected function getInput()
    {
        $group = $this->group;

        // subfields require JCE Pro
        if (isset($this->element['pro']) && !WF_EDITOR_PRO) {
            return "";
        }

        $subForm = new JForm('', array('control' => $this->formControl . '[' . str_replace('.', '][', $group) . ']'));
        $children = $this->element->children();

        $subForm->load($children);
        $subForm->setFields($children);

        $data = $this->form->getData()->toObject();

        // extract relevant data level using group
        foreach (explode('.', $group) as $key) {
            if (isset($data->$key)) {
                $data = $data->$key;
            }
        }

        $subForm->bind($data);
        $fields = $subForm->getFieldset();

        $count = 1;

        // find number of potential repeatable fields
        foreach ($fields as $field) {
            $name = (string) $field->element['name'];

            if (isset($data->$name) && is_array($data->$name)) {
                $count = max(count($data->$name), $count);
            }
        }

        $repeatable = (string) $this->element['repeatable'];

        // And finaly build a main container
        $str = array();

        if ($this->class === 'inset') {
            $this->class .= ' well well-small well-light p-4 bg-light';
        }

        $str[] = '<div class="form-field-container ' . $this->class . '">';
        $str[] = '<fieldset class="form-field-container-group">';

        if ($this->element['label']) {
            $text = $this->element['label'];
            $text = $this->translateLabel ? JText::_($text) : $text;

            $str[] = '<legend>' . $text . '</legend>';
        }

        if ((string) $this->element['description']) {
            $text = $this->element['description'];
            $text = $this->translateLabel ? JText::_($text) : $text;

            $str[] = '<small class="description">' . $text . '</small>';

            // reset description
            $this->description = '';
        }

        // repeatable
        if ($repeatable) {
            $str[] = '<div class="form-field-repeatable">';

            $class = '';

            // highlight grouped fields
            if ($count > 1) {
                $class = ' well well-small p-4 bg-light';
            }
        }

        for ($i = 0; $i < $count; $i++) {

            if ($repeatable) {
                $str[] = '<div class="form-field-repeatable-item' . $class . '">';
                $str[] = '  <div class="form-field-repeatable-item-group">';
            }

            foreach ($fields as $field) {
                if ($repeatable) {                    
                    $field->element['multiple'] = true;
                    
                    $name   = (string) $field->element['name'];
                    $value  = (string) $field->element['default'];

                    if (isset($data->$name)) {
                        $value = $data->$name;
                    }

                    if (is_array($value)) {
                        $value = isset($value[$i]) ? $value[$i] : '';
                    }
     
                    // escape value
                    $field->value = htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
    
                    // reset id
                    $field->id .= '_' . $i;
    
                    if (strpos($field->name, '[]') === false) {
                        $field->name .= '[]';
                    }
                }

                $str[] = $field->renderField(array('description' => $field->description));
            }

            if ($repeatable) {
                $str[] = '</div>';
                
                $str[] = '<div class="form-field-repeatable-item-control">';
                $str[] = '<button class="btn btn-link form-field-repeatable-add" aria-label="' . JText::_('JGLOBAL_FIELD_ADD') . '"><i class="icon icon-plus pull-right float-right"></i></button>';
                $str[] = '<button class="btn btn-link form-field-repeatable-remove" aria-label="' . JText::_('JGLOBAL_FIELD_REMOVE') . '"><i class="icon icon-trash pull-right float-right"></i></button>';
                $str[] = '</div>';

                $str[] = '</div>';
            }
        }

        // repeatable
        if ($repeatable) {
            $str[] = '</div>';
        }

        $str[] = '</fieldset>';
        $str[] = '</div>';

        return implode("", $str);
    }
}
