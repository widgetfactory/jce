<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Media;

\defined('_JEXEC') or die;

class Audio extends \Wfe\Adapter\Plugin\Media\AbstractMedia
{
    public function __construct($config = array(), $container = null)
    {
        $config['format'] = 'audio';
    
        parent::__construct($config, $container);
    }

    public function display()
    {
        $document = $this->getDocument();
        $document->addScript('audio', 'adapters/media/audio/js');
    }

    public function isEnabled()
    {
        return true;
    }

    public function getParams()
    {
        $defaults = array(
            'controls' => (int) $this->getParam('aggregator.audio.controls', 1),
            'loop' => (int) $this->getParam('aggregator.audio.loop', 0),
            'autoplay' => (int) $this->getParam('aggregator.audio.autoplay', 0),
            'muted' => (int) $this->getParam('aggregator.audio.mute', 0),
        );

        $attributes = $this->getParam('aggregator.audio.attributes', '');

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
