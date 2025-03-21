<?php
/**
 * @package     JCE
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 - 2024 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Form\Field\MediaField;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Helper\MediaHelper;

/**
 * Provides a modal media selector field for the JCE File Browser
 *
 * @since  2.6.17
 */
class JFormFieldMediaJce extends MediaField
{
    /**
     * The form field type.
     *
     * @var    string
     */
    protected $type = 'MediaJce';

    /**
     * Layout to render
     *
     * @var    string
     * @since  3.5
     */
    protected $layout = 'joomla.form.field.media';

    /**
     * The mediatype for the form field.
     *
     * @var    string
     * @since  2.9.37
     */
    protected $mediatype = 'images';

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
     */
    public function setup(SimpleXMLElement $element, $value, $group = null)
    {
        // decode value if it is a string
        if (is_string($value)) {
            $json = json_decode($value, true);

            if ($json) {
                $value = isset($json['media_src']) ? $json['media_src'] : $value;
            }
        } else {
            $value = (array) $value;
            $value = isset($value['media_src']) ? $value['media_src'] : '';
        }

        $result = parent::setup($element, $value, $group);

        if ($result === true) {
            $this->mediatype = isset($this->element['mediatype']) ? (string) $this->element['mediatype'] : 'images';

            if (isset($this->types) && (bool) $this->element['converted'] === false) {
                if (is_string($this->value)) {
                    $this->value = MediaHelper::getCleanMediaFieldValue($this->value);
                }
            }
        }

        return $result;
    }

    /**
     * Get the data that is going to be passed to the layout
     *
     * @return  array
     */
    public function getLayoutData()
    {
        // Get the basic field data
        $data = parent::getLayoutData();

        // component must be installed and enabled
        if (!ComponentHelper::isEnabled('com_jce')) {
            return $data;
        }
        
        // plugin must be enabled
        if (!PluginHelper::isEnabled('system', 'jce')) {
            return $data;
        }

        $config = array(
            'element' => $this->id,
            'mediatype' => strtolower($this->mediatype),
            'converted' => false,
            'mediafolder' => isset($this->element['media_folder']) ? (string) $this->element['media_folder'] : '',
        );

        $options = WfBrowserHelper::getMediaFieldOptions($config);

        $this->link = $options['url'];

        $data['class'] .= ' input-medium wf-media-input';

        // not a valid file browser link
        if (!$this->link) {
            $data['readonly'] = true;
            return $data;
        }

        $extraData = array(
            'link'  => $this->link,
            'class' => $data['class'] .= ' wf-media-input-active',
        );

        if ($options['upload'] == 1) {
            $extraData['class'] .= ' wf-media-input-upload';
        }

        if ($options['select_button'] == 0) {
            $extraData['class'] .= ' wf-media-input-no-select-button';
        }

        $extraData['class'] .= ' wf-media-input-core';

        return array_merge($data, $extraData);
    }
}
