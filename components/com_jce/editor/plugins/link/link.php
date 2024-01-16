<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

// Link Plugin Controller
class WFLinkPlugin extends WFEditorPlugin
{
    protected $name = 'link';

    public $extensions = array();
    public $popups = array();
    public $tabs = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        parent::__construct();

        $this->getLinks();
        $this->getSearch('link');
    }

    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();
        $settings = $this->getSettings();

        $document->addScriptDeclaration('LinkDialog.settings=' . json_encode($settings) . ';');

        $tabs = WFTabs::getInstance(array(
            'base_path' => WF_EDITOR_PLUGIN,
        ));

        // Add tabs
        $tabs->addTab('link', 1, array('plugin' => $this));
        $tabs->addTab('advanced', $this->getParam('tabs_advanced', 1));

        // get and display links
        $links = $this->getLinks();
        $links->display();

        // get and display search
        $search = $this->getSearch('link');
        $search->display();

        // Load Popups instance
        $popups = WFPopupsExtension::getInstance(array(
            'text' => false,
            'default' => $this->getParam('link.popups.default', ''),
        ));

        $popups->display();

        // add link stylesheet
        $document->addStyleSheet(array('link'), 'plugins');
        // add link scripts last
        $document->addScript(array('link'), 'plugins');
    }

    public function getLinks()
    {
        static $links;

        if (!isset($links)) {
            $links = WFLinkExtension::getInstance();
        }

        return $links;
    }

    public function getSearch($type = 'link')
    {
        static $search;

        if (!isset($search)) {
            $search = array();
        }

        if (empty($search[$type])) {
            $search[$type] = WFSearchExtension::getInstance($type);
        }

        return $search[$type];
    }

    public function getSettings($settings = array())
    {
        $profile = $this->getProfile();

        $settings = array(
            'file_browser' => $this->getParam('file_browser', 1) && in_array('browser', explode(',', $profile->plugins)),
            'attributes' => array(
                'target' => $this->getParam('attributes_target', 1),
                'anchor' => $this->getParam('attributes_anchor', 1),
            ),
        );

        return parent::getSettings($settings);
    }
}
