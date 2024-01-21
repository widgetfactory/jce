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

use Joomla\CMS\Editor\Editor;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Uri\Uri;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

trait XTDButtonsTrait
{
    private function getXtdButtonsList($name, $buttons, $asset, $author)
    {
        $list = array(
            $name => array(),
        );

        $excluded = array('readmore', 'pagebreak');

        if (!is_array($buttons)) {
            $buttons = !$buttons ? false : $excluded;
        } else {
            $buttons = array_merge($buttons, $excluded);
        }

        // easiest way to get buttons across versions
        $buttons = Editor::getInstance('jce')->getButtons($name, $buttons);

        if (!empty($buttons)) {
            foreach ($buttons as $i => $button) {
                if ($button->get('name')) {
                    $id = $name . '_' . $button->name;

                    if (version_compare(JVERSION, '4', 'ge')) {
                        $button->id = $id . '_modal';
                        echo LayoutHelper::render('joomla.editors.buttons.modal', $button);
                    }

                    // create icon class
                    $icon = 'none icon-' . $button->get('icon', $button->get('name'));

                    // set href value
                    if ($button->get('link') !== '#') {
                        $href = Uri::base() . $button->get('link');
                    } else {
                        $href = '';
                    }

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

                    $list[$name][] = $options;
                }
            }
        }

        return $list;
    }

    protected function displayXtdButtons($name, $buttons, $asset, $author)
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
            }

            return LayoutHelper::render('joomla.editors.buttons', $buttons);
        }
    }
}
