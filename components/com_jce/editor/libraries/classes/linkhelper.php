<?php

/**
 * @copyright    Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die('RESTRICTED');

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
        $app = JApplication::getInstance('site');
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

    public static function removeHomeItemId($url) {
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
		$menus = JFactory::getApplication()->getMenu('site');
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