<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFCharmapPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $append = $wf->getParam('charmap.charmap_append', array());

        if (!empty($append)) {
            $values = array();

            foreach ($append as $item) {
                $item = (object) $item;

                // invalid values
                if (empty($item->name) || empty($item->value)) {
                    continue;
                }

                $item->name = html_entity_decode($item->name);
                $values[$item->name] = $item->value;
            }

            $settings['charmap_append'] = $values;
        }
    }
}
