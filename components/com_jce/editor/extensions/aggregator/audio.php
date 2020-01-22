<?php

/**
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
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
            'muted' => (int) $plugin->getParam('aggregator.audio.mute', 0)
        );
    }
}
