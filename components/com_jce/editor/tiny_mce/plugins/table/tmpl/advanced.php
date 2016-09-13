<?php

/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('_JEXEC') or die('RESTRICTED');

?>
<div class="uk-form-row">
    <label for="classlist" class="uk-form-label uk-width-3-10 hastip" title="<?php echo WFText::_('WF_LABEL_CLASSES_DESC'); ?>"><?php echo WFText::_('WF_LABEL_CLASSES'); ?></label>
    <div class="uk-form-controls uk-width-7-10 uk-datalist">
        <input type="text" id="classes" />
        <select id="classlist">
          <option value=""><?php echo WFText::_('WF_OPTION_NOT_SET'); ?></option>
        </select>
    </div>
</div>

<div class="uk-form-row">
    <label class="uk-form-label uk-width-3-10" for="id">
        <?php echo WFText::_('WF_TABLE_ID'); ?></label>
    <div class="uk-form-controls uk-width-7-10">
        <input id="id" type="text" value=""/>
    </div>
</div>
<div class="uk-form-row">
    <label class="uk-form-label uk-width-3-10" for="summary">
        <?php echo WFText::_('WF_TABLE_SUMMARY'); ?></label>
    <div class="uk-form-controls uk-width-7-10">
        <input id="summary" type="text" value=""/>
    </div>
</div>
<div class="uk-form-row">
    <label class="uk-form-label uk-width-3-10" for="style">
            <?php echo WFText::_('WF_TABLE_STYLE'); ?></label>
        <div class="uk-form-controls uk-width-7-10">
            <input type="text" id="style" value=""
                   onchange="TableDialog.changedStyle();"/>
        </div>
    </div>
    <div class="uk-form-row">
        <label class="uk-form-label uk-width-3-10" id="langlabel" for="lang">
            <?php echo WFText::_('WF_TABLE_LANGCODE'); ?></label>
        <div class="uk-form-controls uk-width-7-10">
            <input id="lang" type="text" value="" class="uk-form-width-small" />
        </div>
    </div>
    <div class="uk-form-row">
        <label class="uk-form-label uk-width-3-10" for="backgroundimage">
            <?php echo WFText::_('WF_TABLE_BGIMAGE'); ?></label>
        <div class="uk-form-controls uk-width-7-10">
            <input id="backgroundimage" type="text"
                   value="" class="browser"
                   onchange="TableDialog.changedBackgroundImage();"/>
        </div>
    </div>
    <?php if ($this->plugin->getContext() == 'table') :
        ?>
        <div class="uk-form-row">
            <label class="uk-form-label uk-width-3-10" for="tframe">
                <?php echo WFText::_('WF_TABLE_FRAME'); ?></label>
            <div class="uk-form-controls uk-width-7-10">
                <select id="tframe">
                    <option value="">{#not_set}</option>
                    <option value="void"><?php echo WFText::_('WF_TABLE_RULES_VOID'); ?></option>
                    <option value="above"><?php echo WFText::_('WF_TABLE_RULES_ABOVE'); ?></option>
                    <option value="below"><?php echo WFText::_('WF_TABLE_RULES_BELOW'); ?></option>
                    <option value="hsides"><?php echo WFText::_('WF_TABLE_RULES_HSIDES'); ?></option>
                    <option value="lhs"><?php echo WFText::_('WF_TABLE_RULES_LHS'); ?></option>
                    <option value="rhs"><?php echo WFText::_('WF_TABLE_RULES_RHS'); ?></option>
                    <option value="vsides"><?php echo WFText::_('WF_TABLE_RULES_VSIDES'); ?></option>
                    <option value="box"><?php echo WFText::_('WF_TABLE_RULES_BOX'); ?></option>
                    <option value="border"><?php echo WFText::_('WF_TABLE_RULES_BORDER'); ?></option>
                </select></div>
        </div>
        <div class="uk-form-row">
            <label class="uk-form-label uk-width-3-10" for="rules">
                <?php echo WFText::_('WF_TABLE_RULES'); ?></label>
            <div class="uk-form-controls uk-width-7-10">
                <select id="rules">
                    <option value="">{#not_set}</option>
                    <option value="none"><?php echo WFText::_('WF_TABLE_FRAME_NONE'); ?></option>
                    <option value="groups"><?php echo WFText::_('WF_TABLE_FRAME_GROUPS'); ?></option>
                    <option value="rows"><?php echo WFText::_('WF_TABLE_FRAME_ROWS'); ?></option>
                    <option value="cols"><?php echo WFText::_('WF_TABLE_FRAME_COLS'); ?></option>
                    <option value="all"><?php echo WFText::_('WF_TABLE_FRAME_ALL'); ?></option>
                </select></div>
        </div>
    <?php endif; ?>
    <div class="uk-form-row">
        <label class="uk-form-label uk-width-3-10" for="dir">
            <?php echo WFText::_('WF_TABLE_LANGDIR'); ?></label>
        <div class="uk-form-controls uk-width-7-10">
            <select id="dir">
                <option value="">{#not_set}</option>
                <option value="ltr"><?php echo WFText::_('WF_TABLE_LTR'); ?></option>
                <option value="rtl"><?php echo WFText::_('WF_TABLE_RTL'); ?></option>
            </select></div>
    </div>
    <div class="uk-form-row">
        <label class="uk-form-label uk-width-3-10" for="bordercolor">
            <?php echo WFText::_('WF_TABLE_BORDERCOLOR'); ?></label>
        <div class="uk-form-controls uk-width-3-10">
            <input id="bordercolor" type="text" value=""
                   size="9" class="color uk-form-width-small" onchange="TableDialog.changedColor();"/>
        </div>
    </div>
    <div class="uk-form-row">
        <label class="uk-form-label uk-width-3-10" for="bgcolor">
            <?php echo WFText::_('WF_TABLE_BGCOLOR'); ?></label>
        <div class="uk-form-controls uk-width-3-10">
            <input id="bgcolor" type="text" value="" size="9"
                   class="color uk-form-width-small" onchange="TableDialog.changedColor();"/>
        </div>
    </div>
