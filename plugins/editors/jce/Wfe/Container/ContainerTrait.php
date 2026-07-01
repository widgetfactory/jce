<?php

/**
 * @package     JCE
 * @subpackage  Library.wfe
 *
 * @copyright   Copyright (c) 2026-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Container;

trait ContainerTrait
{
    /**
     * Bound object instances, keyed by name.
     *
     * @var object[]
     */
    private array $instances = [];

    /**
     * Bind an object instance to a key.
     *
     * @param  string|object  $keyOrInstance
     * @param  object|null    $instance
     *
     * @return void
     */
    public function setContainer(string|object $keyOrInstance, ?object $instance = null): void
    {
        if (is_string($keyOrInstance) && $instance === null) {
            throw new \InvalidArgumentException('An instance must be provided when a key is specified.');
        }

        if ($instance === null) {
            $key      = 'container';
            $instance = $keyOrInstance;
        } else {
            $key = $keyOrInstance;
        }

        $this->instances[$key] = $instance;
    }

    /**
     * Retrieve a bound object instance by key.
     *
     * @param  string  $key
     *
     * @return object|null
     */
    public function getContainer(string $key = 'container'): ?object
    {
        return $this->instances[$key] ?? null;
    }
}
