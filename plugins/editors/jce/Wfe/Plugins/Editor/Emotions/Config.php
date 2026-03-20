<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Emotions;

\defined('_JEXEC') or die;

use Wfe\Application\Application;

class Config
{
    public static function getConfig(&$settings)
    {
        $wf = Application::getInstance();

        $settings['emotions_smilies'] = $wf->getParam('emotions.smilies');
        $settings['emotions_url'] = $wf->getParam('emotions.url');
    }
}
