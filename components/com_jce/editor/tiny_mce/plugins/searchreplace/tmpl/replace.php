<?php

/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

defined('WF_EDITOR') or die('RESTRICTED');
?>
	<div class="uk-form-row">
		<label class="uk-form-label uk-width-3-10" for="replace_panel_searchstring"><?php echo WFText::_('WF_SEARCHREPLACE_FINDWHAT');?></label>
		<div class="uk-form-controls uk-width-7-10">
			<input type="text" id="replace_panel_searchstring" name="replace_panel_searchstring" />
		</div>
	</div>
	<div class="uk-form-row">
			<label class="uk-form-label uk-width-3-10" for="replace_panel_replacestring"><?php echo WFText::_('WF_SEARCHREPLACE_REPLACEWITH');?></label>
		<div class="uk-form-controls uk-width-7-10">
			<input type="text" id="replace_panel_replacestring" name="replace_panel_replacestring" />
		</div>
	</div>
	<div class="uk-form-row">
			<label class="uk-form-label uk-width-3-10"><?php echo WFText::_('WF_SEARCHREPLACE_DIRECTION');?></label>
		<div class="uk-form-controls uk-width-7-10">
			<input id="replace_panel_backwardsu" name="replace_panel_backwards" type="radio" />
			<label for="replace_panel_backwardsu"><?php echo WFText::_('WF_SEARCHREPLACE_UP');?></label>

			<input id="replace_panel_backwardsd" name="replace_panel_backwards" type="radio" checked />
			<label for="replace_panel_backwardsd"><?php echo WFText::_('WF_SEARCHREPLACE_DOWN');?></label>
		</div>
	</div>
	<div class="uk-form-row">
		<input id="replace_panel_casesensitivebox" name="replace_panel_casesensitivebox" type="checkbox" />
		<label for="replace_panel_casesensitivebox"><?php echo WFText::_('WF_SEARCHREPLACE_MCASE');?></label>
	</div>