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

use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Uri\Uri;

class WFPacker extends CMSObject
{
    const IMPORT_RX = '#@import.*?(?:\(([^\)]+)\);|(?:[\'"]([^\'"]+)[\'"]);)#i'; // match @import url('...'); or @import '...'; or @import "...";

    protected $files = array();
    protected $type = 'javascript';
    protected $text = '';
    protected $start = '';
    protected $end = '';
    protected static $imports = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        $this->setProperties($config);
    }

    public function setFiles($files = array())
    {
        $this->files = $files;
    }

    public function getFiles()
    {
        return $this->files;
    }

    public function setText($text = '')
    {
        $this->text = $text;
    }

    public function setContentStart($start = '')
    {
        $this->start = $start;
    }

    public function getContentStart()
    {
        return $this->start;
    }

    public function setContentEnd($end = '')
    {
        $this->end = $end;
    }

    public function getContentEnd()
    {
        return $this->end;
    }

    public function setType($type)
    {
        $this->type = $type;
    }

    public function getType()
    {
        return $this->type;
    }

    /**
     * Get encoding.
     *
     * @copyright Copyright (C) 2005 - 2010 Open Source Matters. All rights reserved
     */
    private static function getEncoding()
    {
        if (!isset($_SERVER['HTTP_ACCEPT_ENCODING'])) {
            return false;
        }

        $encoding = false;

        if (false !== strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip')) {
            $encoding = 'gzip';
        }

        if (false !== strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'x-gzip')) {
            $encoding = 'x-gzip';
        }

        return $encoding;
    }

    private function getEtag($hash)
    {
        if (strpos($hash, '"') !== 0) {
            $hash = '"' . $hash . '"';
        }

        return $hash;
    }

    /**
     * Pack and output content based on type.
     *
     * @param bool|true  $minify
     * @param bool|true $cache
     * @param bool|false $gzip
     * Contains some code from libraries/joomla/cache/controller/page.php - Copyright (C) 2005 - 2015 Open Source Matters, Inc. All rights reserved
     */
    public function pack($minify = true, $cache_validation = true, $gzip = false)
    {
        $type = $this->getType();

        ob_start();

        // Headers
        if ($type == 'javascript') {
            header('Content-type: application/javascript; charset: UTF-8');
        }

        if ($type == 'css') {
            header('Content-type: text/css; charset: UTF-8');
        }

        // encoding
        header('Vary: Accept-Encoding');

        // cache control
        header('Cache-Control: max-age=0,no-cache');

        $files = $this->getFiles();

        $content = $this->getContentStart();

        if (empty($files)) {
            $content .= $this->getText();
        } else {
            foreach ($files as $file) {
                $content .= $this->getText($file, $minify);
            }
        }

        if ($this->getType() == 'css') {
            // move external import rules to top
            foreach (array_unique(self::$imports) as $import) {
                if (strpos($import, '//') !== false) {
                    $content = '@import url("' . $import . '");' . $content;
                }
            }
        }

        $content .= $this->getContentEnd();

        // trim content
        $content = trim($content);

        // force browser caching using an E-tag
        if ($cache_validation) {
            // get content hash
            $hash = md5(implode(' ', array_map('basename', $files)) . $content);
            // create E-tag
            $etag = $this->getEtag($hash);
            // set etag header
            header('ETag: ' . $etag);

            // check for sent etag against hash
            if (!headers_sent() && isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
                $_etag = stripslashes($_SERVER['HTTP_IF_NONE_MATCH']);

                if ($_etag && $_etag === $etag) {
                    header('HTTP/1.x 304 Not Modified', true);
                    exit(ob_get_clean());
                }
            }
        }

        // Generate GZIP'd content
        if ($gzip) {
            $encoding = self::getEncoding();

            $zlib = function_exists('ini_get') && extension_loaded('zlib') && ini_get('zlib.output_compression');

            if (!empty($encoding) && !$zlib && function_exists('gzencode')) {
                header('Content-Encoding: ' . $encoding);
                $content = gzencode($content, 4, FORCE_GZIP);
            }
        }

        // stream to client
        echo $content;

        exit(ob_get_clean());
    }

    protected function jsmin($data)
    {
        // remove header comments
        return preg_replace('#^\/\*[\s\S]+?\*\/#', '', $data);
    }

    /**
     * Simple CSS Minifier
     * https://github.com/GaryJones/Simple-PHP-CSS-Minification.
     *
     * @param $data Data string to minify
     */
    protected function cssmin($css)
    {
        // Normalize whitespace
        //$css = preg_replace('/\s+/', ' ', $css);
        // Remove comment blocks, everything between /* and */, unless
        // preserved with /*! ... */
        //$css = preg_replace('/\/\*[^\!](.*?)\*\//', '', $css);
        // Remove space after , : ; { }
        //$css = preg_replace('/(,|:|;|\{|}) /', '$1', $css);
        // Remove space before , ; { }
        //$css = preg_replace('/ (,|;|\{|})/', '$1', $css);
        // Strips leading 0 on decimal values (converts 0.5px into .5px)
        //$css = preg_replace('/(:| )0\.([0-9]+)(%|em|ex|px|in|cm|mm|pt|pc)/i', '${1}.${2}${3}', $css);
        // Strips units if value is 0 (converts 0px to 0)
        //$css = preg_replace('/(:| )(\.?)0(%|em|ex|px|in|cm|mm|pt|pc)/i', '${1}0', $css);
        // Converts all zeros value into short-hand
        //$css = preg_replace('/0 0 0 0/', '0', $css);
        // Shortern 6-character hex color codes to 3-character where possible
        //$css = preg_replace('/#([a-f0-9])\\1([a-f0-9])\\2([a-f0-9])\\3/i', '#\1\2\3', $css);

        require_once __DIR__ . '/vendor/cssmin/cssmin.php';

        try {
            $css = CssMin::minify($css);
        } catch (Exception $e) {
        }

        return trim($css);
    }

    /**
     * Import CSS from a file.
     *
     * @param file File path where data comes from
     * @param $data Data from file
     */
    protected function importCss($data, $file)
    {
        if (preg_match_all(self::IMPORT_RX, $data, $matches)) {
            $data = '';

            foreach ($matches[1] as $match) {
                // clean up url
                $match = str_replace(array('url', '"', "'", '(', ')'), '', $match);
                // trim
                $match = trim($match);

                if ($match) {
                    // external url, skip it
                    if (strpos($match, '//') !== false) {
                        // add to imports list
                        self::$imports[] = $match;
                        continue;
                    }

                    // url has a query, remove
                    if (strpos($match, '?') !== false) {
                        $match = substr($match, 0, strpos($match, '?'));
                    }

                    if (strpos($match, '&') !== false) {
                        $match = substr($match, 0, strpos($match, '&'));
                    }

                    // get full path
                    $path = realpath($this->get('_cssbase') . '/' . $match);

                    // already import, don't repeat!
                    if (in_array($path, self::$imports)) {
                        continue;
                    }

                    // get data
                    $data .= $this->getText($path);
                }
            }

            return $data;
        }

        return '';
    }

    protected function compileLess($string, $path)
    {
        $less = new lessc();
        // add file directory
        $less->addImportDir($path);
        // add joomla media folder
        $less->addImportDir(JPATH_SITE . '/media');

        try {
            return $less->compile($string);
        } catch (Exception $e) {
            return '/* LESS file could not be compiled due to error - ' . $e->getMessage() . ' */';
        }
    }

    protected function getText($file = null, $minify = true)
    {
        if ($file && is_file($file)) {
            $text = file_get_contents($file);

            if ($text) {
                // process css files
                if ($this->getType() == 'css') {
                    // compile less files
                    if (preg_match('#\.less$#', $file)) {
                        $text = $this->compileLess($text, dirname($file));
                    }

                    if ($minify) {
                        // minify
                        $text = $this->cssmin($text, $file);
                    }

                    // add to imports list
                    self::$imports[] = $file;

                    if (strpos($text, '@import') !== false) {
                        // store the base path of the current file
                        $this->set('_cssbase', dirname($file));

                        // process import rules
                        $text = $this->importCss($text, $file) . preg_replace(self::IMPORT_RX, '', $text);
                    }

                    // store the base path of the current file
                    $this->set('_imgbase', dirname($file));

                    // process urls
                    $text = preg_replace_callback('#url\s?\([\'"]?([^\'"\))]+)[\'"]?\)#', array('WFPacker', 'processPaths'), $text);
                }
                // make sure text ends in a semi-colon;
                if ($this->getType() == 'javascript') {
                    $text = rtrim(trim($text), ';') . ';';

                    if ($minify) {
                        $text = $this->jsmin($text);
                    }
                }

                return $text;
            }
        }

        return $this->text;
    }

    protected function processPaths($data)
    {
        if (isset($data[1])) {
            if (strpos($data[1], '//') === false) {
                $path = parse_url($data[1], PHP_URL_PATH);

                if (empty($path)) {
                    $path = $data[1];
                }

                // get query, if any, eg: ?v=273
                $query = parse_url($data[1], PHP_URL_QUERY);

                if (empty($query)) {
                    $query = "";
                } else {
                    $query = "?" . $query;
                }

                $path = str_replace(JPATH_SITE, '', realpath($this->get('_imgbase') . '/' . $path));

                if ($path) {
                    return "url('" . Uri::root(true) . str_replace('\\', '/', $path) . $query . "')";
                }

                return "url('" . $data[1] . "')";
            }

            return $data[1];
        }

        return '';
    }
}
