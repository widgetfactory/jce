<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Editor\Link;

\defined('_JEXEC') or die;


// Link Plugin Controller
class Plugin extends \Wfe\Editor\Plugin\AbstractPlugin
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

        $this->getLinkAdapter();
    }

    public function display()
    {
        parent::display();

        $document = $this->getDocument();
        $settings = $this->getSettings();

        $document->addScriptDeclaration('LinkDialog.settings=' . json_encode($settings) . ';');

        $tabs = $this->getTabs();

        // Add tabs
        $tabs->addTab('link', 1, array(
            'plugin' => $this
        ));

        $tabs->addTab('advanced', $this->getParam('tabs_advanced', 1));

        // get and display links
        $this->getLinkAdapter()->display();

        // Load Popups instance
        $lightbox = new \Wfe\Adapter\LightboxAdapter($this, array(
            'text' => false,
            'default' => $this->getParam('link.popups.default', ''),
        ));

        $lightbox->display();

        // add link stylesheet
        $document->addStyleSheet(
            array('link'),
            'plugins'
        );

        // add link scripts last
        $document->addScript(
            array('link'),
            'plugins'
        );
    }

    public function getLinkAdapter()
    {
        static $adapter;

        if (!isset($adapter)) {
            $adapter = new \Wfe\Adapter\LinkAdapter($this);
        }

        return $adapter;
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
};
