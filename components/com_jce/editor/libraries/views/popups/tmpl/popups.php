<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

?>
<div class="uk-form-row uk-grid uk-grid-small uk-margin-small-bottom">
	<label for="popup_list" class="uk-form-label uk-width-1-5 hastip" title="<?php echo JText::_('WF_POPUP_TYPE_DESC'); ?>"><?php echo JText::_('WF_POPUP_TYPE'); ?></label>
	<div class="uk-form-controls uk-width-2-5">
		<?php echo $this->popups->getPopupList(); ?>
	</div>
</div>

<?php if ($this->popups->get('text')): ?>

<div class="uk-form-row uk-grid uk-grid-small uk-margin-small-bottom"">
	<label for=" popup_text" class="hastip uk-form-label uk-width-1-5" title="<?php echo JText::_('WF_POPUP_TEXT_DESC'); ?>"><?php echo JText::_('WF_POPUP_TEXT'); ?></label>
	<div class="uk-form-controls uk-width-4-5">
		<input id="popup_text" type="text" value="" />
	</div>
</div>

<?php endif;?>

<?php if ($this->popups->get('url')): ?>

<div class="uk-form-row uk-margin-small-bottom uk-grid uk-grid-small">
	<label for="popup_src" class="uk-form-label uk-width-1-5 hastip" title="<?php echo JText::_('WF_LABEL_URL_DESC'); ?>"><?php echo JText::_('WF_LABEL_URL'); ?></label>
	<div class="uk-form-controls uk-width-4-5">
		<input id="popup_src" type="text" value="" class="uk-input-multiple-disabled browser files" />
	</div>
</div>

<?php endif;?>

<?php echo $this->popups->getPopupTemplates(); ?>