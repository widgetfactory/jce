<?php

/**
 * @package     JCE
 * @subpackage  Library.wfe
 *
 * @copyright   Copyright (c) 2025-2026 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2014 Open Source Matters, Inc. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Registry;

use InvalidArgumentException;

trait ConfigurationTrait
{
    /**
     * Internal Registry object for configuration storage.
     *
     * @var Registry|null
     */
    protected $config;

    /**
     * Ensure the internal Registry exists.
     *
     * @return Registry
     */
    protected function getRegistry()
    {
        if (!($this->config instanceof Registry)) {
            $this->config = new Registry();
        }

        return $this->config;
    }

    /**
     * Returns the entire configuration as an associative array.
     *
     * @return array
     */
    public function getProperties()
    {
        return $this->getRegistry()->getAll();
    }

    /**
     * Returns a property of the configuration, or the default value if not set.
     *
     * @param  string  $key
     * @param  mixed   $default
     *
     * @return mixed
     */
    public function getConfig($key, $default = null)
    {
        return $this->getRegistry()->get($key, $default);
    }

    /**
     * Merges a configuration array or object into the existing configuration.
     *
     * @param  array|object  $config
     *
     * @return void
     *
     * @throws InvalidArgumentException
     */
    public function setProperties($config)
    {
        if (!is_array($config) && !is_object($config)) {
            throw new InvalidArgumentException('Config must be an array or an object.');
        }

        $this->getRegistry()->merge($config);
    }

    /**
     * Sets a single property in the configuration.
     *
     * @param  string  $key
     * @param  mixed   $value
     *
     * @return mixed The previous value, or null if none.
     */
    public function setConfig($key, $value = null)
    {
        $registry = $this->getRegistry();

        $previous = $registry->get($key, null);
        $registry->set($key, $value);

        return $previous;
    }

    /**
     * Replaces the internal configuration object.
     *
     * @param  Registry|array|object|string|null  $config  Registry instance, array/object, or JSON string.
     *
     * @return $this
     */
    public function setConfiguration($config)
    {
        $this->config = ($config instanceof Registry) ? $config : new Registry($config);

        return $this;
    }
}
