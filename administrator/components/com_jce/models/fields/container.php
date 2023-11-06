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
 * Form Field class for the JCE.
 * Display a field with a repeatable set of defined sub fields
 *
 * @since       2.8.13
 */
class JFormFieldContainer extends FormField
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
            $this->class .= ' well well-light p-4 card';
        }

        $str[] = '<div class="form-field-container ' . $this->class . '">';
        $str[] = '<fieldset class="form-field-container-group">';

        if ($this->element['label']) {
            $text = $this->element['label'];
            $text = $this->translateLabel ? Text::_($text) : $text;

            $str[] = '<legend>' . $text . '</legend>';
        }

        if ((string) $this->element['description']) {
            $text = $this->element['description'];
            $text = $this->translateLabel ? Text::_($text) : $text;

            $descriptionClass = isset($this->element['descriptionclass']) ? 'description ' . $this->element['descriptionclass'] : 'description';

            $str[] = '<small class="' . $descriptionClass . '">' . $text . '</small>';

            // reset description
            $this->description = '';
        }

        // repeatable
        if ($repeatable) {
            $str[] = '<div class="form-field-repeatable">';
        }

        for ($i = 0; $i < $count; $i++) {

            if ($repeatable) {
                $str[] = '<div class="form-field-repeatable-item well p-3 card my-2">';
                $str[] = '  <div class="form-field-repeatable-item-group">';
            }

            $subForm = new Form('', array('control' => $this->formControl . '[' . str_replace('.', '][', $group) . ']'));

            $subForm::addFieldPath(__DIR__);

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
                    if (is_array($value)) {
                        $value = implode(',', $value);
                    }
                }

                // extract value if this is a repeatable container
                if (is_array($value) && $repeatable) {
                    $value = isset($value[$i]) ? $value[$i] : '';
                }

                // escape values
                if (is_array($value)) {
                    array_walk($value, function(&$item) {
                        $item = htmlspecialchars($item, ENT_COMPAT, 'UTF-8');
                    });
                } else {
                    $value = htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
                }

                $field->value = $value;
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
                $str[] = '<button class="btn btn-link form-field-repeatable-add" aria-label="' . Text::_('JGLOBAL_FIELD_ADD') . '"><i class="icon icon-plus"></i></button>';
                $str[] = '<button class="btn btn-link form-field-repeatable-remove" aria-label="' . Text::_('JGLOBAL_FIELD_REMOVE') . '"><i class="icon icon-trash"></i></button>';
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
