<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

class WFBrowserPluginConfig
{
    public static function getConfig(&$settings)
    {
        $settings['file_browser_callback'] = '';
    }
}
