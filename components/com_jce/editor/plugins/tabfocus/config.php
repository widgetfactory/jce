<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFPluginTabfocusConfig
{
    public static function getConfig(&$vars)
    {
        $vars['tabfocus_elements'] = ':prev,:next';
    }
}