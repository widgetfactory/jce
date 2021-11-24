<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
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
        return JFactory::getLanguage()->isRTL() ? 'rtl' : 'ltr';
    }

    /**
     * Return the curernt language code.
     *
     * @return language code
     */
    public static function getTag()
    {
        $tag = JFactory::getLanguage()->getTag();

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
        JFactory::getLanguage()->load($prefix, $path);
    }
}
