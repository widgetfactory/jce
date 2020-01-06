<?php

/**
 * @copyright     Copyright (c) 2009-2020 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
class WFCharmapPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $append = $wf->getParam('charmap.charmap_append', array());

        if (!empty($append)) {
            $values = array();
            
            foreach($append as $item) {
                $item = (object) $item;

                $item->name = html_entity_decode($item->name);
                $values[$item->name] = $item->value;
            }
            
            $settings['charmap_append'] = $values;
        }
    }
}
