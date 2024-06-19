<?php
/**
 * @package     JCE
 * @subpackage  Editor
*
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

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

    protected function getFileBrowserConfig($config = array())
    {
        $app = Factory::getApplication();

        $config = parent::getFileBrowserConfig($config);

        // update folder path if a value is passed from a mediafield url
        if ($this->isMediaField()) {
            $folder = $app->input->getString('mediafolder', '');

            if ($folder) {
                if (empty($config['dir'])) {
                    $config['dir'] = 'images';
                }

                $config['dir'] = WFUtility::makePath($config['dir'], trim(rawurldecode($folder)));
            }
        }

        return $config;
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
        $mediatype = $app->input->getString('mediatype', $app->input->getString('filter', 'files'));

        if ($mediatype) {
            // clean and lowercase filter value
            $mediatype = (string) preg_replace('/[^\w_,]/i', '', strtolower($mediatype));

            // get filetypes from params
            $filetypes = $this->getParam('extensions', $this->get('_filetypes'));

            // add upload event
            $browser->addEvent('onUpload', array($this, 'onUpload'));

            // map to comma seperated list
            $filetypes = $browser->getFileTypes('list', $filetypes);

            $map = array(
                'images' => 'jpg,jpeg,png,apng,gif,webp,avif',
                'media' => 'avi,wmv,wm,asf,asx,wmx,wvx,mov,qt,mpg,mpeg,m4a,m4v,swf,dcr,rm,ra,ram,divx,mp4,ogv,ogg,webm,flv,f4v,mp3,ogg,wav,xap',
                'documents' => 'doc,docx,odg,odp,ods,odt,pdf,ppt,pptx,txt,xcf,xls,xlsx,csv',
                'html' => 'html,htm,txt,md',
                'files' => $filetypes,
            );

            // add svg support to images if it is allowed in filetypes
            if (in_array('svg', explode(',', $filetypes))) {
                $map['images'] .= ',svg';
            }

            $accept = explode(',', $filetypes);

            if (array_key_exists($mediatype, $map)) {
                // process the map to filter permitted extensions
                array_walk($map, function (&$item, $key) use ($accept) {
                    $items = explode(',', $item);

                    $values = array_intersect($items, $accept);
                    $item = empty($values) ? '' : implode(',', $values);
                });

                $filetypes = $map[$mediatype];
            } else {
                $filetypes = implode(',', array_intersect(explode(',', $mediatype), $accept));
            }

            // set updated filetypes
            $this->setFileTypes($filetypes);
        }

        $folder = $app->input->getPath('folder', '');

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
            
            // still intact after clean?
            if ($folder) {
                $filesystem = $browser->getFileSystem();

                // check path exists
                if ($filesystem->is_dir($folder)) {
                    // process any variables in the path
                    $path = $filesystem->toRelative($folder, false);

                    if ($browser->checkPathAccess($path)) {
                        // set new path for browser
                        $browser->set('source', $folder);
                    }
                }
            }
        }
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
        parent::onUpload($file, $relative);

        $app = Factory::getApplication();

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
