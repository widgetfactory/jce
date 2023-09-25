<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

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

        $plugins = PluginHelper::getPlugin('editors-xtd');

        $list = array();
        $editor = Editor::getInstance('jce');

        $excluded = array('readmore', 'pagebreak', 'image');

        $i = 0;

        foreach ($plugins as $plugin) {
            // skip buttons better implemented by editor
            if (in_array($plugin->name, $excluded)) {
                continue;
            }

            // fully load plugin instance
            PluginHelper::importPlugin('editors-xtd', $plugin->name, true);

            // create the button class name
            $className = 'PlgEditorsXtd' . $plugin->name;

            // or an alternative
            if (!class_exists($className)) {
                $className = 'PlgButton' . $plugin->name;
            }

            $instance = null;

            if (class_exists($className)) {
                $dispatcher = is_subclass_of($editor, 'Joomla\Event\DispatcherAwareInterface', false) ? $editor->getDispatcher() : $editor;
                $instance = new $className($dispatcher, (array) $plugin);
            }

            // check that the button is valid
            if (!$instance || !method_exists($instance, 'onDisplay')) {
                continue;
            }

            $button = $instance->onDisplay('__jce__', null, null);

            if (empty($button) || !is_object($button)) {
                continue;
            }

            // should be a CMSObject
            if (!($button instanceof CMSObject)) {
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
