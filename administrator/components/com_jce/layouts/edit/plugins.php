<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;

$plugins = $displayData->get('Plugins');

?>
<div class="form-horizontal tabbable tabs-left flex-column">
    <?php echo HTMLHelper::_('bootstrap.startTabSet', 'plugins', array('active' => ''));
foreach ($plugins as $plugin) {
    if (!$plugin->editable || empty($plugin->form)) {
        continue;
    }

    $icons = '';
    $title = '';

    $title .= '<p>' . $plugin->title . '</p>';

    if (!empty($plugin->icon)) {

        foreach ($plugin->icon as $icon) {
            $icons .= '<div class="mce-widget mce-btn mceButton ' . $plugin->class . '" title="' . $plugin->title . '"><span class="mce-ico mce-i-' . $icon . ' mceIcon mce_' . $icon . '"></span></div>';
        }

        $title .= '<div class="mceEditor mceDefaultSkin"><div class="mce-container mce-toolbar mceToolBarItem">' . $icons . '</div></div>';
    }

    echo HTMLHelper::_('bootstrap.addTab', 'plugins', 'tabs-plugins-' . $plugin->name, $title); ?>
            <fieldset class="<?php echo !empty($displayData->formclass) ? $displayData->formclass : ''; ?>">
                <legend><?php echo $plugin->title; ?></legend>
                <div class="row-fluid">
                        <hr />

                        <?php if ($plugin->form):

        echo $plugin->form->renderFieldset('config');?>

	                            <hr />

	                            <?php foreach ($plugin->extensions as $type => $extensions): ?>
	                                <h3><?php echo Text::_('WF_EXTENSION_' . strtoupper($type), true); ?></h3>

	                                <?php foreach ($extensions as $extension): ?>

	                                    <div class="row-fluid">
	                                        <h4><?php echo Text::_('PLG_JCE_' . strtoupper($type) . '_' . strtoupper($extension->name), true); ?></h4>
	                                        <?php echo $extension->form->renderFieldset($type . '.' . $extension->name); ?>
	                                    </div>

	                                <?php endforeach;?>

                                <hr />

                            <?php endforeach;

    endif;?>
                </div>
            </fieldset>
            <?php echo HTMLHelper::_('bootstrap.endTab');
}
echo HTMLHelper::_('bootstrap.endTabSet'); ?>
</div>