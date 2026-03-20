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

use Wfe\Registry\ConfigurationTrait;

class AbstractAdapter
{
    use ConfigurationTrait;

    // The Editor Plugin Container
    protected $container;

    // An array of adapter plugins
    protected $plugins = array();

    public function __construct($container, $config = array())
    {
        $this->container = $container;
        $this->setConfiguration($config);
    }

    public function display()
    {
    }

    public function getPlugins()
    {
        return $this->plugins;
    }

    protected function getContainer()
    {
        return $this->container;
    }

    protected function getParam($key, $default = null)
    {
        $container = $this->getContainer();
        return $container->getParam($key, $default);
    }

    protected function getTemplatePath()
    {
        $name = strtolower((new \ReflectionClass($this))->getShortName());
    
        return WF_EDITOR . '/views/adapter/' . $name . '/tmpl';
    }
}
