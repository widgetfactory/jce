<?php
/**
 * @package     JCE
 * @subpackage  Fields.MediaJce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('_JEXEC') or die;

use Joomla\CMS\Form\Form;
use Joomla\Component\Fields\Administrator\Plugin\FieldsPlugin;

if (version_compare(JVERSION, 4, '<') && !class_exists('\\Joomla\\Component\\Fields\\Administrator\\Plugin\\FieldsPlugin', false)) {
	JLoader::import('components.com_fields.libraries.fieldsplugin', JPATH_ADMINISTRATOR);
	class_alias('FieldsPlugin', '\\Joomla\\Component\\Fields\\Administrator\\Plugin\\FieldsPlugin');
}

/**
 * Fields MediaJce Plugin
 *
 * @since  2.6.27
 */
class PlgFieldsMediaJce extends FieldsPlugin
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
	public function onCustomFieldsPrepareDom($field, DOMElement $parent, Form $form)
	{
		$fieldNode = parent::onCustomFieldsPrepareDom($field, $parent, $form);

		if (!$fieldNode)
		{
			return $fieldNode;
		}

		$fieldParams = clone $this->params;
        $fieldParams->merge($field->fieldparams);

		// reset from parent
		$fieldNode->setAttribute('type', 'mediajce');

		if ((int) $fieldParams->get('extendedmedia', 0) == 1) {
			$fieldNode->setAttribute('type', 'extendedmedia');
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
		if (!$this->isTypeSupported($field->type))
		{
			return;
		}

		// Check if the field value is an old (string) value
		$field->value = $this->checkValue($field->value);

		$fieldParams = clone $this->params;
        $fieldParams->merge($field->fieldparams);

		// if extendedmedia is disabled, use restricted media support
		if ((int) $fieldParams->get('extendedmedia', 0) == 0) {
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

		if (json_last_error() === JSON_ERROR_NONE)
		{
			return (array) json_decode($value, true);
		}

		return array('media_src' => $value, 'media_text' => '');
	}
}