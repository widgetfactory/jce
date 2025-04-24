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

class WFAggregatorExtension_Video extends WFAggregatorExtension
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
        $document->addScript('video', 'extensions/aggregator/video/js');
    }

    public function isEnabled()
    {
        return true;
    }

    public function getParams()
    {
        $plugin = WFEditorPlugin::getInstance();

        $defaults = array(
            'width' => $plugin->getParam('aggregator.video.width', ''),
            'height' => $plugin->getParam('aggregator.video.height', ''),

            'controls' => (int) $plugin->getParam('aggregator.video.controls', 1),
            'loop' => (int) $plugin->getParam('aggregator.video.loop', 0),
            'autoplay' => (int) $plugin->getParam('aggregator.video.autoplay', 0),
            'muted' => (int) $plugin->getParam('aggregator.video.mute', 0)
        );

        $attributes = $plugin->getParam('aggregator.video.attributes', '');

        if ($attributes) {            
            $defaults['attributes'] = $this->getCustomDefaultAttributes($attributes);
        }

        return $defaults;
    }

    public function getEmbedData($data, $url)
    {
        $params = $this->getParams();

        $default = array(
            'controls' => 1,
            'loop' => 0,
            'autoplay' => 0,
            'muted' => 0,
        );

        foreach ($params as $name => $value) {
            if ($default[$name] === $value) {
                continue;
            }

            if ($name == 'attributes') {
                $data[$name] = $value;
                continue;
            }

            if ($value !== '') {
                $data[$name] = $value;
            }
        }

        $data['src'] = $url;

        return $data;
    }
}
