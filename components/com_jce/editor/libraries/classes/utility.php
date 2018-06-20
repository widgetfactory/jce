<?php

/**
 * @copyright    Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license    GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

/* Set internal character encoding to UTF-8 */
if (function_exists('mb_internal_encoding')) {
    mb_internal_encoding("UTF-8");
}

abstract class WFUtility
{
    public static function getExtension($path)
    {
        return pathinfo($path, PATHINFO_EXTENSION);
    }

    public static function stripExtension($path)
    {
        return pathinfo($path, PATHINFO_FILENAME);
    }

    public static function cleanPath($path, $ds = DIRECTORY_SEPARATOR, $prefix = '')
    {
        $path = trim(rawurldecode($path));

        // check for UNC path on IIS and set prefix
        if ($ds == '\\' && $path[0] == '\\' && $path[1] == '\\') {
            $prefix = '\\';
        }
        // clean path, removing double slashes, replacing back/forward slashes with DIRECTORY_SEPARATOR
        $path = preg_replace('#[/\\\\]+#', $ds, $path);

        // return path with prefix if any
        return $prefix . $path;
    }

    /**
     * Append a DIRECTORY_SEPARATOR to the path if required.
     *
     * @param string $path the path
     * @param string $ds   optional directory seperator
     *
     * @return string path with trailing DIRECTORY_SEPARATOR
     */
    public static function fixPath($path, $ds = DIRECTORY_SEPARATOR)
    {
        return self::cleanPath($path . $ds);
    }

    private static function checkCharValue($string)
    {
        // null byte check
        if (strstr($string, "\x00")) {
            return false;
        }

        if (preg_match('#([^\w\.\-~\/\\\\\s ])#i', $string, $matches)) {
            foreach ($matches as $match) {
                // not a safe UTF-8 character
                if (ord($match) < 127) {
                    return false;
                }
            }
        }

        return true;
    }

