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
use Joomla\CMS\Filesystem\Path;
use Joomla\CMS\Object\CMSObject;

class WFLanguageParser extends WFObject
{
    protected $mode = 'editor';
    protected $plugins = array();
    protected $sections = array();

    protected $language = 'en-GB';

    /**
     * Cache of processed data.
     *
     * @var array
     *
     * @since  11.1
     */
    protected static $cache = array();

    public function __construct($config = array())
    {
        if (array_key_exists('plugins', $config)) {
            $config['plugins'] = (array) $config['plugins'];
        }

        if (array_key_exists('sections', $config)) {
            $config['sections'] = (array) $config['sections'];
        }

        if (array_key_exists('language', $config)) {
            $config['language'] = $config['language'];
        }

        $this->setProperties($config);
    }

    /**
     * Parse an INI formatted string and convert it into an array.
     *
     * @param string $data             INI formatted string to convert
     * @param bool   $process_sections A boolean setting to process sections
     * @param array  $sections         An array of sections to include
     * @param mixed  $filter           A regular expression to filter sections by
     *
     * @return array Data array
     *
     * @since   2.4
     *
     * Based on JRegistryFormatINI::stringToObject
     *
     * @copyright   Copyright (C) 2005 - 2013 Open Source Matters, Inc. All rights reserved
     * @license     GNU General Public License version 2 or later; see LICENSE
     */
    protected static function ini_to_array($data, $process_sections = false, $sections = array(), $filter = '')
    {
        // Check the memory cache for already processed strings.
        $hash = md5($data . ':' . (int) $process_sections . ':' . serialize($sections) . ':' . $filter);

        if (isset(self::$cache[$hash])) {
            return self::$cache[$hash];
        }

        // If no lines present just return the array.
        if (empty($data)) {
            return array();
        }

        $array = array();
        $section = false;
        $lines = explode("\n", $data);

        // Process the lines.
        foreach ($lines as $line) {
            // Trim any unnecessary whitespace.
            $line = trim($line);

            // Ignore empty lines and comments.
            if (empty($line) || ($line[0] == ';')) {
                continue;
            }

            if ($process_sections) {
                $length = strlen($line);

                // If we are processing sections and the line is a section add the object and continue.
                if (($line[0] == '[') && ($line[$length - 1] == ']')) {
                    $section = substr($line, 1, $length - 2);

                    // filter section by regular expression
                    if ($filter) {
                        if (preg_match('#' . $filter . '#', $section)) {
                            continue;
                        }
                    }

                    // allow all sections
                    if (empty($sections)) {
                        $array[$section] = array();
                    } else {
                        if (in_array($section, $sections)) {
                            $array[$section] = array();
                        }
                    }

                    continue;
                }
            } elseif ($line[0] == '[') {
                continue;
            }

            // Check that an equal sign exists and is not the first character of the line.
            if (!strpos($line, '=')) {
                // Maybe throw exception?
                continue;
            }

            // Get the key and value for the line.
            list($key, $value) = explode('=', $line, 2);

            // Validate the key.
            if (preg_match('/[^A-Z0-9_]/i', $key)) {
                // Maybe throw exception?
                continue;
            }

            // If the value is quoted then we assume it is a string.
            $length = strlen($value);

            if ($length && ($value[0] == '"') && ($value[$length - 1] == '"')) {
                // Strip the quotes and Convert the new line characters.
                $value = stripcslashes(substr($value, 1, ($length - 2)));
                $value = str_replace(array("\n", "\r"), array('\n', '\r'), $value);
            } else {
                // If the value is not quoted, we assume it is not a string.
                // If the value is 'false' assume boolean false.
                if ($value == 'false') {
                    $value = false;
                }
                // If the value is 'true' assume boolean true.
                elseif ($value == 'true') {
                    $value = true;
                }
                // If the value is numeric than it is either a float or int.
                elseif (is_numeric($value)) {
                    // If there is a period then we assume a float.
                    if (strpos($value, '.') !== false) {
                        $value = (float) $value;
                    } else {
                        $value = (int) $value;
                    }
                }
            }

            // If a section is set add the key/value to the section, otherwise top level.
            if ($section) {
                $array[$section][$key] = $value;
            } else {
                $array[$key] = $value;
            }
        }

        // Cache the string
        self::$cache[$hash] = $array;

        return $array;
    }

    protected static function getOverrides()
    {
        // get the language file
        $language = Factory::getLanguage();
        // get language tag
        $tag = $language->getTag();

        $file = JPATH_SITE . '/language/overrides/' . $tag . '.override.ini';

        $ini = array();

        if (is_file($file)) {
            $content = @file_get_contents($file);

            if ($content && is_string($content)) {
                $ini = @parse_ini_string($content, true);
            }
        }

        return $ini;
    }

    protected static function filterSections($ini, $sections = array(), $filter = '')
    {
        if ($ini && is_array($ini)) {
            if (!empty($sections)) {
                $ini = array_intersect_key($ini, array_flip($sections));
            }

            // filter keys by regular expression
            if ($filter) {
                foreach (array_keys($ini) as $key) {
                    if (preg_match('#' . $filter . '#', $key)) {
                        unset($ini[$key]);
                    }
                }
            }
        }

        return $ini;
    }

