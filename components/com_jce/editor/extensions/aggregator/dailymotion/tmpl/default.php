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
    <label for="dailymotion_autoPlay" title="<?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_AUTOPLAY_DESC') ?>"
           class="tooltip uk-form-label uk-width-1-5"><?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_AUTOPLAY') ?></label>
    <div class="uk-width-4-5">
        <div class="uk-form-controls uk-width-1-5">
            <input type="checkbox" id="dailymotion_autoPlay" />
        </div>

        <label for="dailymotion_start" title="<?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_START_DESC') ?>"
               class="tooltip uk-form-label uk-width-1-5"><?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_START') ?></label>
        <div class="uk-form-controls uk-width-1-5">
            <input id="dailymotion_start" type="number" value="" />
        </div>
    </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
    <label class="uk-form-label uk-width-1-5"
           title="<?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_SIZE'); ?>"><?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_SIZE'); ?></label>

    <div class="uk-form-controls uk-width-4-5">
        <select id="dailymotion_player_size">
            <option value="320"><?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_SIZE_SMALL'); ?></option>
            <option value="480"><?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_SIZE_MEDIUM'); ?></option>
            <option value="560"><?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_SIZE_LARGE'); ?></option>
            <option value=""><?php echo Text::_('WF_AGGREGATOR_DAILYMOTION_SIZE_CUSTOM'); ?></option>
        </select>

        <input type="number" id="dailymotion_player_size_custom" class="uk-hidden uk-margin-small-left" />
    </div>
</div>
