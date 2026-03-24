<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Visualchars;

\defined('_JEXEC') or die;


class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();

        // legacy
        $state = $wf->getParam('editor.visualchars', 0);

        $settings['visualchars_default_state'] = $wf->getParam('editor.visualchars_state', $state, 0, 'boolean');
    }
}
