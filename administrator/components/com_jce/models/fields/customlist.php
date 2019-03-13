<?php

defined('JPATH_PLATFORM') or die;

JFormHelper::loadFieldClass('list');

class JFormFieldCustomList extends JFormFieldList
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'CustomList';

    /**
     * Method to get the field input for a tag field.
     *
     * @return string The field input
     *
     * @since   3.1
     */
    protected function getInput()
    {
        // Get the field id
        $id = isset($this->element['id']) ? $this->element['id'] : null;
        $cssId = '#'.$this->getId($id, $this->element['name']);

        // Load the ajax-chosen customised field
        JHtml::_('tag.ajaxfield', $cssId, true);

        if (!is_array($this->value) && !empty($this->value)) {
            // String in format 2,5,4
            if (is_string($this->value)) {
                $this->value = explode(',', $this->value);
            }
        }

        return parent::getInput();
    }
}
