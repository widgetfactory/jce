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

use Joomla\CMS\Form\FormField;
use Joomla\CMS\Language\Text;

class JFormFieldHeading extends FormField
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'Heading';

    /**
     * Method to get the field input markup for a spacer.
     * The spacer does not have accept input.
     *
     * @return string The field input markup
     *
     * @since   11.1
     */
    protected function getInput()
    {
        return ' ';
    }

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
        $html = array();
        $class = !empty($this->class) ? ' class="' . $this->class . '"' : '';
        $html[] = '<h3' . $class . '>';

        // Get the label text from the XML element, defaulting to the element name.
        $text = $this->element['label'] ? (string) $this->element['label'] : (string) $this->element['name'];
        $text = $this->translateLabel ? Text::_($text) : $text;

        $html[] = $text;

        $html[] = '</h3>';

        // If a description is specified, use it to build a tooltip.
        if (!empty($this->description)) {
            $html[] = '<small>' . Text::_($this->description) . '</small>';
        }

        return implode('', $html);
    }

    /**
     * Method to get the field title.
     *
     * @return string The field title
     *
     * @since   11.1
     */
    protected function getTitle()
    {
        return $this->getLabel();
    }
}
