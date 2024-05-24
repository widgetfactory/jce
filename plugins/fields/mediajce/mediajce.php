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

JLoader::registerNamespace('Joomla\\Plugin\\Fields\\MediaJce', JPATH_PLUGINS . '/fields/mediajce/src', false, false, 'psr4');

use Joomla\Component\Fields\Administrator\Plugin\FieldsPlugin;
use Joomla\Plugin\Fields\MediaJce\PluginTraits\FormTrait;

if (!class_exists('\\Joomla\\Component\\Fields\\Administrator\\Plugin\\FieldsPlugin', false)) {
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
    use FormTrait;
}