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

use Joomla\CMS\Factory;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\MVC\View\HtmlView;
use Joomla\CMS\Language\Text;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\HTML\Helper\Sidebar;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Table\Table;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Toolbar\ToolbarHelper;
use Joomla\CMS\Toolbar\Toolbar;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Router\Route;

?>
<div class="uk-form-row uk-grid uk-grid-small">
       <label for="vimeo_color" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_COLOR_DESC') ?>"
              class="tooltip uk-form-label uk-width-1-5"><?php echo Text::_('WF_AGGREGATOR_VIMEO_COLOR') ?></label>

       <div class="uk-form-controls uk-width-1-5">
              <input type="text" id="vimeo_color" class="color" />
       </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">

       <label for="vimeo_intro" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_INTRO_DESC') ?>"
              class="tooltip uk-form-label uk-width-1-5"><?php echo Text::_('WF_AGGREGATOR_VIMEO_INTRO') ?></label>
       <div class="uk-form-controls uk-width-4-5">
              <input type="checkbox" id="vimeo_portrait" />
              <label for="vimeo_portrait" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_PORTRAIT_DESC') ?>"
                     class="tooltip uk-margin-right"><?php echo Text::_('WF_AGGREGATOR_VIMEO_PORTRAIT') ?></label>

              <input type="checkbox" id="vimeo_title" />
              <label for="vimeo_title" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_INTROTITLE_DESC') ?>"
                     class="tooltip uk-margin-right"><?php echo Text::_('WF_AGGREGATOR_VIMEO_INTROTITLE') ?></label>

              <input type="checkbox" id="vimeo_byline" />
              <label for="vimeo_byline" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_BYLINE_DESC') ?>"
                     class="tooltip"><?php echo Text::_('WF_AGGREGATOR_VIMEO_BYLINE') ?></label>
       </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
       <label for="vimeo_special"
              class="uk-form-label uk-width-1-5"><?php echo Text::_('WF_AGGREGATOR_VIMEO_SPECIAL') ?></label>
       <div class="uk-form-controls uk-width-4-5">

              <input type="checkbox" id="vimeo_autoplay" />
              <label for="vimeo_autoplay" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_AUTOPLAY_DESC') ?>"
                     class="tooltip uk-margin-right"><?php echo Text::_('WF_AGGREGATOR_VIMEO_AUTOPLAY') ?></label>

              <input type="checkbox" id="vimeo_loop" />
              <label for="vimeo_loop" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_LOOP_DESC') ?>"
                     class="tooltip uk-margin-right"><?php echo Text::_('WF_AGGREGATOR_VIMEO_LOOP') ?></label>

              <input type="checkbox" id="vimeo_fullscreen" checked="checked" />
              <label for="vimeo_fullscreen" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_FULLSCREEN_DESC') ?>"
                     class="tooltip"><?php echo Text::_('WF_AGGREGATOR_VIMEO_FULLSCREEN') ?></label>

              <input type="checkbox" id="vimeo_dnt" />
              <label for="vimeo_dnt" title="<?php echo Text::_('WF_AGGREGATOR_VIMEO_DNT_DESC') ?>"
                     class="tooltip"><?php echo Text::_('WF_AGGREGATOR_VIMEO_DNT') ?></label>
       </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
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