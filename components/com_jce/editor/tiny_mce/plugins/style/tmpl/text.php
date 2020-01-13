<?php
/**
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;
?>
<div class="uk-form-row uk-grid uk-grid-small">
  <label for="text_font" class="uk-form-label uk-width-2-10"><?php echo JText::_('WF_STYLES_TEXT_FONT'); ?></label>
    <div class="uk-form-controls uk-width-8-10"><input type="text" id="text_font" class="uk-datalist" list="text_font_datalist" /><datalist id="text_font_datalist"></datalist></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label for="text_size" class="uk-form-label uk-width-2-10"><?php echo JText::_('WF_STYLES_TEXT_SIZE'); ?></label>

      <div class="uk-form-controls uk-width-2-10">
        <input type="text" id="text_size" class="uk-datalist" list="text_size_datalist" /><datalist id="text_size_datalist"></datalist>
      </div>
      <div class="uk-form-controls uk-width-2-10">
        <select id="text_size_measurement"></select>
      </div>

    <div class="uk-width-4-10">
      <label for="text_weight" class="uk-form-label uk-width-3-10"><?php echo JText::_('WF_STYLES_TEXT_WEIGHT'); ?></label>
           <div class="uk-form-controls uk-width-7-10"><select id="text_weight"></select></div>
  </div>
</div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label class="uk-form-label uk-width-2-10" for="text_style"><?php echo JText::_('WF_STYLES_TEXT_STYLE'); ?></label>
            <div class="uk-form-controls uk-width-4-10">
              <input type="text" id="text_style" class="uk-datalist" list="text_style_datalist" /><datalist id="text_style_datalist"></datalist>
            </div>
          <div class="uk-width-4-10">
            <label class="uk-form-label uk-width-3-10" for="text_variant"><?php echo JText::_('WF_STYLES_TEXT_VARIANT'); ?></label>
              <div class="uk-form-controls uk-width-7-10">
                <select id="text_variant"></select>
              </div>
          </div>
      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label class="uk-form-label uk-width-2-10" for="text_lineheight"><?php echo JText::_('WF_STYLES_TEXT_LINEHEIGHT'); ?></label>
            <div class="uk-form-row uk-width-2-10">
                <input type="text" id="text_lineheight" class="uk-datalist" list="text_lineheight_datalist" /><datalist id="text_lineheight_datalist"></datalist>
            </div>
            <div class="uk-form-controls uk-width-2-10">
              <select id="text_lineheight_measurement" ></select>
            </div>
            <div class="uk-width-4-10">
              <label class="uk-form-label uk-width-3-10" for="text_case"><?php echo JText::_('WF_STYLES_TEXT_CASE'); ?></label>
              <div class="uk-form-controls uk-width-7-10">
                <select id="text_case" ></select>
              </div>
            </div>
      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label class="uk-form-label uk-width-2-10" for="text_color"><?php echo JText::_('WF_STYLES_TEXT_COLOR'); ?></label>
            <div class="uk-form-controls uk-width-2-10">
              <input id="text_color" class="color" type="text" value="" />
            </div>
      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
          <label class="uk-form-label uk-width-2-10"><?php echo JText::_('WF_STYLES_TEXT_DECORATION'); ?></label>
          <div class="uk-form-controls uk-width-8-10">
              <input id="text_underline" type="checkbox" />
              <label for="text_underline" class="uk-margin-right"><?php echo JText::_('WF_STYLES_TEXT_UNDERLINE'); ?></label>

              <input id="text_overline" type="checkbox" />
              <label for="text_overline" class="uk-margin-right"><?php echo JText::_('WF_STYLES_TEXT_OVERLINE'); ?></label>

              <input id="text_linethrough" type="checkbox" />
              <label for="text_linethrough" class="uk-margin-right"><?php echo JText::_('WF_STYLES_TEXT_STRIKETROUGH'); ?></label>

              <input id="text_blink" type="checkbox" />
              <label for="text_blink" class="uk-margin-right"><?php echo JText::_('WF_STYLES_TEXT_BLINK'); ?></label>

              <input id="text_none" type="checkbox" onclick="StyleDialog.updateTextDecorations();" />
              <label for="text_none"><?php echo JText::_('WF_STYLES_TEXT_NONE'); ?></label>
          </div>
      </div>
