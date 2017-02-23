<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_WF_EXT') or die('RESTRICTED');

class WFLinkBrowser_Joomlalinks
{
    public $_option = array();
    public $_adapters = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($options = array())
    {
        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        $path = dirname(__FILE__).'/joomlalinks';

        // Get all files
        $files = JFolder::files($path, '\.(php)$');

        if (!empty($files)) {
            foreach ($files as $file) {
                $name = basename($file, '.php');

                // skip weblinks if it doesn't exist!
                if ($name === 'weblinks' && !is_file(JPATH_SITE.'/components/com_weblinks/helpers/route.php')) {
                    continue;
                }

                require_once $path.'/'.$file;

                $classname = 'Joomlalinks'.ucfirst($name);

                if (class_exists($classname)) {
                    $this->_adapters[] = new $classname();
                }
            }
        }
    }

    public function display()
    {
        // Load css
        $document = WFDocument::getInstance();
        $document->addStyleSheet(array('joomlalinks'), 'extensions/links/joomlalinks/css');
    }

    public function isEnabled()
    {
        $wf = WFEditorPlugin::getInstance();

        return $wf->checkAccess($wf->getName().'.links.joomlalinks.enable', 1);
    }

    public function getOption()
    {
        foreach ($this->_adapters as $adapter) {
            $this->_option[] = $adapter->getOption();
        }

        return $this->_option;
    }

    public function getList()
    {
        $list = '';

        foreach ($this->_adapters as $adapter) {
            $list .= $adapter->getList();
        }

        return $list;
    }

    public function getLinks($args)
    {
        foreach ($this->_adapters as $adapter) {
            if ($adapter->getOption() == $args->option) {
                return $adapter->getLinks($args);
            }
        }
    }
}
