<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;

$lightbox = $this->get('lightbox');

?>
<div class="uk-form-row uk-grid uk-grid-small uk-margin-small-bottom">
	<label for="popup_list" class="uk-form-label uk-width-1-5 hastip" title="<?php echo Text::_('WF_LIGHTBOX_TYPE_DESC'); ?>"><?php echo Text::_('WF_LIGHTBOX_TYPE'); ?></label>
	<div class="uk-form-controls uk-width-2-5">
		<?php echo $lightbox->getLightboxList(); ?>
	</div>
</div>

<?php if ($lightbox->getConfig('text')): ?>

<div class="uk-form-row uk-grid uk-grid-small uk-margin-small-bottom"">
	<label for=" popup_text" class="hastip uk-form-label uk-width-1-5" title="<?php echo Text::_('WF_LIGHTBOX_TEXT_DESC'); ?>"><?php echo Text::_('WF_LIGHTBOX_TEXT'); ?></label>
	<div class="uk-form-controls uk-width-4-5">
		<input id="popup_text" type="text" value="" />
	</div>
</div>

<?php endif;?>

<?php if ($lightbox->getConfig('url')): ?>

<div class="uk-form-row uk-margin-small-bottom uk-grid uk-grid-small">
	<label for="popup_src" class="uk-form-label uk-width-1-5 hastip" title="<?php echo Text::_('WF_LABEL_URL_DESC'); ?>"><?php echo Text::_('WF_LABEL_URL'); ?></label>
	<div class="uk-form-controls uk-width-4-5">
		<input id="popup_src" type="text" value="" class="uk-input-multiple-disabled browser files" />
	</div>
</div>

<?php endif;?>

<?php echo $lightbox->getLightboxTemplates(); ?>