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

        // expand group with container name
        if ($this->element['name']) {
            $group .= '.' . (string) $this->element['name'];
        }

        $children = $this->element->children();

        // extract group data
        $data = $this->form->getData()->get($group);
        // to array
        $data = (array) $data;

        $count = 1;

        $repeatable = (string) $this->element['repeatable'];

        if ($repeatable) {            
            // find number of potential repeatable fields
            foreach ($children as $child) {
                $name = (string) $child->attributes()['name'];

                if (isset($data[$name]) && is_array($data[$name])) {
                    $count = max(count($data[$name]), $count);
                }
            }
        }

        // And finaly build a main container
        $str = array();

        if ($this->class == 'inset') {
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
        }

        for ($i = 0; $i < $count; $i++) {

            if ($repeatable) {
                $str[] = '<div class="form-field-repeatable-item well well-small p-3 bg-light my-2">';
                $str[] = '  <div class="form-field-repeatable-item-group">';
            }

            $subForm = new JForm('', array('control' => $this->formControl . '[' . str_replace('.', '][', $group) . ']'));

            $subForm->load($children);
            $subForm->setFields($children);

            $subForm->bind($data);
            $fields = $subForm->getFieldset();

            foreach ($fields as $field) {
                $name = (string) $field->element['name'];
                $value = (string) $field->element['default'];

                if (empty($name)) {
                    continue;
                }

                if (is_array($data) && isset($data[$name])) {
                    $value = $data[$name];
                }

                $type = (string) $field->element['type'];

                // convert checkboxes value to string
                if ($type == 'checkboxes') {
                    $value = is_array($value) ? implode(',', $value) : $value;
                }

                if (is_array($value)) {
                    $value = isset($value[$i]) ? $value[$i] : '';
                }

                // escape value
                $field->value = htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
                $field->setup($field->element, $field->value);

                if ($repeatable) {
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