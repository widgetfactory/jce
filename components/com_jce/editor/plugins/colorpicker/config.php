<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFColorpickerPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $colours = $wf->getParam('colorpicker.custom_colors', '');

        if (empty($colours)) {
            $colours = $wf->getParam('editor.custom_colors', '');
        }

        $colours = array_map('trim', explode(',', $colours));

        $settings['colorpicker_custom_colors'] = $colours;
    }
}
