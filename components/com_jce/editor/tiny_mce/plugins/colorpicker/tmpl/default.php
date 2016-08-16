<?php

/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('_JEXEC') or die('RESTRICTED');
?>
<div id="colorpicker">
    <div id="colorpicker_tabs">
        <ul class="ui-tab">
            <li class="ui-active"><a href="#colorpicker_picker" aria-controls="colorpicker_picker"><?php echo WFText::_('WF_COLORPICKER_PICKER'); ?></a></li>
            <li><a href="#colorpicker_web" aria-controls="colorpicker_web"><?php echo WFText::_('WF_COLORPICKER_PALETTE'); ?></a></li>
            <li><a href="#colorpicker_named" aria-controls="colorpicker_named"><?php echo WFText::_('WF_COLORPICKER_NAMED'); ?></a></li>
            <li><a href="#colorpicker_template" aria-controls="colorpicker_template"><?php echo WFText::_('WF_COLORPICKER_TEMPLATE'); ?></a></li>
        </ul>
        <div id="tab-content" class="ui-switcher">
            <div id="colorpicker_picker" title="<?php echo WFText::_('WF_COLORPICKER_PICKER'); ?>" data-type="picker" class="ui-active"><!-- Will be filled with color wheel --></div>
            <div id="colorpicker_web" title="<?php echo WFText::_('WF_COLORPICKER_PALETTE'); ?>" data-type="web"><!-- Gets filled with web safe colors--></div>
            <div id="colorpicker_named" title="<?php echo WFText::_('WF_COLORPICKER_NAMED'); ?>" data-type="named"><!-- Gets filled with named colors--></div>
            <div id="colorpicker_template" title="<?php echo WFText::_('WF_COLORPICKER_TEMPLATE'); ?>" data-type="template"><!-- Gets filled with template colors--></div>
        </div>
    </div>
</div>
<input type="hidden" id="tmp_color" />
<div class="mceActionPanel ui-modal-footer">
  <div id="colorpicker_preview">
      <div id="colorpicker_preview_text" class="ui-form-icon ui-form-icon-both">
          <i class="ui-icon-hashtag"></i>
          <input type="text" id="colorpicker_color" size="8" maxlength="8" value="000000" aria-required="true" />
          <span class="ui-icon-none" id="colorpicker_preview_color" style="background-color: rgb(0, 0, 0);"></span>
      </div>
  </div>

    <button type="button" class="ui-button ui-button-primary" id="colorpicker_insert" onclick="ColorPicker.insert();"><i class="ui-icon-check"></i><?php echo WFText::_('WF_LABEL_APPLY'); ?></button>
</div>
