<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Language\Text;

?>
<div class="uk-form-row uk-grid uk-grid-small">
  <div class="uk-width-4-10">
    <input type="checkbox" id="youtube_controls" checked />
    <label for="youtube_controls" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_CONTROLS_DESC') ?>" class="tooltip">
      <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_CONTROLS') ?>
    </label>
  </div>
  <div class="uk-width-6-10">
    <input type="checkbox" id="youtube_loop" />
    <label for="youtube_loop" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_LOOP_DESC') ?>" class="tooltip">
      <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_LOOP') ?>
    </label>
  </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
  <div class="uk-width-4-10">
    <input type="checkbox" id="youtube_autoplay" />
    <label for="youtube_autoplay" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_AUTOPLAY_DESC') ?>" class="tooltip">
      <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_AUTOPLAY') ?>
    </label>
  </div>
  <div class="uk-width-6-10">
    <input type="checkbox" id="youtube_mute" />
    <label for="youtube_mute" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_MUTE_DESC') ?>" class="tooltip">
      <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_MUTE') ?>
    </label>
  </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
  <div class="uk-width-4-10">
    <input type="checkbox" id="youtube_modestbranding" checked />
    <label for="youtube_modestbranding" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_MODESTBRANDING_DESC') ?>" class="tooltip">
      <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_MODESTBRANDING') ?>
    </label>
  </div>

  <div class="uk-width-6-10">
    <input type="checkbox" id="youtube_privacy" />
    <label for="youtube_privacy" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_PRIVACY_DESC') ?>" class="tooltip">
      <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_PRIVACY') ?>
    </label>
  </div>

</div>

<div class="uk-grid uk-grid-small">
  <label for="youtube_rel" class="uk-form-label uk-width-1-5 tooltip" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_RELATED_DESC') ?>">
    <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_RELATED') ?>
  </label>

  <div class="uk-form-controls uk-width-4-5">

    <select id="youtube_rel">
      <option value="1">
        <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_RELATED_ALL') ?>
      </option>
      <option value="0">
        <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_RELATED_CHANNEL') ?>
      </option>
    </select>

  </div>
</div>

<div class="uk-grid uk-grid-small">
  <label for="youtube_start" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_START_DESC') ?>" class="tooltip uk-form-label uk-width-2-10">
    <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_START') ?>
  </label>

  <div class="uk-form-controls uk-width-2-10">
    <input type="number" id="youtube_start" />
  </div>
  <div class="uk-width-6-10">
    <label for="youtube_end" class="uk-form-label uk-width-2-10" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_END_DESC') ?>" class="tooltip">
      <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_END') ?>
    </label>
    <div class="uk-form-controls uk-width-3-10">
      <input type="number" id="youtube_end" />
    </div>
  </div>
</div>

<div class="uk-grid uk-grid-small">
  <label for="youtube_playlist" class="uk-form-label uk-width-1-5" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_PLAYLIST_DESC') ?>" class="tooltip">
    <?php echo Text::_('WF_AGGREGATOR_YOUTUBE_PLAYLIST') ?>
  </label>
  <div class="uk-form-controls uk-width-4-5">
    <input type="text" id="youtube_playlist" />
  </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
  <label for="youtube_params" class="uk-form-label uk-width-1-5 hastip" title="<?php echo Text::_('WF_AGGREGATOR_YOUTUBE_PARAMS_DESC'); ?>"><?php echo Text::_('WF_AGGREGATOR_YOUTUBE_PARAMS'); ?></label>
  <div class="uk-width-4-5" id="youtube_params">
    <div class="uk-form-row uk-repeatable">
      <div class="uk-form-controls uk-grid uk-grid-small uk-width-9-10">
        <label class="uk-form-label uk-width-1-10"><?php echo Text::_('WF_LABEL_NAME'); ?></label>
        <div class="uk-form-controls uk-width-4-10">
          <input type="text" name="youtube_params_name[]" />
        </div>
        <label class="uk-form-label uk-width-1-10"><?php echo Text::_('WF_LABEL_VALUE'); ?></label>
        <div class="uk-form-controls uk-width-4-10">
          <input type="text" name="youtube_params_value[]" />
        </div>
      </div>
      <div class="uk-form-controls uk-margin-small-left">
        <button type="button" class="uk-button uk-button-link uk-repeatable-create"><i class="uk-icon-plus"></i></button>
        <button type="button" class="uk-button uk-button-link uk-repeatable-delete"><i class="uk-icon-trash"></i></button>
      </div>
    </div>
  </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
  <label for="youtube_attributes" class="uk-form-label uk-width-1-5"><?php echo Text::_('WF_LABEL_ATTRIBUTES'); ?></label>
  <div class="uk-width-4-5" id="youtube_attributes">
    <div class="uk-form-row uk-repeatable">
      <div class="uk-form-controls uk-grid uk-grid-small uk-width-9-10">
        <label class="uk-form-label uk-width-1-10"><?php echo Text::_('WF_LABEL_NAME'); ?></label>
        <div class="uk-form-controls uk-width-4-10">
          <input type="text" name="youtube_attributes_name[]" />
        </div>
        <label class="uk-form-label uk-width-1-10"><?php echo Text::_('WF_LABEL_VALUE'); ?></label>
        <div class="uk-form-controls uk-width-4-10">
          <input type="text" name="youtube_attributes_value[]" />
        </div>
      </div>
      <div class="uk-form-controls uk-margin-small-left">
        <button class="uk-button uk-button-link uk-repeatable-create" aria-label="<?php echo Text::_('WF_LABEL_ADD'); ?>" title="<?php echo Text::_('WF_LABEL_ADD'); ?>"><i class="uk-icon-plus"></i></button>
        <button class="uk-button uk-button-link uk-repeatable-delete" aria-label="<?php echo Text::_('WF_LABEL_REMOVE'); ?>" title="<?php echo Text::_('WF_LABEL_REMOVE'); ?>"><i class="uk-icon-trash"></i></button>
      </div>
    </div>
  </div>
</div>