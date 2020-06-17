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
        
        $subForm    = new JForm('', array('control' => $this->formControl . '[' . $group . ']'));
        $children   = $this->element->children();

        $subForm->load($children);
        $subForm->setFields($children);

        $data = $this->form->getData()->toObject();

        if (isset($data->$group)) {
            $subForm->bind($data->$group);
        }

        // And finaly build a main container
        $str = array();

        $fields = $subForm->getFieldset();

        if ($this->class === 'inset') {
            $this->class .= ' well well-small well-light p-4 bg-white';
        }

        $str[] = '<div class="form-field-container ' . $this->class . '">';
        $str[] = '  <fieldset class="form-field-container-group">';

        if ($this->element['label']) {
            $text = $this->element['label'];
            $text = $this->translateLabel ? JText::_($text) : $text;
            
            $str[] = '<legend>' . $text . '</legend>';
        }

        foreach ($fields as $field) {
            $str[] = $field->renderField();
        }

        $str[] = '  </fieldset>';
        $str[] = '</div>';

        return implode("", $str);
    }
}
