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

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Layout\LayoutHelper;

if (version_compare(JVERSION, 4, '<')) {
    HTMLHelper::_('formbehavior.chosen', 'select');
}
?>
<form action="index.php" method="post" name="adminForm" id="adminForm" class="form-horizontal">
    <div class="ui-jce container-fluid">
        <?php if (!empty($this->sidebar)): ?>
            <div id="j-sidebar-container" class="span2 col-md-2">
                <?php echo $this->sidebar; ?>
            </div>
            <div id="j-main-container" class="span10 col-md-10">
        <?php else: ?>
            <div id="j-main-container">
        <?php endif;?>
                <fieldset class="adminform panelform">
                    <?php echo LayoutHelper::render('joomla.content.options_default', $this); ?>
                </fieldset>
            </div>
    </div>
    <input type="hidden" name="option" value="com_jce" />
    <input type="hidden" name="view" value="mediabox" />
    <input type="hidden" name="task" value="" />
    <?php echo HTMLHelper::_('form.token'); ?>
</form>