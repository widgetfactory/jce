<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Fontsizeselect;

\defined('_JEXEC') or die;


class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();

        $settings['fontsizeselect_font_sizes'] = $wf->getParam('fontsizeselect.font_sizes', '8pt,10pt,12pt,14pt,18pt,24pt,36pt', '8pt,10pt,12pt,14pt,18pt,24pt,36pt');
    }
}
