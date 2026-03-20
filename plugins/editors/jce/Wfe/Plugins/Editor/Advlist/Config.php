<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Advlist;

\defined('_JEXEC') or die;

use Wfe\Application\Application;

class Config
{
    public static function getConfig(&$settings)
    {
        $wf = Application::getInstance();
        
        $bullet = self::getBulletList();
        $settings['advlist_bullist_styles'] = $bullet !== false ? implode(',', $bullet) : false;

        $number = self::getNumberList();
        $settings['advlist_number_styles'] = $number !== false ? implode(',', $number) : false;

        $settings['advlist_bullist_classes'] = $wf->getParam('lists.bullet_classes', '');
        $settings['advlist_numlist_classes'] = $wf->getParam('lists.numlist_classes', '');

        $settings['advlist_bullist_custom_classes'] = $wf->getParam('lists.bullet_custom_classes', []);
        $settings['advlist_numlist_custom_classes'] = $wf->getParam('lists.numlist_custom_classes', []);
    }

    private static function getNumberList()
    {
        $wf = Application::getInstance();
        $number = (array) $wf->getParam('lists.number_styles');

        if (empty($number) || (count($number) === 1 && array_shift($number) === 'default')) {
            return false;
        }

        return $number;
    }

    private static function getBulletList()
    {
        $wf = Application::getInstance();
        $bullet = (array) $wf->getParam('lists.bullet_styles');

        if (empty($bullet) || (count($bullet) === 1 && array_shift($bullet) === 'default')) {
            return false;
        }

        return $bullet;
    }
}
