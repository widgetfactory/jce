<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;

$user = Factory::getUser();
$canEditPref = $user->authorise('core.admin', 'com_jce');

?>
<div class="ui-jce row row-fluid">
	<div class="span12 col-md-12">
        <nav id="wf-cpanel" class="quick-icons bg-transparent">
			<ul class="unstyled mb-0 nav flex-wrap row-fluid">
				<?php echo implode("\n", $this->icons); ?>
			</ul>
		</nav>

        <dl class="dl-horizontal card card-body well">
            <dt class="wf-tooltip" title="<?php echo Text::_('WF_CPANEL_SUPPORT') . '::' . Text::_('WF_CPANEL_SUPPORT_DESC'); ?>">
                <?php echo Text::_('WF_CPANEL_SUPPORT'); ?>
            </dt>
            <dd><a href="https://www.joomlacontenteditor.net/support" target="_new">https://www.joomlacontenteditor.com/support</a></dd>
            <dt class="wf-tooltip" title="<?php echo Text::_('WF_CPANEL_LICENCE') . '::' . Text::_('WF_CPANEL_LICENCE_DESC'); ?>">
                <?php echo Text::_('WF_CPANEL_LICENCE'); ?>
            </dt>
            <dd><?php echo $this->state->get('licence'); ?></dd>
            <dt class="wf-tooltip" title="<?php echo Text::_('WF_CPANEL_VERSION') . '::' . Text::_('WF_CPANEL_VERSION_DESC'); ?>">
                <?php echo Text::_('WF_CPANEL_VERSION'); ?>
            </dt>
            <dd><?php echo $this->state->get('version'); ?></dd>
            <?php if ($this->params->get('feed', 0) || $canEditPref): ?>
                <dt class="wf-tooltip" title="<?php echo Text::_('WF_CPANEL_FEED') . '::' . Text::_('WF_CPANEL_FEED_DESC'); ?>">
                    <?php echo Text::_('WF_CPANEL_FEED'); ?>
                </dt>
                <dd>
                <?php if ($this->params->get('feed', 0)): ?>
                    <ul class="unstyled wf-cpanel-newsfeed">
                        <li><?php echo Text::_('WF_CPANEL_FEED_NONE'); ?></li>
                    </ul>
                <?php else: ?>
                    <?php echo Text::_('WF_CPANEL_FEED_DISABLED'); ?> :: <a id="newsfeed_enable" title="<?php echo Text::_('WF_PREFERENCES'); ?>" href="#">[<?php echo Text::_('WF_CPANEL_FEED_ENABLE'); ?>]</a>
                <?php endif;?>
                </dd>
            <?php endif;?>
        </dl>
        <?php if (!$this->state->get('pro', 0)) :
    echo LayoutHelper::render('message.upgrade', $this);
endif;?>
    </div>
</div>