<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFFontcolorPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $settings['fontcolor_foreground_color'] = $wf->getParam('fontcolor.foreground_color', '');
        $settings['fontcolor_background_color'] = $wf->getParam('fontcolor.background_color', '');

        $settings['fontcolor_foreground_colors'] = $wf->getParam('fontcolor.foreground_colors', '');
        $settings['fontcolor_background_colors'] = $wf->getParam('fontcolor.background_colors', '');
    }
}
