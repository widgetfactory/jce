<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Tabfocus;

\defined('_JEXEC') or die;

class Config
{
    public static function getConfig(&$vars, $application = null)
    {
        $vars['tabfocus_elements'] = ':prev,:next';
    }
}