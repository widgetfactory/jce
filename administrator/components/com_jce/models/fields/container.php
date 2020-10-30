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
        
        $subForm    = new JForm('', array('control' => $this->formControl . '[' . str_replace('.', '][', $group) . ']'));
        $children   = $this->element->children();

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

        // And finaly build a main container
        $str = array();

        $fields = $subForm->getFieldset();

        if ($this->class === 'inset') {
            $this->class .= ' well well-small well-light p-4 bg-light';
        }

        $str[] = '<div class="form-field-container ' . $this->class . '">';
        $str[] = '  <fieldset class="form-field-container-group">';

        if ($this->element['label']) {
            $text = $this->element['label'];
            $text = $this->translateLabel ? JText::_($text) : $text;
            
            $str[] = '<legend>' . $text . '</legend>';
        }

        if ($this->element['description']) {
            $text = $this->element['description'];
            $text = $this->translateLabel ? JText::_($text) : $text;
            
            $str[] = '<small class="description">' . $text . '</small>';

            // reset description
            $this->description = '';
        }

        foreach ($fields as $field) {
            $str[] = $field->renderField(array('description' => $field->description));
        }

        $str[] = '  </fieldset>';
        $str[] = '</div>';

        return implode("", $str);
    }
}
