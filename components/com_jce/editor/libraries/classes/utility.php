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

/* Set internal character encoding to UTF-8 */
if (function_exists('mb_internal_encoding')) {
    mb_internal_encoding("UTF-8");
}

use Joomla\CMS\Uri\Uri;

abstract class WFUtility
{
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

    /**
     * Multi-byte-safe pathinfo replacement.
     * Drop-in replacement for pathinfo(), but multibyte- and cross-platform-safe.
     *
     * From PHPMailer - https://github.com/PHPMailer/PHPMailer/blob/v6.1.4/src/PHPMailer.php#L4256-L4302
     *
     * @see http://www.php.net/manual/en/function.pathinfo.php#107461
     *
     * @param string     $path    A filename or path, does not need to exist as a file
     * @param int|string $options Either a PATHINFO_* constant,
     *                            or a string name to return only the specified piece
     *
     * @return string|array
     */
    public static function mb_pathinfo($path, $options = null)
    {
        // check if multibyte string, use pathname() if not
        if (function_exists('mb_strlen')) {
            if (mb_strlen($path) === strlen($path)) {
                return pathinfo($path, $options);
            }
        }

        $ret = array('dirname' => '', 'basename' => '', 'extension' => '', 'filename' => '');

        $pathinfo = array();

        if (preg_match('#^(.*?)[\\\\/]*(([^/\\\\]*?)(\.([^.\\\\/]+?)|))[\\\\/.]*$#m', $path, $pathinfo)) {
            if (array_key_exists(1, $pathinfo)) {
                $ret['dirname'] = $pathinfo[1];
            }
            if (array_key_exists(2, $pathinfo)) {
                $ret['basename'] = $pathinfo[2];
            }
            if (array_key_exists(5, $pathinfo)) {
                $ret['extension'] = $pathinfo[5];
            }
            if (array_key_exists(3, $pathinfo)) {
                $ret['filename'] = $pathinfo[3];
            }
        }

        switch ($options) {
            case PATHINFO_DIRNAME:
            case 'dirname':
                return $ret['dirname'];
            case PATHINFO_BASENAME:
            case 'basename':
                return $ret['basename'];
            case PATHINFO_EXTENSION:
            case 'extension':
                return $ret['extension'];
            case PATHINFO_FILENAME:
            case 'filename':
                return $ret['filename'];
            default:
                return $ret;
        }
    }

    /**
     * Get the file extension from a path
     *
     * From libraries/vendor/joomla/filesystem/src/File.php
     * @copyright  Copyright (C) 2005 - 2021 Open Source Matters, Inc. All rights reserved.
     *
     * @param  string $path The file path
     * @param  bool   $lowercase Convert the extension to lowercase
     * @return string The file extension
     */
    public static function getExtension($file, $lowercase = false)
    {
        // String manipulation should be faster than pathinfo() on newer PHP versions.
        $dot = strrpos($file, '.');

        // If no dot is found or it's at the start, return an empty string (no extension)
        if ($dot === false || $dot === 0) {
            return '';
        }

        $ext = substr($file, $dot + 1);

        // Ensure the extension does not contain any slashes or directory separators
        if (strpos($ext, '/') !== false || strpos($ext, DIRECTORY_SEPARATOR) !== false) {
            return '';
        }

        if ($lowercase) {
            $ext = strtolower($ext);
        }

        return $ext;
    }

    /**
     * Remove the extension from a file name or path
     *
     * @param  string $path The file path
     * @return string The file path without the extension
     */
    public static function stripExtension($path)
    {
        return preg_replace('#\.[^.]*$#', '', $path);
    }

    /**
     * Get the file name
     *
     * @param  string $path The file path
     * @return string The file name without the path or extension
     */
    public static function getFilename($path)
    {
        // check if multibyte string, use basename() if not
        if (function_exists('mb_strlen')) {
            if (mb_strlen($path) === strlen($path)) {
                return pathinfo($path, PATHINFO_FILENAME);
            }
        }

        // get basename
        $path = self::mb_basename($path);

        // remove name without extension
        return self::stripExtension($path);
    }

    public static function cleanPath($path, $ds = '/', $prefix = '')
    {
        $path = trim(rawurldecode($path));

        // check for UNC path on IIS and set prefix
        if ($ds == '\\' && strlen($path) > 1) {
            if ($path[0] == '\\' && $path[1] == '\\') {
                $prefix = '\\';
            }
        }

        /// Normalize slashes to forward slashes
        $path = preg_replace('#[/\\\\]+#', $ds, $path);

        // return path with prefix if any
        return $prefix . $path;
    }

