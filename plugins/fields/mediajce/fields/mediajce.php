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

use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\Field\MediaField;
use Joomla\CMS\Helper\MediaHelper;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\Registry\Registry;

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
        // component must be installed and enabled
        if (!ComponentHelper::isEnabled('com_jce')) {
            return parent::getLayoutData();
        }
        
        require_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php';

        $config = array(
            'element' => $this->id,
            'mediatype' => strtolower($this->mediatype),
            'converted' => (int) $this->element['converted'] ? true : false
        );

        $options = WFBrowserHelper::getMediaFieldOptions($config);

        $this->link = $options['url'];

        // Get the basic field data
        $data = parent::getLayoutData();

        // not a valid file browser link
        if (!$this->link) {
            return $data;
        }

        if ($this->element['media_folder']) {
            $this->link .= '&mediafolder=' . rawurlencode($this->element['media_folder']);
        }

        $extraData = array(
            'link'      => $this->link,
            'class'     => $this->element['class'] . ' input-medium wf-media-input wf-media-input-active'
        );
        
        if ($options['upload']) {
            $extraData['class'] .= ' wf-media-input-upload';
        }

        if ($config['converted']) {
            $extraData['class'] .= ' wf-media-input-converted';
        } else {
            $extraData['class'] .= ' wf-media-input-core';
        }

        // Joomla 4
        if (isset($this->types)) {            
            $mediaData = array(
                'imagesAllowedExt'    => '',
                'audiosAllowedExt'    => '',
                'videosAllowedExt'    => '',
                'documentsAllowedExt' => ''
            );

            $allowable = array('jpg,jpeg,png,apng,gif,webp', 'mp3,m4a,mp4a,ogg', 'mp4,mp4v,mpeg,mov,webm', 'doc,docx,odg,odp,ods,odt,pdf,ppt,pptx,txt,xcf,xls,xlsx,csv', 'zip,tar,gz');

            if (!empty($options['accept'])) {
                $accept = explode(',', $options['accept']);

                array_walk($allowable, function (&$item) use ($accept) {
                    $items = explode(',', $item);

                    $values = array_intersect($items, $accept);
                    $item   = empty($values) ? '' : implode(',', $values);
                });
            }

            $mediaMap = array('images', 'audio', 'video', 'documents', 'media', 'files');

            // find mediatype value if passed in values is an extension list, eg: pdf,docx
            if (!in_array($this->mediatype, $mediaMap)) {
                $accept = explode(',', $this->mediatype);

                $mediatypes = array();

                array_walk($allowable, function (&$item, $key) use ($accept, $mediaMap, &$mediatypes) {
                    $items  = explode(',', $item);
                    $values = array_intersect($items, $accept);

                    if (!empty($values)) {
                        $mediatypes[] = $mediaMap[$key];
                        $item = implode(',', $values);
                    }
                });

                if (count($mediatypes) == 2 && $mediatypes[0] == 'audio' && $mediatypes[1] == 'video') {
                    $this->mediatype = 'media';
                } else if (count($mediatypes) > 1) {
                    $this->mediatype = 'files';
                }
            }

            $mediaType = [0, 1, 2, 3];

            switch ($this->mediatype) {
                case 'images':
                    $mediaType = [0];
                    $mediaData['imagesAllowedExt'] = $allowable[0];
                    break;
                case 'audio':
                    $mediaType = [1];
                    $mediaData['audiosAllowedExt'] = $allowable[1];
                    break;
                case 'video':
                    $mediaType = [2];
                    $mediaData['videosAllowedExt'] = $allowable[2];
                    break;
                case 'media':
                    $mediaType = [1, 2];
                    $mediaData['audiosAllowedExt'] = $allowable[1];
                    $mediaData['videosAllowedExt'] = $allowable[2];
                    break;
                case 'documents':
                    $mediaType = [3];
                    $mediaData['documentsAllowedExt'] = $allowable[3];
                    break;
                case 'files':
                    $mediaType = [0, 1, 2, 3];

                    $mediaData = array(
                        'imagesAllowedExt'    => $allowable[0],
                        'audiosAllowedExt'    => $allowable[1],
                        'videosAllowedExt'    => $allowable[2],
                        'documentsAllowedExt' => $allowable[3]
                    );

                    break;
            }

            $mediaData['mediaTypes'] = implode(',', $mediaType);

            $extraData = array_merge($extraData, $mediaData);
        }

        return array_merge($data, $extraData);
    }

    /**
     * Method to post-process a field value.
     * Remove Joomla 4.2 Media Field parameters
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
        if ((bool) $this->element['converted'] === false) {
            $value = MediaHelper::getCleanMediaFieldValue($value);
        }

        return $value;
    }
}