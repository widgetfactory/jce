<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

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

    private static function getDefaultItemId()
    {
        // get menus
        $menus = Factory::getApplication()->getMenu('site');

        // get "default" menu
        $default = $menus->getDefault();

        return $default ? (int) $default->id : 0;
    }

    public static function removeAlias($url)
    {
        // Only strip alias after a numeric ID (e.g. id=1:article-alias)
        $url = preg_replace('#(?<=\d):[\w-]+#u', '', $url);

        return $url;
    }

    private static function parseQueryVars($url)
    {
        $parsed = parse_url($url, PHP_URL_QUERY);
        $parsed = str_replace('&amp;', '&', $parsed);
        parse_str($parsed, $vars);
        return $vars;
    }

    public static function removeItemId($url)
    {
        if (strpos($url, 'Itemid') === false) {
            return $url;
        }

        $vars = self::parseQueryVars($url);

        if (!array_key_exists('Itemid', $vars)) {
            return $url;
        }

        // remove the itemid
        unset($vars['Itemid']);

        if (empty($vars)) {
            return 'index.php';
        }

        // rebuild the query string, preserving colons (valid in query values)
        $query = str_replace('%3A', ':', http_build_query($vars));

        return 'index.php?' . $query;
    }

    public static function removeHomeItemId($url)
    {
        if (strpos($url, 'Itemid') === false) {
            return $url;
        }

        $vars = self::parseQueryVars($url);

        if (!array_key_exists('Itemid', $vars)) {
            return $url;
        }

        $defaultId = self::getDefaultItemId();

        if ((int) $defaultId === (int) $vars['Itemid']) {
            $url = self::removeItemId($url);
        }

        return $url;
    }
}
