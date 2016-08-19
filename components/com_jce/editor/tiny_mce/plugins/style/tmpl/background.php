<?php

/**
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('_JEXEC') or die('RESTRICTED');
?>
      <div class="ui-form-row">
        <label for="background_color" class="ui-form-label ui-width-2-10"><?php echo WFText::_('WF_STYLES_BACKGROUND_COLOR');?></label>
            <div class="ui-form-controls ui-width-2-10">
              <input id="background_color" class="color" type="text" value="" />
            </div>
      </div>
      <div class="ui-form-row">
        <label for="background_image" class="ui-form-label ui-width-2-10"><?php echo WFText::_('WF_STYLES_BACKGROUND_IMAGE');?></label>
          <div class="ui-form-controls ui-width-8-10">
            <input id="background_image" class="browser image" type="text" />
          </div>
      </div>

      <div class="ui-form-row">
        <label for="background_repeat" class="ui-form-label ui-width-2-10"><?php echo WFText::_('WF_STYLES_BACKGROUND_REPEAT');?></label>
        <div class="ui-form-controls ui-width-4-10 ui-datalist">
          <select id="background_repeat"></select>
        </div>
      </div>

      <div class="ui-form-row">
        <label for="background_attachment" class="ui-form-label ui-width-2-10"><?php echo WFText::_('WF_STYLES_BACKGROUND_ATTACHMENT');?></label>
        <div class="ui-form-controls ui-width-4-10 ui-datalist">
          <select id="background_attachment"></select>
        </div>
      </div>

      <div class="ui-form-row">
        <label for="background_hpos" class="ui-form-label ui-width-2-10"><?php echo WFText::_('WF_STYLES_BACKGROUND_HPOS');?></label>

          <div class="ui-form-controls ui-width-4-10 ui-margin-right ui-datalist">
              <select id="background_hpos"></select>
          </div>
          <div class="ui-form-controls ui-width-2-10">
              <select id="background_hpos_measurement"></select>
          </div>
      </div>

      <div class="ui-form-row">
        <label for="background_vpos" class="ui-form-label ui-width-2-10"><?php echo WFText::_('WF_STYLES_BACKGROUND_VPOS');?></label>

          <div class="ui-form-controls ui-width-4-10 ui-margin-right ui-datalist">
              <select id="background_vpos"></select>
            </div>
          <div class="ui-form-controls ui-width-2-10">
              <select id="background_vpos_measurement"></select>
          </div>
      </div>
