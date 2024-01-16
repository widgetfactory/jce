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

class WFTablePlugin extends WFEditorPlugin
{
    public function __construct()
    {
        parent::__construct(array('colorpicker' => true));
    }

    public function getLayout()
    {
        return Factory::getApplication()->input->getCmd('slot', 'table');
    }

    /**
     * Display the plugin.
     */
    public function display()
    {
        parent::display();

        $layout = $this->getLayout();
        $document = WFDocument::getInstance();

        $document->addScript(array('table'), 'plugins');
        $document->addStyleSheet(array('table'), 'plugins');

        // update title
        if ($layout !== 'table') {
            $document->setTitle(Text::_('WF_TABLE_' . strtoupper($layout) . '_TITLE'));
        }

        $settings = $this->getSettings();

        $document->addScriptDeclaration('TableDialog.settings=' . json_encode($settings) . ';');

        $tabs = WFTabs::getInstance(array('base_path' => WF_EDITOR_PLUGIN));

        if ($layout == 'merge') {
            // Add tabs
            $tabs->addTab('merge');
        } else {
            $tabs->addTab('general', 1, array('plugin' => $this));
            $tabs->addTab('advanced', 1, array('plugin' => $this));
        }
    }

    public function getSettings($settings = array())
    {
        $profile = $this->getProfile();

        $settings['file_browser'] = $this->getParam('file_browser', 1) && in_array('browser', explode(',', $profile->plugins));

        return parent::getSettings($settings);
    }
}
