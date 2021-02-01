<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
class WFJoomlaPluginConfig
{
    public static function getConfig(&$settings)
    {
        // already set by editor display
        if (isset($settings['joomla_xtd_buttons'])) {
            return;
        }

        $plugins = JPluginHelper::getPlugin('editors-xtd');

        $list = array();
        $editor = JEditor::getInstance('jce');

        $excluded = array('readmore', 'pagebreak', 'image');

        $i = 0;

        foreach ($plugins as $plugin) {
            // skip buttons better implemented by editor
            if (in_array($plugin->name, $excluded)) {
                continue;
            }

            // fully load plugin instance
            JPluginHelper::importPlugin('editors-xtd', $plugin->name, true);

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
            if (!($button instanceof Joomla\CMS\Object\CMSObject)) {
                continue;
            }

            // Set some vars
            $name = 'button-' . $i . '-' . str_replace(' ', '-', $button->get('text'));
            $title = $button->get('text');
            $onclick = $button->get('onclick', '');
            $icon = $button->get('name');

            if ($button->get('link') !== '#') {
                $href = JUri::base() . $button->get('link');
            } else {
                $href = '';
            }

            $icon = 'none icon-' . $icon;

            $list[] = array(
                'name' => $name,
                'title' => $title,
                'icon' => $icon,
                'href' => $href,
                'onclick' => $onclick,
            );

            $i++;
        }

        $settings['joomla_xtd_buttons'] = json_encode($list);
    }
}
