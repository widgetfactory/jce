<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;
?>
<div class="uk-grid">
  <div class="uk-width-3-10">
    <fieldset>
      <legend><?php echo Text::_('WF_STYLES_STYLE'); ?></legend>
      <div class="uk-form-row">
        <input type="checkbox" id="border_style_same" checked="checked" onclick="StyleDialog.toggleSame(this,'border_style');" />
        <label for="border_style_same"><?php echo Text::_('WF_STYLES_SAME'); ?></label>
      </div>
    <div class="uk-form-row uk-grid uk-grid-small">
      <label for="border_style_top" class="uk-form-label uk-width-3-10"><?php echo Text::_('WF_STYLES_TOP'); ?></label>
      <div class="uk-form-controls uk-width-7-10">
        <input type="text" id="border_style_top" class="uk-datalist" list="border_style_top_datalist" /><datalist id="border_style_top_datalist"></datalist>
      </div>
    </div>

    <div class="uk-form-row uk-grid uk-grid-small">
      <label for="border_style_right" class="uk-form-label uk-width-3-10"><?php echo Text::_('WF_STYLES_RIGHT'); ?></label>
      <div class="uk-form-controls uk-width-7-10">
        <input type="text" id="border_style_right" class="uk-datalist" list="border_style_right_datalist" /><datalist id="border_style_right_datalist"></datalist>
      </div>
    </div>

    <div class="uk-form-row uk-grid uk-grid-small">
      <label for="border_style_bottom" class="uk-form-label uk-width-3-10"><?php echo Text::_('WF_STYLES_BOTTOM'); ?></label>
      <div class="uk-form-controls uk-width-7-10">
        <input type="text" id="border_style_bottom" class="uk-datalist" list="border_style_bottom_datalist" /><datalist id="border_style_bottom_datalist"></datalist>
      </div>
    </div>

    <div class="uk-form-row uk-grid uk-grid-small">
      <label for="border_style_left" class="uk-form-label uk-width-3-10"><?php echo Text::_('WF_STYLES_LEFT'); ?></label>
      <div class="uk-form-controls uk-width-7-10">
        <input type="text" id="border_style_left" class="uk-datalist" list="border_style_left_datalist" /><datalist id="border_style_left_datalist"></datalist>
      </div>
    </div>
  </fieldset>
  </div>
  <div class="uk-width-4-10">
    <fieldset>
      <legend><?php echo Text::_('WF_STYLES_WIDTH'); ?></legend>
      <div class="uk-form-row">
        <input type="checkbox" id="border_width_same" checked="checked" onclick="StyleDialog.toggleSame(this,'border_width');" />
        <label for="border_width_same"><?php echo Text::_('WF_STYLES_SAME'); ?></label>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <div class="uk-form-controls uk-width-5-10">
          <input type="text" id="border_width_top" class="uk-datalist" list="border_width_top_datalist" /><datalist id="border_width_top_datalist"></datalist>
        </div>
        <div class="uk-form-controls uk-width-5-10">
          <select id="border_width_top_measurement" ></select>
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <div class="uk-form-controls uk-width-5-10">
          <input type="text" id="border_width_right" class="uk-datalist" list="border_width_right_datalist" /><datalist id="border_width_right_datalist"></datalist>
        </div>
        <div class="uk-form-controls uk-width-5-10">
          <select id="border_width_right_measurement" ></select>
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <div class="uk-form-controls uk-width-5-10">
          <input type="text" id="border_width_bottom" class="uk-datalist" list="border_width_bottom_datalist" /><datalist id="border_width_bottom_datalist"></datalist>
        </div>
        <div class="uk-form-controls uk-width-5-10">
          <select id="border_width_bottom_measurement" ></select>
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <div class="uk-form-controls uk-width-5-10">
          <input type="text" id="border_width_left" class="uk-datalist" list="border_width_left_datalist" /><datalist id="border_width_left_datalist"></datalist>
        </div>
        <div class="uk-form-controls uk-width-5-10">
          <select id="border_width_left_measurement" ></select>
        </div>
      </div>
    </fieldset>
  </div>
  <div class="uk-width-3-10">
    <fieldset>
      <legend><?php echo Text::_('WF_STYLES_COLOR'); ?></legend>
      <div class="uk-form-row">
        <input type="checkbox" id="border_color_same" checked="checked" onclick="StyleDialog.toggleSame(this,'border_color');" />
        <label for="border_color_same"><?php echo Text::_('WF_STYLES_SAME'); ?></label>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <div class="uk-form-controls uk-width-2-3">
          <input id="border_color_top" class="color" type="text" value="" />
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <div class="uk-form-controls uk-width-2-3">
          <input id="border_color_right" class="color" type="text" value="" />
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <div class="uk-form-controls uk-width-2-3">
          <input id="border_color_bottom" class="color" type="text" value="" />
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <div class="uk-form-controls uk-width-2-3">
          <input id="border_color_left" class="color" type="text" value="" />
        </div>
      </div>
    </fieldset>
  </div>
</div>
