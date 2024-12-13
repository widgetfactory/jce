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
<div class="uk-grid uk-grid-small">
    <div class="uk-width-1-1 uk-width-medium-4-5 uk-flex-item-auto">
        <div class="uk-form-row uk-grid uk-grid-small">
            <label for="src" class="hastip uk-form-label uk-width-1-1 uk-width-small-1-5" title="<?php echo Text::_('WF_LABEL_URL_DESC'); ?>">
                <?php echo Text::_('WF_LABEL_URL'); ?>
            </label>
            <div class="uk-form-controls uk-width-1-1 uk-width-small-4-5">
                <input type="text" id="src" value="" class="filebrowser" data-filebrowser required />
            </div>
        </div>
        <div class="uk-form-row uk-grid uk-grid-small">
            <label for="alt" class="hastip uk-form-label uk-width-1-1 uk-width-small-1-5" title="<?php echo Text::_('WF_LABEL_ALT_DESC'); ?>">
                <?php echo Text::_('WF_LABEL_ALT'); ?>
            </label>
            <div class="uk-form-controls uk-width-1-1 uk-width-small-4-5">
                <input type="text" id="alt" value="" />
            </div>
        </div>

        <div class="uk-form-row uk-grid uk-grid-small" id="attributes-dimensions">
            <label class="hastip uk-form-label uk-width-1-1 uk-width-small-1-5" title="<?php echo Text::_('WF_LABEL_DIMENSIONS_DESC'); ?>">
                <?php echo Text::_('WF_LABEL_DIMENSIONS'); ?>
            </label>
            <div class="uk-form-control uk-width-1-1 uk-width-small-4-5 uk-form-constrain uk-flex">

                <div class="uk-form-controls">
                    <input type="text" id="width" value="" class="uk-text-muted" aria-label="<?php echo Text::_('WF_LABEL_WIDTH'); ?>" />
                </div>

                <div class="uk-form-controls">
                    <strong class="uk-form-label uk-text-center uk-vertical-align-middle" role="presentation">&times;</strong>
                </div>

                <div class="uk-form-controls">
                    <input type="text" id="height" value="" class="uk-text-muted" aria-label="<?php echo Text::_('WF_LABEL_HEIGHT'); ?>" />
                </div>

                <label class="uk-form-label">
                    <input class="uk-constrain-checkbox" type="checkbox" checked aria-label="<?php echo Text::_('WF_LABEL_PROPORTIONAL'); ?>" />
                    <?php echo Text::_('WF_LABEL_PROPORTIONAL'); ?>
                </label>
            </div>
        </div>

        <div class="uk-hidden-mini uk-grid uk-grid-small uk-form-row" id="attributes-align">
            <label for="align" class="hastip uk-form-label uk-width-1-5" title="<?php echo Text::_('WF_LABEL_ALIGN_DESC'); ?>">
                <?php echo Text::_('WF_LABEL_ALIGN'); ?>
            </label>
            <div class="uk-grid uk-grid-small uk-form-row uk-width-4-5">
                <div class="uk-width-1-2">
                    <div class="uk-form-controls uk-width-9-10">
                        <select id="align">
                            <option value=""><?php echo Text::_('WF_OPTION_NOT_SET'); ?></option>
                            <optgroup label="------------">
                                <option value="left"><?php echo Text::_('WF_OPTION_ALIGN_LEFT'); ?></option>
                                <option value="center"><?php echo Text::_('WF_OPTION_ALIGN_CENTER'); ?></option>
                                <option value="right"><?php echo Text::_('WF_OPTION_ALIGN_RIGHT'); ?></option>
                            </optgroup>
                            <optgroup label="------------">
                                <option value="top"><?php echo Text::_('WF_OPTION_ALIGN_TOP'); ?></option>
                                <option value="middle"><?php echo Text::_('WF_OPTION_ALIGN_MIDDLE'); ?></option>
                                <option value="bottom"><?php echo Text::_('WF_OPTION_ALIGN_BOTTOM'); ?></option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div class="uk-width-1-2 uk-hidden-mini">
                    <label for="clear" class="hastip uk-form-label uk-width-3-10" title="<?php echo Text::_('WF_LABEL_CLEAR_DESC'); ?>" aria-label="<?php echo Text::_('WF_LABEL_CLEAR_DESC'); ?>">
                        <?php echo Text::_('WF_LABEL_CLEAR'); ?>
                    </label>
                    <div class="uk-form-controls uk-width-7-10">
                        <select id="clear" disabled>
                            <option value=""><?php echo Text::_('WF_OPTION_NOT_SET'); ?></option>
                            <option value="none"><?php echo Text::_('WF_OPTION_CLEAR_NONE'); ?></option>
                            <option value="both"><?php echo Text::_('WF_OPTION_CLEAR_BOTH'); ?></option>
                            <option value="left"><?php echo Text::_('WF_OPTION_CLEAR_LEFT'); ?></option>
                            <option value="right"><?php echo Text::_('WF_OPTION_CLEAR_RIGHT'); ?></option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="uk-hidden-mini uk-grid uk-grid-small uk-form-row" id="attributes-margin">
            <label for="margin" class="hastip uk-form-label uk-width-1-5" title="<?php echo Text::_('WF_LABEL_MARGIN_DESC'); ?>">
                <?php echo Text::_('WF_LABEL_MARGIN'); ?>
            </label>
            <div class="uk-form-controls uk-width-4-5 uk-grid uk-grid-small uk-form-equalize">

                <label for="margin_top" class="uk-form-label">
                    <?php echo Text::_('WF_OPTION_TOP'); ?>
                </label>
                <div class="uk-form-controls">
                    <input type="text" id="margin_top" value="" />
                </div>

                <label for="margin_right" class="uk-form-label">
                    <?php echo Text::_('WF_OPTION_RIGHT'); ?>
                </label>
                <div class="uk-form-controls">
                    <input type="text" id="margin_right" value="" />
                </div>

                <label for="margin_bottom" class="uk-form-label">
                    <?php echo Text::_('WF_OPTION_BOTTOM'); ?>
                </label>
                <div class="uk-form-controls">
                    <input type="text" id="margin_bottom" value="" />
                </div>

                <label for="margin_left" class="uk-form-label">
                    <?php echo Text::_('WF_OPTION_LEFT'); ?>
                </label>
                <div class="uk-form-controls">
                    <input type="text" id="margin_left" value="" />
                </div>
                <label class="uk-form-label">
                    <input type="checkbox" class="uk-equalize-checkbox" aria-label="<?php echo Text::_('WF_LABEL_EQUAL'); ?>" />
                    <?php echo Text::_('WF_LABEL_EQUAL'); ?>
                </label>
            </div>
        </div>

        <div class="uk-hidden-mini uk-grid uk-grid-small uk-form-row" id="attributes-border">
            <label for="border" class="hastip uk-form-label uk-width-1-5" title="<?php echo Text::_('WF_LABEL_BORDER_DESC'); ?>">
                <?php echo Text::_('WF_LABEL_BORDER'); ?>
            </label>

            <div class="uk-form-controls uk-grid uk-grid-small uk-width-4-5">
                <div class="uk-form-controls uk-width-0-3">
                    <input type="checkbox" id="border" aria-label="<?php echo Text::_('WF_LABEL_BORDER_ENABLE'); ?>" />
                </div>

                <label for="border_width" class="hastip uk-form-label uk-width-1-10 uk-margin-small-left" title="<?php echo Text::_('WF_LABEL_BORDER_WIDTH_DESC'); ?>"><?php echo Text::_('WF_LABEL_WIDTH'); ?></label>
                <div class="uk-form-controls uk-width-2-10">
                    <input type="text" pattern="[0-9]+" id="border_width" class="uk-datalist" list="border_width_datalist" />
                    <datalist id="border_width_datalist">
                        <option value="">--</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="thin"><?php echo Text::_('WF_OPTION_BORDER_THIN'); ?></option>
                        <option value="medium"><?php echo Text::_('WF_OPTION_BORDER_MEDIUM'); ?></option>
                        <option value="thick"><?php echo Text::_('WF_OPTION_BORDER_THICK'); ?></option>
                    </datalist>
                </div>

                <label for="border_style" class="hastip uk-form-label uk-width-1-10 uk-margin-small-left" title="<?php echo Text::_('WF_LABEL_BORDER_STYLE_DESC'); ?>"><?php echo Text::_('WF_LABEL_STYLE'); ?></label>
                <div class="uk-form-controls uk-width-2-10">
                    <select id="border_style">
                        <option value="inherit">--</option>
                        <option value="none"><?php echo Text::_('WF_OPTION_BORDER_NONE'); ?></option>
                        <option value="solid"><?php echo Text::_('WF_OPTION_BORDER_SOLID'); ?></option>
                        <option value="dashed"><?php echo Text::_('WF_OPTION_BORDER_DASHED'); ?></option>
                        <option value="dotted"><?php echo Text::_('WF_OPTION_BORDER_DOTTED'); ?></option>
                        <option value="double"><?php echo Text::_('WF_OPTION_BORDER_DOUBLE'); ?></option>
                        <option value="groove"><?php echo Text::_('WF_OPTION_BORDER_GROOVE'); ?></option>
                        <option value="inset"><?php echo Text::_('WF_OPTION_BORDER_INSET'); ?></option>
                        <option value="outset"><?php echo Text::_('WF_OPTION_BORDER_OUTSET'); ?></option>
                        <option value="ridge"><?php echo Text::_('WF_OPTION_BORDER_RIDGE'); ?></option>
                    </select>
                </div>

                <label for="border_color" class="hastip uk-form-label uk-width-1-10 uk-margin-small-left" title="<?php echo Text::_('WF_LABEL_BORDER_COLOR_DESC'); ?>"><?php echo Text::_('WF_LABEL_COLOR'); ?></label>
                <div class="uk-form-controls uk-width-2-10">
                    <input id="border_color" class="color" type="text" value="#000000" />
                </div>
            </div>
        </div>
    </div>
    <div class="uk-width-1-5 uk-hidden-small">
        <div class="preview">
            <img id="sample" src="<?php echo $this->plugin->image('sample.jpg', 'media'); ?>" alt="sample.jpg" />
            <?php echo Text::_('WF_LOREM_IPSUM'); ?>
        </div>
    </div>
</div>