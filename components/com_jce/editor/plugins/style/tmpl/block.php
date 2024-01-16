<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Language\Text;
?>
      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="block_wordspacing" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BLOCK_WORDSPACING'); ?></label>
            <div class="uk-form-controls uk-width-5-10">
              <input type="text" id="block_wordspacing" class="uk-datalist" list="block_wordspacing_datalist" /><datalist id="block_wordspacing_datalist"></datalist>
            </div>
            <div class="uk-form-controls uk-width-3-10">
              <select id="block_wordspacing_measurement" ></select>
            </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="block_letterspacing" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BLOCK_LETTERSPACING'); ?></label>
            <div class="uk-form-controls uk-width-5-10">
              <input type="text" id="block_letterspacing" class="uk-datalist" list="block_letterspacing_datalist" /><datalist id="block_letterspacing_datalist"></datalist>
            </div>
            <div class="uk-form-controls uk-width-3-10">
              <select id="block_letterspacing_measurement"></select>
            </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="block_vertical_alignment" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BLOCK_VERTICAL_ALIGNMENT'); ?></label>
        <div class="uk-form-controls uk-width-5-10">
          <input type="text" id="block_vertical_alignment" class="uk-datalist" list="block_vertical_alignment_datalist" /><datalist id="block_vertical_alignment_datalist"></datalist>
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="block_text_align" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BLOCK_TEXT_ALIGN'); ?></label>
        <div class="uk-form-controls uk-width-5-10">
          <input type="text" id="block_text_align" class="uk-datalist" list="block_text_align_datalist" /><datalist id="block_text_align_datalist"></datalist>
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="block_text_indent" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BLOCK_TEXT_INDENT'); ?></label>
            <div class="uk-form-controls uk-width-2-10">
              <input type="number" id="block_text_indent" />
            </div>
            <div class="uk-form-controls uk-width-2-10">
              <select id="block_text_indent_measurement"></select>
            </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="block_whitespace" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BLOCK_WHITESPACE'); ?></label>
        <div class="uk-form-controls uk-width-5-10">
          <input type="text" id="block_whitespace" class="uk-datalist" list="block_whitespace_datalist" /><datalist id="block_whitespace_datalist"></datalist>
        </div>
      </div>

      <div class="uk-form-row uk-grid uk-grid-small">
        <label for="block_display" class="uk-form-label uk-width-2-10"><?php echo Text::_('WF_STYLES_BLOCK_DISPLAY'); ?></label>
        <div class="uk-form-controls uk-width-5-10">
          <input type="text" id="block_display" class="uk-datalist" list="block_display_datalist" /><datalist id="block_display_datalist"></datalist>
        </div>
      </div>
