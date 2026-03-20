<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;

$list = $this->get('lists', []);
$searchareas = $this->get('searchareas', []);

?>
<div id="search-browser" class="uk-flex uk-flex-column uk-position-relative uk-width-1-1">

    <!-- Search Row -->
    <div class="uk-flex">

        <!-- Search Input -->
        <div class="uk-width-1-1">
            <div id="searchbox" class="uk-inline uk-width-1-1 uk-position-relative">
                <input
                    type="text"
                    id="search-input"
                    class="uk-input uk-width-1-1"
                    aria-label="<?php echo Text::_('WF_LABEL_SEARCH'); ?>"
                    placeholder="<?php echo Text::_('WF_LABEL_SEARCH'); ?>..." />

                <a id="search-clear" class="uk-form-icon uk-form-icon-flip uk-icon-close uk-position-right"></a>
            </div>
        </div>

        <!-- Buttons -->
        <div class="uk-width-auto">
            <div class="uk-button-group">
                <button class="uk-button uk-button-default" id="search-button">
                    <?php echo Text::_('WF_LABEL_SEARCH'); ?>
                </button>

                <button
                    class="uk-button uk-button-default"
                    id="search-options-button"
                    title="<?php echo Text::_('WF_LABEL_SEARCH_OPTIONS'); ?>"
                    aria-label="<?php echo Text::_('WF_LABEL_SEARCH_OPTIONS'); ?>"
                    aria-haspopup="true">
                    <span class="uk-icon uk-icon-cog"></span>
                </button>
            </div>
        </div>

    </div>

    <!-- Search Options Dropdown -->
    <div id="search-options" class="uk-dropdown uk-flex uk-flex-column uk-width-1-1" hidden>

        <fieldset class="uk-fieldset uk-flex uk-flex-column uk-margin-remove">

            <legend class="uk-legend">
                <?php echo Text::_('WF_SEARCH_FOR'); ?>
            </legend>

            <div class="uk-flex">
                <?php echo $list['searchphrase']; ?>
            </div>

            <div class="uk-flex uk-margin">
                <label for="ordering" class="uk-form-label">
                    <?php echo Text::_('WF_SEARCH_ORDERING'); ?>
                </label>
                <?php echo $list['ordering']; ?>
            </div>

        </fieldset>

        <fieldset class="uk-fieldset uk-flex uk-margin-remove">

            <legend class="uk-legend">
                <?php echo Text::_('WF_SEARCH_SEARCH_ONLY'); ?>
            </legend>

            <div class="uk-flex uk-flex-row">
                <?php foreach ($searchareas as $val => $txt): ?>
                    <label>
                        <input
                            class="uk-checkbox"
                            type="checkbox"
                            name="areas[]"
                            value="<?php echo $val; ?>"
                            id="area-<?php echo $val; ?>" />
                        <?php echo Text::_($txt); ?>
                    </label>
                <?php endforeach; ?>
            </div>

        </fieldset>

    </div>

    <!-- Search Results -->
    <div id="search-result" class="uk-dropdown"></div>

</div>