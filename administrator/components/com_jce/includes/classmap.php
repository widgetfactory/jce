<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Form\FormHelper;

// For Checkbox
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\CheckboxField')) {
    FormHelper::loadFieldClass('checkbox');
    class_alias('JFormFieldCheckbox', '\\Joomla\\CMS\\Form\\Field\\CheckboxField');
}

// For Checkboxes
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\CheckboxesField')) {
    FormHelper::loadFieldClass('checkboxes');
    class_alias('JFormFieldCheckboxes', '\\Joomla\\CMS\\Form\\Field\\CheckboxesField');
}

// For Color
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\ColorField')) {
    FormHelper::loadFieldClass('color');
    class_alias('JFormFieldColor', '\\Joomla\\CMS\\Form\\Field\\ColorField');
}

// For File List
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\FilelistField')) {
    FormHelper::loadFieldClass('filelist');
    class_alias('JFormFieldFileList', '\\Joomla\\CMS\\Form\\Field\\FilelistField');
}

// For List
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\ListField')) {
    FormHelper::loadFieldClass('list');
    class_alias('JFormFieldList', '\\Joomla\\CMS\\Form\\Field\\ListField');
}

// For Number
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\NumberField')) {
    FormHelper::loadFieldClass('number');
    class_alias('JFormFieldNumber', '\\Joomla\\CMS\\Form\\Field\\NumberField');
}

// For Plugins
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\PluginsField')) {
    FormHelper::loadFieldClass('plugins');
    class_alias('JFormFieldPlugins', '\\Joomla\\CMS\\Form\\Field\\PluginsField');
}

// For Radio
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\RadioField')) {
    FormHelper::loadFieldClass('radio');
    class_alias('JFormFieldRadio', '\\Joomla\\CMS\\Form\\Field\\RadioField');
}

// For Text
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\TextField')) {
    FormHelper::loadFieldClass('text');
    class_alias('JFormFieldText', '\\Joomla\\CMS\\Form\\Field\\TextField');
}

// For Textarea
if (!class_exists('\\Joomla\\CMS\\Form\\Field\\TextareaField')) {
    FormHelper::loadFieldClass('textarea');
    class_alias('JFormFieldTextarea', '\\Joomla\\CMS\\Form\\Field\\TextareaField');
}

// check for the existence of the Sidebar class which may have been declared by another extension
if (!class_exists('\\Joomla\\CMS\\HTML\\Helpers\\Sidebar')) {
    JLoader::import('libraries.cms.html.sidebar', JPATH_ADMINISTRATOR);
    class_alias('JHtmlSidebar', '\\Joomla\\CMS\\HTML\\Helpers\\Sidebar');
}

JLoader::register('JceHelperAdmin', JPATH_COMPONENT_ADMINISTRATOR . '/helpers/admin.php');