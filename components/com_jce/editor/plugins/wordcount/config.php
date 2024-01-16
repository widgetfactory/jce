<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFWordcountPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();
        $settings['wordcount_limit'] = $wf->getParam('editor.wordcount_limit', 0, 0);
        $settings['wordcount_alert'] = $wf->getParam('editor.wordcount_alert', 0, 0);
    }
}
