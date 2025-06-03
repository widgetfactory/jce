<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2025 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Form\FormField;

class JFormFieldDirectoryPath extends FormField
{

    /**
     * The form field type.
     *
     * @var    string
     *
     * @since  2.9.88
     */
    protected $type = 'DirectoryPath';

    /**
     * Name of the layout being used to render the field
     *
     * @var    string
     * @since  2.9.88
     */
    protected $layout = 'joomla.form.field.text';

    protected function getLayoutData()
    {
        $data = parent::getLayoutData();

        $value = $this->value;

        if (is_array($value)) {
            $first = reset($value); // Get the first element of the array
            $value = is_array($first) && isset($first['path']) ? $first['path'] : '';
        }

        // normalize the value to a string
        $value = (string) $value;

        $data['value'] = $value;

        // override options for the text layout
        $extraData = [
            'maxLength'   => null,
            'pattern'     => null,
            'inputmode'   => null,
            'dirname'     => null,
            'addonBefore' => null,
            'addonAfter'  => null,
            'options'     => null,
            'charcounter' => false,
        ];

        return array_merge($data, $extraData);
    }
}
