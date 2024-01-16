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

class WFAggregatorExtension_Audio extends WFAggregatorExtension
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
        $document->addScript('audio', 'extensions/aggregator/audio/js');
    }

    public function isEnabled()
    {
        return true;
    }

    public function getParams()
    {
        $plugin = WFEditorPlugin::getInstance();

        return array(
            'controls' => (int) $plugin->getParam('aggregator.audio.controls', 1),
            'loop' => (int) $plugin->getParam('aggregator.audio.loop', 0),
            'autoplay' => (int) $plugin->getParam('aggregator.audio.autoplay', 0),
            'muted' => (int) $plugin->getParam('aggregator.audio.mute', 0),
        );
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

            if ($value !== '') {
                $data[$name] = $value;
            }
        }

        $data['src'] = $url;

        return $data;
    }
}
