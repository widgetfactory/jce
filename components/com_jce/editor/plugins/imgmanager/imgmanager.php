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

class WFImgManagerPlugin extends WFMediaManager
{
    public $_filetypes = 'jpg,jpeg,png,apng,gif,webp,avif';

    protected $name = 'imgmanager';

    public function __construct($config = array())
    {
        $config['colorpicker'] = true;

        parent::__construct($config);

        $this->addFileBrowserEvent('onUpload', array($this, 'onUpload'));
    }

    /**
     * Display the plugin.
     */
    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();

        // create new tabs instance
        $tabs = WFTabs::getInstance(array(
            'base_path' => WF_EDITOR_PLUGINS . '/imgmanager',
        ));

        // Add tabs
        $tabs->addTab('image', 1, array('plugin' => $this));

        if ($this->allowEvents()) {
            $tabs->addTab('rollover', $this->getParam('tabs_rollover', 1));
        }

        $tabs->addTab('advanced', $this->getParam('tabs_advanced', 1));

        $document->addScript(array('imgmanager'), 'plugins');
        $document->addStyleSheet(array('imgmanager'), 'plugins');

        $document->addScriptDeclaration('ImageManagerDialog.settings=' . json_encode($this->getSettings()) . ';');
    }

    public function getDefaultAttributes()
    {
        $attribs = parent::getDefaultAttributes();

        unset($attribs['always_include_dimensions']);

        return $attribs;
    }

    public function onUpload($file, $relative = '')
    {
        parent::onUpload($file, $relative);
        
        $app = Factory::getApplication();

        // inline upload
        if ($app->input->getInt('inline', 0) === 1) {
            $result = array(
                'file' => $relative,
                'name' => WFUtility::mb_basename($relative),
            );

            if ($this->getParam('always_include_dimensions', 1)) {
                $dim = @getimagesize($file);

                if ($dim) {
                    $result['width'] = $dim[0];
                    $result['height'] = $dim[1];
                }
            }

            $result = array_merge($result, array('attributes' => $this->getDefaultAttributes()));

            return $result;
        }

        return array();
    }

    public function getSettings($settings = array())
    {
        $settings = array(
            'attributes' => array(
                'dimensions' => $this->getParam('attributes_dimensions', 1),
                'align' => $this->getParam('attributes_align', 1),
                'margin' => $this->getParam('attributes_margin', 1),
                'border' => $this->getParam('attributes_border', 1),
            ),
            'always_include_dimensions' => (bool) $this->getParam('always_include_dimensions', 1),
        );

        return parent::getSettings($settings);
    }
}
