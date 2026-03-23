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

use Wfe\Document\Document;

class Youtube extends \Wfe\Adapter\Plugin\Media\AbstractMedia
{
    public function __construct($config = array(), $container = null)
    {
        $config['format'] = 'video';
    
        parent::__construct($config, $container);
    }

    public function display()
    {
        $document = Document::getInstance();
        $document->addScript('youtube', 'adapters/media/youtube/js');
    }

    public function isEnabled()
    {
        return $this->checkAccess('aggregator.youtube.enable', 1);
    }

    public function getParams()
    {
        $defaults = array(
            'width' => $this->getParam('aggregator.youtube.width', 560),
            'height' => $this->getParam('aggregator.youtube.height', 315),

            'controls' => (int) $this->getParam('aggregator.youtube.controls', 1),
            'loop' => (int) $this->getParam('aggregator.youtube.loop', 0),
            'autoplay' => (int) $this->getParam('aggregator.youtube.autoplay', 0),
            'rel' => (int) $this->getParam('aggregator.youtube.related', 1),
            'modestbranding' => (int) $this->getParam('aggregator.youtube.modestbranding', 0),
            'privacy' => (int) $this->getParam('aggregator.youtube.privacy', 0),
        );

        $attributes = $this->getParam('aggregator.youtube.attributes', '');

        if ($attributes) {
            $defaults['attributes'] = $this->getCustomDefaultAttributes($attributes);
        }

        return $defaults;
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

            if ($name == 'width' || $name == 'height' || $name == 'attributes') {
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
