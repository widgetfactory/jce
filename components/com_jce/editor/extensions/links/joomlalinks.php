<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\Filesystem\Folder;

class WFLinkBrowser_Joomlalinks
{
    public $_option = array();
    public $_adapters = array();

    /**
     * Constructs the link browser instance.
     *
     * @param array $options The options for the link browser.
     * 
     * @return void
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

    /**
     * Checks if the given option has access.
     *
     * @param string $option The option to check.
     * 
     * @return bool True if access is allowed, false otherwise.
     */
    protected function checkOptionAccess($option)
    {
        $wf = WFEditorPlugin::getInstance();

        $option = str_replace('com_', '', $option);

        if ($option === "contact") {
            $option = "contacts";
        }

        return (int) $wf->getParam('links.joomlalinks.' . $option, 1) === 1;
    }

    /**
     * Displays the link browser interface.
     *
     * @return void
     */
    public function display()
    {
        // Load css
        $document = WFDocument::getInstance();
        $document->addStyleSheet(array('joomlalinks'), 'extensions/links/joomlalinks/css');
    }

    /**
     * Checks if the link browser is enabled.
     *
     * @return boolean
     */
    public function isEnabled()
    {
        $wf = WFEditorPlugin::getInstance();
        return (bool) $wf->getParam('links.joomlalinks.enable', 1);
    }

    /**
     * Returns and adapter option, eg: com_content
     *
     * @return string Adapter option
     */
    public function getOption()
    {
        foreach ($this->_adapters as $adapter) {
            $this->_option[] = $adapter->getOption();
        }

        return $this->_option;
    }

    /**
     * Returns the list of available adapters.
     *
     * @return string HTML list of adapters.
     */
    public function getList()
    {
        $list = '';

        foreach ($this->_adapters as $adapter) {
            $list .= $adapter->getList();
        }

        return $list;
    }

    /**
     * Returns the links for the given adapter option.

     * @param object $args The arguments containing the option.
     * 
     * @return array The list of links.
     */
    public function getLinks($args)
    {
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
