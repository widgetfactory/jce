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

class Vimeo extends \Wfe\Adapter\Plugin\Media\AbstractMedia
{
    public function __construct($config = array(), $container = null)
    {
        $config['format'] = 'video';
    
        parent::__construct($config, $container);
    }

    public function display()
    {
        $document = $this->getDocument();
        $document->addScript('vimeo', 'adapters/media/vimeo/js');
    }

    public function isEnabled()
    {
        return $this->checkAccess('aggregator.vimeo.enable', 1);
    }

    public function getParams()
    {
        $defaults = array(
            'width' => $this->getParam('aggregator.vimeo.width', 400),
            'height' => $this->getParam('aggregator.vimeo.height', 225),

            'color' => (string) $this->getParam('aggregator.vimeo.color', ''),
            'loop' => (int) $this->getParam('aggregator.vimeo.loop', 0),
            'autoplay' => (int) $this->getParam('aggregator.vimeo.autoplay', 0),
            'intro' => (int) $this->getParam('aggregator.vimeo.intro', 0),
            'title' => (int) $this->getParam('aggregator.vimeo.title', 0),
            'byline' => (int) $this->getParam('aggregator.vimeo.byline', 0),
            'portrait' => (int) $this->getParam('aggregator.vimeo.portrait', 0),
            'fullscreen' => (int) $this->getParam('aggregator.vimeo.fullscreen', 1),
            'dnt' => (int) $this->getParam('aggregator.vimeo.dnt', 0),
        );

        $attributes = $this->getParam('aggregator.vimeo.attributes', '');

        if ($attributes) {
            $defaults['attributes'] = $this->getCustomDefaultAttributes($attributes);
        }

        return $defaults;
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

            if ($name == 'width' || $name == 'height' || $name == 'attributes') {
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
