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
use Joomla\CMS\Form\FormHelper;
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

		// use restricted media support
		if (is_array($field->value)) {
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