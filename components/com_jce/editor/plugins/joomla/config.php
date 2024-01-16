<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Editor\Editor;
use Joomla\CMS\Factory;
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

        $list = array(
            '__jce__' => array()
        );

        $editor = Editor::getInstance('jce');

        $excluded = array('readmore', 'pagebreak', 'image');

        $i = 0;

        $buttons = $editor->getButtons('__jce__');

        foreach ($buttons as $button) {
            // skip buttons better implemented by editor
            if (in_array($button->name, $excluded)) {
                continue;
            }

            // create icon class
            $icon = 'none icon-' . $button->get('icon', $button->get('name'));

            // set href value
            if ($button->get('link') !== '#') {
                $href = Uri::base() . $button->get('link');
            } else {
                $href = '';
            }

            $id = $button->get('name');

            $options = array(
                'name' => $button->get('text'),
                'id' => $id,
                'title' => $button->get('text'),
                'icon' => $icon,
                'href' => $href,
                'onclick' => $button->get('onclick', ''),
                'svg' => $button->get('iconSVG'),
                'options' => $button->get('options', array()),
            );

            $list['__jce__'][] = $options;
        }
        $settings['joomla_xtd_buttons'] = json_encode($list);
    }
}
