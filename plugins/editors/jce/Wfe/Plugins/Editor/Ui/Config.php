<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Ui;

\defined('_JEXEC') or die;


class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();
        $settings['object_resizing'] = $wf->getParam('editor.object_resizing', 1);

        if ((int) $settings['object_resizing'] === 0) {
            $settings['object_resizing'] = false;
        } else {
            $settings['object_resizing'] = '';
        }
    }
}
