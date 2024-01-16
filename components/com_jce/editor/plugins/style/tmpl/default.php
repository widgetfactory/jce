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

$tabs = WFTabs::getInstance();
?>
<form>
    <?php $tabs->render();?>
    <div class="mceActionPanel">
        <div class="uk-form-row uk-float-left">
            <label for="toggle_insert_span" class="uk-form-label"><input type="checkbox" id="toggle_insert_span" onclick="StyleDialog.toggleApplyAction();" /> <?php echo Text::_('WF_STYLES_TOGGLE_INSERT_SPAN'); ?></label>
        </div>
        <button type="button" id="cancel"><?php echo Text::_('WF_LABEL_CANCEL'); ?></button>
        <button type="button" id="apply"><?php echo Text::_('WF_STYLES_APPLY'); ?></button>
        <button type="submit" id="insert"><?php echo Text::_('WF_LABEL_UPDATE'); ?></button>
    </div>
</form>
<div style="display:none;">
    <div id="container"></div>
</div>