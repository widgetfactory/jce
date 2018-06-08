<?php

/**
 * @copyright     Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

require_once WF_EDITOR_LIBRARIES.'/classes/manager.php';

class WFFileBrowserPlugin extends WFMediaManager
{
    /*
     * @var string
     */
    protected $_filetypes = 'doc,docx,ppt,pps,pptx,ppsx,xls,xlsx,gif,jpeg,jpg,png,pdf,zip,tar,gz,swf,rar,mov,mp4,qt,wmv,asx,asf,avi,wav,mp3,aiff,odt,odg,odp,ods,odf,rtf,txt,csv';

    public function __construct($config = array())
    {
        $config = array(
            'layout' => 'browser',
            'can_edit_images' => 1,
            'show_view_mode' => 1,
        );

        parent::__construct($config);

        // get the plugin that opened the file browser
        $caller = $this->get('caller', 'browser');

        // get mediatype from xml
        $mediatype = JRequest::getVar('mediatype', JRequest::getVar('filter', 'files'));

        // clean filter value
        $mediatype = (string) preg_replace('/[^\w_,]/i', '', $mediatype);

        // get filetypes from params
        $filetypes = $this->getParam('browser.extensions', $this->get('_filetypes'));

        $map = array(
            "images" => "jpg,jpeg,png,gif",
            "media"  => "avi,wmv,wm,asf,asx,wmx,wvx,mov,qt,mpg,mpeg,m4a,m4v,swf,dcr,rm,ra,ram,divx,mp4,ogv,ogg,webm,flv,f4v,mp3,ogg,wav,xap",
            "html"   => "html,htm,txt",
            "files"  => $filetypes
        );

        // add svg support to images if it is allowed in filetypes
        if (in_array('svg', explode(",", $filetypes))) {
            $map['images'] = "jpg,jpeg,png,gif,svg";
        }

        if (array_key_exists($mediatype, $map)) {
            $filetypes = $map[$mediatype];
        } else {
            $filetypes = $mediatype;
        }

        // set filetypes
        $this->setFileTypes($filetypes);

        $browser = $this->getFileBrowser();
        
        $upload = $browser->get('upload', array());
        $upload['filetypes'] = $browser->getFileTypes('list', $filetypes);
        
        $browser->setProperties(array('upload' => $upload));
    }

    /**
     * Display the plugin.
     */
    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();
        $layout = JRequest::getCmd('layout', 'plugin');

        if ($document->get('standalone') == 1) {
            if ($layout === 'plugin') {
                $document->addScript(array('window.min'), 'plugins');

                $element = JRequest::getCmd('element', JRequest::getCmd('fieldid', ''));
                $callback = JRequest::getCmd('callback', '');

                $settings = array(
                    'site_url' => JURI::base(true).'/',
                    'language' => WFLanguage::getCode(),
                    'element' => $element,
                    'token' => WFToken::getToken(),
                );

                if ($callback) {
                    $settings['callback'] = $callback;
                }

                $document->addScriptDeclaration('tinymce.settings='.json_encode($settings).';');
            }

            $document->addScript(array('popup.min'), 'plugins');
            $document->addStyleSheet(array('browser.min'), 'plugins');
        }

        if ($layout === 'plugin') {
            $document->addScript(array('browser'), 'plugins');
        }
    }
}
