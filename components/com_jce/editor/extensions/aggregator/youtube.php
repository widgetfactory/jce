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

class WFAggregatorExtension_Youtube extends WFAggregatorExtension
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
        $document->addScript('youtube', 'extensions/aggregator/youtube/js');
    }

    public function isEnabled()
    {
        $plugin = WFEditorPlugin::getInstance();

        return $plugin->checkAccess('aggregator.youtube.enable', 1);
    }

    public function getParams()
    {
        $plugin = WFEditorPlugin::getInstance();

        return array(
            'width' => $plugin->getParam('aggregator.youtube.width', 560),
            'height' => $plugin->getParam('aggregator.youtube.height', 315),

            'controls' => (int) $plugin->getParam('aggregator.youtube.controls', 1),
            'loop' => (int) $plugin->getParam('aggregator.youtube.loop', 0),
            'autoplay' => (int) $plugin->getParam('aggregator.youtube.autoplay', 0),
            'rel' => (int) $plugin->getParam('aggregator.youtube.related', 1),
            'modestbranding' => (int) $plugin->getParam('aggregator.youtube.modestbranding', 0),
            'privacy' => (int) $plugin->getParam('aggregator.youtube.privacy', 0),
        );
    }

    public function getEmbedData($data)
    {
        $params = $this->getParams();

        $default = array(
            'width' => 560,
            'height' => 315,
            'controls' => 1,
            'loop' => 0,
            'autoplay' => 0,
            'rel' => 1,
            'modestbranding' => 0,
            'privacy' => 0,
        );

        $options = array();

        foreach ($params as $name => $value) {
            if (isset($default[$name]) && $value === $default[$name]) {
                continue;
            }

            if ($name === 'width' || $name == 'height') {
                $data[$name] = $value;
                continue;
            }

            $options[$name] = $value;
        }

        if (!empty($options)) {
            $data['query'] = http_build_query($options);
        }

        return $data;
    }
}
