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

use Joomla\CMS\Form\Form;

Form::addFieldPath(JPATH_PLUGINS . '/system/jce/fields');

/**
 * Fields MediaJce Plugin
 *
 * @since  2.6.27
 */
class PlgFieldsMediaJce extends \Joomla\Component\Fields\Administrator\Plugin\FieldsPlugin
{
}