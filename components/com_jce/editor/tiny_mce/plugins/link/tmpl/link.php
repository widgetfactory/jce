<?php

/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('_JEXEC') or die('RESTRICTED');

$search = $this->plugin->getSearch('link');
$links = $this->plugin->getLinks();

?>
<div class="ui-form-row">
    <label class="ui-form-label ui-width-1-5" for="href" class="hastip" title="<?php echo WFText::_('WF_LABEL_URL_DESC'); ?>"><?php echo WFText::_('WF_LABEL_URL'); ?></label>
    <div class="ui-form-controls ui-form-icon ui-form-icon-flip ui-width-4-5">
        <input id="href" type="text" value="" required class="browser" />
        <span class="email ui-icon ui-icon-envelope-o" title="<?php echo WFText::_('WF_LABEL_EMAIL'); ?>"></span>
    </div>
</div>
<div class="ui-form-row">
    <label for="text" class="ui-form-label ui-width-1-5 hastip" title="<?php echo WFText::_('WF_LINK_LINK_TEXT_DESC'); ?>"><?php echo WFText::_('WF_LINK_LINK_TEXT'); ?></label>
    <div class="ui-form-controls ui-width-4-5">
        <input id="text" type="text" value="" required />
    </div>
</div>
<?php if ($search->isEnabled() || count($links->getLists())) : ?>
    <div id="link-options" class="ui-placeholder">
        <?php echo $search->render(); ?>
        <?php echo $links->render(); ?>
    </div>
<?php endif; ?>
<div class="ui-form-row" id="attributes-anchor">
    <label for="anchor" class="ui-form-label ui-width-1-5 hastip" title="<?php echo WFText::_('WF_LABEL_ANCHORS_DESC'); ?>"><?php echo WFText::_('WF_LABEL_ANCHORS'); ?></label>
    <div class="ui-form-controls ui-width-4-5" id="anchor_container"></div>
</div>

<div class="ui-form-row" id="attributes-target">
    <label for="target" class="ui-form-label ui-width-1-5 hastip" title="<?php echo WFText::_('WF_LABEL_TARGET_DESC'); ?>"><?php echo WFText::_('WF_LABEL_TARGET'); ?></label>
    <div class="ui-form-controls ui-width-4-5">
        <select id="target">
            <option value=""><?php echo WFText::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="_self"><?php echo WFText::_('WF_OPTION_TARGET_SELF'); ?></option>
            <option value="_blank"><?php echo WFText::_('WF_OPTION_TARGET_BLANK'); ?></option>
            <option value="_parent"><?php echo WFText::_('WF_OPTION_TARGET_PARENT'); ?></option>
            <option value="_top"><?php echo WFText::_('WF_OPTION_TARGET_TOP'); ?></option>
        </select>
    </div>
</div>

<div class="ui-form-row" id="attributes-title">
    <label class="ui-form-label ui-width-1-5" for="title" class="hastip" title="<?php echo WFText::_('WF_LABEL_TITLE_DESC'); ?>"><?php echo WFText::_('WF_LABEL_TITLE'); ?></label>
    <div class="ui-form-controls ui-width-4-5">
        <input id="title" type="text" value="" />
    </div>
</div>