    public static function uriToAbsolutePath($url)
    {
        // Get the relative root URL
        $root = Uri::root(true);

        // Make sure JPATH_SITE has a trailing slash
        $base = rtrim(JPATH_SITE, '/');

        // If $url starts with the root URL, replace it with JPATH_SITE
        $path = self::safe_substr($url, 0, self::safe_strlen($root));

        if ($path === $root) {
            $relativePath = self::safe_substr($url, self::safe_strlen($root));

            return self::makePath($base, $relativePath);
        }

        // If no match, return the original URL as it is (or handle accordingly)
        return $url;
    }

    /**
     * Append a DIRECTORY_SEPARATOR to the path if required.
     *
     * @param string $path the path
     * @param string $ds   optional directory seperator
     *
     * @return string path with trailing DIRECTORY_SEPARATOR
     */
    public static function fixPath($path)
    {
        return self::cleanPath($path . '/');
    }

    /**
     * Validates a string for use as a file or folder name or path, ensuring it contains only safe characters.
     *
     * - Disallows null bytes and control characters.
     * - Accepts valid UTF-8 strings with letters, digits, combining marks, and common safe punctuation.
     * - Allows characters: Unicode letters (L), numbers (N), marks (M), space, dot (.), dash (-),
     *   underscore (_), colon (:), forward slash (/), parentheses (), and square brackets [].
     * - Provides a fallback byte-level ASCII check if the string is not valid UTF-8.
     * - Safe for use with both multibyte and legacy ASCII inputs, even if mbstring is not available.
     *
     * @param string $string The input string to validate.
     *
     * @return bool True if the string contains only valid characters, false otherwise.
     */

