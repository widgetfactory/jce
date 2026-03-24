<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Wordcount;

\defined('_JEXEC') or die;


class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $wf = \Wfe\Factory::getApplication();

        $settings['wordcount_limit'] = $wf->getParam('editor.wordcount_limit', 0, 0);
        $settings['wordcount_alert'] = $wf->getParam('editor.wordcount_alert', 0, 0);
    }
}