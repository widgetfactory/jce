<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright     Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Form\FormHelper;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;

?>

<fieldset class="<?php echo !empty($displayData->formclass) ? $displayData->formclass : 'form-horizontal'; ?>">
	<legend><?php echo $displayData->name; ?></legend>
	<?php if (!empty($displayData->description)): ?>
		<p><?php echo $displayData->description; ?></p>
	<?php endif;?>
	<?php $fieldsnames = explode(',', $displayData->fieldsname);?>
	<?php foreach ($fieldsnames as $fieldname): ?>
		<?php foreach ($displayData->form->getFieldset($fieldname) as $field): ?>
			<?php $datashowon = '';?>
			<?php $groupClass = $field->type === 'Spacer' ? ' field-spacer' : '';?>
			<?php if ($field->showon): ?>
				<?php HTMLHelper::_('jquery.framework');?>
				<?php HTMLHelper::_('script', 'jui/cms.js', array('version' => 'auto', 'relative' => true));?>
				<?php $datashowon = ' data-showon=\'' . json_encode(FormHelper::parseShowOnConditions($field->showon, $field->formControl, $field->group)) . '\'';?>
			<?php endif;?>
			<div class="control-group<?php echo $groupClass; ?>"<?php echo $datashowon; ?>>
				<?php if (!isset($displayData->showlabel) || $displayData->showlabel): ?>
					<div class="control-label"><?php echo $field->label; ?></div>
				<?php endif;?>
				<div class="controls"><?php echo $field->input; ?></div>
				<?php if ($field->description): ?>
					<small class="description"><?php echo Text::_($field->description); ?></small>
				<?php endif;?>
			</div>
		<?php endforeach;?>
	<?php endforeach;?>
</fieldset>
