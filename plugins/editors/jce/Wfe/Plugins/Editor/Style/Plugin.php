<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Style;

\defined('_JEXEC') or die;


class Plugin extends \Wfe\Editor\Plugin\AbstractPlugin
{
    public function __construct()
    {
        parent::__construct(array('colorpicker' => true));
    }

    /**
     * Display the plugin.
     */
    public function display()
    {
        parent::display();

        $document = $this->getDocument();

        $document->addScript(array('style'), 'plugins');
        $document->addStyleSheet(array('style'), 'plugins');

        $settings = $this->getSettings();

        $document->addScriptDeclaration('StyleDialog.settings=' . json_encode($settings) . ';');

        $tabs = $this->getTabs();

        // Add tabs
        $tabs->addTab('text');
        $tabs->addTab('background');
        $tabs->addTab('block');
        $tabs->addTab('box');
        $tabs->addTab('border');
        $tabs->addTab('list');
        $tabs->addTab('positioning');
    }

    public function getSettings($settings = array())
    {
        $profile = $this->getProfile();

        $settings = array(
            'file_browser' => $this->getParam('file_browser', 1) && in_array('browser', explode(',', $profile->plugins)),
        );

        return parent::getSettings($settings);
    }
};
