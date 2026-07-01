<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;

$editorPlugins = array_values(array_filter($this->editorPlugins, function ($plugin) {
    return $plugin->editable && !empty($plugin->form);
}));

?>
<div class="<?php echo $this->formclass; ?> tabbable tabs-left flex-column">
    <ul class="nav nav-tabs" id="profile-plugins-tabs">

        <?php

        $key = 0;

        foreach ($editorPlugins as $plugin) :
            $plugin->state = "hide";

            if ($plugin->active) {
                $plugin->state = "";

                $key++;

                if ($key === 1) {
                    $plugin->state = "active show";
                }
            }

            $icons = '';
            $title = '';

            $title .= '<p>' . $plugin->title . '</p>';

            if (!empty($plugin->icon)) {

                $image = !empty($plugin->image) ? '<img src="' . $plugin->image . '" alt="" />' : '';

                foreach ($plugin->icon as $icon) {
                    $icons .= '<div class="mce-widget mce-btn mceButton ' . $plugin->class . '" title="' . $plugin->title . '"><span class="mce-ico mce-i-' . $icon . ' mceIcon mce_' . $icon . '">' . $image . '</span></div>';
                }

                $title .= '<div class="mceEditor mceDefaultSkin"><div class="mce-container mce-toolbar mceToolbarItem">' . $icons . '</div></div>';
            }

        ?>
            <li class="nav-item <?php echo $plugin->state; ?>"><a href="#profile-plugins-<?php echo $plugin->name; ?>" class="nav-link"><?php echo $title; ?></a></li>
        <?php endforeach; ?>

    </ul>
    <div class="tab-content">
        <?php foreach ($editorPlugins as $plugin) : ?>
            <div class="tab-pane <?php echo $plugin->state; ?>" id="profile-plugins-<?php echo $plugin->name; ?>">
                <div class="row-fluid">

                    <?php if ($plugin->form) :
                        $plugin->fieldsname = "config";
                        $plugin->name = $plugin->title;
                        $plugin->description = "";

                        echo LayoutHelper::render('joomla.content.options_default', $plugin);

                        foreach ($plugin->adapterPlugins as $adapterType => $adapterPlugins) : ?>

                            <h2 class="mb-4"><?php echo Text::_('WF_ADAPTER_' . strtoupper($adapterType) . '_TITLE', true); ?></h2>

                            <?php foreach ($adapterPlugins as $name => $adapterPlugin) : ?>
                                <div class="row-fluid">

                                    <?php if ($adapterPlugin->form) :
                                        $adapterPlugin->fieldsname = "";
                                        $adapterPlugin->formclass = "adapter-plugins";
                                        $adapterPlugin->name = Text::_($adapterPlugin->title, true);
                                        $adapterPlugin->description = "";

                                        echo LayoutHelper::render('joomla.content.options_default', $adapterPlugin);

                                    endif; ?>

                                </div>

                                <hr />

                            <?php endforeach; ?>

                    <?php endforeach;

                    endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>