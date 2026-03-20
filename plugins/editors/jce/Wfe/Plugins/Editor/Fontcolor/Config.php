<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Fontcolor;

\defined('_JEXEC') or die;

use Wfe\Application\Application;

class Config
{
    public static function getConfig(&$settings)
    {
        $wf = Application::getInstance();

        $settings['fontcolor_foreground_color'] = $wf->getParam('fontcolor.foreground_color', '');
        $settings['fontcolor_background_color'] = $wf->getParam('fontcolor.background_color', '');

        $settings['fontcolor_foreground_colors'] = $wf->getParam('fontcolor.foreground_colors', '');
        $settings['fontcolor_background_colors'] = $wf->getParam('fontcolor.background_colors', '');
    }
}
