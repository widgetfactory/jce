<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Compat;

\defined('_JEXEC') or die;

/**
 * Backwards-compatibility shim for legacy filesystem adapters that extend WFFileSystem.
 *
 * Legacy adapters call $this->get($key, $default) which mapped to the old
 * Template-based registry API. The new base class uses ConfigurationTrait
 * with getConfig(). This shim bridges the two.
 *
 * @deprecated  Legacy filesystem adapters should call getConfig() directly.
 *              This class will be removed in a future major version.
 */
class WFFileSystem extends \Wfe\Adapter\Plugin\Filesystem\AbstractFilesystem
{
    /**
     * Retrieve a configuration value by key.
     *
     * @deprecated  Use getConfig() instead.
     *
     * @param  string  $key
     * @param  mixed   $default
     *
     * @return mixed
     */
    public function get($key, $default = null)
    {
        return $this->getConfig($key, $default);
    }

    /**
     * Set a configuration value by key.
     *
     * @deprecated  Use setConfig() instead.
     *
     * @param  string  $key
     * @param  mixed   $value
     *
     * @return void
     */
    public function set($key, $value = null)
    {
        $this->setConfig($key, $value);
    }
}