    public static function checkPath($path)
    {
        $path = urldecode($path);

        if (self::checkCharValue($path) === false || strpos($path, '..') !== false) {
            throw new InvalidArgumentException('Invalid path');
        }
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
    public static function makePath($a, $b, $ds = DIRECTORY_SEPARATOR)
    {
        return self::cleanPath($a . $ds . $b, $ds);
    }

    private static function utf8_latin_to_ascii($subject)
    {
        static $CHARS = null;

        if (is_null($CHARS)) {
            $CHARS = array(
                'À' => 'A', 'Á' => 'A', 'Â' => 'A', 'Ã' => 'A', 'Ä' => 'A', 'Å' => 'A', 'Æ' => 'AE',
                'Ç' => 'C', 'È' => 'E', 'É' => 'E', 'Ê' => 'E', 'Ë' => 'E', 'Ì' => 'I', 'Í' => 'I', 'Î' => 'I', 'Ï' => 'I',
                'Ð' => 'D', 'Ñ' => 'N', 'Ò' => 'O', 'Ó' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ö' => 'O', 'Ø' => 'O',
                'Ù' => 'U', 'Ú' => 'U', 'Û' => 'U', 'Ü' => 'U', 'Ý' => 'Y', 'ß' => 's',
                'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a', 'æ' => 'ae',
                'ç' => 'c', 'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e', 'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
                'ñ' => 'n', 'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ø' => 'o', 'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
                'ý' => 'y', 'ÿ' => 'y', 'Ā' => 'A', 'ā' => 'a', 'Ă' => 'A', 'ă' => 'a', 'Ą' => 'A', 'ą' => 'a',
                'Ć' => 'C', 'ć' => 'c', 'Ĉ' => 'C', 'ĉ' => 'c', 'Ċ' => 'C', 'ċ' => 'c', 'Č' => 'C', 'č' => 'c', 'Ď' => 'D', 'ď' => 'd', 'Đ' => 'D', 'đ' => 'd',
                'Ē' => 'E', 'ē' => 'e', 'Ĕ' => 'E', 'ĕ' => 'e', 'Ė' => 'E', 'ė' => 'e', 'Ę' => 'E', 'ę' => 'e', 'Ě' => 'E', 'ě' => 'e',
                'Ĝ' => 'G', 'ĝ' => 'g', 'Ğ' => 'G', 'ğ' => 'g', 'Ġ' => 'G', 'ġ' => 'g', 'Ģ' => 'G', 'ģ' => 'g', 'Ĥ' => 'H', 'ĥ' => 'h', 'Ħ' => 'H', 'ħ' => 'h',
                'Ĩ' => 'I', 'ĩ' => 'i', 'Ī' => 'I', 'ī' => 'i', 'Ĭ' => 'I', 'ĭ' => 'i', 'Į' => 'I', 'į' => 'i', 'İ' => 'I', 'ı' => 'i',
                'Ĳ' => 'IJ', 'ĳ' => 'ij', 'Ĵ' => 'J', 'ĵ' => 'j', 'Ķ' => 'K', 'ķ' => 'k', 'Ĺ' => 'L', 'ĺ' => 'l', 'Ļ' => 'L', 'ļ' => 'l', 'Ľ' => 'L', 'ľ' => 'l', 'Ŀ' => 'L', 'ŀ' => 'l', 'Ł' => 'l', 'ł' => 'l',
                'Ń' => 'N', 'ń' => 'n', 'Ņ' => 'N', 'ņ' => 'n', 'Ň' => 'N', 'ň' => 'n', 'ŉ' => 'n', 'Ō' => 'O', 'ō' => 'o', 'Ŏ' => 'O', 'ŏ' => 'o', 'Ő' => 'O', 'ő' => 'o', 'Œ' => 'OE', 'œ' => 'oe',
                'Ŕ' => 'R', 'ŕ' => 'r', 'Ŗ' => 'R', 'ŗ' => 'r', 'Ř' => 'R', 'ř' => 'r', 'Ś' => 'S', 'ś' => 's', 'Ŝ' => 'S', 'ŝ' => 's', 'Ş' => 'S', 'ş' => 's', 'Š' => 'S', 'š' => 's',
                'Ţ' => 'T', 'ţ' => 't', 'Ť' => 'T', 'ť' => 't', 'Ŧ' => 'T', 'ŧ' => 't', 'Ũ' => 'U', 'ũ' => 'u', 'Ū' => 'U', 'ū' => 'u', 'Ŭ' => 'U', 'ŭ' => 'u', 'Ů' => 'U', 'ů' => 'u', 'Ű' => 'U', 'ű' => 'u', 'Ų' => 'U', 'ų' => 'u',
                'Ŵ' => 'W', 'ŵ' => 'w', 'Ŷ' => 'Y', 'ŷ' => 'y', 'Ÿ' => 'Y', 'Ź' => 'Z', 'ź' => 'z', 'Ż' => 'Z', 'ż' => 'z', 'Ž' => 'Z', 'ž' => 'z', 'ſ' => 's', 'ƒ' => 'f', 'Ơ' => 'O', 'ơ' => 'o', 'Ư' => 'U', 'ư' => 'u',
                'Ǎ' => 'A', 'ǎ' => 'a', 'Ǐ' => 'I', 'ǐ' => 'i', 'Ǒ' => 'O', 'ǒ' => 'o', 'Ǔ' => 'U', 'ǔ' => 'u', 'Ǖ' => 'U', 'ǖ' => 'u', 'Ǘ' => 'U', 'ǘ' => 'u', 'Ǚ' => 'U', 'ǚ' => 'u', 'Ǜ' => 'U', 'ǜ' => 'u',
                'Ǻ' => 'A', 'ǻ' => 'a', 'Ǽ' => 'AE', 'ǽ' => 'ae', 'Ǿ' => 'O', 'ǿ' => 'o',
            );
        }

        if (function_exists('transliterator_transliterate')) {
            if (is_array($subject)) {
                /*array_walk($subject, function (&$string) {
                    $string = WFUtility::utf8_latin_to_ascii($string);
                });*/

                for($i = 0; $i < count($subject); $i++) {
                    $subject[$i] = WFUtility::utf8_latin_to_ascii($subject[$i]);
                }

                return $subject;
            }

            $transformed = transliterator_transliterate('Any-Latin; Latin-ASCII;', $subject);

            if ($transformed !== false) {
                return $transformed;
            }

            return str_replace(array_keys($CHARS), array_values($CHARS), $subject);
        }

        return str_replace(array_keys($CHARS), array_values($CHARS), $subject);
    }

    protected static function changeCase($string, $case)
    {
        if (!function_exists('mb_strtolower') || !function_exists('mb_strtoupper')) {
            return $string;
        }

        if (is_array($string)) {
            for($i = 0; $i < count($string); $i++) {
                $string[$i] = WFUtility::changeCase($string[$i], $case);
            }
        } else {
            switch ($case) {
                case 'lowercase' :
                    $string = mb_strtolower($string);
                    break;
                case 'uppercase' :
                    $string = mb_strtoupper($string);
                    break;
            }
        }

        return $string;
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

        if (!function_exists('mb_internal_encoding')) {
            $mode = 'ascii';
        }

        // trim
        if (is_array($subject)) {
            $subject = array_map('trim', $subject);
        }
        else {
            $subject = trim($subject);
        }

        // replace spaces with specified character or space
        $subject = preg_replace('#[\s ]+#', $spaces, $subject);

        switch ($mode) {
            default :
            case 'utf-8' :
                $search[] = '#[^a-zA-Z0-9_\.\-~\p{L}\p{N}\s ]#u';
                $mode = 'utf-8';
                break;
            case 'ascii' :
                $subject = self::utf8_latin_to_ascii($subject);
                $search[] = '#[^a-zA-Z0-9_\.\-~\s ]#';
                break;
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
     * Format the file size, limits to Mb.
     *
     * @param int $size the raw filesize
     *
     * @return string formated file size
     */
    public static function formatSize($size)
    {
        if ($size < 1024) {
            return $size . ' ' . WFText::_('WF_LABEL_BYTES');
        }
        elseif ($size >= 1024 && $size < 1024 * 1024) {
            return sprintf('%01.2f', $size / 1024.0) . ' ' . WFText::_('WF_LABEL_KB');
        }
        else {
            return sprintf('%01.2f', $size / (1024.0 * 1024)) . ' ' . WFText::_('WF_LABEL_MB');
        }
    }

    /**
     * Format the date.
     *
     * @param int $date the unix datestamp
     *
     * @return string formated date
     */
    public static function formatDate($date, $format = '%d/%m/%Y, %H:%M')
    {
        return strftime($format, $date);
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

    public static function convertEncoding($string)
    {
        if (!function_exists('mb_detect_encoding')) {
            // From http://w3.org/International/questions/qa-forms-utf-8.html
            $isUTF8 = preg_match('%^(?:
	              [\x09\x0A\x0D\x20-\x7E]          	 # ASCII
	            | [\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
	            |  \xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs
	            | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}  # straight 3-byte
	            |  \xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates
	            |  \xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3
	            | [\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15
	            |  \xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16
	        )*$%xs', $string);

            if (!$isUTF8) {
                return utf8_encode($string);
            }

            return $string;
        }

        // get encoding
        $encoding = mb_detect_encoding($string, "auto", true);

        // return existing string if it is already utf-8
        if ($encoding === 'UTF-8') {
            return $string;
        }

        // invalid encoding, so make a "safe" string
        if ($encoding === false) {
            return preg_replace('#[^a-zA-Z0-9_\.\-~\s ]#', '', $string);
        }

        // convert to utf-8 and return
        return mb_convert_encoding($string, 'UTF-8', $encoding);
    }

    public static function isUtf8($string)
    {
        if (!function_exists('mb_detect_encoding')) {
            // From http://w3.org/International/questions/qa-forms-utf-8.html
            return preg_match('%^(?:
	              [\x09\x0A\x0D\x20-\x7E]          	 # ASCII
	            | [\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
	            |  \xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs
	            | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}  # straight 3-byte
	            |  \xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates
	            |  \xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3
	            | [\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15
	            |  \xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16
	        )*$%xs', $string);
        }

        return mb_detect_encoding($string, 'UTF-8', true);
    }

    /**
     * Convert size value to bytes.
     */
    public static function convertSize($value)
    {
        $unit = '';

        preg_match('#([0-9]+)\s?([a-z]*)#i', $value, $matches);

        if (isset($matches[1])) {
            $value = (int)$matches[1];
        }

        if (isset($matches[2])) {
            $unit = $matches[2];
        }

        // Convert to bytes
        switch (strtolower($unit)) {
            case 'g' :
                $value = intval($value) * 1073741824;
                break;
            case 'm' :
                $value = intval($value) * 1048576;
                break;
            case 'k' :
                $value = intval($value) * 1024;
                break;
        }

        return $value;
    }

    /**
     * Checks an upload for suspicious naming, potential PHP contents, valid image and HTML tags.
     */
    public static function isSafeFile($file)
    {
        // null byte check
        if (strstr($file['name'], "\x00")) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException('The file name contains a null byte.');
        }

        // check name for invalid extensions
        if (self::validateFileName($file['name']) !== true) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException('The file name contains an invalid extension.');
        }

        $isImage = preg_match('#\.(jpeg|jpg|jpe|png|gif|wbmp|bmp|tiff|tif|webp|psd|swc|iff|jpc|jp2|jpx|jb2|xbm|ico|xcf|odg)$#i', $file['name']);

        // check file for <?php tags
        $fp = @fopen($file['tmp_name'], 'r');

        if ($fp !== false) {
            $data = '';

            while (!feof($fp)) {
                $data .= @fread($fp, 131072);
                // we can only reliably check for the full <?php tag here (short tags conflict with valid exif xml data), so users are reminded to disable short_open_tag
                if (stristr($data, '<?php')) {
                    @unlink($file['tmp_name']);
                    throw new InvalidArgumentException('The file contains PHP code.');
                }

                $data = substr($data, -10);
            }

            fclose($fp);
        }

        // validate image
        if ($isImage && @getimagesize($file['tmp_name']) === false) {
            @unlink($file['tmp_name']);
            throw new InvalidArgumentException('The file is not a valid image.');
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

        // list of invalid extensions
        $executable = array(
            'php', 'php3', 'php4', 'php5', 'js', 'exe', 'phtml', 'java', 'perl', 'py', 'asp', 'dll', 'go', 'ade', 'adp', 'bat', 'chm', 'cmd', 'com', 'cpl', 'hta', 'ins', 'isp',
            'jse', 'lib', 'mde', 'msc', 'msp', 'mst', 'pif', 'scr', 'sct', 'shb', 'sys', 'vb', 'vbe', 'vbs', 'vxd', 'wsc', 'wsf', 'wsh',
        );
        // get file parts, eg: ['image', 'jpg']
        $parts = explode('.', $name);
        // reverse so that name is last array item
        $parts = array_reverse($parts);
        // remove name
        array_pop($parts);
        // lowercase it
        array_map('strtolower', $parts);

        // check for extension in file name, eg: image.php.jpg or as extension, eg: image.php
        foreach ($executable as $ext) {
            if (in_array($ext, $parts)) {
                return false;
            }
        }

        return true;
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
     *
     * @return array
     *
     * @author Daniel <daniel (at) danielsmedegaardbuus (dot) dk>
     * @author Gabriel Sobrinho <gabriel (dot) sobrinho (at) gmail (dot) com>
     */
    public static function array_merge_recursive_distinct(array &$array1, array &$array2)
    {
        $merged = $array1;

        foreach ($array2 as $key => &$value) {
            if (is_array($value) && isset($merged[$key]) && is_array($merged[$key])) {
                $merged[$key] = self::array_merge_recursive_distinct($merged[$key], $value);
            }
            else {
                $merged[$key] = $value;
            }
        }

        return $merged;
    }
}
