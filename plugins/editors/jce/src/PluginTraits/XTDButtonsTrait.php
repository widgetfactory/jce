<?php
/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Editors\Jce\PluginTraits;

use Joomla\CMS\Factory;
use Joomla\CMS\Editor\Editor;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;
use Joomla\Event\Event;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

trait XTDButtonsTrait
{
    private function getXtdButtonsList($name, $buttons, $asset, $author)
    {
        $app = Factory::getApplication();
        
        $list = array();

        $excluded = array('readmore', 'pagebreak');

        if (!is_array($buttons)) {
            $buttons = !$buttons ? false : $excluded;
        } else {
            $buttons = array_merge($buttons, $excluded);
        }

        // easiest way to get buttons across versions
        $buttons = Editor::getInstance('jce')->getButtons($name, $buttons);

        if (!empty($buttons)) {
            $list[$name] = array();
            
            foreach ($buttons as $i => $button) {
                if ($button->get('name')) {
                    $id = $name . '_' . $button->name;

                    if (version_compare(JVERSION, '4', 'ge')) {
                        $button->id = $id . '_modal';
                        echo LayoutHelper::render('joomla.editors.buttons.modal', $button);
                    }

                    // create icon class
                    $icon = 'none icon-' . $button->get('icon', $button->get('name'));

                    $options = (array) $button->get('options', array());

                    // set href value
                    if ($button->get('link', '#') == '#') {
                        $link = isset($options['src']) ? $options['src'] : '';
                    } else {
                        $link = Uri::base() . $button->get('link');
                    }

                    // Joomla 5 modal requirements
                    if ($button->get('action', '')) {
                        $options['src']         = $link;
                        $options['textHeader']  = $button->get('text');
                        $options['iconHeader']  = 'icon-' . $icon;
                        $options['popupType']   = $options['popupType'] ?? 'iframe';
                    }

                    $args = array(
                        'name' => $button->get('text'),
                        'id' => $id,
                        'title' => $button->get('text'),
                        'icon' => $icon,
                        'href' => $link,
                        'onclick' => $button->get('onclick', ''),
                        'svg' => $button->get('iconSVG'),
                        'options' => $options,
                        'action' => $button->get('action', '')
                    );

                    $list[$name][] = $args;
                }
            }
        }

        return $list;
    }

    protected function displayXtdButtons($name, $buttons, $asset, $author, $hidden = false)
    {
        // easiest way to get buttons across versions
        $buttons = Editor::getInstance('jce')->getButtons($name, $buttons);

        if (!empty($buttons)) {
            // fix some buttons attributes
            foreach ($buttons as $button) {
                $cls = $button->get('class', '');

                if (empty($cls) || strpos($cls, 'btn') === false) {
                    $cls .= ' btn';
                    $button->set('class', trim($cls));
                }
                
                // set the editor name (Joomla 5) so each modal is unique
                $button->set('editor', $name);

                // hide buttons if required
                if ($hidden) {
                    $button->set('class', 'd-none hidden');
                }
            }

            return LayoutHelper::render('joomla.editors.buttons', $buttons);
        }
    }
}