<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

 defined('JPATH_PLATFORM') or die;

 use Joomla\CMS\Factory;
 use Joomla\CMS\Language\Text;
 use Joomla\CMS\Session\Session;

$search = $this->plugin->getSearch('link');
$links = $this->plugin->getLinks();

?>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-1-5" for="href" class="hastip" title="<?php echo Text::_('WF_LABEL_URL_DESC'); ?>"><?php echo Text::_('WF_LABEL_URL'); ?></label>
    <div class="uk-form-controls uk-form-icon uk-form-icon-flip uk-width-1-1  uk-width-small-4-5">
        <input id="href" type="text" value="" required class="browser" />
        <button class="email uk-icon uk-icon-email uk-button uk-button-link" aria-haspopup="true" aria-label="<?php echo Text::_('WF_LABEL_EMAIL'); ?>" title="<?php echo Text::_('WF_LABEL_EMAIL'); ?>"></button>
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label for="text" class="uk-form-label uk-width-1-1  uk-width-small-1-5 hastip" title="<?php echo Text::_('WF_LINK_LINK_TEXT_DESC'); ?>"><?php echo Text::_('WF_LINK_LINK_TEXT'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-4-5">
        <input id="text" type="text" value="" required placeholder="<?php echo Text::_('WF_ELEMENT_SELECTION'); ?>" />
    </div>
</div>
<?php if ($search->isEnabled() || count($links->getLists())) : ?>
    <div id="link-options" class="uk-placeholder">
        <?php echo $search->render(); ?>
        <?php echo $links->render(); ?>
    </div>
<?php endif; ?>
<div class="uk-form-row uk-hidden-mini uk-form-row uk-grid uk-grid-small" id="attributes-anchor">
    <label for="anchor" class="uk-form-label uk-width-1-1  uk-width-small-1-5 hastip" title="<?php echo Text::_('WF_LABEL_ANCHORS_DESC'); ?>"><?php echo Text::_('WF_LABEL_ANCHORS'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-4-5" id="anchor_container"></div>
</div>

<div class="uk-form-row uk-grid uk-grid-small" id="attributes-target">
    <label for="target" class="uk-form-label uk-width-1-1  uk-width-small-1-5 hastip" title="<?php echo Text::_('WF_LABEL_TARGET_DESC'); ?>"><?php echo Text::_('WF_LABEL_TARGET'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-4-5">
        <select id="target">
            <option value=""><?php echo Text::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="_self"><?php echo Text::_('WF_OPTION_TARGET_SELF'); ?></option>
            <option value="_blank"><?php echo Text::_('WF_OPTION_TARGET_BLANK'); ?></option>
            <option value="_parent"><?php echo Text::_('WF_OPTION_TARGET_PARENT'); ?></option>
            <option value="_top"><?php echo Text::_('WF_OPTION_TARGET_TOP'); ?></option>
        </select>
    </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small uk-hidden-mini" id="attributes-title">
    <label class="uk-form-label uk-width-1-1  uk-width-small-1-5" for="title" class="hastip" title="<?php echo Text::_('WF_LABEL_TITLE_DESC'); ?>"><?php echo Text::_('WF_LABEL_TITLE'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-4-5">
        <input id="title" type="text" value="" />
    </div>
</div>
