<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Links\Joomla\Provider;

\defined('_JEXEC') or die;

/**
 * Unified abstract provider for Joomla link browsing and search.
 *
 * Extend this class to add support for a custom Joomla component in both the
 * JCE link browser and the JCE search plugin. Implement `getList()` /
 * `getLinks()` for link browsing and `getSearchAreas()` / `doSearch()`
 * for search — or only the subset you need.
 */
abstract class AbstractProvider
{
    /**
     * The Joomla component option this provider is responsible for (e.g. 'com_content').
     *
     * @var string|null
     */
    protected $option;

    /**
     * Reference to the Link plugin container. Set automatically when the
     * provider is loaded by the Link plugin; null in the Search context.
     *
     * @var object|null
     */
    protected $container;

    public function __construct($container = null)
    {
        $this->container = $container;
    }

    /**
     * Returns the search areas this provider covers, keyed by area slug.
     * Override in concrete providers, e.g.:
     *   return ['content' => 'JGLOBAL_ARTICLES'];
     *
     * @return array
     */
    public function getSearchAreas(): array
    {
        return [];
    }

    /**
     * Executes a content search. Override in concrete providers.
     *
     * @param  \Joomla\Registry\Registry $options
     * @return array
     */
    public function doSearch($options = null)
    {
        return [];
    }

    /**
     * Returns the component option string (e.g. 'com_content').
     *
     * @return string|null
     */
    public function getOption(): ?string
    {
        return $this->option;
    }

    /**
     * Returns the HTML tree-node for the link browser's top-level list.
     * Override to provide an entry point in the link panel.
     *
     * @return string
     */
    public function getLinkList(): string
    {
        return '';
    }

    /**
     * Returns an array of link items for the given browse arguments.
     * Override to provide navigation items.
     *
     * @param  object $args
     * @return array
     */
    public function getLinkItems($args): array
    {
        return [];
    }

    /**
     * Retrieves a configuration parameter.
     *
     * In the Link context (container is set) the call is forwarded to the
     * container so that profile parameters (links.joomlalinks.*) are resolved.
     * In the Search context the CMSPlugin $params Registry is used instead.
     *
     * @param  string $key
     * @param  mixed  $default
     * @return mixed
     */
    public function getParam($key, $default = null)
    {
        if ($this->container !== null) {
            return $this->container->getParam('links.joomla.' . $key, $default);
        }

        return $default;
    }

    /**
     * Applies SEF routing and optional Itemid stripping to a URL.
     * Only used from the Link context (getLinks).
     *
     * @param  string $url
     * @return string
     */
    protected function routeUrl($url)
    {
       // remove alias
        if ((bool) $this->getParam('alias', 0) === false) {
            $url = \Wfe\Helper\LinkHelper::removeAlias($url);
        }
    
        if ((bool) $this->getParam('sef_url', 0)) {
            $url = \Wfe\Helper\LinkHelper::route($url);
        }

        $url = \Wfe\Helper\LinkHelper::removeHomeItemId($url);

        // remove itemId
        if ((bool) $this->getParam('itemid', 1) === false) {
            $url = \Wfe\Helper\LinkHelper::removeItemId($url);
        }

        return $url;
    }

    /**
     * Returns child categories for the given component section.
     * Delegates to the Link container; returns an empty array in the Search context.
     *
     * @param  string $section  Component option (e.g. 'com_content')
     * @param  int    $parent   Parent category ID
     * @return array
     */
    protected function getCategory($section, $parent = 1)
    {
        if ($this->container) {
            $useAlias = (bool) $this->getParam('alias', 0);
            return $this->container->getCategory($section, $parent, $useAlias);
        }

        return [];
    }

    /**
     * Returns an Itemid query string for the given component option.
     * Delegates to the Link container; returns '' in the Search context.
     *
     * @param  string $option
     * @param  array  $params
     * @return string
     */
    protected function getItemId($option, $params = [])
    {
        if ($this->container) {
            return $this->container->getItemId($option, $params);
        }

        return '';
    }
}
