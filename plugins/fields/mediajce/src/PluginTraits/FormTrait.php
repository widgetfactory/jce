<?php
/**
 * @package     JCE
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 - 2024 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Fields\MediaJce\PluginTraits;

defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormHelper;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;

/**
 * Fields MediaJce FormTrait
 *
 * @since  2.9.73
 */
trait FormTrait
{
    private $mediaLoaded = false;
    
    /**
     * Transforms the field into a DOM XML element and appends it as a child on the given parent.
     *
     * @param   stdClass    $field   The field.
     * @param   DOMElement  $parent  The field node parent.
     * @param   Form        $form    The form.
     *
     * @return  DOMElement
     *
     * @since   3.7.0
     */
    public function onCustomFieldsPrepareDom($field, \DOMElement $parent, Form $form)
    {
        $fieldNode = parent::onCustomFieldsPrepareDom($field, $parent, $form);

        if (!$fieldNode) {
            return $fieldNode;
        }

        if ($field->type !== 'mediajce') {
            return $fieldNode;
        }

        // override "Edit Custom Field Value" permission if set
        $fieldNode->setAttribute('disabled', 'false');

        $fieldParams = clone $this->params;
        $fieldParams->merge($field->fieldparams);

        $field->fieldparams = clone $fieldParams;

        $form->addFieldPath(JPATH_PLUGINS . '/fields/mediajce/fields');

        Factory::getApplication()->triggerEvent('onWfCustomFieldsPrepareDom', array($field, $fieldNode, $form));

        return $fieldNode;
    }

    /**
     * Before prepares the field value.
     *
     * @param   string     $context  The context.
     * @param   \stdclass  $item     The item.
     * @param   \stdclass  $field    The field.
     *
     * @return  void
     *
     * @since   3.7.0
     */
    public function onCustomFieldsBeforePrepareField($context, $item, $field)
    {
        // Check if the field should be processed by us
        if ($field->type !== 'mediajce') {
            return;
        }

        // Check if the field value is an old (string) value
        if (is_string($field->value)) {
            $field->value = $this->checkValue($field->value);
        }

        $fieldParams = clone $this->params;
        $fieldParams->merge($field->fieldparams);

        $field->fieldparams = clone $fieldParams;

        // if extendedmedia is disabled, use restricted media support
        if ((int) $fieldParams->get('extendedmedia', 0) == 0 && is_array($field->value)) {
            $field->value['media_supported'] = array('img', 'a');
        }
    }

    /**
     * Before prepares the field value.
     *
     * @param   string  $value  The value to check.
     *
     * @return  array  The checked value
     *
     * @since   4.0.0
     */
    private function checkValue($value)
    {
        json_decode($value);

        if (json_last_error() === JSON_ERROR_NONE) {
            return (array) json_decode($value, true);
        }

        return array('media_src' => $value, 'media_text' => '');
    }
}
