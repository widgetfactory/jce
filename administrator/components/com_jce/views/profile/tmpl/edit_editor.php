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

use Joomla\CMS\Language\Text;

?>
<div class="tabbable tabs-left flex-column">
    <?php //echo HTMLHelper::_('bootstrap.startTabSet', 'profile-editor', array('active' => 'profile-editor-setup')); ?>

    <ul class="nav nav-tabs py-1">
        <?php foreach (array('setup', 'typography', 'filesystem', 'advanced') as $key => $item): ?>
            <li class="nav-item<?php echo $key === 0 ? ' active show' : ''; ?>"><a href="#" class="nav-link"><?php echo Text::_('WF_PROFILES_EDITOR_' . strtoupper($item), true); ?></a></li>
        <?php endforeach;?>
    </ul>
    <div class="tab-content">
        <?php foreach (array('setup', 'typography', 'filesystem', 'advanced') as $key => $item): ?>
            <div class="tab-pane<?php echo $key === 0 ? ' active show' : ''; ?>">
                <?php //echo HTMLHelper::_('bootstrap.addTab', 'profile-editor', 'profile-editor-' . $item, Text::_('WF_PROFILES_EDITOR_' . strtoupper($item), true));?>

                <div class="row-fluid">
                    <?php echo $this->loadTemplate('editor_' . $item); ?>
                </div>
            </div>
            <?php //echo HTMLHelper::_('bootstrap.endTab');?>
        <?php endforeach;?>
    </div>
    <?php //echo HTMLHelper::_('bootstrap.endTabSet'); ?>
</div>