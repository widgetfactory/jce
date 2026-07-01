<?php
/**
 * @package     JCE
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2020-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Fields\MediaJce\PluginTraits;

defined('_JEXEC') or die;

use Joomla\Event\Event;
use Joomla\CMS\Event\CustomFields\BeforePrepareFieldEvent;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormHelper;

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
     * @param   \stdClass        $field   The field.
     * @param   \DOMElement      $parent The parent element.
     * @param   Form             $form   The form object.
     *
     * @return  \DOMElement
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

        FormHelper::addFieldPrefix('Joomla\\Plugin\\Fields\\MediaJce\\Field');

        $event = new Event('onWfCustomFieldsPrepareDom', array(
            'subject' => $this,
            'field' => $field,
            'fieldNode' => $fieldNode,
            'form' => $form,
        ));

        $this->getApplication()->getDispatcher()->dispatch('onWfCustomFieldsPrepareDom', $event);

        $fieldNode = $event->getArgument('fieldNode');

        return $fieldNode;
    }

    /**
     * Before prepares the field value.
     *
     * @param   BeforePrepareFieldEvent $event    The event instance.
     *
     * @return  void
     *
     * @since   3.0.0
     */
    public function onCustomFieldsBeforePrepareField(BeforePrepareFieldEvent $event)
    {
        $field = $event->getArgument('field');

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
