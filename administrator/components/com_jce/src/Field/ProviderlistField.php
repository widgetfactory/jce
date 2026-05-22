<?php

namespace Joomla\Component\Jce\Administrator\Field;

defined('JPATH_SITE') or die;

use Joomla\CMS\Language\Text;
use Joomla\CMS\Form\Field\ListField;

class ProviderlistField extends ListField
{
	/**
	 * The form field type.
	 *
	 * @var string
	 *
	 * @since  11.1
	 */
	protected $type = 'Providerlist';

	/**
	 * Method to attach a JForm object to the field.
	 *
	 * @param   \SimpleXMLElement  $element  The \SimpleXMLElement object representing the `<field>` tag for the form field object.
	 * @param   mixed             $value    The form field value to validate.
	 * @param   string            $group    The field name group control value. This acts as an array container for the field.
	 *                                      For example if the field has name="foo" and the group value is set to "bar" then the
	 *                                      full field name would end up being "bar[foo]".
	 *
	 * @return  boolean  True on success.
	 *
	 * @see     JFormField::setup()
	 * @since   3.2
	 */
	public function setup(\SimpleXMLElement $element, $value, $group = null)
	{
		if (is_string($value) && strpos($value, ',') !== false) {
			$value = explode(',', $value);
		}

		return parent::setup($element, $value, $group);
	}

	/**
	 * Method to get a list of options for a list input.
	 *
	 * @return array An array of JHtml options
	 *
	 * @since   11.4
	 */
	protected function getOptions()
	{
		$options = array();
		$default = explode(',', $this->default);

		foreach (parent::getOptions() as $item) {
			$options[] = $item;
		}

		// Merge any additional options in the XML definition.
		return $options;
	}
}