    private static function checkCharValue($string)
    {
        // Disallow null byte
        if (strpos($string, "\x00") !== false) {
            return false;
        }

        // Try UTF-8 validation if mb_check_encoding() is available
        $isUtf8 = function_exists('mb_check_encoding')
        ? mb_check_encoding($string, 'UTF-8')
        : (bool) preg_match('//u', $string); // minimal UTF-8 validity test

        if ($isUtf8) {
            // Use mb_* if available
            if (function_exists('mb_strlen') && function_exists('mb_substr')) {
                $length = mb_strlen($string, 'UTF-8');

                for ($i = 0; $i < $length; $i++) {
                    $char = mb_substr($string, $i, 1, 'UTF-8');

                    if (!preg_match('#^[\p{L}\p{N}\p{M}\.\-_\:/\(\)\[\] ]$#u', $char)) {
                        return false;
                    }
                }
            } else {
                // No mbstring: use preg_match_all to split into characters
                if (!preg_match_all('/./u', $string, $matches)) {
                    return false;
                }

                foreach ($matches[0] as $char) {
                    if (!preg_match('#^[\p{L}\p{N}\p{M}\.\-_\:/\(\)\[\] ]$#u', $char)) {
                        return false;
                    }
                }
            }
        } else {
            // Fallback: raw byte-level ASCII check
            $length = strlen($string);

            for ($i = 0; $i < $length; $i++) {
                $ord = ord($string[$i]);

                if (
                    $ord < 32 || $ord > 126 ||
                    in_array($ord, [34, 42, 60, 62, 63, 92, 124]) // " * < > ? \ |
                ) {
                    return false;
                }

                if (!(
                    ($ord >= 48 && $ord <= 57) || // 0–9
                    ($ord >= 65 && $ord <= 90) || // A–Z
                    ($ord >= 97 && $ord <= 122) || // a–z
                    in_array($ord, [32, 45, 46, 95, 58, 47, 40, 41, 91, 93]) // allowed symbols
                )) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Validates a relative file or folder path for safe usage.
     *
     * - Decodes the path using urldecode().
     * - Rejects paths containing directory traversal sequences (../).
     * - Delegates character validation to checkCharValue(), ensuring only safe characters are used.
     * - Throws an InvalidArgumentException on failure.
     *
     * Intended for validating UTF-8-safe relative paths, including multibyte directory and file names.
     *
     * @param string $path The relative path to validate (e.g. 'images/ειδήσεις/photo.jpg').
     *
     * @return bool True if the path is valid.
     *
     * @throws InvalidArgumentException If the path contains invalid characters or traversal attempts.
     */

    public static function checkPath($path)
    {
        $path = urldecode($path);

        if (preg_match('#(^|/)\.\.(/|$)#', $path)) {
            throw new InvalidArgumentException('Invalid path traversal');
        }

        if (self::checkCharValue($path) === false) {
            throw new InvalidArgumentException('Invalid path');
        }

        return true;
    }

    /**
     * Concat two paths together. Basically $a + $b.
     *
     * @param string $a  path one
     * @param string $b  path two
     * @param string $ds optional directory seperator
     *
     * @return string $a DIRECTORY_SEPARATOR $b
     */
    public static function makePath($a, $b, $ds = '/')
    {
        return self::cleanPath($a . $ds . $b, $ds);
    }

    /**
     * Converts UTF-8 encoded Latin-based characters with diacritics to their closest ASCII equivalents.
     *
     * - Uses `transliterator_transliterate()` (from the intl extension) if available for broad Unicode support.
     * - Falls back to a static map of pre-defined Latin characters to ASCII equivalents if transliterator is not available.
     * - Handles both single strings and arrays of strings recursively.
     * - Only converts Latin-based accented characters; non-Latin scripts (e.g. Greek, Cyrillic) are not affected unless transliterator is used.
     *
     * Example:
     *   "Crème brûlée" => "Creme brulee"
     *   "Jürgen" => "Jurgen"
     *
     * @param string|array $subject The input string or array of strings to convert.
     *
     * @return string|array The ASCII-transliterated version of the input.
     */
    private static function utf8_latin_to_ascii($subject)
    {
        static $CHARS = null;

        if (is_null($CHARS)) {
            $CHARS = array(
                'À' => 'A',
                'Á' => 'A',
                'Â' => 'A',
                'Ã' => 'A',
                'Ä' => 'A',
                'Å' => 'A',
                'Æ' => 'AE',
                'Ç' => 'C',
                'È' => 'E',
                'É' => 'E',
                'Ê' => 'E',
                'Ë' => 'E',
                'Ì' => 'I',
                'Í' => 'I',
                'Î' => 'I',
                'Ï' => 'I',
                'Ð' => 'D',
                'Ñ' => 'N',
                'Ò' => 'O',
                'Ó' => 'O',
                'Ô' => 'O',
                'Õ' => 'O',
                'Ö' => 'O',
                'Ø' => 'O',
                'Ù' => 'U',
                'Ú' => 'U',
                'Û' => 'U',
                'Ü' => 'U',
                'Ý' => 'Y',
                'ß' => 's',
                'à' => 'a',
                'á' => 'a',
                'â' => 'a',
                'ã' => 'a',
                'ä' => 'a',
                'å' => 'a',
                'æ' => 'ae',
                'ç' => 'c',
                'è' => 'e',
                'é' => 'e',
                'ê' => 'e',
                'ë' => 'e',
                'ì' => 'i',
                'í' => 'i',
                'î' => 'i',
                'ï' => 'i',
                'ñ' => 'n',
                'ò' => 'o',
                'ó' => 'o',
                'ô' => 'o',
                'õ' => 'o',
                'ö' => 'o',
                'ø' => 'o',
                'ù' => 'u',
                'ú' => 'u',
                'û' => 'u',
                'ü' => 'u',
                'ý' => 'y',
                'ÿ' => 'y',
                'Ā' => 'A',
                'ā' => 'a',
                'Ă' => 'A',
                'ă' => 'a',
                'Ą' => 'A',
                'ą' => 'a',
                'Ć' => 'C',
                'ć' => 'c',
                'Ĉ' => 'C',
                'ĉ' => 'c',
                'Ċ' => 'C',
                'ċ' => 'c',
                'Č' => 'C',
                'č' => 'c',
                'Ď' => 'D',
                'ď' => 'd',
                'Đ' => 'D',
                'đ' => 'd',
                'Ē' => 'E',
                'ē' => 'e',
                'Ĕ' => 'E',
                'ĕ' => 'e',
                'Ė' => 'E',
                'ė' => 'e',
                'Ę' => 'E',
                'ę' => 'e',
                'Ě' => 'E',
                'ě' => 'e',
                'Ĝ' => 'G',
                'ĝ' => 'g',
                'Ğ' => 'G',
                'ğ' => 'g',
                'Ġ' => 'G',
                'ġ' => 'g',
                'Ģ' => 'G',
                'ģ' => 'g',
                'Ĥ' => 'H',
                'ĥ' => 'h',
                'Ħ' => 'H',
                'ħ' => 'h',
                'Ĩ' => 'I',
                'ĩ' => 'i',
                'Ī' => 'I',
                'ī' => 'i',
                'Ĭ' => 'I',
                'ĭ' => 'i',
                'Į' => 'I',
                'į' => 'i',
                'İ' => 'I',
                'ı' => 'i',
                'Ĳ' => 'IJ',
                'ĳ' => 'ij',
                'Ĵ' => 'J',
                'ĵ' => 'j',
                'Ķ' => 'K',
                'ķ' => 'k',
                'Ĺ' => 'L',
                'ĺ' => 'l',
                'Ļ' => 'L',
                'ļ' => 'l',
                'Ľ' => 'L',
                'ľ' => 'l',
                'Ŀ' => 'L',
                'ŀ' => 'l',
                'Ł' => 'l',
                'ł' => 'l',
                'Ń' => 'N',
                'ń' => 'n',
                'Ņ' => 'N',
                'ņ' => 'n',
                'Ň' => 'N',
                'ň' => 'n',
                'ŉ' => 'n',
                'Ō' => 'O',
                'ō' => 'o',
                'Ŏ' => 'O',
                'ŏ' => 'o',
                'Ő' => 'O',
                'ő' => 'o',
                'Œ' => 'OE',
                'œ' => 'oe',
                'Ŕ' => 'R',
                'ŕ' => 'r',
                'Ŗ' => 'R',
                'ŗ' => 'r',
                'Ř' => 'R',
                'ř' => 'r',
                'Ś' => 'S',
                'ś' => 's',
                'Ŝ' => 'S',
                'ŝ' => 's',
                'Ş' => 'S',
                'ş' => 's',
                'Š' => 'S',
                'š' => 's',
                'Ţ' => 'T',
                'ţ' => 't',
                'Ť' => 'T',
                'ť' => 't',
                'Ŧ' => 'T',
                'ŧ' => 't',
                'Ũ' => 'U',
                'ũ' => 'u',
                'Ū' => 'U',
                'ū' => 'u',
                'Ŭ' => 'U',
                'ŭ' => 'u',
                'Ů' => 'U',
                'ů' => 'u',
                'Ű' => 'U',
                'ű' => 'u',
                'Ų' => 'U',
                'ų' => 'u',
                'Ŵ' => 'W',
                'ŵ' => 'w',
                'Ŷ' => 'Y',
                'ŷ' => 'y',
                'Ÿ' => 'Y',
                'Ź' => 'Z',
                'ź' => 'z',
                'Ż' => 'Z',
                'ż' => 'z',
                'Ž' => 'Z',
                'ž' => 'z',
                'ſ' => 's',
                'ƒ' => 'f',
                'Ơ' => 'O',
                'ơ' => 'o',
                'Ư' => 'U',
                'ư' => 'u',
                'Ǎ' => 'A',
                'ǎ' => 'a',
                'Ǐ' => 'I',
                'ǐ' => 'i',
                'Ǒ' => 'O',
                'ǒ' => 'o',
                'Ǔ' => 'U',
                'ǔ' => 'u',
                'Ǖ' => 'U',
                'ǖ' => 'u',
                'Ǘ' => 'U',
                'ǘ' => 'u',
                'Ǚ' => 'U',
                'ǚ' => 'u',
                'Ǜ' => 'U',
                'ǜ' => 'u',
                'Ǻ' => 'A',
                'ǻ' => 'a',
                'Ǽ' => 'AE',
                'ǽ' => 'ae',
                'Ǿ' => 'O',
                'ǿ' => 'o',
            );
        }

        if (is_array($subject)) {
            foreach ($subject as $i => $string) {
                $subject[$i] = self::utf8_latin_to_ascii($string);
            }

            return $subject;
        }

        if (!is_string($subject)) {
            return $subject;
        }

        if (function_exists('transliterator_transliterate')) {
            $transformed = transliterator_transliterate('Any-Latin; Latin-ASCII;', $subject);

            if ($transformed !== false) {
                return $transformed;
            }
        }

        return strtr($subject, $CHARS);
    }

    /**
     * Changes the case of a string or an array of strings using multibyte-safe functions.
     *
     * Supports 'lowercase' and 'uppercase' case transformations for UTF-8 encoded text.
     * If the input is an array, the transformation is applied recursively to each element.
     * Falls back to returning the original value if mbstring functions are not available.
     *
     * @param string|array $string The input string or array of strings to transform.
     * @param string $case The case to apply: 'lowercase' or 'uppercase'.
     *
     * @return string|array The transformed string or array, or the original input if unsupported.
     */

    protected static function changeCase($string, $case)
    {
        if (!function_exists('mb_strtolower') || !function_exists('mb_strtoupper')) {
            return $string;
        }

        $encoding = 'UTF-8';

        if (is_array($string)) {
            $result = [];

            foreach ($string as $key => $value) {
                $result[$key] = self::changeCase($value, $case);
            }

            return $result;
        }

        switch ($case) {
            case 'lowercase':
                return mb_strtolower($string, $encoding);

            case 'uppercase':
                return mb_strtoupper($string, $encoding);

            default:
                return $string;
        }
    }

    /**
     * Cleans a UTF-8 string by removing disallowed characters.
     *
     * - Strips common punctuation, symbols, brackets, and currency characters.
     * - Preserves only Unicode letters (\p{L}), numbers (\p{N}), space, dot (.), dash (-), and underscore (_).
     * - Returns a cleaned string consisting of readable alphanumeric and structural characters.
     * - Intended for safe output in filenames, slugs, or sanitized text fields.
     *
     * @param string $string The UTF-8 encoded input string to clean.
     * @return string The sanitized UTF-8 string with disallowed characters removed.
     */
    private static function cleanUTF8($string)
    {
        // Remove disallowed ASCII characters (punctuation, symbols)
        // This also removes brackets, currency, etc.
        $string = preg_replace('#[\\\+/\?\#%&<>"\'=\[\]\{\},;@\^\(\)£€$~]#u', '', $string);

        $result = '';
        $length = mb_strlen($string, 'UTF-8');

        for ($i = 0; $i < $length; $i++) {
            $char = mb_substr($string, $i, 1, 'UTF-8');

            // Keep: Unicode letters, numbers, space, dash, underscore, dot
            if (preg_match('#[\p{L}\p{N}\s\.\-_]#u', $char)) {
                $result .= $char;
            }

            // Everything else is skipped
        }

        return $result;
    }

    /**
     * Makes file name safe to use.
     *
     * @param mixed The name of the file (not full path)
     *
     * @return mixed The sanitised string or array
     */
    public static function makeSafe($subject, $mode = 'utf-8', $spaces = '_', $case = '')
    {
        $search = array();

        // set default mode if none is passed in
        if (empty($mode)) {
            $mode = 'utf-8';
        }

        if (!function_exists('mb_internal_encoding')) {
            $mode = 'ascii';
        }

        // trim
        if (is_array($subject)) {
            $subject = array_map('trim', $subject);
        } else {
            $subject = trim($subject);
        }

        // replace spaces with specified character or space
        if (is_string($spaces)) {
            $subject = preg_replace('#[\s ]+#', $spaces, $subject);
        }

        if ($mode === 'utf-8') {
            $search[] = '#[^\pL\pM\pN_\.\-\s ]#u';
        } else {
            $subject = self::utf8_latin_to_ascii($subject);
            $search[] = '#[^a-zA-Z0-9_\.\-\s ]#';
        }

        // remove multiple . characters
        $search[] = '#(\.){2,}#';

        // strip leading period
        $search[] = '#^\.#';

        // strip trailing period
        $search[] = '#\.$#';

        // strip whitespace
        $search[] = '#^\s*|\s*$#';

        // only for utf-8 to avoid PCRE errors - PCRE must be at least version 5
        if ($mode == 'utf-8') {
            try {
                // perform pcre replacement
                $result = preg_replace($search, '', $subject);
            } catch (Exception $e) {
                // try ascii
                return self::makeSafe($subject, 'ascii');
            }

            // try ascii
            if (is_null($result) || $result === false) {
                return self::makeSafe($subject, 'ascii');
            }

            if ($case) {
                // change case
                $result = self::changeCase($result, $case);
            }

            return $result;
        }

        $result = preg_replace($search, '', $subject);

        if ($case) {
            // change case
            $result = self::changeCase($result, $case);
        }

        return $result;
    }

    /**
     * Formats a raw file size (in bytes) as a human-readable string, limited to MB.
     *
     * - Bytes (< 1 KB): formatted as "123 bytes"
     * - Kilobytes (< 1 MB): formatted as "12.34 KB"
     * - Megabytes (≥ 1 MB): formatted as "1.23 MB"
     *
     * @param int $size The file size in bytes.
     * @return string The formatted file size string.
     */
    public static function formatSize($size)
    {
        if ($size < 1024) {
            return $size . ' ' . WFText::_('WF_LABEL_BYTES');
        }

        if ($size < 1048576) { // 1024 * 1024
            return sprintf('%.2f', $size / 1024) . ' ' . WFText::_('WF_LABEL_KB');
        }

        return sprintf('%.2f', $size / 1048576) . ' ' . WFText::_('WF_LABEL_MB');
    }

    /**
     * Convert strftime format to DateTime format.
     *
     * @param string $format The strftime format string.
     *
     * @return string The DateTime format string.
     */
    private static function convertStrftimeToDateTimeFormat($format)
    {
        $replacements = [
            '%d' => 'd', // Day of the month, 2 digits with leading zeros
            '%m' => 'm', // Numeric representation of a month, with leading zeros
            '%Y' => 'Y', // A full numeric representation of a year, 4 digits
            '%y' => 'y', // A two digit representation of a year
            '%H' => 'H', // 24-hour format of an hour with leading zeros
            '%I' => 'h', // 12-hour format of an hour with leading zeros
            '%M' => 'i', // Minutes with leading zeros
            '%S' => 's', // Seconds, with leading zeros
            '%p' => 'A', // UPPER-CASE 'AM' or 'PM' based on the given time
            '%P' => 'a', // lower-case 'am' or 'pm' based on the given time
        ];

        return strtr($format, $replacements);
    }

    /**
     * Format the date.
     *
     * @param int $timestamp the unix timestamp
     * @param string $format the format of the date (default: 'd/m/Y, H:i')
     *
     * @return string formatted date
     */
    public static function formatDate($timestamp = null, $format = 'd/m/Y, H:i')
    {
        $formatDateTime = self::convertStrftimeToDateTimeFormat($format);

        $dateTime = new DateTime();

        if ($timestamp !== null) {
            $dateTime->setTimestamp($timestamp);
        }

        return $dateTime->format($formatDateTime);
    }

    /**
     * Get the modified date of a file.
     *
     * @return Formatted modified date
     *
     * @param string $file Absolute path to file
     */
    public static function getDate($file)
    {
        return self::formatDate(@filemtime($file));
    }

    /**
     * Get the size of a file.
     *
     * @return Formatted filesize value
     *
     * @param string $file Absolute path to file
     */
    public static function getSize($file)
    {
        return self::formatSize(@filesize($file));
    }

    /**
     * Multi-byte-safe dirname replacement.
     * https://gist.github.com/tcyrus/257a1ed93c5e115b7b33426d029b5c5f
     *
     * @param string $path A Path
     * @param int $levels The number of parent directories to go up.
     * @return string The path of a parent directory.
     */
    public static function mb_dirname($path)
    {
        // check if multibyte string, use dirname() if not
        if (function_exists('mb_strlen')) {
            $dir = dirname($path);

            if ($dir == ".") {
                return "";
            }

            return $dir;
        }

        // Normalize the path for non-multibyte environments
        $path = self::cleanPath($path, '/');

        // Get last slash position
        $slash = strrpos($path, '/');

        // If there's no slash in the path, return ''
        if ($slash === false) {
            return "";
        }

        // Return directory part
        $dir = substr($path, 0, $slash);

        // If it's an empty string after substr, then it was a root path
        if ($dir === ".") {
            return "";
        }

        return $dir;
    }

    public static function mb_basename($path, $ext = '')
    {
        // check if multibyte string, use basename() if not
        if (function_exists('mb_strlen')) {
            return basename($path, $ext);
        }

        // clean
        $path = self::cleanPath($path, '/');

        // split path
        $parts = explode('/', $path);

        // return basename
        $path = end($parts);

        if ($ext === '.' . self::getExtension($path)) {
            $path = self::stripExtension($path);
        }

        return $path;
    }

    /**
     * Converts a string to UTF-8 encoding if it's not already UTF-8.
     *
     * - Uses mb_detect_encoding() if available.
     * - Falls back to regex-based UTF-8 detection and utf8_encode() for Latin-1 strings if mbstring is unavailable.
     * - If encoding cannot be determined, returns a sanitized ASCII-only version.
     *
     * @param string $string The input string to normalize.
     * @return string UTF-8 encoded or sanitized string.
     */
    public static function convertEncoding($string)
    {
        if (!function_exists('mb_detect_encoding') || !function_exists('mb_convert_encoding')) {
            // Regex-based UTF-8 detection (W3C)
            $isUTF8 = preg_match('%^(?:
              [\x09\x0A\x0D\x20-\x7E]              # ASCII
            | [\xC2-\xDF][\x80-\xBF]               # non-overlong 2-byte
            |  \xE0[\xA0-\xBF][\x80-\xBF]          # excluding overlongs
            | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}    # straight 3-byte
            |  \xED[\x80-\x9F][\x80-\xBF]          # excluding surrogates
            |  \xF0[\x90-\xBF][\x80-\xBF]{2}       # planes 1–3
            | [\xF1-\xF3][\x80-\xBF]{3}            # planes 4–15
            |  \xF4[\x80-\x8F][\x80-\xBF]{2}       # plane 16
        )*$%xs', $string);

            return $isUTF8 ? $string : utf8_encode($string);
        }

        // Try to detect the encoding
        $encoding = mb_detect_encoding($string, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII'], true);

        // Return unchanged if already UTF-8
        if ($encoding === 'UTF-8') {
            return $string;
        }

        // If unknown encoding, fallback to stripped ASCII
        if ($encoding === false) {
            return preg_replace('#[^a-zA-Z0-9_\.\-\s ]#u', '', $string);
        }

        // Convert from detected encoding to UTF-8
        return mb_convert_encoding($string, 'UTF-8', $encoding);
    }

    /**
     * Checks whether a string is valid UTF-8.
     *
     * Uses mb_detect_encoding() if available; otherwise falls back to a strict UTF-8 pattern check.
     * Designed for safe operation even in environments without mbstring.
     *
     * @param string $string The input string to validate.
     * @return bool True if the string is valid UTF-8, false otherwise.
     */
    public static function isUtf8($string)
    {
        if (!function_exists('mb_detect_encoding')) {
            return (bool) preg_match(
                '%^(?:
                [\x09\x0A\x0D\x20-\x7E]              # ASCII
              | [\xC2-\xDF][\x80-\xBF]               # non-overlong 2-byte
              |  \xE0[\xA0-\xBF][\x80-\xBF]          # excluding overlongs
              | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}    # straight 3-byte
              |  \xED[\x80-\x9F][\x80-\xBF]          # excluding surrogates
              |  \xF0[\x90-\xBF][\x80-\xBF]{2}       # planes 1-3
              | [\xF1-\xF3][\x80-\xBF]{3}            # planes 4-15
              |  \xF4[\x80-\x8F][\x80-\xBF]{2}       # plane 16
            )*$%xs',
                $string
            );
        }

        return mb_detect_encoding($string, 'UTF-8', true);
    }

    /**
     * Converts a human-readable size value (e.g., "2M", "512k", "1G") to bytes.
     *
     * Supports the following unit suffixes (case-insensitive):
     * - K (kilobytes)
     * - M (megabytes)
     * - G (gigabytes)
     *
     * If no unit is specified, the value is assumed to be in bytes.
     *
     * @param string|int $value The size value to convert (e.g., "2M", "1024").
     * @return int Size in bytes.
     */
    public static function convertSize($value)
    {
        $value = trim((string) $value);
        $unit = '';

        if (preg_match('#([\d\.]+)\s*([a-z]*)#i', $value, $matches)) {
            $value = floatval($matches[1]);
            $unit = strtolower(substr($matches[2], 0, 1));
        }

        switch ($unit) {
            case 'g':
                $value *= 1073741824; // 1024^3
                break;
            case 'm':
                $value *= 1048576; // 1024^2
                break;
            case 'k':
                $value *= 1024; // 1024^1
                break;
        }

        return (int) $value;
    }

    /**
     * Checks an upload for suspicious naming, potential PHP contents, valid image and HTML tags.
     */
    public static function isSafeFile($file)
    {
        // null byte check
        if (strstr($file['name'], "\x00")) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException('Invalid file: The file name contains a null byte.');
        }

        // check name for invalid extensions
        if (self::validateFileName($file['name']) === false) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException('Invalid file: The file name contains an invalid extension.');
        }

