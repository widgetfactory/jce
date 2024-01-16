<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFVisualcharsPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        // legacy
        $state = $wf->getParam('editor.visualchars', 0);

        $settings['visualchars_default_state'] = $wf->getParam('editor.visualchars_state', $state, 0, 'boolean');
    }
}
