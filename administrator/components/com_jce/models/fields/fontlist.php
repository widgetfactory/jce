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

use Joomla\CMS\Form\Field\FilelistField;

class JFormFieldFontList extends FilelistField
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
