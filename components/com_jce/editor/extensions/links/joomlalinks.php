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

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Filesystem\Folder;

class WFLinkBrowser_Joomlalinks
{
    public $_option = array();
    public $_adapters = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($options = array())
    {
        $wf = WFEditorPlugin::getInstance();

        $path = __DIR__ . '/joomlalinks';

        // Get all files
        $files = Folder::files($path, '\.(php)$');

        if (!empty($files)) {
            foreach ($files as $file) {
                $name = basename($file, '.php');

                if (!$this->checkOptionAccess($name)) {
                    continue;
                }

                // skip weblinks if it doesn't exist!
                if ($name == 'weblinks' && !ComponentHelper::isEnabled('com_weblinks')) {
                    continue;
                }

                require_once $path . '/' . $file;

                $classname = 'Joomlalinks' . ucfirst($name);

                if (class_exists($classname)) {
                    $this->_adapters[] = new $classname();
                }
            }
        }
    }

    protected function checkOptionAccess($option)
    {
        $wf = WFEditorPlugin::getInstance();

        $option = str_replace('com_', '', $option);

        if ($option === "contact") {
            $option = "contacts";
        }

        return (int) $wf->getParam('links.joomlalinks.' . $option, 1) === 1;
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
        return (bool) $wf->getParam('links.joomlalinks.enable', 1);
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
        $wf = WFEditorPlugin::getInstance();

        foreach ($this->_adapters as $adapter) {
            if ($adapter->getOption() == $args->option) {

                if (!$this->checkOptionAccess($args->option)) {
                    continue;
                }

                return $adapter->getLinks($args);
            }
        }
    }
}
