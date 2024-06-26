<?php
/**
 * @package     JCE
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Fields\MediaJce\PluginTraits;

defined('_JEXEC') or die;

use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormHelper;
use Joomla\CMS\Plugin\PluginHelper;

/**
 * Fields MediaJce FormTrait
 *
 * @since  2.9.73
 */
trait FormTrait
{
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

        $fieldParams = clone $this->params;
        $fieldParams->merge($field->fieldparams);

        // find a better way to do this....
        if (PluginHelper::isEnabled('system', 'jcepro')) {

            $form->addFieldPath(JPATH_PLUGINS . '/system/jcepro/fields');
            // Joomla 3 requires the fieldtype to be loaded
            FormHelper::loadFieldType('extendedmedia', false);

            $fieldNode->setAttribute('type', 'extendedmedia');

            // set extendedmedia flag
            if ((int) $fieldParams->get('extendedmedia', 0) == 1) {
                $fieldNode->setAttribute('data-extendedmedia', '1');
            }

            // allow for legacy media support
            if ((int) $this->params->get('legacymedia', 0) == 1) {
                $fieldNode->setAttribute('type', 'mediajce');
            }
        }

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
