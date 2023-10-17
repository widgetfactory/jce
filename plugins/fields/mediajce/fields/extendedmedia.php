<?php
/**
 * @package     JCE
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\CMS\Form\Field;

// phpcs:disable PSR1.Files.SideEffects
\defined('JPATH_PLATFORM') or die;
// phpcs:enable PSR1.Files.SideEffects

use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormField;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\Registry\Registry;

/**
 * Extended the JCE Media Field with additional options
 *
 * @since  2.9.31
 */
class ExtendedMediaField extends FormField
{
    /**
     * The form field type.
     *
     * @var    string
     * @since  2.9.31
     */
    protected $type = 'ExtendedMedia';

    /**
     * Layout to render the form
     * @var  string
     */
    protected $layout = 'joomla.form.field.subform.default';

    /**
     * Method to attach a Form object to the field.
     *
     * @param   \SimpleXMLElement  $element  The SimpleXMLElement object representing the <field /> tag for the form field object.
     * @param   mixed              $value    The form field value to validate.
     * @param   string             $group    The field name group control value.
     *
     * @return  boolean  True on success.
     *
     * @since   2.9.31
     */
    public function setup(\SimpleXMLElement $element, $value, $group = null)
    {
        // convert array value to object
        $value = is_array($value) ? (object) $value : $value;

        // decode value if it is a string
        if (is_string($value)) {
            json_decode($value);

            // Check if value is a valid JSON string.
            if ($value !== '' && json_last_error() !== JSON_ERROR_NONE) {

                // check for valid file which indicates value string
                if (is_file(JPATH_ROOT . '/' . $value)) {
                    $value = '{"media_src":"' . $value . '","media_text":""}';
                } else {
                    $value = '';
                }
            }
        } elseif (
            !is_object($value)
            || !property_exists($value, 'media_src')
            || !property_exists($value, 'media_text')
        ) {
            return false;
        }

        if (!parent::setup($element, $value, $group)) {
            return false;
        }

        return true;
    }

    /**
     * Method to get the field input markup.
     *
     * @return  string  The field input markup.
     *
     * @since   2.7
     */
    protected function getInput()
    {
        $xml = file_get_contents(__DIR__ . '/mediajce.xml');

        $formname   = 'subform.' . str_replace(array('jform[', '[', ']'), array('', '.', ''), $this->name);
        $subForm     = Form::getInstance($formname, $xml, array('control' => $this->name));

        if (is_string($this->value)) {
            $this->value = json_decode($this->value);
        }

        // add data
        $subForm->bind($this->value);

        $exclude = array('name', 'type', 'label', 'description');

        foreach ($this->element->attributes() as $key => $value) {
            if (in_array($key, $exclude)) {
                continue;
            }

            $subForm->setFieldAttribute('media_src', $key, (string) $value);
        }

        $data = $this->getLayoutData();

        $data['forms'] = array($subForm);

        // Prepare renderer
        $renderer = $this->getRenderer($this->layout);

        // Render
        $html = $renderer->render($data);

        return $html;
    }

    /**
     * Method to post-process a field value.
     *
     * @param   mixed     $value  The optional value to use as the default for the field.
     * @param   string    $group  The optional dot-separated form group path on which to find the field.
     * @param   Registry  $input  An optional Registry object with the entire data set to filter
     *                            against the entire form.
     *
     * @return  mixed   The processed value.
     *
     * @since   2.9.31
     */
    public function postProcess($value, $group = null, Registry $input = null)
    {        
        $media = array('img', 'video', 'audio', 'iframe', 'a', 'object');
        
        $value->media_supported = array_filter($media, function ($tag) {
			$html = '<' . $tag . '></' . $tag . '>';
            
            if ($tag == 'img') {
				$html = '<' . $tag . '/>';
			}

            $html = ComponentHelper::filterText($html);

			return !empty($html);
 		});

        return $value;
    }
}
