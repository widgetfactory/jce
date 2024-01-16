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

class WFAggregatorExtension_Dailymotion extends WFAggregatorExtension
{
    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        parent::__construct(array(
            'format' => 'video',
        ));
    }

    public function display()
    {
        $document = WFDocument::getInstance();
        $document->addScript('dailymotion', 'extensions/aggregator/dailymotion/js');
        $document->addStyleSheet('dailymotion', 'extensions/aggregator/dailymotion/css');
    }

    public function isEnabled()
    {
        $plugin = WFEditorPlugin::getInstance();

        return $plugin->checkAccess('aggregator.dailymotion.enable', 1);
    }

    public function getParams()
    {
        $plugin = WFEditorPlugin::getInstance();

        return array(
            'width' => $plugin->getParam('aggregator.dailymotion.width', 480),
            'height' => $plugin->getParam('aggregator.dailymotion.height', 270),
        );
    }

    public function getEmbedData($data, $url)
    {
        $params = $this->getParams();

        $default = array(
            'width' => 480,
            'height' => 270,
        );

        foreach ($params as $name => $value) {
            if (isset($default[$name]) && $value === $default[$name]) {
                continue;
            }

            if ($name === 'width' || $name == 'height') {
                $data[$name] = $value;
                continue;
            }
        }

        return $data;
    }
}
