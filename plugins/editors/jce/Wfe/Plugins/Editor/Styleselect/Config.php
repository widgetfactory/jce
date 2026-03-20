<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Styleselect;

\defined('_JEXEC') or die;

use Wfe\Application\Application;

class Config
{
    public static function getConfig(&$settings)
    {
        $wf = Application::getInstance();

        $settings['styleselect_sort'] = $wf->getParam('styleselect.sort', 1, 1);
        $settings['styleselect_preview_styles'] = $wf->getParam('styleselect.preview_styles', 1, 1);
    }
}
