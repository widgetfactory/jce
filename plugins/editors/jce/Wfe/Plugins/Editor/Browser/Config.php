<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Browser;

\defined('_JEXEC') or die;

class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $settings['file_browser_callback'] = '';
    }
}