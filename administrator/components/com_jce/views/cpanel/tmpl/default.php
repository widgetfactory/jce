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
<div class="ui-jce">
    <ul id="cpanel" class="unstyled thumbnails">
      <?php echo implode("\n", $this->icons); ?>
    </ul>
    <dl class="dl-horizontal placeholder">
        <dt class="wf-tooltip" title="<?php echo WFText::_('WF_CPANEL_SUPPORT').'::'.WFText::_('WF_CPANEL_SUPPORT_DESC'); ?>">
            <?php echo WFText::_('WF_CPANEL_SUPPORT'); ?>
        </dt>
        <dd><a href="http://www.joomlacontenteditor.net/support" target="_new">www.joomlacontenteditor.com/support</a></dd>
        <dt class="wf-tooltip" title="<?php echo WFText::_('WF_CPANEL_LICENCE').'::'.WFText::_('WF_CPANEL_LICENCE_DESC'); ?>">
            <?php echo WFText::_('WF_CPANEL_LICENCE'); ?>
        </dt>
        <dd><?php echo $this->model->getLicense(); ?></dd>
        <dt class="wf-tooltip" title="<?php echo WFText::_('WF_CPANEL_VERSION').'::'.WFText::_('WF_CPANEL_VERSION_DESC'); ?>">
            <?php echo WFText::_('WF_CPANEL_VERSION'); ?>
        </dt>
        <dd><?php echo $this->version; ?></dd>
        <?php if ($this->params->get('feed', 0) || WFModel::authorize('preferences')) : ?>
            <dt class="wf-tooltip" title="<?php echo WFText::_('WF_CPANEL_FEED').'::'.WFText::_('WF_CPANEL_FEED_DESC'); ?>">
                <?php echo WFText::_('WF_CPANEL_FEED'); ?>
            </dt>
            <dd>
            <?php if ($this->params->get('feed', 0)) : ?>
                <ul class="unstyled newsfeed">
                    <li><?php echo WFText::_('WF_CPANEL_FEED_NONE'); ?></li>
                </ul>
            <?php else : ?>
                <?php echo WFText::_('WF_CPANEL_FEED_DISABLED'); ?> :: <a id="newsfeed_enable" title="<?php echo WFText::_('WF_PREFERENCES'); ?>" href="#">[<?php echo WFText::_('WF_CPANEL_FEED_ENABLE'); ?>]</a>
            <?php endif; ?>
            </dd>
        <?php endif; ?>
    </dl>
    <?php if (!WF_EDITOR_PRO):
        echo $this->loadTemplate('pro_footer');
    endif; ?>
</div>
