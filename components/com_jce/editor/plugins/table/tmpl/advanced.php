<?php

/**
 * @copyright    Copyright (c) 2009-2022 Ryan Demmer. All rights reserved
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Language\Text;

?>
<div class="uk-form-row uk-grid uk-grid-small">
    <label for="classlist" class="uk-form-label uk-width-1-5 hastip" title="<?php echo Text::_('WF_LABEL_CLASSES_DESC'); ?>"><?php echo Text::_('WF_LABEL_CLASSES'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <input type="text" id="classes" class="uk-datalist" multiple="multiple" list="classes_datalist" />
        <datalist id="classes_datalist"></datalist>
    </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" for="id">
        <?php echo Text::_('WF_TABLE_ID'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <input id="id" type="text" value="" />
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" for="summary">
        <?php echo Text::_('WF_TABLE_SUMMARY'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <input id="summary" type="text" value="" />
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" for="style">
        <?php echo Text::_('WF_TABLE_STYLE'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <input type="text" id="style" value="" />
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" id="langlabel" for="lang">
        <?php echo Text::_('WF_TABLE_LANGCODE'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <input id="lang" type="text" value="" class="uk-form-width-small" />
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" for="backgroundimage">
        <?php echo Text::_('WF_TABLE_BGIMAGE'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <input id="backgroundimage" type="text" value="" class="browser images" />
    </div>
</div>
<?php if ($this->plugin->getLayout() == 'table'):
?>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" for="tframe">
        <?php echo Text::_('WF_TABLE_FRAME'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <select id="frame">
            <option value=""><?php echo Text::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="void"><?php echo Text::_('WF_TABLE_RULES_VOID'); ?></option>
            <option value="above"><?php echo Text::_('WF_TABLE_RULES_ABOVE'); ?></option>
            <option value="below"><?php echo Text::_('WF_TABLE_RULES_BELOW'); ?></option>
            <option value="hsides"><?php echo Text::_('WF_TABLE_RULES_HSIDES'); ?></option>
            <option value="lhs"><?php echo Text::_('WF_TABLE_RULES_LHS'); ?></option>
            <option value="rhs"><?php echo Text::_('WF_TABLE_RULES_RHS'); ?></option>
            <option value="vsides"><?php echo Text::_('WF_TABLE_RULES_VSIDES'); ?></option>
            <option value="box"><?php echo Text::_('WF_TABLE_RULES_BOX'); ?></option>
            <option value="border"><?php echo Text::_('WF_TABLE_RULES_BORDER'); ?></option>
        </select></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" for="rules">
        <?php echo Text::_('WF_TABLE_RULES'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <select id="rules">
            <option value=""><?php echo Text::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="none"><?php echo Text::_('WF_TABLE_FRAME_NONE'); ?></option>
            <option value="groups"><?php echo Text::_('WF_TABLE_FRAME_GROUPS'); ?></option>
            <option value="rows"><?php echo Text::_('WF_TABLE_FRAME_ROWS'); ?></option>
            <option value="cols"><?php echo Text::_('WF_TABLE_FRAME_COLS'); ?></option>
            <option value="all"><?php echo Text::_('WF_TABLE_FRAME_ALL'); ?></option>
        </select></div>
</div>
<?php endif; ?>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" for="dir">
        <?php echo Text::_('WF_TABLE_LANGDIR'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <select id="dir">
            <option value=""><?php echo Text::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="ltr"><?php echo Text::_('WF_TABLE_LTR'); ?></option>
            <option value="rtl"><?php echo Text::_('WF_TABLE_RTL'); ?></option>
        </select></div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <label for="border" class="hastip uk-form-label uk-width-1-5" title="<?php echo Text::_('WF_LABEL_BORDER_DESC'); ?>">
        <?php echo Text::_('WF_LABEL_BORDER'); ?>
    </label>

    <div class="uk-form-controls uk-grid uk-grid-small uk-width-4-5">
        <div class="uk-form-controls uk-width-0-3 uk-margin-small-top">
            <input type="checkbox" id="border" />
        </div>

        <label for="border_width" class="hastip uk-form-label uk-width-1-10 uk-margin-small-left" title="<?php echo Text::_('WF_LABEL_BORDER_WIDTH_DESC'); ?>"><?php echo Text::_('WF_LABEL_WIDTH'); ?></label>
        <div class="uk-form-controls uk-width-2-10">
            <input type="text" pattern="[0-9]+" id="border_width" class="uk-datalist" list="border_width_datalist" />
            <datalist id="border_width_datalist">
                <option value="inherit">--</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="thin"><?php echo Text::_('WF_OPTION_BORDER_THIN'); ?></option>
                <option value="medium"><?php echo Text::_('WF_OPTION_BORDER_MEDIUM'); ?></option>
                <option value="thick"><?php echo Text::_('WF_OPTION_BORDER_THICK'); ?></option>
            </datalist>
        </div>

        <label for="border_style" class="hastip uk-form-label uk-width-1-10 uk-margin-small-left" title="<?php echo Text::_('WF_LABEL_BORDER_STYLE_DESC'); ?>"><?php echo Text::_('WF_LABEL_STYLE'); ?></label>
        <div class="uk-form-controls uk-width-2-10">
            <select id="border_style">
                <option value="inherit">--</option>
                <option value="none"><?php echo Text::_('WF_OPTION_BORDER_NONE'); ?></option>
                <option value="solid"><?php echo Text::_('WF_OPTION_BORDER_SOLID'); ?></option>
                <option value="dashed"><?php echo Text::_('WF_OPTION_BORDER_DASHED'); ?></option>
                <option value="dotted"><?php echo Text::_('WF_OPTION_BORDER_DOTTED'); ?></option>
                <option value="double"><?php echo Text::_('WF_OPTION_BORDER_DOUBLE'); ?></option>
                <option value="groove"><?php echo Text::_('WF_OPTION_BORDER_GROOVE'); ?></option>
                <option value="inset"><?php echo Text::_('WF_OPTION_BORDER_INSET'); ?></option>
                <option value="outset"><?php echo Text::_('WF_OPTION_BORDER_OUTSET'); ?></option>
                <option value="ridge"><?php echo Text::_('WF_OPTION_BORDER_RIDGE'); ?></option>
            </select>
        </div>

        <label for="border_color" class="hastip uk-form-label uk-width-1-10 uk-margin-small-left" title="<?php echo Text::_('WF_LABEL_BORDER_COLOR_DESC'); ?>"><?php echo Text::_('WF_LABEL_COLOR'); ?></label>
        <div class="uk-form-controls uk-width-2-10">
            <input id="border_color" class="color" type="text" value="#000000" />
        </div>
    </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5" for="bgcolor">
        <?php echo Text::_('WF_TABLE_BGCOLOR'); ?></label>
    <div class="uk-form-controls uk-width-1-5">
        <input id="bgcolor" type="text" value="" size="9" class="color uk-form-width-small" />
    </div>
</div>