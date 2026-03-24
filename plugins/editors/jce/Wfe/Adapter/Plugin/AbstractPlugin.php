<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Adapter\Plugin;

\defined('_JEXEC') or die;

use Wfe\Registry\ConfigurationTrait;
use Wfe\Helper\AdapterHelper;

class AbstractPlugin
{
    use ConfigurationTrait;

    protected $container;

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array(), $container = null)
    {
        // set plugin properties
        $this->setConfiguration($config);

        if (is_null($container)) {
            $container = \Wfe\Factory::getEditorPlugin();
        }

        // store container object
        $this->setContainer($container);
    }

    public function setContainer($container)
    {
        $this->container = $container;
    }

    public function getContainer()
    {
        return $this->container;
    }

    /**
     * Display the extension.
     */
    public function display() {}

    protected function getDocument()
    {
        return $this->container->getDocument();
    }

    /**
     * Return a parameter for the current plugin / group.
     *
     * @param string $key   Parameter name
     * @param mixed $default Default value
     *
     * @return mixed Parameter value
     */
    protected function getParam($key, $default = '')
    {
        return AdapterHelper::getParam($this->container, $key, $default);
    }

    public function isEnabled()
    {
        return false;
    }

    public function checkAccess($key, $default = 1)
    {
        return $this->getContainer()->checkAccess($key, $default);
    }

    public function getView($options = array())
    {
        return new \Wfe\Document\View($options);
    }

    public function getName()
    {
        return $this->get('name');
    }

    public function getTitle()
    {
        return $this->get('title');
    }

    public function getPath()
    {
        return $this->get('path');
    }

    protected function getCustomDefaultAttributes($data)
    {
        $custom = array();

        if (is_string($data)) {
            $data = html_entity_decode($data);
            $data = json_decode($data, true);
        }

        // Remove values with invalid key, must be indexed array
        $data = array_filter($data, function ($value, $key) {
            return is_numeric($key) && $value != "";
        }, ARRAY_FILTER_USE_BOTH);

        foreach ($data as $attribute) {
            if (empty($attribute)) {
                continue;
            }

            $name = '';
            $value = '';

            // json associative array
            if (is_array($attribute) && array_key_exists('name', $attribute)) {
                extract($attribute);
            }

            if ($name && $value !== '') {
                $value = trim($value, " \t\n\r\0\x0B'\"");
                $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');

                $custom[$name] = $value;
            }
        }

        // remove empty values
        $custom = array_filter($custom, function ($value) {
            return $value !== '';
        });

        // remove invalid keys
        $custom = array_filter($custom, function ($key) {
            return preg_match('/^[a-zA-Z0-9\-_]+$/', $key);
        }, ARRAY_FILTER_USE_KEY);

        return $custom;
    }
}
