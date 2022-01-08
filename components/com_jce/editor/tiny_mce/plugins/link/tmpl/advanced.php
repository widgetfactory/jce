<?php
/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;
?>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="id" class="hastip" title="<?php echo JText::_('WF_LABEL_ID_DESC'); ?>"><?php echo JText::_('WF_LABEL_ID'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10"><input id="id" type="text" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="style" class="hastip" title="<?php echo JText::_('WF_LABEL_STYLE_DESC'); ?>"><?php echo JText::_('WF_LABEL_STYLE'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10"><input type="text" id="style" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="classes" class="hastip" title="<?php echo JText::_('WF_LABEL_CLASSES_DESC'); ?>"><?php echo JText::_('WF_LABEL_CLASSES'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10">
        <input type="text" id="classes" class="uk-datalist" list="classes_datalist" multiple />
        <datalist id="classes_datalist"></datalist>
    </div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="dir" class="hastip" title="<?php echo JText::_('WF_LABEL_DIR_DESC'); ?>"><?php echo JText::_('WF_LABEL_DIR'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10">
        <select id="dir">
            <option value=""><?php echo JText::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="ltr"><?php echo JText::_('WF_OPTION_LTR'); ?></option>
            <option value="rtl"><?php echo JText::_('WF_OPTION_RTL'); ?></option>
        </select>
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="hreflang" class="hastip" title="<?php echo JText::_('WF_LABEL_HREFLANG_DESC'); ?>"><?php echo JText::_('WF_LABEL_HREFLANG'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10"><input type="text" id="hreflang" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="lang" class="hastip" title="<?php echo JText::_('WF_LABEL_LANG_DESC'); ?>"><?php echo JText::_('WF_LABEL_LANG'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10"><input id="lang" type="text" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="charset" class="hastip" title="<?php echo JText::_('WF_LABEL_CHARSET_DESC'); ?>"><?php echo JText::_('WF_LABEL_CHARSET'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10"><input type="text" id="charset" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="type" class="hastip" title="<?php echo JText::_('WF_LABEL_MIME_TYPE_DESC'); ?>"><?php echo JText::_('WF_LABEL_MIME_TYPE'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10"><input type="text" id="type" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="rel" class="hastip" title="<?php echo JText::_('WF_LABEL_REL_DESC'); ?>"><?php echo JText::_('WF_LABEL_REL'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10">
        <input type="text" id="rel" class="uk-datalist" list="rel_datalist" multiple />
        <datalist id="rel_datalist">
            <option value="nofollow">No Follow</option>
            <option value="alternate">Alternate</option>
            <option value="designates">Designates</option>
            <option value="stylesheet">Stylesheet</option>
            <option value="start">Start</option>
            <option value="next">Next</option>
            <option value="prev">Prev</option>
            <option value="contents">Contents</option>
            <option value="index">Index</option>
            <option value="glossary">Glossary</option>
            <option value="copyright">Copyright</option>
            <option value="chapter">Chapter</option>
            <option value="subsection">Subsection</option>
            <option value="appendix">Appendix</option>
            <option value="help">Help</option>
            <option value="bookmark">Bookmark</option>
            <option value="sponsored">Sponsored</option>
            <option value="ugc">User Generated Content</option>
        </datalist>
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="rev" class="hastip" title="<?php echo JText::_('WF_LABEL_REV_DESC'); ?>"><?php echo JText::_('WF_LABEL_REV'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10">
        <select id="rev">
            <option value=""><?php echo JText::_('WF_OPTION_NOT_SET'); ?></option>
            <option value="alternate">Alternate</option>
            <option value="designates">Designates</option>
            <option value="stylesheet">Stylesheet</option>
            <option value="start">Start</option>
            <option value="next">Next</option>
            <option value="prev">Prev</option>
            <option value="contents">Contents</option>
            <option value="index">Index</option>
            <option value="glossary">Glossary</option>
            <option value="copyright">Copyright</option>
            <option value="chapter">Chapter</option>
            <option value="subsection">Subsection</option>
            <option value="appendix">Appendix</option>
            <option value="help">Help</option>
            <option value="bookmark">Bookmark</option>
        </select>
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="tabindex" class="hastip" title="<?php echo JText::_('WF_LABEL_TABINDEX_DESC'); ?>"><?php echo JText::_('WF_LABEL_TABINDEX'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10"><input type="text" id="tabindex" value="" /></div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-1  uk-width-small-3-10" for="accesskey" class="hastip" title="<?php echo JText::_('WF_LABEL_ACCESSKEY_DESC'); ?>"><?php echo JText::_('WF_LABEL_ACCESSKEY'); ?></label>
    <div class="uk-form-controls uk-width-1-1  uk-width-small-7-10"><input type="text" id="accesskey" value="" /></div>
</div>

<div class="uk-form-row uk-grid uk-grid-small">
    <div class="uk-form-controls uk-width-1-1">
        <div class="uk-repeatable">
            <div class="uk-form-controls uk-flex uk-margin-small uk-width-9-10">
                <label class="uk-form-label uk-width-1-10">
                    <?php echo JText::_('WF_LABEL_NAME'); ?>
                </label>
                <div class="uk-form-controls uk-width-4-10">
                    <input type="text" name="custom_name[]" />
                </div>
                <label class="uk-form-label uk-width-1-10">
                    <?php echo JText::_('WF_LABEL_VALUE'); ?>
                </label>
                <div class="uk-form-controls uk-width-4-10">
                    <input type="text" name="custom_value[]" />
                </div>
            </div>
            <div class="uk-form-controls uk-width-1-10 uk-margin-small-left">
                <button type="button" class="uk-button uk-button-link uk-repeatable-create">
                    <i class="uk-icon-plus"></i>
                </button>
                <button type="button" class="uk-button uk-button-link uk-repeatable-delete">
                    <i class="uk-icon-trash"></i>
                </button>
            </div>
        </div>
    </div>
</div>