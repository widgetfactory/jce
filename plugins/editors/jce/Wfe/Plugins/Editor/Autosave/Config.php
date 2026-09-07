<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Editor\Autosave;

\defined('_JEXEC') or die;

class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();

        $ask_before_unload = $wf->getParam('autosave.ask_before_unload');
        $retention = $wf->getParam('autosave.retention');
        $interval = $wf->getParam('autosave.interval');

        // add "m" to the retention value if it is not empty
        if ($retention) {
            $retention = (int) $retention;

            if ($retention > 0) {
                $retention .= 'm';
            } else {
                $retention = '';
            }
        }

        // add "s" to the interval value if it is not empty
        if ($interval) {
            $interval = (int) $interval;
            if ($interval > 0) {
                $interval .= 's';
            } else {
                $interval = '';
            }
        }

        if ($ask_before_unload) {
            $settings['autosave_ask_before_unload'] = true;
        }

        if ($retention) {
            $settings['autosave_retention'] = $retention;
        }

        if ($interval) {
            $settings['autosave_interval'] = $interval;
        }
    }
}
