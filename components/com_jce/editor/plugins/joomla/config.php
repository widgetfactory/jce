<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Editor\Editor;
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;

class WFJoomlaPluginConfig
{
    public static function getConfig(&$settings)
    {
        // already set by editor display
        if (isset($settings['joomla_xtd_buttons'])) {
            return;
        }

        // everything below is only required for SP Page Builder...
        if (Factory::getApplication()->input->get('option') !== 'com_sppagebuilder') {
            return;
        }

        $list = array();
        $editor = Editor::getInstance('jce');

        $excluded = array('readmore', 'pagebreak', 'image');

        $i = 0;

        $buttons = $editor->getButtons('__jce__');

        foreach($buttons as $button) {
            // skip buttons better implemented by editor
            if (in_array($button->name, $excluded)) {
                continue;
            }

            // Set some vars
            $icon = 'icon-' . $button->get('icon', $button->get('name'));

            $name = 'button-' . $i . '-' . str_replace(' ', '-', $button->get('text'));
            $title = $button->get('text');
            $onclick = $button->get('onclick', '');

            if ($button->get('link') !== '#') {
                $href = Uri::base() . $button->get('link');
            } else {
                $href = '';
            }

            $id = $button->get('name');

            $list[$id] = array(
                'name' => $name,
                'title' => $title,
                'icon' => $icon,
                'href' => $href,
                'onclick' => $onclick,
                'svg' => $button->get('iconSVG'),
                'options' => $button->get('options', array()),
            );

            $i++;
        }

        $settings['joomla_xtd_buttons'] = json_encode(array_values($list));
    }
}
