<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Router\Route;

// Include the component HTML helpers.
HTMLHelper::addIncludePath(JPATH_COMPONENT . '/helpers/html');
HTMLHelper::_('behavior.multiselect');

$user = Factory::getUser();
$listOrder = $this->escape($this->state->get('list.ordering'));
$listDirn = $this->escape($this->state->get('list.direction'));

$saveOrder = $listOrder == 'ordering';

if ($saveOrder) {
    $saveOrderingUrl = 'index.php?option=com_jce&task=profiles.saveOrderAjax&tmpl=component';
    HTMLHelper::_('sortablelist.sortable', 'profileList', 'adminForm', strtolower($listDirn), $saveOrderingUrl);
}
?>
<form action="<?php echo Route::_('index.php?option=com_jce&view=profiles'); ?>" method="post" enctype="multipart/form-data" name="adminForm" id="adminForm">
    <div class="ui-jce row">
    <?php if (!empty($this->sidebar)): ?>
        <div id="j-sidebar-container" class="j-sidebar-container span2 col-md-2">
            <?php echo $this->sidebar; ?>
        </div>
        <div class="col-md-10">
            <div id="j-main-container" class="j-main-container span10">
        <?php else: ?>
            <div id="j-main-container" class="j-main-container span10">
        <?php endif;?>

                <?php echo LayoutHelper::render('joomla.searchtools.default', array('view' => $this)); ?>

                <?php if (empty($this->items)): ?>
                    <div class="alert alert-no-items">
                        <?php echo Text::_('JGLOBAL_NO_MATCHING_RESULTS'); ?>
                    </div>
                <?php else: ?>
                    <table class="table table-striped" id="profileList">
                        <thead>
                            <tr>
                                <th width="1%" class="nowrap center hidden-phone text-center d-none d-md-table-cell">
                                    <?php echo HTMLHelper::_('searchtools.sort', '', 'ordering', $listDirn, $listOrder, null, 'asc', 'JGRID_HEADING_ORDERING', 'icon-menu-2'); ?>
                                </th>
                                <th style="width:1%" class="nowrap center text-center">
                                    <?php echo HTMLHelper::_('grid.checkall'); ?>
                                </th>
                                <th style="width:1%" class="nowrap center text-center">
                                    <?php echo HTMLHelper::_('searchtools.sort', 'JSTATUS', 'published', $listDirn, $listOrder); ?>
                                </th>
                                <th class="title">
                                    <?php echo HTMLHelper::_('searchtools.sort', 'JGLOBAL_TITLE', 'name', $listDirn, $listOrder); ?>
                                </th>
                                <th class="title hidden-phone">
                                    <?php echo Text::_('JGLOBAL_DESCRIPTION'); ?>
                                </th>
                                <th style="width:5%" class="nowrap hidden-phone center d-none d-md-table-cell text-center">
                                    <?php echo HTMLHelper::_('searchtools.sort', 'JGRID_HEADING_ID', 'id', $listDirn, $listOrder); ?>
                                </th>
                            </tr>
                        </thead>
                        <tfoot>
                            <tr>
                                <td colspan="8">
                                    <?php echo $this->pagination->getListFooter(); ?>
                                </td>
                            </tr>
                        </tfoot>
                        <tbody>
                        <?php foreach ($this->items as $i => $item):
    $ordering = ($listOrder == 'ordering');
    $canEdit = $user->authorise('core.edit', 'com_jce');
    $canCheckin = $user->authorise('core.manage', 'com_checkin') || $item->checked_out == $user->get('id') || $item->checked_out == 0;
    $canChange = $user->authorise('core.edit.state', 'com_jce') && $canCheckin;
    ?>
	                            <tr class="row<?php echo $i % 2; ?>">
	                                <td class="order nowrap center hidden-phone text-center d-none d-md-table-cell">
	                                    <?php
    $iconClass = '';

    if (!$canChange) {
        $iconClass = ' inactive';
    } elseif (!$saveOrder) {
    $iconClass = ' inactive tip-top hasTooltip" title="' . HTMLHelper::_('tooltipText', 'JORDERINGDISABLED');
}
?>
                                    <span class="sortable-handler<?php echo $iconClass; ?>">
                                        <span class="icon-menu" aria-hidden="true"></span>
                                    </span>
                                    <?php if ($canChange && $saveOrder): ?>
                                        <input type="text" style="display:none" name="order[]" size="5" value="<?php echo $item->ordering; ?>" class="width-20 text-area-order">
                                    <?php endif;?>
                                </td>
                                <td class="center text-center">
                                    <?php echo HTMLHelper::_('grid.id', $i, $item->id); ?>
                                </td>
                                <td class="center text-center">
                                    <?php echo HTMLHelper::_('jgrid.published', $item->published, $i, 'profiles.', $canChange); ?>
                                </td>
                                <td>
                                    <?php if ($item->checked_out): ?>
                                        <?php echo HTMLHelper::_('jgrid.checkedout', $i, $item->checked_out, $item->checked_out_time, 'profiles.', $canCheckin); ?>
                                    <?php endif;?>
                                    <?php if ($canEdit): ?>
                                        <?php $editIcon = $item->checked_out ? '' : '<span class="mr-2" aria-hidden="true"></span>';?>
                                        <a class="hasTooltip" href="<?php echo Route::_('index.php?option=com_jce&task=profile.edit&id=' . (int) $item->id); ?>" title="<?php echo Text::_('JACTION_EDIT'); ?> <?php echo $this->escape(addslashes($item->name)); ?>">
                                            <?php echo $editIcon; ?><?php echo $item->name; ?></a>
                                    <?php else: ?>
                                            <?php echo $item->name; ?>
                                    <?php endif;?>
                                </td>
                                <td class="nowrap hidden-phone d-none d-md-table-cell text-left">
                                    <?php echo $this->escape($item->description); ?>
                                </td>
                                <td class="nowrap center hidden-phone d-none d-md-table-cell text-center">
                                    <?php echo (int) $item->id; ?>
                                </td>
                            </tr>
                        <?php endforeach;?>
                        </tbody>
                    </table>
                <?php endif;?>

                <input type="hidden" name="task" value="" />
                <input type="hidden" name="boxchecked" value="0" />
                <?php echo HTMLHelper::_('form.token'); ?>
            </div>
        </div>
    </div>
</form>