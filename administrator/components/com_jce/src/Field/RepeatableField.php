<?php
/**
 * @package     JCE
 * @subpackage  Component
 *
 * @copyright   Copyright (C) 2005 - 2019 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2006 - 2020 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE
 */
namespace Joomla\Component\Jce\Administrator\Field;

use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormField;
use Joomla\CMS\Language\Text;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * Form Field class for the JCE.
 * Display a field with a repeatable set of defined sub fields
 *
 * @since       2.7
 */
class RepeatableField extends FormField
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

        if (empty($values)) {
            $values = array();
        }

        // explode to array if string
        if (is_string($values)) {
            $values = explode(',', $values);
        }

        // remove emtpy arrays
        $values = array_filter($values);

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
            $str[] = '      <button class="btn btn-link form-field-repeatable-add" aria-label="' . Text::_('JGLOBAL_FIELD_ADD') . '"><span class="icon icon-plus"></span></button>';
            $str[] = '      <button class="btn btn-link form-field-repeatable-remove" aria-label="' . Text::_('JGLOBAL_FIELD_REMOVE') . '"><span class="icon icon-trash"></span></button>';
            $str[] = '  </div>';

            $str[] = '</div>';

            $key++;
        }

        $str[] = '</div>';

        return implode("", $str);
    }
}
