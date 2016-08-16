<?php
/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('_WF_EXT') or die('RESTRICTED');
?>
<div class="ui-form-row">
    <div class="ui-width-4-10">
        <input type="checkbox" id="youtube_embed"/>
        <label for="youtube_embed" title="<?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_EMBED_DESC') ?>"
               class="tooltip"><?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_EMBED') ?></label>
    </div>
    <div class="ui-width-6-10">

        <input type="checkbox" id="youtube_rel"/>
        <label for="youtube_rel" title="<?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_RELATED_DESC') ?>"
               class="tooltip"><?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_RELATED') ?></label>
    </div>
</div>
<div class="ui-form-row">
    <div class="ui-width-4-10">
        <input type="checkbox" id="youtube_privacy"/>
        <label for="youtube_privacy" title="<?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_PRIVACY_DESC') ?>"
               class="tooltip"><?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_PRIVACY') ?></label>
    </div>
    <div class="ui-width-6-10">
        <input type="checkbox" id="youtube_autoplay"/>
        <label for="youtube_autoplay" title="<?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_AUTOPLAY_DESC') ?>"
               class="tooltip"><?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_AUTOPLAY') ?></label>
    </div>
</div>
<div class="ui-form-row">
    <div class="ui-width-1-1">

        <input type="checkbox" id="youtube_loop"/>
        <label for="youtube_loop" title="<?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_LOOP_DESC') ?>"
               class="tooltip"><?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_LOOP') ?></label>
    </div>
</div>
<div class="ui-form-row">
    <label for="youtube_autohide" title="<?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_AUTOHIDE_DESC') ?>"
           class="tooltip ui-form-label ui-width-2-10"><?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_AUTOHIDE') ?></label>

    <div class="ui-width-2-10">

        <div class="ui-form-controls ui-width-1-2">
            <select id="youtube_autohide">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2" selected="selected">2</option>
            </select>
        </div>
        </div>
    <div class="ui-width-6-10">

        <label for="youtube_start" class="ui-form-label ui-width-2-10"
               title="<?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_START_DESC') ?>"
               class="tooltip"><?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_START') ?></label>
        <div class="ui-form-controls ui-width-2-10">
            <input type="number" id="youtube_start"/>
        </div>

    </div>
</div>

<div class="ui-form-row">
    <label for="youtube_playlist" class="ui-form-label ui-width-1-5"
           title="<?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_PLAYLIST_DESC') ?>"
           class="tooltip"><?php echo WFText::_('WF_AGGREGATOR_YOUTUBE_PLAYLIST') ?></label>
    <div class="ui-form-controls ui-width-4-5">
        <input type="text" id="youtube_playlist"/>
    </div>
</div>