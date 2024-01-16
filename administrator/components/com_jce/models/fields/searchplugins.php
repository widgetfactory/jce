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

use Joomla\CMS\Form\Field\PluginsField;
use Joomla\CMS\Language\Text;

class JFormFieldSearchPlugins extends PluginsField
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'SearchPlugins';

    /**
     * Method to attach a JForm object to the field.
     *
     * @param   SimpleXMLElement  $element  The SimpleXMLElement object representing the `<field>` tag for the form field object.
     * @param   mixed             $value    The form field value to validate.
     * @param   string            $group    The field name group control value. This acts as an array container for the field.
     *                                      For example if the field has name="foo" and the group value is set to "bar" then the
     *                                      full field name would end up being "bar[foo]".
     *
     * @return  boolean  True on success.
     *
     * @see     JFormField::setup()
     * @since   3.2
     */
    public function setup(SimpleXMLElement $element, $value, $group = null)
    {
        if (is_string($value) && strpos($value, ',') !== false) {
            $value = explode(',', $value);
        }

        $return = parent::setup($element, $value, $group);

        if ($return) {
            $this->folder = 'search';
            $this->element['useaccess'] = 'true';
        }

        return $return;
    }

    /**
     * Method to get a list of options for a list input.
     *
     * @return array An array of JHtml options
     *
     * @since   11.4
     */
    protected function getOptions()
    {
        $options = array();
        $default = explode(',', $this->default);

        foreach (parent::getOptions() as $item) {
            if (in_array($item->value, $default)) {
                continue;
            }

            // skip "newsfeeds"
            if ($item->value == 'newsfeeds') {
                continue;
            }

            $options[] = $item;
        }

        foreach ($default as $name) {
            if (!is_dir(JPATH_SITE . '/components/com_jce/editor/extensions/search/adapter/' . $name)) {
                continue;
            }

            $option = new StdClass;

            $option->text = Text::_('PLG_SEARCH_' . strtoupper($name) . '_' . strtoupper($name), true);
            $option->disable = '';
            $option->value = $name;

            $options[] = $option;
        }

        // Merge any additional options in the XML definition.
        return $options;
    }
}
