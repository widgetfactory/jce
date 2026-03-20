<?php

namespace Joomla\Component\Jce\Administrator\Field;

defined('JPATH_SITE') or die;

use Joomla\CMS\Form\Field\FileListField;

class FontListField extends FileListField
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'FontList';

    /**
     * Method to get the field input for a fontlist field.
     *
     * @return string The field input
     *
     * @since   3.1
     */
    protected function getInput()
    {
        if (!is_array($this->value) && !empty($this->value)) {
            // String in format 2,5,4
            if (is_string($this->value)) {
                $this->value = explode(',', $this->value);
            }
        }

        return parent::getInput();
    }
}
