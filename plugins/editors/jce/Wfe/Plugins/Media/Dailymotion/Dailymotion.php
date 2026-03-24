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

class Dailymotion extends \Wfe\Adapter\Plugin\Media\AbstractMedia
{
    public function __construct($config = array(), $container = null)
    {
        $config['format'] = 'video';
    
        parent::__construct($config, $container);
    }

    public function display()
    {
        $document = $this->getDocument();
        $document->addScript('dailymotion', 'adapters/media/dailymotion/js');
        $document->addStyleSheet('dailymotion', 'adapters/media/dailymotion/css');
    }

    public function isEnabled()
    {
        return $this->checkAccess('aggregator.dailymotion.enable', 1);
    }

    public function getParams()
    {
        $defaults = array(
            'width' => $this->getParam('aggregator.dailymotion.width', 480),
            'height' => $this->getParam('aggregator.dailymotion.height', 270),
        );

        $attributes = $this->getParam('aggregator.dailymotion.attributes', '');

        if ($attributes) {            
            $defaults['attributes'] = $this->getCustomDefaultAttributes($attributes);
        }

        return $defaults;
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

            if ($name == 'width' || $name == 'height' || $name == 'attributes') {
                $data[$name] = $value;
                continue;
            }
        }

        return $data;
    }
}
