<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');
?>
<div class="uk-form-row">
	<label for="onmouseover" class="hastip uk-form-label uk-width-3-10" title="<?php echo WFText::_('WF_LABEL_MOUSEOVER_DESC'); ?>">
		<?php echo WFText::_('WF_LABEL_MOUSEOVER'); ?>
	</label>
	<div class="uk-form-controls uk-width-7-10">
		<input id="onmouseover" type="text" value="" class="focus" />
	</div>
</div>
<div class="uk-form-row">
	<label for="onmouseout" class="hastip uk-form-label uk-width-3-10" title="<?php echo WFText::_('WF_LABEL_MOUSEOUT_DESC'); ?>">
		<?php echo WFText::_('WF_LABEL_MOUSEOUT'); ?>
	</label>
	<div class="uk-form-controls uk-width-7-10">
		<input id="onmouseout" type="text" value="" />
	</div>
</div>