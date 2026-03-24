<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Colorpicker;

\defined('_JEXEC') or die;


class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();

        $colours = $wf->getParam('colorpicker.custom_colors', '');

        if (empty($colours)) {
            $colours = $wf->getParam('editor.custom_colors', '');
        }

        $colours = array_map('trim', explode(',', $colours));

        $settings['colorpicker_custom_colors'] = $colours;
    }
}
