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

    // Function to check if two arrays are equal
    private function arraysEqual($arr1, $arr2)
    {
        if (count($arr1) !== count($arr2)) {
            return false;
        }

        for ($i = 0; $i < count($arr1); $i++) {
            if ($arr1[$i] !== $arr2[$i]) {
                return false;
            }
        }

        return true;
    }

    // Function to check if an array exists within another array of arrays
    private function arrayExistsInContainer($container, $array)
    {
        foreach ($container as $containedArray) {
            if ($this->arraysEqual($containedArray, $array)) {
                return true;
            }
        }

        return false;
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
            // collapse
            $str[] = '<div class="form-field-repeatable">';
        }

        $containerValues = array();

        for ($i = 0; $i < $count; $i++) {
            $item = array();

            if ($repeatable) {
                $item[] = '<div class="form-field-repeatable-item well p-3 card my-2">';
                $item[] = '  <div class="form-field-repeatable-item-group">';
            }

            $subForm = new Form('', array('control' => $this->formControl . '[' . str_replace('.', '][', $group) . ']'));

            $subForm::addFieldPath(__DIR__);

            $subForm->load($children);
            $subForm->setFields($children);

            $subForm->bind($data);
            $fields = $subForm->getFieldset();

            $defaultValues = array();
            $fieldValues = array();

            foreach ($fields as $field) {
                $tmpField = clone $field;
                
                $name = (string) $tmpField->element['name'];
                $value = (string) $tmpField->element['default'];

                $defaultValues[] = $value;

                if (empty($name)) {
                    continue;
                }

                if (is_array($data) && isset($data[$name])) {
                    $value = $data[$name];
                }

                $type = (string) $tmpField->element['type'];

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
                    // handle nested arrays
                    array_walk_recursive($value, function (&$item) {
                        if (is_string($item)) {
                            $item = htmlspecialchars($item, ENT_COMPAT, 'UTF-8');
                        }
                    });
                } else {
                    $value = htmlspecialchars($value, ENT_COMPAT, 'UTF-8');
                }

                // store value for repeatable check
                $fieldValues[] = $value;

                $tmpField->value = $value;
                $tmpField->setup($tmpField->element, $tmpField->value);

                if ($repeatable) {
                    // reset id
                    $tmpField->id .= '_' . $i;

                    if (strpos($tmpField->name, '[]') === false) {
                        $tmpField->name .= '[]';
                    }
                }

                $item[] = $tmpField->renderField(array('description' => $tmpField->description));
            }

            if ($repeatable) {
                $item[] = '</div>';

                $item[] = '<div class="form-field-repeatable-item-control">';
                $item[] = '<button class="btn btn-link form-field-repeatable-add" aria-label="' . Text::_('JGLOBAL_FIELD_ADD') . '"><i class="icon icon-plus"></i></button>';
                $item[] = '<button class="btn btn-link form-field-repeatable-remove" aria-label="' . Text::_('JGLOBAL_FIELD_REMOVE') . '"><i class="icon icon-trash"></i></button>';
                $item[] = '</div>';

                $item[] = '</div>';
            }

            // remove empty fields with default values
            if ($count > 1 && $this->arraysEqual($defaultValues, $fieldValues)) {
                continue;
            }

            // only add if unique
            if ($this->arrayExistsInContainer($containerValues, $fieldValues)) {
                continue;
            }

            $str[] = implode('', $item);
            $containerValues[] = $fieldValues;
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
