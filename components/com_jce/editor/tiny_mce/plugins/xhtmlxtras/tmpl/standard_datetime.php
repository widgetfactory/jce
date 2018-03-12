<?php

/**
 * @copyright    Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');
?>
<div class="uk-form-row">
    <label class="uk-form-label uk-width-2-10"
           for="datetime"><?php echo WFText::_('WF_XHTMLXTRAS_ATTRIBUTE_LABEL_DATETIME'); ?></label>
    <div class="uk-form-controls uk-form-icon uk-form-icon-flip uk-width-8-10">
            <input id="datetime" type="text" value="" />
            <i class="uk-icon-clock-o" onclick="XHTMLXtrasDialog.insertDateTime('datetime');" title="<?php echo WFText::_('WF_XHTMLXTRAS_INSERT_DATE'); ?>"></i>
    </div>
</div>
<div class="uk-form-row">
    <label class="uk-form-label uk-width-2-10" for="cite">
        <?php echo WFText::_('WF_XHTMLXTRAS_ATTRIBUTE_LABEL_CITE'); ?>
    </label>
    <div class="uk-form-controls uk-width-8-10">
        <input id="cite" type="text" value="" />
    </div>
</div>