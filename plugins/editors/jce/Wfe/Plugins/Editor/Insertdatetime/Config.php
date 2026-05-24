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

        if ($dateformat) {
            $settings['insertdatetime_dateformat'] = (string) $dateformat;
        }
        
        $timeformat = $wf->getParam('insertdatetime.timeformat', '%H:%M:%S');

        if ($timeformat) {
            $settings['insertdatetime_timeformat'] = (string) $timeformat;
        }

        $formats = $wf->getParam('insertdatetime.formats', '');

        if ($formats) {
            $settings['insertdatetime_formats'] = array_map('trim', explode(',', $formats));
        }

        $settings['insertdatetime_element'] = (bool) $wf->getParam('insertdatetime.element', 0);
    }
}
