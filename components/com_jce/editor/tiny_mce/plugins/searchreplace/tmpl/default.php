<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('WF_EDITOR') or die('RESTRICTED');

?>
	<div>
<div class="uk-form-row">
	<label class="uk-form-label uk-width-3-10" for="searchstring"><?php echo WFText::_('WF_SEARCHREPLACE_FINDWHAT');?></label>
	<div class="uk-form-controls uk-width-7-10">
		<input type="text" id="searchstring" />
	</div>
</div>
<div class="uk-form-row">
		<label class="uk-form-label uk-width-3-10" for="replacestring"><?php echo WFText::_('WF_SEARCHREPLACE_REPLACEWITH');?></label>
	<div class="uk-form-controls uk-width-7-10">
		<input type="text" id="replacestring" />
	</div>
</div>
<div class="uk-form-row">
		<label class="uk-form-label uk-width-3-10"><?php echo WFText::_('WF_SEARCHREPLACE_DIRECTION');?></label>
	<div class="uk-form-controls uk-width-7-10">
		<input id="backwardsu" name="backwards" type="radio" />
		<label for="backwardsu"><?php echo WFText::_('WF_SEARCHREPLACE_UP');?></label>

		<input id="backwardsd" name="backwards" type="radio" checked />
		<label for="backwardsd"><?php echo WFText::_('WF_SEARCHREPLACE_DOWN');?></label>
	</div>
</div>
<div class="uk-form-row">
	<input id="casesensitivebox" type="checkbox" />
	<label for="casesensitivebox"><?php echo WFText::_('WF_SEARCHREPLACE_MCASE');?></label>
</div>
</div>
<div class="mceActionPanel">
	<button type="submit" id="next" name="insert"><?php echo WFText::_('WF_SEARCHREPLACE_FINDNEXT');?></button>
	<button type="button" class="button" id="replaceBtn" name="replaceBtn"><?php echo WFText::_('WF_SEARCHREPLACE_REPLACE');?></button>
	<button type="button" class="button" id="replaceAllBtn" name="replaceAllBtn"><?php echo WFText::_('WF_SEARCHREPLACE_REPLACEALL');?></button>
	<button type="button" id="cancel" name="cancel" class="uk-hidden-mini" onclick="tinyMCEPopup.close();"><?php echo WFText::_('WF_LABEL_CANCEL');?></button>
</div>
