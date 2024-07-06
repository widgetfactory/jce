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
use Joomla\CMS\Session\Session;
use Joomla\CMS\Uri\Uri;

class WFDocument extends CMSObject
{
    /**
     * Array of linked scripts.
     *
     * @var array
     */
    private $scripts = array();

    /**
     * Array of scripts placed in the header.
     *
     * @var array
     */
    private $script = array();

    /**
     * Array of linked style sheets.
     *
     * @var array
     */
    private $styles = array();

    /**
     * Array of head items.
     *
     * @var array
     */
    private $head = array();

    /**
     * Body content.
     *
     * @var array
     */
    private $body = '';

    /**
     * Document title.
     *
     * @var string
     */
    public $title = '';

    /**
     * Contains the document language setting.
     *
     * @var string
     */
    public $language = 'en-gb';

    /**
     * Contains the document direction setting.
     *
     * @var string
     */
    public $direction = 'ltr';

    private static $queryMap = array(
        'imgmanager' => 'image',
        'imgmanager_ext' => 'imagepro',
    );

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        parent::__construct();

        // set document title
        if (isset($config['title'])) {
            $this->setTitle($config['title']);
        }

        $this->setProperties($config);
    }

    /**
     * Returns a reference to a WFDocument object.
     *
     * This method must be invoked as:
     *    <pre>  $document = WFDocument::getInstance();</pre>
     *
     * @return object WFDocument
     */
    public static function getInstance($config = array())
    {
        static $instance;

        if (!is_object($instance)) {
            $instance = new self($config);
        }

        return $instance;
    }

    /**
     * Set the document title.
     *
     * @param string $title
     */
    public function setTitle($title)
    {
        $this->title = $title;
    }

    /**
     * Get the document title.
     *
     * @return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * Set the document name.
     *
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * Get the document name.
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get the editor URL.
     *
     * @param bool $relative
     *
     * @return string
     */
    private function getURL($relative = false)
    {
        if ($relative) {
            return Uri::root(true) . '/media/com_jce/editor';
        }

        return Uri::root() . 'media/com_jce/editor';
    }

    /**
     * Sets the global document language declaration. Default is English (en-gb).
     *
     * @param string $lang
     */
    public function setLanguage($lang = 'en-gb')
    {
        $this->language = strtolower($lang);
    }

    /**
     * Returns the document language.
     *
     * @return string
     */
    public function getLanguage()
    {
        return $this->language;
    }

    /**
     * Sets the global document direction declaration. Default is left-to-right (ltr).
     *
     * @param string $lang
     */
    public function setDirection($dir = 'ltr')
    {
        $this->direction = strtolower($dir);
    }

    /**
     * Returns the document language.
     *
     * @return string
     */
    public function getDirection()
    {
        return $this->direction;
    }

    /**
     * Returns a JCE resource url.
     *
     * @param     string  The path to resolve eg: libaries
     * @param     bool Create a relative url
     *
     * @return full url
     */
    private function getBaseURL($path, $type = '')
    {
        static $url;

        if (!isset($url)) {
            $url = array();
        }

        $signature = serialize(array($type, $path));

        // Check if value is already stored
        if (!isset($url[$signature])) {
            // get the plugin name using this document instance
            $plugin = $this->get('name');

            $base = $this->getURL(true) . '/';

            $parts = explode('.', $path);
            $path = array_shift($parts);

            switch ($path) {
                // JCE root folder
                case 'jce':
                    $pre = $base . '';
                    break;
                // JCE libraries resource folder
                case 'media':
                    $pre = $base . '/' . $type;
                    break;
                case 'pro':
                    $pre = Uri::root(true) . '/media/plg_system_jcepro/editor/';
                    break;
                case 'jquery':
                    $pre = $base . 'vendor/jquery/' . $type;
                    break;
                // TinyMCE folder
                case 'tinymce':
                    $pre = $base . 'tinymce';
                    break;
                // Tinymce plugins folder
                case 'plugins':
                    $pre = $base . 'tinymce/plugins/' . $plugin . '/' . $type;
                    break;
                // Extensions folder
                case 'extensions':
                    $pre = $base . 'extensions';
                    break;
                case 'joomla':
                    return Uri::root(true);
                    break;
                case 'component':
                    $pre = Uri::root(true) . '/media/com_jce/admin/' . $type;
                    break;
                default:
                    $pre = $base . $path;
                    break;
            }

            if (count($parts)) {
                $pre = rtrim($pre, '/') . '/' . implode('/', $parts);
            }

            // Store url
            $url[$signature] = $pre;
        }

        return $url[$signature];
    }

    /**
     * Convert a url to path.
     *
     * @param string $url
     *
     * @return string
     */
    private function urlToPath($url)
    {
        $root = Uri::root(true);

        // remove root from url
        if (!empty($root)) {
            $url = substr($url, strlen($root));
        }

        return WFUtility::makePath(JPATH_SITE, Path::clean($url));
    }

    /**
     * Returns an image url.
     *
     * @param string  The file to load including path and extension eg: libaries.image.gif
     *
     * @return Image url
     *
     * @since 1.5
     */
    public function image($image, $root = 'media')
    {
        $parts = explode('.', $image);
        $parts = preg_replace('#[^A-Z0-9-_]#i', '', $parts);

        $ext = array_pop($parts);
        $name = trim(array_pop($parts), '/');

        $parts[] = 'img';
        $parts[] = $name . '.' . $ext;

        return $this->getBaseURL($root) . implode('/', $parts);
    }

    public function removeScript($file, $root = 'media')
    {
        $file = $this->buildScriptPath($file, $root);
        unset($this->scripts[$file]);
    }

    public function removeCss($file, $root = 'media')
    {
        $file = $this->buildStylePath($file, $root);
        unset($this->styles[$file]);
    }

    public function buildScriptPath($file, $root)
    {
        $file = preg_replace('#[^A-Z0-9-_\/\.]#i', '', $file);
        // get base dir
        $base = dirname($file);
        // remove extension if present
        $file = basename($file, '.js');
        // strip . and trailing /
        $file = trim(trim($base, '.'), '/') . '/' . $file . '.js';
        // remove leading and trailing slashes
        $file = trim($file, '/');
        // create path
        $file = $this->getBaseURL($root, 'js') . '/' . $file;
        // remove duplicate slashes
        $file = preg_replace('#[/\\\\]+#', '/', $file);

        return $file;
    }

    public function buildStylePath($file, $root)
    {
        $file = preg_replace('#[^A-Z0-9-_\/\.]#i', '', $file);
        // get base dir
        $base = dirname($file);
        // remove extension if present
        $file = basename($file, '.css');
        // strip . and trailing /
        $file = trim(trim($base, '.'), '/') . '/' . $file . '.css';
        // remove leading and trailing slashes
        $file = trim($file, '/');
        // create path
        $file = $this->getBaseURL($root, 'css') . '/' . $file;
        // remove duplicate slashes
        $file = preg_replace('#[/\\\\]+#', '/', $file);

        return $file;
    }

    /**
     * Loads a javascript file.
     *
     * @param string  The file to load including path eg: libaries.manager
     * @param bool Debug mode load src file
     *
     * @return echo script html
     *
     * @since 1.5
     */
    public function addScript($files, $root = 'media', $type = 'text/javascript')
    {
        $files = (array) $files;

        foreach ($files as $file) {
            // external link
            if (strpos($file, '://') !== false || strpos($file, 'index.php?option=com_jce') !== false) {
                $this->scripts[$file] = $type;
            } else {
                $file = $this->buildScriptPath($file, $root);
                // store path
                $this->scripts[$file] = $type;
            }
        }
    }

    /**
     * Loads a css file.
     *
     * @param string The file to load including path eg: libaries.manager
     * @param string Root folder
     *
     * @return echo css html
     *
     * @since 1.5
     */
    public function addStyleSheet($files, $root = 'media', $type = 'text/css')
    {
        $files = (array) $files;

        foreach ($files as $file) {
            $url = $this->buildStylePath($file, $root);
            // store path
            $this->styles[$url] = $type;
        }
    }

    public function addScriptDeclaration($content, $type = 'text/javascript')
    {
        if (!isset($this->script[strtolower($type)])) {
            $this->script[strtolower($type)] = $content;
        } else {
            $this->script[strtolower($type)] .= chr(13) . $content;
        }
    }

    private function getScriptDeclarations()
    {
        return $this->script;
    }

    private function getScripts()
    {
        return $this->scripts;
    }

    private function getStyleSheets()
    {
        return $this->styles;
    }

    /**
     * Setup head data.
     */
    private function setHead($data)
    {
        if (is_array($data)) {
            $this->head = array_merge($this->head, $data);
        } else {
            $this->head[] = $data;
        }
    }

    public function getQueryString($query = array())
    {
        $app = Factory::getApplication();

        // get plugin name and assign to query
        $name = $this->get('name');

        // re-map plugin name
        if (array_key_exists($name, self::$queryMap)) {
            $name = self::$queryMap[$name];
        }

        $query['plugin'] = $name;

        // set slot
        $query['slot'] = $app->input->getCmd('slot');

        // set standalone mode (for File Browser etc)
        $query['standalone'] = $this->get('standalone', 0);

        // set context id
        $query['context'] = $app->input->getInt('context', 0);

        // get profile custom query variables
        $query['profile_custom'] = $app->input->get('profile_custom', array(), 'array');

        // get token
        $token = Session::getFormToken();

        // set token
        $query[$token] = 1;

        // filter out empty values from the $query array
        $query = array_filter($query, function ($value) {
            return !empty($value);
        });

       return http_build_query($query);
    }

    private function getHash($files)
    {
        $seed = '';
        $hash = '';

        // cast as array
        $files = (array) $files;

        foreach ($files as $file) {

            // only add stamp to static stylesheets
            if (strpos($file, '://') === false && strpos($file, 'index.php?option=com_jce') === false) {
                $seed .= basename($file);
            }
        }

        if ($seed) {
            $hash = md5(WF_VERSION . $seed);
        }

        return $hash;
    }

    /**
     * Render document head data.
     */
    private function getHead()
    {
        // set title
        $output = '<title>' . $this->getTitle() . '</title>' . "\n";

        // render stylesheets
        if ($this->get('compress_css', 0)) {
            $file = Uri::base(true) . '/index.php?option=com_jce&' . $this->getQueryString(array('task' => 'plugin.pack', 'type' => 'css'));
            // add hash
            $file .= '&' . $this->getHash(array_keys($this->styles));

            $output .= "\t\t<link href=\"" . $file . "\" rel=\"stylesheet\" type=\"text/css\" />\n";
        } else {
            foreach ($this->styles as $src => $type) {
                $hash = $this->getHash($src);

                // only add stamp to static stylesheets
                if (!empty($hash)) {
                    $hash = strpos($src, '?') === false ? '?' . $hash : '&' . $hash;
                }

                $output .= "\t\t<link href=\"" . $src . $hash . '" rel="stylesheet" type="' . $type . "\" />\n";
            }
        }

        // Render scripts
        if ($this->get('compress_javascript', 0)) {
            $script = Uri::base(true) . '/index.php?option=com_jce&' . $this->getQueryString(array('task' => 'plugin.pack'));
            // add hash
            $script .= '&' . $this->getHash(array_keys($this->scripts));

            $output .= "\t\t<script data-cfasync=\"false\" type=\"text/javascript\" src=\"" . $script . "\"></script>\n";
        } else {
            foreach ($this->scripts as $src => $type) {
                $hash = $this->getHash($src);

                // only add stamp to static stylesheets
                if (!empty($hash)) {
                    $hash = strpos($src, '?') === false ? '?' . $hash : '&' . $hash;
                }

                $output .= "\t\t<script data-cfasync=\"false\" type=\"" . $type . '" src="' . $src . $hash . "\"></script>\n";
            }
        }

        // Script declarations
        foreach ($this->script as $type => $content) {
            $output .= "\t\t<script data-cfasync=\"false\" type=\"" . $type . '">' . $content . '</script>';
        }

        // Other head data
        foreach ($this->head as $head) {
            $output .= "\t" . $head . "\n";
        }

        return $output;
    }

    public function setBody($data = '')
    {
        $this->body = $data;
    }

    private function getBody()
    {
        return $this->body;
    }

    private function loadData()
    {
        //get the file content
        ob_start();
        require_once WF_EDITOR_LIBRARIES . '/views/plugin/index.php';
        $data = ob_get_contents();
        ob_end_clean();

        return $data;
    }

    /**
     * Render the document.
     */
    public function render()
    {
        // assign language
        $this->language = $this->getLanguage();
        $this->direction = $this->getDirection();

        // load template data
        $output = $this->loadData();
        $output = $this->parseData($output);

        exit($output);
    }

    private function parseData($data)
    {
        $data = preg_replace_callback('#<!-- \[head\] -->#', array($this, 'getHead'), $data);
        $data = preg_replace_callback('#<!-- \[body\] -->#', array($this, 'getBody'), $data);

        return $data;
    }

    /**
     * pack function for plugins.
     */
    public function pack($minify = true, $gzip = false)
    {
        $app = Factory::getApplication();

        if ($app->input->getCmd('task') == 'pack') {

            // check token
            Session::checkToken('get') or jexit();

            $type = $app->input->getWord('type', 'javascript');

            // create packer
            $packer = new WFPacker(array('type' => $type));

            $files = array();

            switch ($type) {
                case 'javascript':
                    $data = '';

                    foreach ($this->getScripts() as $src => $type) {
                        if (strpos($src, '://') === false && strpos($src, 'index.php') === false) {
                            $src .= preg_match('/\.js$/', $src) ? '' : '.js';

                            $files[] = $this->urlToPath($src);
                        }
                    }

                    // parse ini language files
                    $parser = new WFLanguageParser(array(
                        'plugins' => array('core' => array($this->getName()), 'external' => array()),
                        'sections' => array('dlg', $this->getName() . '_dlg'),
                        'mode' => 'plugin',
                        'language' => WFLanguage::getTag(),
                    ));

                    $data .= $parser->load();

                    // add script declarations
                    /*foreach ($this->getScriptDeclarations() as $script) {
                    $data .= $script;
                    }*/

                    $packer->setContentEnd($data);

                    break;
                case 'css':
                    foreach ($this->getStyleSheets() as $style => $type) {
                        if (strpos($style, '://') === false && strpos($style, 'index.php') === false) {
                            $style .= preg_match('/\.css$/', $style) ? '' : '.css';

                            $files[] = $this->urlToPath($style);
                        }
                    }

                    break;
            }

            $packer->setFiles($files);
            $packer->pack($minify, $gzip);
        }
    }
}
