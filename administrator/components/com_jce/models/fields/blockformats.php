<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Form\Field\CheckboxesField;
use Joomla\CMS\Language\Text;

class JFormFieldBlockformats extends CheckboxesField
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'Blockformats';

    /**
     * Name of the layout being used to render the field
     *
     * @var    string
     * @since  3.5
     */
    protected $layout = 'form.field.blockformats';

    protected static $blockformats = array(
        'p' => 'Paragraph',
        'div' => 'Div',
        'div_container' => 'Div Container',
        'h1' => 'Heading1',
        'h2' => 'Heading2',
        'h3' => 'Heading3',
        'h4' => 'Heading4',
        'h5' => 'Heading5',
        'h6' => 'Heading6',
        'blockquote' => 'Blockquote',
        'address' => 'Address',
        'code' => 'Code',
        'pre' => 'Preformatted',
        'samp' => 'Sample',
        'span' => 'Span',
        'section' => 'Section',
        'article' => 'Article',
        'aside' => 'Aside',
        'header' => 'Header',
        'footer' => 'Footer',
        'nav' => 'Nav',
        'figure' => 'Figure',
        'dl' => 'Definition List',
        'dt' => 'Definition Term',
        'dd' => 'Definition Description'
    );

    /**
     * Allow to override renderer include paths in child fields
     *
     * @return  array
     *
     * @since   3.5
     */
    protected function getLayoutPaths()
    {
        return array(JPATH_ADMINISTRATOR . '/components/com_jce/layouts', JPATH_SITE . '/layouts');
    }

    protected function getOptions()
    {
        $fieldname = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $this->fieldname);
        $options = array();

        if (empty($this->value)) {
            $data = array_keys(self::$blockformats);
            $values = $data;
        } else {
            if (is_string($this->value)) {
                $this->value = explode(',', $this->value);
            }
            $values = $this->value;
            $data = array_unique(array_merge($this->value, array_keys(self::$blockformats)));
        }

        // create default font structure
        foreach ($data as $format) {
            if (array_key_exists($format, self::$blockformats) === false) {
                continue;
            }

            $text = self::$blockformats[$format];

            $tmp = array(
                'value' => $format,
                'text' => Text::alt($text, $fieldname),
                'checked' => in_array($format, $values),
            );

            $options[] = (object) $tmp;
        }

        return $options;
    }
}
