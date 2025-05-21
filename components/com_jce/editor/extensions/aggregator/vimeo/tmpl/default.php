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
<div class="uk-form-row uk-flex">
       <label for="vimeo_color" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_COLOR_DESC') ?>"
              class="tooltip uk-form-label uk-width-1-5"><?php echo Text::_('WF_AGGREGATOR_VIMEO_COLOR') ?></label>

       <div class="uk-form-controls uk-width-1-5">
              <input type="text" id="vimeo_color" class="color" />
       </div>
</div>

<div class="uk-form-row uk-flex">

       <label for="vimeo_intro" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_INTRO_DESC') ?>"
              class="tooltip uk-form-label uk-width-1-5"><?php echo Text::_('WF_AGGREGATOR_VIMEO_INTRO') ?></label>

       <div class="uk-form-controls uk-form-row uk-flex uk-width-4-5">
              <label for="vimeo_portrait" class="uk-checkbox-label tooltip" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_PORTRAIT_DESC') ?>">
                     <input type="checkbox" id="vimeo_portrait" /><?php echo Text::_('WF_AGGREGATOR_VIMEO_PORTRAIT'); ?>
              </label>

              <label for="vimeo_title" class="uk-checkbox-label tooltip" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_INTROTITLE_DESC') ?>">
                     <input type="checkbox" id="vimeo_title" /><?php echo Text::_('WF_AGGREGATOR_VIMEO_INTROTITLE'); ?>
              </label>

              <label for="vimeo_byline" class="uk-checkbox-label tooltip" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_BYLINE_DESC') ?>">
                     <input type="checkbox" id="vimeo_byline" /><?php echo Text::_('WF_AGGREGATOR_VIMEO_BYLINE'); ?>
              </label>
       </div>
</div>

<div class="uk-form-row uk-flex">
       <label for="vimeo_special"
              class="uk-form-label uk-width-1-5"><?php echo Text::_('WF_AGGREGATOR_VIMEO_SPECIAL') ?></label>
       <div class="uk-form-controls uk-form-row uk-flex uk-width-4-5">

              <label for="vimeo_autoplay" class="uk-checkbox-label tooltip" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_AUTOPLAY_DESC') ?>">
                     <input type="checkbox" id="vimeo_autoplay" /><?php echo Text::_('WF_AGGREGATOR_VIMEO_AUTOPLAY'); ?>
              </label>

              <label for="vimeo_loop" class="uk-checkbox-label tooltip" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_LOOP_DESC') ?>">
                     <input type="checkbox" id="vimeo_loop" /><?php echo Text::_('WF_AGGREGATOR_VIMEO_LOOP'); ?>
              </label>

              <label for="vimeo_fullscreen" class="uk-checkbox-label tooltip" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_FULLSCREEN_DESC') ?>">
                     <input type="checkbox" id="vimeo_fullscreen" /><?php echo Text::_('WF_AGGREGATOR_VIMEO_FULLSCREEN'); ?>
              </label>

              <label for="vimeo_dnt" class="uk-checkbox-label tooltip" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_DNT_DESC') ?>">
                     <input type="checkbox" id="vimeo_dnt" /><?php echo Text::_('WF_AGGREGATOR_VIMEO_DNT'); ?>
              </label>
       </div>
</div>

<div class="uk-form-row uk-flex">
       <label for="vimeo_attributes" class="uk-form-label uk-width-1-5"><?php echo Text::_('WF_LABEL_ATTRIBUTES'); ?></label>
       <div class="uk-width-4-5" id="vimeo_attributes">
              <div class="uk-form-row uk-repeatable">
                     <div class="uk-form-controls uk-grid uk-grid-small uk-width-9-10">
                            <label class="uk-form-label uk-width-1-10"><?php echo Text::_('WF_LABEL_NAME'); ?></label>
                            <div class="uk-form-controls uk-width-4-10">
                                   <input type="text" name="vimeo_attributes_name[]" />
                            </div>
                            <label class="uk-form-label uk-width-1-10"><?php echo Text::_('WF_LABEL_VALUE'); ?></label>
                            <div class="uk-form-controls uk-width-4-10">
                                   <input type="text" name="vimeo_attributes_value[]" />
                            </div>
                     </div>
                     <div class="uk-form-controls uk-width-1-10 uk-margin-small-left">
                            <button class="uk-button uk-button-link uk-repeatable-create" aria-label="<?php echo Text::_('WF_LABEL_ADD'); ?>" title="<?php echo Text::_('WF_LABEL_ADD'); ?>"><i class="uk-icon-plus"></i></button>
                            <button class="uk-button uk-button-link uk-repeatable-delete" aria-label="<?php echo Text::_('WF_LABEL_REMOVE'); ?>" title="<?php echo Text::_('WF_LABEL_REMOVE'); ?>"><i class="uk-icon-trash"></i></button>
                     </div>
              </div>
       </div>
</div>