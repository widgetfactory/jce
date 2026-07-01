<?php

/**
 * @copyright    Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license    GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */

namespace Wfe\Helper;

\defined('_JEXEC') or die;

abstract class StringHelper
{
    public static function isJson($value)
    {
        // value must be a string
        if (!$value || !is_string($value)) {
            return false;
        }

        // trim
        $value = trim($value);

        if (!$value) {
            return false;
        }

        // quick syntax check
        if ($value[0] !== '{' && $value[0] !== '[') {
            return false;
        }

        // full check using json_decode
        json_decode($value);
        return json_last_error() == JSON_ERROR_NONE;
    }

    public static function safe_strpos($string, $needle, $offset = 0)
    {
        if (function_exists('mb_strpos')) {
            return mb_strpos($string, $needle, $offset);
        } else {
            return strpos($string, $needle, $offset);
        }
    }

    public static function safe_substr($string, $start, $length = null)
    {
        if (function_exists('mb_substr')) {
            return mb_substr($string, $start, $length);
        } else {
            return substr($string, $start, $length);
        }
    }

    public static function safe_strlen($string)
    {
        if (function_exists('mb_strlen')) {
            return mb_strlen($string);
        } else {
            return strlen($string);
        }
    }
}