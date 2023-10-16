<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Form\FormHelper;

FormHelper::loadFieldClass('checkbox');
class_alias('JFormFieldCheckbox', '\\Joomla\\CMS\\Form\\Field\\CheckboxField');

FormHelper::loadFieldClass('checkboxes');
class_alias('JFormFieldCheckboxes', '\\Joomla\\CMS\\Form\\Field\\CheckboxesField');

FormHelper::loadFieldClass('color');
class_alias('JFormFieldColor', '\\Joomla\\CMS\\Form\\Field\\ColorField');

FormHelper::loadFieldClass('filelist');
class_alias('JFormFieldFileList', '\\Joomla\\CMS\\Form\\Field\\FilelistField');

FormHelper::loadFieldClass('list');
class_alias('JFormFieldList', '\\Joomla\\CMS\\Form\\Field\\ListField');

FormHelper::loadFieldClass('number');
class_alias('JFormFieldNumber', '\\Joomla\\CMS\\Form\\Field\\NumberField');

FormHelper::loadFieldClass('plugins');
class_alias('JFormFieldPlugins', '\\Joomla\\CMS\\Form\\Field\\PluginsField');

FormHelper::loadFieldClass('radio');
class_alias('JFormFieldRadio', '\\Joomla\\CMS\\Form\\Field\\RadioField');

FormHelper::loadFieldClass('text');
class_alias('JFormFieldText', '\\Joomla\\CMS\\Form\\Field\\TextField');

FormHelper::loadFieldClass('textarea');
class_alias('JFormFieldTextarea', '\\Joomla\\CMS\\Form\\Field\\TextareaField');

JLoader::import('libraries.cms.html.sidebar', JPATH_ADMINISTRATOR);
class_alias('JHtmlSidebar', '\\Joomla\\CMS\\HTML\\Helpers\\Sidebar');

JLoader::register('JceHelperAdmin', JPATH_COMPONENT_ADMINISTRATOR . '/helpers/admin.php');