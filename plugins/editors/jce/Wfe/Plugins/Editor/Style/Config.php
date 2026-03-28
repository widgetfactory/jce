<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Editor\Style;

\defined('_JEXEC') or die;

class Config
{
    public static function getSettings(&$settings = array())
    {
        $wf = \Wfe\Factory::getApplication();

        $settings['style_file_browser'] = $wf->getParam('style.file_browser', 1);
    }
};
