<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Language\Text;

?>
<div class="uk-form-row uk-grid uk-grid-small">
	<label for="onmouseover" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_MOUSEOVER_DESC'); ?>">
		<?php echo Text::_('WF_LABEL_MOUSEOVER'); ?>
	</label>
	<div class="uk-form-controls uk-width-1-1 uk-width-small-7-10 uk-input-clear">
		<input id="onmouseover" type="text" value="" class="focus" />
	</div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
	<label for="onmouseout" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_MOUSEOUT_DESC'); ?>">
		<?php echo Text::_('WF_LABEL_MOUSEOUT'); ?>
	</label>
	<div class="uk-form-controls uk-width-1-1 uk-width-small-7-10 uk-input-clear">
		<input id="onmouseout" type="text" value="" autofocus />
	</div>
</div>