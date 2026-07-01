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

abstract class ArrayHelper
{
    /**
     * Method to determine if an array is an associative array.
     *
     * @param    array        An array to test
     *
     * @return bool True if the array is an associative array
     *
     * @link    https://www.php.net/manual/en/function.is-array.php#84488
     */
    public static function isAssociative($array)
    {
        if (!is_array($array)) {
            return false;
        }

        $i = count($array);

        while ($i > 0) {
            if (!array_key_exists(--$i, $array)) {
                return true;
            }
        }

        return false;
    }

    public static function is_associative_array($array)
    {
        return self::isAssociative($array);
    }

    /**
     * array_merge_recursive does indeed merge arrays, but it converts values with duplicate
     * keys to arrays rather than overwriting the value in the first array with the duplicate
     * value in the second array, as array_merge does. I.e., with array_merge_recursive,
     * this happens (documented behavior):.
     *
     * array_merge_recursive(array('key' => 'org value'), array('key' => 'new value'));
     *     => array('key' => array('org value', 'new value'));
     *
     * array_merge_recursive_distinct does not change the datatypes of the values in the arrays.
     * Matching keys' values in the second array overwrite those in the first array, as is the
     * case with array_merge, i.e.:
     *
     * array_merge_recursive_distinct(array('key' => 'org value'), array('key' => 'new value'));
     *     => array('key' => array('new value'));
     *
     * Parameters are passed by reference, though only for performance reasons. They're not
     * altered by this function.
     *
     * @param array $array1
     * @param array $array2
     * @param boolean $ignore_empty_string
     *
     * @return array
     *
     * @author Daniel <daniel (at) danielsmedegaardbuus (dot) dk>
     * @author Gabriel Sobrinho <gabriel (dot) sobrinho (at) gmail (dot) com>
     */
    public static function array_merge_recursive_distinct(array $array1, array $array2, $ignore_empty_string = false)
    {
        $merged = $array1;

        foreach ($array2 as $key => $value) {
            if (self::is_associative_array($value) && array_key_exists($key, $merged) && self::is_associative_array($merged[$key])) {
                $merged[$key] = self::array_merge_recursive_distinct($merged[$key], $value, $ignore_empty_string);
            } else {
                if (is_null($value)) {
                    continue;
                }

                if (array_key_exists($key, $merged) && $ignore_empty_string && $value === "") {
                    continue;
                }

                $merged[$key] = $value;
            }
        }

        return $merged;
    }
}
