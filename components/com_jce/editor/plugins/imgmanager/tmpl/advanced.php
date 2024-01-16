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
    <label for="style" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_STYLE_DESC'); ?>"><?php echo Text::_('WF_LABEL_STYLE'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10"><input id="style" type="text" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label for="classlist" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_CLASSES_DESC'); ?>"><?php echo Text::_('WF_LABEL_CLASSES'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10">
        <input type="text" id="classes" class="uk-datalist" multiple="multiple" list="classes_datalist" />
        <datalist id="classes_datalist"></datalist>
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label for="title" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_TITLE_DESC'); ?>"><?php echo Text::_('WF_LABEL_TITLE'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10"><input id="title" type="text" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label for="id" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_ID_DESC'); ?>"><?php echo Text::_('WF_LABEL_ID'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10"><input id="id" type="text" value="" /></div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <label for="dir" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_DIR_DESC'); ?>"><?php echo Text::_('WF_LABEL_DIR'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10">
        <select id="dir">
            <option value=""><?php echo Text::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="ltr"><?php echo Text::_('WF_OPTION_LTR'); ?></option>
            <option value="rtl"><?php echo Text::_('WF_OPTION_RTL'); ?></option>
        </select>
    </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <label for="lang" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_LANG_DESC'); ?>"><?php echo Text::_('WF_LABEL_LANG'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10"><input id="lang" type="text" value="" /></div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <label for="usemap" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_USEMAP_DESC'); ?>"><?php echo Text::_('WF_LABEL_USEMAP'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10"><input id="usemap" type="text" value="" /></div>
</div>

<div class="uk-form-row uk-grid uk-grid-small html4">
    <label for="longdesc" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_LONGDESC_DESC'); ?>"><?php echo Text::_('WF_LABEL_LONGDESC'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10"><input id="longdesc" type="text" value="" class="browser html" /></div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <label for="loading" class="hastip uk-form-label uk-width-1-1 uk-width-small-3-10" title="<?php echo Text::_('WF_LABEL_LOADING_DESC'); ?>"><?php echo Text::_('WF_LABEL_LOADING'); ?></label>
    <div class="uk-form-controls uk-width-1-1 uk-width-small-7-10">
        <select id="loading">
            <option value=""><?php echo Text::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="lazy"><?php echo Text::_('WF_OPTION_LOADING_LAZY'); ?></option>
            <option value="eager"><?php echo Text::_('WF_OPTION_LOADING_EAGER'); ?></option>
        </select>
    </div>
</div>