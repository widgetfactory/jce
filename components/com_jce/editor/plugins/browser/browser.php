<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Uri\Uri;

class WFBrowserPlugin extends WFMediaManager
{
    /*
     * @var string
     */
    protected $_filetypes = 'doc,docx,dot,dotx,ppt,pps,pptx,ppsx,xls,xlsx,gif,jpeg,jpg,png,webp,apng,avif,pdf,zip,tar,gz,swf,rar,mov,mp4,m4a,flv,mkv,webm,ogg,ogv,qt,wmv,asx,asf,avi,wav,mp3,aiff,oga,odt,odg,odp,ods,odf,rtf,txt,csv';

    private function isMediaField()
    {
        $app = Factory::getApplication();
        return $app->input->getInt('standalone') && $app->input->getString('mediatype') && $app->input->getCmd('fieldid', $app->input->getCmd('element', ''));
    }

    /**
     * Get a parameter by key.
     *
     * @param string $key        Parameter key eg: editor.width
     * @param mixed  $fallback   Fallback value
     * @param mixed  $default    Default value
     * @param string $type       Variable type eg: string, boolean, integer, array
     *
     * @return mixed
     */
    public function getParam($key, $fallback = '', $default = '', $type = 'string')
    {
        $wf = WFApplication::getInstance();

        $value = parent::getParam($key, $fallback, $default, $type);

        // get all keys
        $keys = explode('.', $key);

        // get caller if any
        $caller = $this->get('caller');

        // create new namespaced key
        if ($caller && ($keys[0] === $caller || count($keys) == 1)) {
            // create new key
            $key = $caller . '.' . 'browser' . '.' . array_pop($keys);
            // get namespaced value, fallback to base parameter
            $value = $wf->getParam($key, $value, $default, $type);
        }

        return $value;
    }

    public function __construct($config = array())
    {
        $app = Factory::getApplication();

        $config = array(
            'layout' => 'browser',
            'can_edit_images' => 1,
            'show_view_mode' => 1,
        );

        parent::__construct($config);

        $browser = $this->getFileBrowser();

        // get mediatype from xml
        $mediatypes = $app->input->getString('mediatype', $app->input->getString('filter', 'files'));

        if ($mediatypes) {
            // add upload event
            $browser->addEvent('onUpload', array($this, 'onUpload'));

            // clean and lowercase filter value
            $mediatypes = (string) preg_replace('/[^\w_,]/i', '', strtolower($mediatypes));

            // get filetypes from params
            $filetypes = $this->getParam('extensions', $this->get('_filetypes'));

            // map to comma seperated list
            $filetypes = $browser->getFileTypes('list', $filetypes);

            $accept = explode(',', $filetypes);

            $map = array(
                'images' => array('jpg', 'jpeg', 'png', 'apng', 'gif', 'webp', 'avif'),
                'media' => array('avi', 'wmv', 'wm', 'asf', 'asx', 'wmx', 'wvx', 'mov', 'qt', 'mpg', 'mpeg', 'm4a', 'm4v', 'swf', 'dcr', 'rm', 'ra', 'ram', 'divx', 'mp4', 'ogv', 'ogg', 'webm', 'flv', 'f4v', 'mp3', 'ogg', 'wav', 'xap'),
                'documents' => array('doc', 'docx', 'odg', 'odp', 'ods', 'odt', 'pdf', 'ppt', 'pptx', 'txt', 'xcf', 'xls', 'xlsx', 'csv'),
                'html' => array('html', 'htm', 'txt', 'md'),
                'files' => $accept, // “files” == everything allowed
            );

            // add svg support to images if it is allowed in filetypes
            if (in_array('svg', $accept)) {
                $map['images'][] = 'svg';
            }

            // explode the mediatypes
            $mediatypes = explode(',', $mediatypes);

            // selected filetypes
            $selected = array();

            foreach ($mediatypes as $mediatype) {
                // trim the value
                $mediatype = trim($mediatype);

                // strtolower the value
                $mediatype = strtolower($mediatype);
                
                // mediaypes contains a mapped type
                if (array_key_exists($mediatype, $map)) {
                    // process the map to filter permitted extensions
                    array_walk($map, function (&$items, $key) use ($accept) {
                        $values = array_intersect($items, $accept);
                        $item = empty($values) ? '' : implode(',', $values);
                    });

                    $selected = $map[$mediatype];
                } else {
                    if (in_array($mediatype, $accept)) {
                        // add the mediatype to the selected filetypes
                        $selected[] = $mediatype;
                    }
                }
            }

            // remove duplicates
            $selected = array_values(array_unique($selected));

            // set updated filetypes
            $this->setFileTypes(implode(',', $selected));
        }

        $folder = $this->getMediaFolder();

        if ($folder) {
            // process any variables in the path
            $path = $browser->getFileSystem()->toRelative($folder, false);

            if ($browser->checkPathAccess($path)) {
                // set new path for browser
                $browser->set('source', $folder);
            }
        }
    }

    private function getMediaFolder()
    {
        $app = Factory::getApplication();

        $folder = $app->input->getPath('mediafolder', '');

        if ($folder) {
            // clean
            $folder = WFUtility::cleanPath($folder);

            // split by / and each part "safe"
            $parts = explode('/', $folder);

            foreach ($parts as $key => $part) {
                $parts[$key] = WFUtility::makeSafe($part);
            }

            // rejoin parts
            $folder = implode('/', $parts);

            // clean path again
            $folder = WFUtility::cleanPath($folder);

            // still intact after clean?
            if ($folder) {
                $browser = $this->getFileBrowser();

                // check this path is within an existing store
                $store = $browser->getDirectoryStoreFromPath($folder);

                if (!empty($store)) {
                    // check path exists
                    if ($browser->getFileSystem()->is_dir($folder)) {
                        return $folder;
                    }
                }
            }
        }

        return '';
    }

