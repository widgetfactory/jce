<?php
/**
 * @copyright    Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_WF_EXT') or die('RESTRICTED');
?>
<div class="uk-form-row">
    <label title="<?php echo WFText::_('WF_AGGREGATOR_VINE_TYPE_DESC') ?>"
           class="tooltip uk-form-label uk-width-1-5"><?php echo WFText::_('WF_AGGREGATOR_VINE_TYPE') ?></label>
    <div class="uk-form-controls uk-width-2-5">
        <select id="vine_type">
            <option value="simple"><?php echo WFText::_('WF_AGGREGATOR_VINE_SIMPLE') ?></option>
            <option value="postcard"><?php echo WFText::_('WF_AGGREGATOR_VINE_POSTCARD') ?></option>
        </select>
    </div>
</div>

<div class="uk-form-row">
    <label title="<?php echo WFText::_('WF_AGGREGATOR_VINE_SIZE_DESC') ?>"
           class="tooltip uk-form-label uk-width-1-5"><?php echo WFText::_('WF_AGGREGATOR_VINE_SIZE') ?></label>
    <div class="uk-form-controls uk-width-2-5">
        <select id="vine_size">
            <option value="600">600px</option>
            <option value="480">480px</option>
            <option value="300">300px</option>
        </select>
    </div>
</div>

<div class="uk-form-row">
    <label for="vine_audio" class="uk-form-label uk-width-1-5"
           title="<?php echo JText::_('WF_AGGREGATOR_VINE_AUDIO_DESC'); ?>"><?php echo WFText::_('WF_AGGREGATOR_VINE_AUDIO'); ?></label>
    <div class="uk-form-controls uk-width-4-5">
        <input type="checkbox" id="vine_audio" value="0" />
    </div>
</div>