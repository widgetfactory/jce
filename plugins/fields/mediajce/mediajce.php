<?php
/**
 * @package     JCE.Plugin
 * @subpackage  Fields.Media_Jce
 *
 * @copyright   Copyright (C) 2005 - 2019 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (C) 2020 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;

Form::addFieldPath(JPATH_PLUGINS . '/system/jce/fields');

/**
 * Fields MediaJce Plugin
 *
 * @since  2.6.27
 */
class PlgFieldsMediaJce extends \Joomla\Component\Fields\Administrator\Plugin\FieldsPlugin
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
	 * @since   4.0.0
	 */
	public function onCustomFieldsPrepareDom($field, DOMElement $parent, Form $form)
	{
		$fieldNode = parent::onCustomFieldsPrepareDom($field, $parent, $form);

		if (!$fieldNode)
		{
			return $fieldNode;
		}

		if ($this->params->get('extendedmedia', 1)) {
			$fieldNode->setAttribute('type', 'extendedmedia');
		}

		return $fieldNode;
	}
}