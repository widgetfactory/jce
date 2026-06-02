<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Editor\Insertdatetime;

\defined('_JEXEC') or die;

class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();

        $dateformat = $wf->getParam('insertdatetime.dateformat', '%Y-%m-%d');

        $config = array();

        if ($dateformat) {
            $config['dateformat'] = (string) $dateformat;
        }

        $timeformat = $wf->getParam('insertdatetime.timeformat', '%H:%M:%S');

        if ($timeformat) {
            $config['timeformat'] = (string) $timeformat;
        }

        $formats = $wf->getParam('insertdatetime.formats', '');


        if ($formats) {
            if (is_string($formats)) {
                $formats = explode(',', $formats);
            }

            // trim
            $formats = array_map('trim', $formats);

            // remove empty
            $formats = array_filter($formats);

            if (!empty($formats)) {
                $config['formats'] = $formats;
            }
        }

        $config['element'] = (bool) $wf->getParam('insertdatetime.element', 0);

        $settings['insertdatetime'] = $config;
    }
}
