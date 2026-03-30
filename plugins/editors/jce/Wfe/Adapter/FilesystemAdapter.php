<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Adapter;

\defined('_JEXEC') or die;

use Wfe\Helper\AdapterHelper;
use Wfe\Adapter\Plugin\Filesystem\AbstractFilesystem;

class FilesystemAdapter extends \Wfe\Adapter\AbstractAdapter
{
    public static function getInstance($container, $config = array())
    {
        static $instance = array();    

        $pluginName = isset($config['name']) ? $config['name'] : 'joomla';

        $signature = md5($container->getName() . $pluginName . serialize($config));

        if (isset($instance[$signature])) {
            return $instance[$signature];
        }

        // Load plugin definitions only
        $plugins = AdapterHelper::getPlugins('filesystem');

        if (!array_key_exists($pluginName, $plugins)) {
            $pluginName = 'joomla';
        }

        $plugin = $plugins[$pluginName];

        $instance[$signature] = AdapterHelper::createPlugin($plugin, $config, $container);

        // create a default filesystem instance
        if (!$instance[$signature] instanceof AbstractFilesystem) {
            $instance[$signature] = new AbstractFilesystem($config, $container);
        }

        return $instance[$signature];
    }
}
