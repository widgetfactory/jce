<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFUiPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();
        $settings['object_resizing'] = $wf->getParam('editor.object_resizing', 1);

        if ((int) $settings['object_resizing'] === 0) {
            $settings['object_resizing'] = false;
        } else {
            $settings['object_resizing'] = '';
        }
    }
}
