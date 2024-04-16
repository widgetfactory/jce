<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Uri\Uri;

class WFStyleselectPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $settings['styleselect_sort'] = $wf->getParam('styleselect.sort', 1, 1);
        $settings['styleselect_preview_styles'] = $wf->getParam('styleselect.preview_styles', 1, 1);
    }
}
