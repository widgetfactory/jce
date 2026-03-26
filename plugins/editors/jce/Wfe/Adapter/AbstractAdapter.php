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
use Wfe\Registry\ConfigurationTrait;
use Wfe\Container\ContainerTrait;

class AbstractAdapter
{
    use ConfigurationTrait;
    use ContainerTrait;

    // An array of adapter plugins
    protected $plugins = array();

    public function __construct($container, $config = array())
    {
        $this->setContainer($container);
        $this->setConfiguration($config);
    }

    public function display()
    {
    }

    public function getPlugins()
    {
        return $this->plugins;
    }

    protected function getDocument()
    {
        return $this->getContainer()->getDocument();
    }

    protected function getTabs()
    {
        return $this->getContainer()->getTabs();
    }

    /**
     * Return a parameter for the current plugin.adapter
     *
     * @param string $key   Parameter name
     * @param mixed $default Default value
     *
     * @return mixed Parameter value
     */
    protected function getParam($key, $default = '')
    {
        return AdapterHelper::getParam($this->getContainer(), $key, $default);
    }

    protected function getTemplatePath()
    {
        $name = strtolower((new \ReflectionClass($this))->getShortName());

        return WF_EDITOR . '/views/adapter/' . $name . '/tmpl';
    }
}