    protected static function processLanguageINI($files, $sections = array(), $filter = '')
    {
        $data = array();

        foreach ((array) $files as $file) {
            if (!is_file($file)) {
                continue;
            }

            $ini = false;

            $content = @file_get_contents($file);

            if ($content && is_string($content)) {
                if (function_exists('parse_ini_string')) {
                    $ini = @parse_ini_string($content, true);
                    // filter
                    $ini = self::filterSections($ini, $sections, $filter);
                } else {
                    $ini = self::ini_to_array($content, true, $sections, $filter);
                }
            }

            // merge with data array
            if ($ini && is_array($ini)) {
                $data = array_merge($data, $ini);
            }
        }

        $output = '';

        // get overrides
        $overrides = self::getOverrides();

        if (!empty($data)) {
            $x = 0;

            foreach ($data as $key => $strings) {
                if (is_array($strings)) {
                    $output .= '"' . strtolower($key) . '":{';

                    $i = 0;

                    foreach ($strings as $k => $v) {
                        if (!empty($overrides) && array_key_exists(strtoupper($k), $overrides)) {
                            $v = $overrides[$k];
                        }

                        // remove "
                        $v = str_replace('"', '', $v);

                        if (is_numeric($v)) {
                            $v = (float) $v;
                        } else {
                            $v = '"' . $v . '"';
                        }

                        // key to lowercase
                        $k = strtolower($k);

                        // remove WF_
                        $k = str_replace('wf_', '', $k);

                        // remove "_dlg"
                        $key = preg_replace('#_dlg$#', '', $key);

                        // remove the section name
                        $k = preg_replace('#^' . $key . '(_dlg)?_#', '', $k);

                        // hex colours to uppercase and remove marker
                        if (strpos($k, 'hex_') !== false) {
                            $k = strtoupper(str_replace('hex_', '', $k));
                        }

                        // create key/value pair as JSON string
                        $output .= '"' . $k . '":' . $v . ',';

                        ++$i;
                    }
                    // remove last comma
                    $output = rtrim(trim($output), ',');

                    $output .= '},';

                    ++$x;
                }
            }
            // remove last comma
            $output = rtrim(trim($output), ',');
        }

        return $output;
    }

    private function getFilter()
    {
        return '';
    }

    public function load($files = array())
    {
        // get language tag
        $tag = $this->language;

        // base language path
        $path = JPATH_SITE . '/language/' . $tag;

        // if no file set
        if (empty($files)) {
            // Add English language
            $files[] = JPATH_SITE . '/language/en-GB/en-GB.com_jce.ini';

            // add pro language file
            $files[] = JPATH_SITE . '/language/en-GB/en-GB.com_jce_pro.ini';

            // non-english language
            if ($tag != 'en-GB') {
                if (is_dir($path)) {
                    $core = $path . '/' . $tag . '.com_jce.ini';
                    $pro = $path . '/' . $tag . '.com_jce_pro.ini';

                    if (is_file($core)) {
                        $files[] = $core;

                        if (is_file($pro)) {
                            $files[] = $pro;
                        }
                    } else {
                        $tag = 'en-GB';
                    }
                } else {
                    $tag = 'en-GB';
                }
            }

            $plugins = $this->get('plugins');

            if (!empty($plugins)) {
                foreach ($plugins['external'] as $name => $plugin) {
                    // rewrite name from plugin url
                    $name = basename(dirname($plugin));
                    $name = str_replace('plg_jce_', '', $name);

                    $filename = 'en-GB.plg_jce_' . $name . '.ini';

                    // add English file
                    $ini = Path::find(array(
                        JPATH_ADMINISTRATOR . '/language/en-GB',
                        JPATH_PLUGINS . '/jce/' . $name . '/language/en-GB'
                    ), $filename);

                    if ($ini) {
                        $files[] = $ini;
                    }

                    // non-english language
                    if ($tag != 'en-GB') {

                        $filename = $tag . '.plg_jce_' . $name . '.ini';

                        $ini = Path::find(array(
                            JPATH_ADMINISTRATOR . '/language/' . $tag,
                            JPATH_PLUGINS . '/jce/' . $name . '/language/' . $tag
                        ), $filename);

                        if ($ini) {
                            $files[] = $ini;
                        }
                    }
                }
            }
        }

        // shorten the tag, eg: en-GB -> en
        $tag = substr($tag, 0, strpos($tag, '-'));

        $sections = $this->get('sections');
        $filter = $this->getFilter();

        $data = self::processLanguageINI($files, $sections, $filter);

        // clean data
        $data = rtrim(trim($data), ',');

        return 'tinyMCE.addI18n({"' . $tag . '":{' . $data . '}});';
    }

    public function output($data)
    {
        if ($data) {
            ob_start();

            header('Content-type: application/javascript; charset: UTF-8');
            header('Vary: Accept-Encoding');

            // cache control
            header('Cache-Control: max-age=0,no-cache');

            // get content hash
            $hash = md5($data);

            // set etag header
            header('ETag: "' . $hash . '"');

            echo $data;

            exit(ob_get_clean());
        }
        exit();
    }
}
