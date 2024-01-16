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
<div id="search-browser" class="uk-width-1-1">
    <div class="uk-grid uk-grid-collapse">
        <div id="searchbox" class="uk-form-icon uk-form-icon-flip uk-width-3-4">
            <input type="text" id="search-input" class="uk-width-1-1" aria-label="<?php echo Text::_('WF_LABEL_SEARCH'); ?>" placeholder="<?php echo Text::_('WF_LABEL_SEARCH'); ?>..." />
            <i class="uk-icon uk-icon-close" id="search-clear"></i>
            <i class="uk-icon uk-icon-spinner"></i>
        </div>

        <div class="uk-button-group uk-width-1-4">
            <button class="uk-button uk-width-2-3 uk-width-mini-1-2" id="search-button"><label class="uk-form-label"><?php echo Text::_('WF_LABEL_SEARCH'); ?></label></button>
            <button class="uk-button uk-width-1-3 uk-width-mini-1-2" id="search-options-button" title="<?php echo Text::_('WF_LABEL_SEARCH_OPTIONS'); ?>" aria-label="<?php echo Text::_('WF_LABEL_SEARCH_OPTIONS'); ?>" aria-haspopup="true"><i class="uk-icon uk-icon-cog"></i></button>
        </div>
    </div>

    <div id="search-options" class="uk-dropdown uk-width-1-1">
        <fieldset class="phrases">
            <legend><?php echo Text::_('WF_SEARCH_FOR'); ?>
            </legend>
            <div class="phrases-box">
                <?php echo $this->lists['searchphrase']; ?>
            </div>
            <div class="ordering-box">
                <label for="ordering" class="ordering">
                    <?php echo Text::_('WF_SEARCH_ORDERING'); ?>
                </label>
                <?php echo $this->lists['ordering']; ?>
            </div>
        </fieldset>
        <fieldset class="search_only">
            <legend><?php echo Text::_('WF_SEARCH_SEARCH_ONLY'); ?></legend>
            <ul>
            <?php
foreach ($this->searchareas as $val => $txt):
?>
                <li>
                    <input type="checkbox" name="areas[]" value="<?php echo $val; ?>" id="area-<?php echo $val; ?>" />
                <label for="area-<?php echo $val; ?>">
                    <?php echo Text::_($txt); ?>
                </label>
                </li>
            <?php endforeach;?>
            </ul>
        </fieldset>
    </div>

    <div id="search-result" class="uk-dropdown uk-padding-remove"></div>
</div>
