<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;

abstract class WFLinkHelper
{
    /**
     * Translates an internal Joomla URL to a humanly readible URL.
     *
     * @param string $url Absolute or Relative URI to Joomla resource
     *
     * @return The translated humanly readible URL
     */
    public static function route($url)
    {
        $app = Joomla\CMS\Application\CMSApplication::getInstance('site');
        $router = $app->getRouter('site');

        if (!$router) {
            return $url;
        }

        $uri = $router->build($url);
        $url = $uri->toString();
        $url = str_replace('/administrator/', '/', $url);

        return $url;
    }

    public static function removeItemId($url)
    {
        $url = preg_replace('#&Itemid=[0-9]+#', '', $url);

        return $url;
    }

    public static function removeAlias($url)
    {
        $url = preg_replace('#\:[\w-]+#ui', '', $url);

        return $url;
    }

    public static function removeHomeItemId($url)
    {
        if (strpos($url, 'Itemid') === false) {
            return $url;
        }

        $parsed = parse_url($url, PHP_URL_QUERY);
        $parsed = str_replace('&amp;', '&', $parsed);

        parse_str($parsed, $vars);

        if (!array_key_exists('Itemid', $vars)) {
            return $url;
        }

        // get menus
        $menus = Factory::getApplication()->getMenu('site');
        // get "default" menu
        $default = $menus->getDefault();

        // Itemid is unique
        if ($default->id != $vars['Itemid']) {
            return $url;
        }

        // remove "default" Itemid
        $url = self::removeItemId($url);

        return $url;
    }
}