        // check file for <?php tags
        $fp = @fopen($file['tmp_name'], 'r');

        if ($fp !== false) {
            $data = '';

            while (!feof($fp)) {
                $data .= @fread($fp, 131072);
                // we can only reliably check for the full <?php tag here (short tags conflict with valid exif xml data), so users are reminded to disable short_open_tag
                if (stripos($data, '<?php') !== false) {
                    @unlink($file['tmp_name']);
                    throw new InvalidArgumentException('Invalid file: The file contains PHP code.');
                }

                // check for `__HALT_COMPILER()` phar stub
                if (stripos($data, '__HALT_COMPILER()') !== false) {
                    @unlink($file['tmp_name']);
                    throw new InvalidArgumentException('Invalid file: The file contains PHP code.');
                }

                $data = substr($data, -10);
            }

            fclose($fp);
        }

        // Get the file extension
        $extension = self::getExtension($file['name'], true);

        // Check if the file extension is a common image
        $isImage = in_array($extension, ['jpeg', 'jpg', 'jpe', 'png', 'apng', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'psd', 'ico', 'xcf', 'odg'], true);

        // validate image
        if ($isImage && @getimagesize($file['tmp_name']) === false) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException('Invalid file: The file is not a valid image.');
        }

        return true;
    }

    /**
     * Check file name for extensions.
     *
     * @param type $name
     *
     * @return bool
     */
    public static function validateFileName($name)
    {
        if (empty($name) && (string) $name !== "0") {
            return false;
        }

        // first character is a dot
        if ($name[0] === '.') {
            return false;
        }

        // lowercase it
        $name = strtolower($name);

        // remove multiple . characters
        $name = preg_replace('#(\.){2,}#', '.', $name);

        // list of invalid extensions
        $executable = array(
            'php',
            'php3',
            'php4',
            'php5',
            'php6',
            'php7',
            'phar',
            'js',
            'exe',
            'phtml',
            'java',
            'perl',
            'py',
            'asp',
            'dll',
            'go',
            'ade',
            'adp',
            'bat',
            'chm',
            'cmd',
            'com',
            'cpl',
            'hta',
            'ins',
            'isp',
            'jse',
            'lib',
            'mde',
            'msc',
            'msp',
            'mst',
            'pif',
            'scr',
            'sct',
            'shb',
            'sys',
            'vb',
            'vbe',
            'vbs',
            'vxd',
            'wsc',
            'wsf',
            'wsh',
            'svg',
        );

        // get file parts, eg: ['image', 'php', 'jpg']
        $parts = explode('.', $name);

        // remove extension
        array_pop($parts);

        // remove name
        array_shift($parts);

        // trim each $parts
        $parts = array_map('trim', $parts);

        // no extensions in file name
        if (empty($parts)) {
            return true;
        }

        // check for extension in file name, eg: image.php.jpg
        foreach ($executable as $extension) {
            if (in_array($extension, $parts)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Method to determine if an array is an associative array.
     *
     * @param    array        An array to test
     *
     * @return bool True if the array is an associative array
     *
     * @link    https://www.php.net/manual/en/function.is-array.php#84488
     */
    public static function is_associative_array($array)
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

    /**
     * Return a list of allowed file extensions in a specific format.
     *
     * @param string $format The desired format of the output ('map', 'array', 'list', 'json').
     * @param string $list String of file types to format.
     * @return mixed Formatted extension list.
     */
    public static function formatFileTypesList($format = 'map', $list = '')
    {
        $data = array();

        // Split the list into groups separated by ';'
        foreach (explode(';', $list) as $group) {
            // Exclude group if it starts with '-'
            if (strpos($group, '=') !== false && strpos($group, '-') === 0) {
                continue;
            }

            // Split the group into type and items parts
            $parts = explode('=', $group);
            // Get the extensions, e.g., "jpg,gif,png"
            $items = array_pop($parts);
            // Get the type if available, e.g., "images"
            $type = array_pop($parts);

            // Filter and map items, excluding any that start with '-'
            $items = array_filter(explode(',', $items), function ($item) {
                return substr(trim($item), 0, 1) !== '-';
            });

            // If no type is specified, handle as a flat list
            if (empty($type)) {
                $data = array_merge($data, $items);
            } else {
                // Create flattened array if format is 'array' or 'list'
                if ($format === 'array' || $format === 'list') {
                    $data = array_merge($data, array_map('strtolower', $items));
                } else {
                    // Create associative array, e.g., ["images" => ["jpg", "jpeg", "gif", "png"]]
                    if (!isset($data[$type])) {
                        $data[$type] = array();
                    }
                    $data[$type] = array_merge($data[$type], array_map('strtolower', $items));
                }
            }
        }

        // Return flattened list of extensions, e.g., "jpg,jpeg,png,gif"
        if ($format === 'list') {
            return implode(',', array_unique($data));
        }

        // Return JSON encoded list, e.g., {"images": ["jpg", "jpeg", "gif", "png"]}
        if ($format === 'json') {
            return json_encode($data);
        }

        // Return array, ensure uniqueness and maintain structure for 'map' format
        if ($format === 'array') {
            return array_unique($data);
        }

        // Default return associative array ('map' format)
        foreach ($data as $key => $value) {
            $data[$key] = array_unique($value);
        }

        return $data;
    }
}
