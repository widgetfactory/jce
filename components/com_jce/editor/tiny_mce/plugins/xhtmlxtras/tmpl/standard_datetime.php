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
?>
<div class="ui-form-row">
    <label class="ui-form-label ui-width-3-10"
           for="datetime"><?php echo WFText::_('WF_XHTMLXTRAS_ATTRIBUTE_LABEL_DATETIME'); ?></label>
    <div class="ui-form-controls ui-form-icon ui-form-icon-flip ui-width-7-10">
            <input id="datetime" type="text" value="" />
            <i class="ui-icon-clock-o" onclick="XHTMLXtrasDialog.insertDateTime('datetime');" title="<?php echo WFText::_('WF_XHTMLXTRAS_INSERT_DATE'); ?>"></i>
    </div>
</div>
<div class="ui-form-row">
    <label class="ui-form-label ui-width-3-10" for="cite">
        <?php echo WFText::_('WF_XHTMLXTRAS_ATTRIBUTE_LABEL_CITE'); ?>
    </label>
    <div class="ui-form-controls ui-width-7-10">
        <input id="cite" type="text" value="" />
    </div>
</div>