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

class WFAggregatorExtension_Vimeo extends WFAggregatorExtension
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
        $document->addScript('vimeo', 'extensions/aggregator/vimeo/js');
    }

    public function isEnabled()
    {
        $plugin = WFEditorPlugin::getInstance();

        return $plugin->checkAccess('aggregator.vimeo.enable', 1);
    }

    public function getParams()
    {
        $plugin = WFEditorPlugin::getInstance();

        return array(
            'width' => $plugin->getParam('aggregator.vimeo.width', 400),
            'height' => $plugin->getParam('aggregator.vimeo.height', 225),

            'color' => (string) $plugin->getParam('aggregator.vimeo.color', ''),
            'loop' => (int) $plugin->getParam('aggregator.vimeo.loop', 0),
            'autoplay' => (int) $plugin->getParam('aggregator.vimeo.autoplay', 0),
            'intro' => (int) $plugin->getParam('aggregator.vimeo.intro', 0),
            'title' => (int) $plugin->getParam('aggregator.vimeo.title', 0),
            'byline' => (int) $plugin->getParam('aggregator.vimeo.byline', 0),
            'portrait' => (int) $plugin->getParam('aggregator.vimeo.portrait', 0),
            'fullscreen' => (int) $plugin->getParam('aggregator.vimeo.fullscreen', 1),
            'dnt' => (int) $plugin->getParam('aggregator.vimeo.dnt', 0),
        );
    }

    public function getEmbedData($data, $url)
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

        foreach ($params as $name => $value) {
            if (isset($default[$name]) && $value === $default[$name]) {
                continue;
            }

            if ($name === 'width' || $name == 'height') {
                $data[$name] = $value;
                continue;
            }

            $query[$name] = $value;
        }

        if (!empty($options)) {
            $data['query'] = http_build_query($options);
        }

        return $data;
    }
}
