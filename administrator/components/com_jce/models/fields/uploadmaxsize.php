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

use Joomla\CMS\Form\Field\NumberField;
use Joomla\CMS\Language\Text;

/**
 * Form Field class for the Joomla Platform.
 * Supports a one line text field.
 *
 * @link        http://www.w3.org/TR/html-markup/input.text.html#input.text
 * @since       11.1
 */
class JFormFieldUploadMaxSize extends NumberField
{
    /**
     * The form field type.
     *
     * @var string
     *
     * @since  11.1
     */
    protected $type = 'uploadmaxsize';

    /**
     * Method to get the field input markup.
     *
     * @return string The field input markup
     *
     * @since   11.1
     */
    protected function getInput()
    {
        $max = $this->getUploadValue();

        $this->max = (int) $max;
        $this->class = trim($this->class . ' input-small');

        $html = '<div class="input-append input-group">';
        $html .= parent::getInput();
        $html .= '  <div class="input-group-append">';
        $html .= '      <span class="add-on input-group-text">Kb</span>';
        $html .= '  </div>';
        $html .= '	<small class="help-inline form-text">&nbsp;<em>' . Text::_('WF_SERVER_UPLOAD_SIZE') . ' : ' . (string) $max . '</em></small>';
        $html .= '</div>';

        return $html;
    }

    public function getUploadValue()
    {
        $upload = trim(ini_get('upload_max_filesize'));
        $post = trim(ini_get('post_max_size'));

        $upload = $this->convertValue($upload);
        $post = $this->convertValue($post);

        if (intval($post) === 0) {
            return $upload;
        }

        if (intval($upload) < intval($post)) {
            return $upload;
        }

        return $post;
    }

    public function convertValue($value)
    {
        $unit = 'KB';
        $prefix = '';

        preg_match('#([0-9]+)\s?([a-z]*)#i', $value, $matches);

        // get unit
        if (isset($matches[2])) {
            $prefix = $matches[2];

            // extract first character only, eg: g, m, k
            if ($prefix) {
                $prefix = strtolower($prefix[0]);
            }
        }

        // get value
        if (isset($matches[1])) {
            $value = (int) $matches[1];
        }

        $value = intval($value);

        // Convert to bytes
        switch ($prefix) {
            case 'g':
                $value *= 1073741824;
                break;
            case 'm':
                $value *= 1048576;
                break;
            case 'k':
                $value *= 1024;
                break;
        }

        // Convert to unit value
        switch (strtolower($unit[0])) {
            case 'g':
                $value /= 1073741824;
                break;
            case 'm':
                $value /= 1048576;
                break;
            case 'k':
                $value /= 1024;
                break;
        }

        if ($unit) {
            return (int) $value . ' ' . $unit;
        }

        return 0;
    }
}
