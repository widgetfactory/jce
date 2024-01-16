<?php
/**
 * @package     JCE
 * @subpackage  Admin
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
 ;
 use Joomla\CMS\Plugin\PluginHelper;
 use Joomla\CMS\Table\Table;
 use Joomla\CMS\Uri\Uri;
 use Joomla\CMS\Toolbar\ToolbarHelper;
 use Joomla\CMS\Toolbar\Toolbar;
 use Joomla\CMS\Session\Session;
 use Joomla\CMS\Layout\LayoutHelper;
 use Joomla\CMS\Router\Route;

$plugins = array_values(array_filter($this->plugins, function($plugin) {
    return $plugin->editable && !empty($plugin->form);
}));

?>
<div class="<?php echo $this->formclass;?> tabbable tabs-left flex-column">
    <?php //echo HTMLHelper::_('bootstrap.startTabSet', 'profile-plugins', array('active' => 'profile-plugins-' . $plugins[0]->name));?>

    <ul class="nav nav-tabs py-1" id="profile-plugins-tabs">

    <?php

    $key = 0;

    foreach ($plugins as $plugin) :
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

        //echo HTMLHelper::_('bootstrap.addTab', 'profile-plugins', 'profile-plugins-' . $plugin->name, $title); ?>
        <li class="nav-item <?php echo $plugin->state;?>"><a href="#profile-plugins-<?php echo $plugin->name;?>" class="nav-link"><?php echo $title;?></a></li>
    <?php endforeach;?>

    </ul>
    <div class="tab-content">
    <?php foreach ($plugins as $plugin) : ?>
        <div class="tab-pane <?php echo $plugin->state;?>" id="profile-plugins-<?php echo $plugin->name;?>">
            <div class="row-fluid">

                <?php if ($plugin->form) :
                    $plugin->fieldsname = "config";
                    $plugin->name = $plugin->title;
                    $plugin->description = "";
                    echo LayoutHelper::render('joomla.content.options_default', $plugin);
                    
                    foreach ($plugin->extensions as $type => $extensions) : ?>
                        
                        <h3><?php echo Text::_('WF_EXTENSIONS_' . strtoupper($type) . '_TITLE', true); ?></h3>

                        <?php foreach ($extensions as $name => $extension) : ?>
                            <div class="row-fluid">  
                                        
                                <?php if ($extension->form) :
                                    $extension->fieldsname = "";
                                    $extension->name = Text::_($extension->title, true);
                                    $extension->description = "";
                                    echo LayoutHelper::render('joomla.content.options_default', $extension);

                                endif; ?>

                            </div>

                        <?php endforeach; ?>

                    <?php endforeach;

                endif; ?>
            </div>
            <?php //echo HTMLHelper::_('bootstrap.endTab');?>
        </div>
        <?php endforeach;?>
    </div>
    <?php //echo HTMLHelper::_('bootstrap.endTabSet'); ?>
</div>