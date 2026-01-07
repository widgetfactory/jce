<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Form\Field\TextField;

class JFormFieldFilesystemPath extends TextField
{

    /**
     * The form field type.
     *
     * @var    string
     *
     * @since  2.8
     */
    protected $type = 'FilesystemPath';

    /**
     * Method to attach a JForm object to the field.
     *
     * @param   SimpleXMLElement  $element  The SimpleXMLElement object representing the <field /> tag for the form field object.
     * @param   mixed             $value    The form field value to validate.
     * @param   string            $group    The field name group control value. This acts as as an array container for the field.
     *                                      For example if the field has name="foo" and the group value is set to "bar" then the
     *                                      full field name would end up being "bar[foo]".
     *
     * @return  boolean  True on success.
     *
     * @since   2.8
     */
    public function setup(SimpleXMLElement $element, $value, $group = null)
    {
        $return = parent::setup($element, $value, $group);

        return $return;
    }

    /**
     * Method to get the field input markup.
     *
     * @return  string  The field input markup.
     *
     * @since   11.1
     */
    protected function getInput()
    {
        $values = $this->value;
        $path   = '';

        // Step 1: If it's an array, flatten the "first meaningful" item.
        if (is_array($values) && !empty($values)) {
            
            // If it's an associative array already (eg: ['path' => 'images']), use it as-is.
            if (array_key_exists('path', $values)) {
                $values = [$values];
            } else {
                // Otherwise take the first non-empty item (eg: first JSON string in the array)
                $values = reset($values);
            }
        }

        // Step 2: If it's a string, try decode JSON; if not JSON, treat as path string.
        if (is_string($values)) {
            $value = trim(htmlspecialchars_decode($values));

            if ($value !== '') {
                $decoded = json_decode($value, true);

                if (json_last_error() === JSON_ERROR_NONE && $decoded !== null && $decoded !== []) {
                    $values = $decoded;
                } else {
                    // Not valid JSON -> it’s a plain path
                    $values = [['path' => $value]];
                }
            } else {
                $values = [];
            }
        }

        // Step 3: Extract first path
        if (is_array($values) && !empty($values)) {
            // If decoded to a single associative item, normalise to a list.
            if (array_key_exists('path', $values)) {
                $values = [$values];
            }

            $first = reset($values);

            if (is_array($first) && isset($first['path'])) {
                $path = (string) $first['path'];
            }
        }

        $this->value = $path;

        // collect the layout data...
        $layoutData = $this->getLayoutData();

        // ...and reset the value to the processed value
        $layoutData['value'] = htmlspecialchars($this->value, ENT_COMPAT, 'UTF-8');

        return $this->getRenderer($this->layout)->render($layoutData);
    }
}