    /**
     * Normalize a Joomla Media Field path
     *
     * @param  string   $folder
     *
     * @return string
     */
    private function normalizeLocalJoomlaFolder($folder)
    {
        if (empty($folder)) {
            return '';
        }

        $folder = rawurldecode($folder);

        // shouldn't be an absoute URL so return empty string
        if (strpos($folder, '://') !== false) {
            return '';
        }

        // default scheme and path
        $scheme = 'local-images';
        $path = $folder;

        $pos = strpos($folder, ':');

        if ($pos !== false) {
            $scheme = substr($folder, 0, $pos);
            $path = trim(substr($folder, $pos + 1), " \t\n\r\0\x0B/");
        }

        $map = array(
            'local-images' => 'images',
            'local-files' => 'files',
        );

        // map the scheme to a root folder
        $root = isset($map[$scheme]) ? $map[$scheme] : 'images';

        // trim to remove slashes
        $path = trim($path, '/');

        // concatenate the path with the mapped folder
        $folder = $root . '/' . $path;

        // trim to remove slashes
        $folder = trim($folder, '/');

        return $folder;
    }

    /**
     * Update the File Browser configuration with the current media folder.
     *
     * @param array $config Configuration array to update.
     * @return array $config Updated configuration array.
     */
    protected function getFileBrowserConfig($config = array())
    {
        $app = Factory::getApplication();

        $config = parent::getFileBrowserConfig($config);

        // update folder path if a value is passed from a mediafield url
        if ($this->isMediaField()) {
            // get the mediafolder value from a JCE Media Field if any
            $folder = $app->input->getString('mediafolder', '');

            $folder = trim(rawurldecode($folder));

            $prefix = '';

            if (empty($config['dir'])) {
                $root = array('path' => '');
            } else {
                // get the first directory store prefix
                $prefix = key($config['dir']);
                // get the first directory store
                $root = reset($config['dir']);
            }

            if ($app->input->getInt('converted', 0) === 1) {
                // get the path from a converted media field
                $folder = $app->input->getString('path', $app->input->getString('folder', '')); // include "folder" for Joomla 3

                // normalize the folder path of Joomla Media Field, creating a local path, eg: local-images:/folder/subfolder => images/folder/subfolder
                $folder = $this->normalizeLocalJoomlaFolder($folder);

                if ($folder) {
                    $tmpPath = $folder . '/';

                    foreach ($config['dir'] as $key => $store) {
                        $base = trim($store['path'], '/');

                        // check if the folder is within any directory store path
                        if ($tmpPath === $base || strpos($tmpPath, $base . '/') === 0) {
                            $root['path'] = $tmpPath;
                            break;
                        }
                    }

                    // reset folder
                    $folder = '';
                }
            }

            $path = WFUtility::makePath($root['path'], $folder);
            $path = trim($path, '/');

            if (empty($prefix)) {
                $hash = md5($path);
            } else {
                $hash = $prefix;
            }

            $config['dir'] = array(
                $hash => array(
                    'label' => '',
                    'path' => $path,
                ),
            );
        }

        return $config;
    }

    public function setFileTypes($filetypes = '')
    {
        // get file browser reference
        $browser = $this->getFileBrowser();

        // set updated filetypes
        $browser->setFileTypes($filetypes);
    }

    /**
     * Display the plugin.
     */
    public function display()
    {
        parent::display();

        $app = Factory::getApplication();

        $document = WFDocument::getInstance();
        $slot = $app->input->getCmd('slot', 'plugin');

        // update some document variables
        $document->setName('browser');
        $document->setTitle(Text::_('WF_BROWSER_TITLE'));

        if ($document->get('standalone') == 1) {
            if ($slot === 'plugin') {
                $document->addScript(array('window.min'));

                $callback = $app->input->getCmd('callback', '');
                $element = $app->input->getCmd('fieldid', 'field-media-id');

                // Joomla 4 field variable not converted
                if ($element == 'field-media-id') {
                    $element = $app->input->getCmd('element', '');
                }

                $settings = array(
                    'site_url' => Uri::base(true) . '/',
                    'document_base_url' => Uri::root(),
                    'language' => WFLanguage::getCode(),
                    'element' => $element,
                    'token' => Session::getFormToken(),
                );

                if ($callback) {
                    $settings['callback'] = $callback;
                }

                $document->addScriptDeclaration('tinymce.settings=' . json_encode($settings) . ';');
            }

            $document->addScript(array('popup.min'), 'plugins');
            $document->addStyleSheet(array('browser.min'), 'plugins');
        }

        if ($slot === 'plugin') {
            $document->addScript(array('browser'), 'plugins');
        }
    }

    public function onUpload($file, $relative = '')
    {
        $app = Factory::getApplication();

        parent::onUpload($file, $relative);

        // inline upload
        if ($app->input->getInt('inline', 0) === 1) {
            $result = array(
                'file' => $relative,
                'name' => basename($file),
            );

            return $result;
        }

        return array();
    }
}
