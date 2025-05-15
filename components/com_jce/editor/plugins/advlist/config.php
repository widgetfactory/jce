<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFAdvlistPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();
        
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
        $wf = WFApplication::getInstance();
        $number = (array) $wf->getParam('lists.number_styles');

        if (empty($number) || (count($number) === 1 && array_shift($number) === 'default')) {
            return false;
        }

        return $number;
    }

    private static function getBulletList()
    {
        $wf = WFApplication::getInstance();
        $bullet = (array) $wf->getParam('lists.bullet_styles');

        if (empty($bullet) || (count($bullet) === 1 && array_shift($bullet) === 'default')) {
            return false;
        }

        return $bullet;
    }
}
