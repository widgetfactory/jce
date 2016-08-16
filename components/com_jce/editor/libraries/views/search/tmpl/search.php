<?php

/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('_JEXEC') or die('RESTRICTED');
?>
<div id="search-browser" class="ui-width-1-1">
    <div class="ui-grid ui-grid-collapse">
        <div id="searchbox" class="ui-form-icon ui-form-icon-flip ui-width-3-4">
            <input type="text" id="search-input" class="ui-width-1-1" placeholder="<?php echo WFText::_('WF_LABEL_SEARCH'); ?>..." />
            <i class="ui-icon ui-icon-close" id="search-clear"></i>
            <i class="ui-icon ui-icon-spinner"></i>
        </div>

        <div class="ui-button-group ui-width-1-4">
            <button class="ui-button ui-width-2-3 ui-width-mini-1-2" id="search-button"><span><?php echo WFText::_('WF_LABEL_SEARCH'); ?></span></button>
            <button class="ui-button ui-width-1-3 ui-width-mini-1-2" id="search-options-button" title="<?php echo WFText::_('WF_LABEL_SEARCH_OPTIONS'); ?>"><i class="ui-icon ui-icon-cog"></i></button>
        </div>
    </div>

    <div id="search-options" class="ui-dropdown ui-width-1-1">
        <fieldset class="phrases">
            <legend><?php echo JText::_('WF_SEARCH_FOR'); ?>
            </legend>
            <div class="phrases-box">
                <?php echo $this->lists['searchphrase']; ?>
            </div>
            <div class="ordering-box">
                <label for="ordering" class="ordering">
                    <?php echo JText::_('WF_SEARCH_ORDERING'); ?>
                </label>
                <?php echo $this->lists['ordering']; ?>
            </div>
        </fieldset>
        <fieldset class="search_only">
            <legend><?php echo JText::_('WF_SEARCH_SEARCH_ONLY'); ?></legend>
            <ul>
            <?php
            foreach ($this->searchareas as $val => $txt) :
                ?>
                <li>
                    <input type="checkbox" name="areas[]" value="<?php echo $val; ?>" id="area-<?php echo $val; ?>" />
                <label for="area-<?php echo $val; ?>">
                    <?php echo JText::_($txt); ?>
                </label>
                </li>
            <?php endforeach; ?>
            </ul>
        </fieldset>
    </div>

    <div id="search-result" class="ui-dropdown ui-padding-remove"></div>
</div>
