<?php

/**
 * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;

$tabs = WFTabs::getInstance();
?>
<form onsubmit="return false;" class="uk-form uk-form-horizontal" data-layout="<?php echo $this->plugin->getLayout(); ?>">
	<?php echo $tabs->render(); ?>
	<div class="mceActionPanel">
	<?php if ($this->plugin->getLayout() == 'cell') : ?>
		<div class="uk-form-row uk-float-left">
			<select id="action" name="action">
				<option value="cell"><?php echo Text::_('WF_TABLE_CELL_CELL'); ?></option>
				<option value="row"><?php echo Text::_('WF_TABLE_CELL_ROW'); ?></option>
				<option value="all"><?php echo Text::_('WF_TABLE_CELL_ALL'); ?></option>
			</select>
		</div>
	<?php endif;
    if ($this->plugin->getLayout() == 'row') : ?>
		<div class="uk-form-row uk-float-left">
			<select id="action" name="action">
				<option value="row"><?php echo Text::_('WF_TABLE_ROW_ROW'); ?></option>
				<option value="odd"><?php echo Text::_('WF_TABLE_ROW_ODD'); ?></option>
				<option value="even"><?php echo Text::_('WF_TABLE_ROW_EVEN'); ?></option>
				<option value="all"><?php echo Text::_('WF_TABLE_ROW_ALL'); ?></option>
			</select>
		</div>
	<?php endif; ?>
	<button type="button" id="cancel"><?php echo Text::_('WF_LABEL_CANCEL'); ?></button>
	<button type="submit" id="insert" onclick="TableDialog.insert();"><?php echo Text::_('WF_LABEL_INSERT'); ?></button>
	</div>
</form>
