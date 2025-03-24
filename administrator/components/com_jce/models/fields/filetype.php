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

use Joomla\CMS\Form\Field\TextField;
use Joomla\CMS\Language\Text;

class JFormFieldFiletype extends TextField
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'Filetype';

    /**
     * The default value for the field.
     *
     * @var string
     */
    protected $defaultValue = '';

    /**
     * Method to attach a JForm object to the field.
     *
     * @param SimpleXMLElement $element The SimpleXMLElement object representing the <field /> tag for the form field object
     * @param mixed            $value   The form field value to validate
     * @param string           $group   The field name group control value. This acts as as an array container for the field.
     *                                  For example if the field has name="foo" and the group value is set to "bar" then the
     *                                  full field name would end up being "bar[foo]"
     *
     * @return bool True on success
     *
     * @since   11.1
     */
    public function setup(SimpleXMLElement $element, $value, $group = null)
    {
        $return = parent::setup($element, $value, $group);

        return $return;
    }

    private static function array_flatten($array, $return)
    {
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $return = self::array_flatten($value, $return);
            } else {
                $return[] = $value;
            }
        }

        return $return;
    }

    private function mapValue($value, $isGrouped = false)
    {
        $data = array();

        // no grouping
        if (strpos($value, '=') === false) {
            return array(explode(',', $value));
        }

        foreach (explode(';', $value) as $group) {
            $items = explode('=', $group);
            $name = $items[0];
            $values = explode(',', $items[1]);

            array_walk($values, function (&$item) use ($name) {
                if ($name === '-') {
                    $item = '-' . $item;
                }
            });

            if ($isGrouped) {
                $data[$name] = $values;
            } else {
                // remove empty values
                $values = array_filter($values, function ($value) {
                    return !empty($value);
                });

                $data = array_merge($data, $values);
            }
        }

        if (!$isGrouped) {
            $data = array($data);
        }

        return $data;
    }

    private function cleanValue($value)
    {
        $data = $this->mapValue($value);
        // get array values only
        $values = self::array_flatten($data, array());

        // convert to string
        $string = implode(',', $values);

        // return single array
        return explode(',', $string);
    }

    private function getDefaultValues()
    {
        $defaultValues = [
            'default' => [],
        ];

        foreach ($this->element->children() as $element) {
            if ($element->getName() === 'option') {
                $defaultValues['default'][] = (string) $element;
            }

            if ($element->getName() === 'group') {
                $name = (string) $element['label'];

                $defaultValues[$name] = array();

                // Iterate through the children and build an array of options.
                foreach ($element->children() as $option) {
                    // Only add <option /> elements.
                    if ($option->getName() !== 'option') {
                        continue;
                    }

                    $defaultValues[$name][] = (string) $option;
                }
            }
        }

        return $defaultValues;
    }

    private function isGrouped($values)
    {
        $keys = array_keys($values);

        if (count($keys) == 1) {
            $firstKey = $keys[0];

            if (is_string($firstKey) && $firstKey !== 'default') {
                return true;
            }

        } else {
            return true;
        }

        return false;
    }

    private function reorderItems($items, $values)
    {
        // re-order the items so the non-default items are at the end
        usort($items, function ($a, $b) use ($values) {
            $a = strtolower($a);
            $b = strtolower($b);

            $is_default_a = !empty($values) && in_array($a, $values);
            $is_default_b = !empty($values) && in_array($b, $values);

            if ($is_default_a && !$is_default_b) {
                return -1;
            }

            if (!$is_default_a && $is_default_b) {
                return 1;
            }

            return 0;
        });

        return $items;
    }

    /**
     * Method to get the field input markup.
     *
     * @return string The field input markup
     *
     * @since   11.1
     */
    protected function getInput()
    {
        // cleanup string
        $value = htmlspecialchars_decode($this->value);

        // get default values from the manifest
        $defaultValues = $this->getDefaultValues();

        // remove leading = if any (legacy clean up)
        if ($value && $value[0] === '=') {
            $value = substr($value, 1);
        }

        // check if these values are grouped by type
        $grouped = $this->isGrouped($defaultValues);

        // map value to groups or single array
        $data = $this->mapValue($value, $grouped);

        // reset value from $data for non-grouped values
        if (!$grouped) {
            $value = implode(',', $data[0]);
        }

        $html = array();

        $html[] = '<div class="filetype">';
        $html[] = ' <div class="input-append input-group">';

        $html[] = '     <input type="text" value="' . $value . '" disabled class="form-control" />';
        $html[] = '     <input type="hidden" name="' . $this->name . '" value="' . $value . '" />';
        $html[] = '     <div class="input-group-append">';
        $html[] = '         <a class="btn btn-secondary filetype-edit add-on input-group-text" role="button"><i class="icon-edit icon-apply"></i><span role="none">Edit</span></a>';
        $html[] = '     </div>';
        $html[] = ' </div>';

        $customCount = 0;

        foreach ($data as $group => $items) {
            $custom = array();

            if (empty($items)) {
                continue;
            }

            $html[] = '<dl class="filetype-list list-group">';

            if (is_string($group)) {
                $checked = '';

                $is_default = isset($defaultValues[$group]);

                if (empty($value) || $is_default || (!$is_default && $group[0] !== '-')) {
                    $checked = ' checked="checked"';
                }

                // clear minus sign
                $group = str_replace('-', '', $group);

                $groupKey = 'WF_FILEGROUP_' . strtoupper($group);
                $groupName = Text::_('WF_FILEGROUP_' . strtoupper($group));

                // create simple label if there is no translation
                if ($groupName === $groupKey) {
                    $groupName = ucfirst($group);
                }

                $html[] = '<dt class="filetype-group list-group-item" data-filetype-group="' . $group . '"><label><input type="checkbox" value="' . $group . '"' . $checked . ' />' . $groupName . '</label></dt>';
            }

            if (is_numeric($group)) {
                $group = 'default';
            }

            $items = $this->reorderItems($items, $defaultValues[$group]);

            foreach ($items as $item) {
                $checked = '';

                $item = strtolower($item);

                // clear minus sign from beginning of item
                $mod = str_replace('-', '', $item);

                // check if this is a default value or a custom value
                $is_default = !empty($defaultValues[$group]) && in_array($mod, $defaultValues[$group]);

                $class = '';

                if (!$is_default) {
                    $customCount++;

                    $html[] = '<dd class="filetype-item filetype-custom row form-row list-group-item"><div class="file"></div><input type="text" class="span8 col-md-8 form-control" value="' . $mod . '" />';
                    $html[] = '<button class="btn btn-link filetype-remove"><span class="icon-trash"></span></button>';
                } else {
                    if (empty($value) || $mod === $item) {
                        $checked = ' checked="checked"';
                    }
                    
                    $html[] = '<dd class="filetype-item list-group-item"><label><input type="checkbox" value="' . $mod . '"' . $checked . ' /><span class="file ' . $mod . '"></span>&nbsp;' . $mod . '</label>';
                }
            }

            $html[] = '<dd class="filetype-item filetype-custom row form-row list-group-item"><div class="file"></div><input type="text" class="span8 col-md-8 form-control" value="" placeholder="' . Text::_('WF_EXTENSION_MAPPER_TYPE_NEW') . '" />';

            $html[] = '<button class="btn btn-link filetype-remove"><span class="icon-trash"></span></button>';
            $html[] = '<button class="btn btn-link filetype-add"><span class="icon-plus"></span></button>';

            $html[] = '</dl>';
        }

        $html[] = ' </div>';

        return implode("\n", $html);
    }
}