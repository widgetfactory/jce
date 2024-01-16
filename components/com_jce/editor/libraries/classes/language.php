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

abstract class WFLanguage
{
    /* Map language code to generic tag */
    protected static $map = array(
        'de' => 'de-DE',
        'fr' => 'fr-FR',
    );

    /*
     * Check a language file exists and is the correct version
     */
    protected static function isValid($tag)
    {
        return file_exists(JPATH_SITE . '/language/' . $tag . '/' . $tag . '.com_jce.ini');
    }

    /**
     * Return the curernt language code.
     *
     * @return language code
     */
    public static function getDir()
    {
        return Factory::getLanguage()->isRTL() ? 'rtl' : 'ltr';
    }

    /**
     * Return the curernt language code.
     *
     * @return language code
     */
    public static function getTag()
    {
        $tag = Factory::getLanguage()->getTag();

        $code = substr($tag, 0, strpos($tag, '-'));

        if (array_key_exists($code, self::$map)) {
            $tag = self::$map[$code];
        }

        if (false == self::isValid($tag)) {
            return 'en-GB';
        }

        return $tag;
    }

    /**
     * Return the curernt language code.
     *
     * @return language code
     */
    public static function getCode()
    {
        $tag = self::getTag();

        return substr($tag, 0, strpos($tag, '-'));
    }

    /**
     * Load a language file.
     *
     * @param string $prefix         Language prefix
     * @param object $path[optional] Base path
     */
    public static function load($prefix, $path = JPATH_SITE)
    {
        Factory::getLanguage()->load($prefix, $path);
    }
}
