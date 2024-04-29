<?php
/**
 * @package     JCE
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Form\Field\MediaField;
use Joomla\CMS\Form\Form;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Uri\Uri;

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
        }

        HTMLHelper::_('jquery.framework');

        $document = Factory::getDocument();
        $document->addScript(Uri::root(true) . '/media/com_jce/site/js/media.min.js', array('version' => 'auto'));
        $document->addStyleSheet(Uri::root(true) . '/media/com_jce/site/css/media.min.css', array('version' => 'auto'));

        return $result;
    }

    /**
     * Get the data that is going to be passed to the layout
     *
     * @return  array
     */
    public function getLayoutData()
    {
        // component must be installed and enabled
        if (!ComponentHelper::isEnabled('com_jce')) {
            return parent::getLayoutData();
        }

        $config = array(
            'element' => $this->id,
            'mediatype' => 'images',
            'converted' => false,
        );

        $options = WfBrowserHelper::getMediaFieldOptions($config);

        $this->link = $options['url'];

        // Get the basic field data
        $data = parent::getLayoutData();

        // not a valid file browser link
        if (!$this->link) {
            return $data;
        }

        $extraData = array(
            'link' => $this->link,
            'class' => $this->element['class'] . ' input-medium wf-media-input wf-media-input-active',
        );

        if ($options['upload']) {
            $extraData['class'] .= ' wf-media-input-upload';
        }

        $extraData['class'] .= ' wf-media-input-core';

        $this->mediatype = 'images';

        // Joomla 4
        if (isset($this->types)) {
            $mediaData = array(
                'imagesAllowedExt' => '',
                'audiosAllowedExt' => '',
                'videosAllowedExt' => '',
                'documentsAllowedExt' => '',
            );

            $allowable = array('jpg', 'jpeg', 'png', 'apng', 'gif', 'webp');

            if (!empty($options['accept'])) {
                // Explode on comma, trim whitespace, and convert to lowercase for each item
                $accept = array_map('strtolower', array_map('trim', explode(',', $options['accept'])));
                $allowable = array_intersect($allowable, $accept);
                $allowable = array_values($allowable);
            }

            $mediaData['imagesAllowedExt'] = $allowable;
            $mediaData['mediaTypes'] = 0;

            $extraData = array_merge($extraData, $mediaData);
        }

        return array_merge($data, $extraData);
    }
}
