<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;
?>
<div id="colorpicker">
    <div id="colorpicker_tabs">
        <ul class="uk-tab" role="tablist">
            <li role="presentation" aria-selected="true" class="uk-active"><button type="button" class="uk-button uk-button-link" aria-controls="colorpicker_picker" tabindex="-1"><?php echo JText::_('WF_COLORPICKER_PICKER'); ?></button></li>
            <li role="presentation" aria-selected="false" ><button type="button" class="uk-button uk-button-link" aria-controls="colorpicker_web" tabindex="-1"><?php echo JText::_('WF_COLORPICKER_PALETTE'); ?></button></li>
            <li role="presentation" aria-selected="false" ><button type="button" class="uk-button uk-button-link" aria-controls="colorpicker_named" tabindex="-1"><?php echo JText::_('WF_COLORPICKER_NAMED'); ?></button></li>
            <li role="presentation" aria-selected="false" ><button type="button" class="uk-button uk-button-link" aria-controls="colorpicker_template" tabindex="-1"><?php echo JText::_('WF_COLORPICKER_TEMPLATE'); ?></button></li>
        </ul>
        <div id="tab-content" class="uk-switcher">
            <div id="colorpicker_picker" title="<?php echo JText::_('WF_COLORPICKER_PICKER'); ?>" data-type="picker" class="uk-active" role="tabpanel" aria-hidden="false"><!-- Will be filled with color wheel --></div>
            <div id="colorpicker_web" title="<?php echo JText::_('WF_COLORPICKER_PALETTE'); ?>" data-type="web" role="tabpanel" aria-hidden="true"><!-- Gets filled with web safe colors--></div>
            <div id="colorpicker_named" title="<?php echo JText::_('WF_COLORPICKER_NAMED'); ?>" data-type="named" role="tabpanel" aria-hidden="true"><!-- Gets filled with named colors--></div>
            <div id="colorpicker_template" title="<?php echo JText::_('WF_COLORPICKER_TEMPLATE'); ?>" data-type="template" role="tabpanel" aria-hidden="true"><!-- Gets filled with template colors--></div>
        </div>
    </div>
<input type="hidden" id="tmp_color" />
</div>
<div class="mceActionPanel uk-modal-footer">
  <div id="colorpicker_preview">
      <div id="colorpicker_preview_text" class="uk-form-icon uk-form-icon-both">
          <i class="uk-icon-hashtag"></i>
          <input type="text" id="colorpicker_color" size="8" maxlength="8" value="000000" aria-required="true" />
          <span class="uk-icon-none" id="colorpicker_preview_color" style="background-color: rgb(0, 0, 0);"></span>
      </div>
  </div>

    <button type="button" class="uk-button uk-button-primary" id="colorpicker_insert" onclick="ColorPicker.insert();"><i class="uk-icon-check"></i><span class="uk-button-text"><?php echo JText::_('WF_LABEL_APPLY'); ?></span></button>
</div>