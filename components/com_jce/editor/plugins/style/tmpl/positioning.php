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

<div class="uk-form-row uk-grid uk-grid-small">
  <label for="positioning_type" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_POSITIONING_TYPE'); ?></label>
  <div class="uk-form-controls uk-width-3-10">
    <input type="text" id="positioning_type" class="uk-datalist" list="positioning_type_datalist" /><datalist id="positioning_type_datalist"></datalist>
  </div>
  <label for="positioning_visibility" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_VISIBILITY'); ?></label>
  <div class="uk-form-controls uk-width-3-10">
    <input type="text" id="positioning_visibility" class="uk-datalist" list="positioning_visibility_datalist" /><datalist id="positioning_visibility_datalist"></datalist>
  </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
  <label for="positioning_width" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_WIDTH'); ?></label>
  <div class="uk-form-controls uk-width-2-10">
    <input type="number" id="positioning_width" onchange="StyleDialog.synch('positioning_width','box_width');" />
  </div>
  <div class="uk-form-controls uk-width-2-10">
    <select id="positioning_width_measurement"></select>
  </div>
  <label for="positioning_zindex" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_ZINDEX'); ?></label>
  <div class="uk-form-controls uk-width-2-10">
    <input type="number" id="positioning_zindex" />
  </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
  <label for="positioning_height" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_HEIGHT'); ?></label>
  <div class="uk-form-controls uk-width-2-10">
    <input type="number" id="positioning_height" onchange="StyleDialog.synch('positioning_height','box_height');" />
  </div>
  <div class="uk-form-controls uk-width-2-10">
    <select id="positioning_height_measurement"></select>
  </div>
  <label for="positioning_overflow" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_OVERFLOW'); ?></label>
  <div class="uk-form-controls uk-width-2-10">
    <input type="text" id="positioning_overflow" class="uk-datalist" list="positioning_overflow_datalist" /><datalist id="positioning_overflow_datalist"></datalist>
  </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
  <div class="uk-width-5-10">
    <fieldset>
      <legend><?php echo Text::_('WF_STYLES_PLACEMENT'); ?></legend>


      <div class="uk-form-row">
        <input type="checkbox" id="positioning_placement_same" checked="checked" onclick="StyleDialog.toggleSame(this,'positioning_placement');" />
        <label for="positioning_placement_same"><?php echo Text::_('WF_STYLES_SAME'); ?></label>
      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="positioning_placement_left" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_TOP'); ?></label>


        <div class="uk-form-controls uk-width-4-10">
          <input type="number" id="positioning_placement_top" />
        </div>
        <div class="uk-form-controls uk-width-4-10">
          <select id="positioning_placement_top_measurement"></select>
        </div>


      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="positioning_placement_left" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_RIGHT'); ?></label>


        <div class="uk-form-controls uk-width-4-10">
          <input type="number" id="positioning_placement_right" disabled="disabled" />
        </div>
        <div class="uk-form-controls uk-width-4-10">
          <select id="positioning_placement_right_measurement" disabled="disabled"></select>
        </div>


      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="positioning_placement_left" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BOTTOM'); ?></label>


        <div class="uk-form-controls uk-width-4-10">
          <input type="number" id="positioning_placement_bottom" disabled="disabled" />
        </div>
        <div class="uk-form-controls uk-width-4-10">
          <select id="positioning_placement_bottom_measurement" disabled="disabled"></select>
        </div>


      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="positioning_placement_left" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_LEFT'); ?></label>


        <div class="uk-form-controls uk-width-4-10">
          <input type="number" id="positioning_placement_left" disabled="disabled" />
        </div>
        <div class="uk-form-controls uk-width-4-10">
          <select id="positioning_placement_left_measurement" disabled="disabled"></select>
        </div>


      </div>

    </fieldset>
  </div>

  <div class="uk-width-5-10">
    <fieldset>
      <legend><?php echo Text::_('WF_STYLES_CLIP'); ?></legend>


      <div class="uk-form-row">
        <input type="checkbox" id="positioning_clip_same" checked="checked" onclick="StyleDialog.toggleSame(this,'positioning_clip');" />
        <label for="positioning_clip_same"><?php echo Text::_('WF_STYLES_SAME'); ?></label>
      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="positioning_clip_top" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_TOP'); ?></label>


        <div class="uk-form-controls uk-width-4-10">
          <input type="number" id="positioning_clip_top" />
        </div>
        <div class="uk-form-controls uk-width-4-10">
          <select id="positioning_clip_top_measurement"></select>
        </div>


      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="positioning_clip_right" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_RIGHT'); ?></label>


        <div class="uk-form-controls uk-width-4-10">
          <input type="number" id="positioning_clip_right" disabled="disabled" />
        </div>
        <div class="uk-form-controls uk-width-4-10">
          <select id="positioning_clip_right_measurement" disabled="disabled"></select>
        </div>


      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="positioning_clip_bottom" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BOTTOM'); ?></label>


        <div class="uk-form-controls uk-width-4-10">
          <input type="number" id="positioning_clip_bottom" disabled="disabled" />
        </div>
        <div class="uk-form-controls uk-width-4-10">
          <select id="positioning_clip_bottom_measurement" disabled="disabled"></select>
        </div>


      </div>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="positioning_clip_left" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_LEFT'); ?></label>

        <div class="uk-form-controls uk-width-4-10">
          <input type="number" id="positioning_clip_left" disabled="disabled" />
        </div>
        <div class="uk-form-controls uk-width-4-10">
          <select id="positioning_clip_left_measurement" disabled="disabled"></select>
        </div>


      </div>

    </fieldset>
  </div>
</div>