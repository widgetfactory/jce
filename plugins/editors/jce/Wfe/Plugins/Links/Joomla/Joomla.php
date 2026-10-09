<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Links;

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Registry\Registry;

class Joomla extends \Wfe\Adapter\Plugin\Links\AbstractLink
{
    protected $providers = array();

    protected $searchProviders = null;

    public function __construct($options = array())
    {
        parent::__construct($options);

        $path = __DIR__ . '/Provider';

        // Providers to load for the link browser
        $names = ['Contact', 'Content', 'Menu', 'Tags', 'Weblinks'];

        foreach ($names as $option) {
            $name = strtolower($option);

            if (!$this->checkOptionAccess($name)) {
                continue;
            }

            // skip weblinks if the component is not installed
            if ($name == 'weblinks' && !ComponentHelper::isEnabled('com_weblinks')) {
                continue;
            }

            require_once $path . '/' . $option . '.php';

            $classname = '\\Wfe\\Plugins\\Links\\Joomla\\Provider\\' . $option;

            if (class_exists($classname)) {
                $this->providers[$name] = new $classname($this);
            }
        }
    }

    /**
     * Load the search providers, core and legacy "search" plugins, from the profile.
     *
     * @return array
     */
    protected function getSearchProviders()
    {
        if (is_array($this->searchProviders)) {
            return $this->searchProviders;
        }

        $this->searchProviders = array();

        $names = $this->getParam('links.joomla.search.providers');

        // check legacy parameter
        if (empty($names)) {
            $names = $this->getParam('search.link.plugins');
        }

        if (empty($names)) {
            $names = ['categories', 'contacts', 'content', 'weblinks', 'tags'];
        }

        if (is_string($names)) {
            $names = explode(',', $names);
        }

        // core search providers
        $core = [
            'categories'    => 'Categories',
            'contacts'      => 'Contact',
            'content'       => 'Content',
            'weblinks'      => 'Weblinks',
            'tags'          => 'Tags',
        ];

        $app = Factory::getApplication();

        foreach (array_unique($names) as $name) {
            $name = (string) $name;

            if (isset($core[$name])) {
                $component = ($name == 'contacts') ? 'com_contact' : 'com_' . $name;

                if (!ComponentHelper::isEnabled($component)) {
                    continue;
                }

                $option = $core[$name];

                require_once __DIR__ . '/Provider/' . $option . '.php';

                $classname = '\\Wfe\\Plugins\\Links\\Joomla\\Provider\\' . $option;

                $this->searchProviders[$name] = new $classname($this);

                continue;
            }

            // legacy search plugin, must be enabled and accessible
            if ($name === '' || !PluginHelper::isEnabled('search', $name)) {
                continue;
            }

            try {
                $plugin = $app->bootPlugin($name, 'search');
            } catch (\Throwable $e) {
                continue;
            }

            if (!method_exists($plugin, 'onContentSearch')) {
                continue;
            }

            $app->getLanguage()->load('plg_search_' . $name, JPATH_ADMINISTRATOR);

            require_once __DIR__ . '/Provider/SearchPlugin.php';

            $this->searchProviders[$name] = new \Wfe\Plugins\Links\Joomla\Provider\SearchPlugin($this, $plugin);
        }

        return $this->searchProviders;
    }

    public function getParam($key, $default = '')
    {
        $legacyKey = '';

        // eg: links.joomla.search.plugins
        if (str_starts_with($key, 'links.joomla.search')) {
            $legacyKey = 'search.link' . substr($key, strlen('links.joomla.search'));
        // eg: links.joomla.list.content
        } elseif (str_starts_with($key, 'links.joomla.list')) {
            $legacyKey = 'links.joomlalinks' . substr($key, strlen('links.joomla.list'));
        // eg: links.joomla.alias
        } elseif (str_starts_with($key, 'links.joomla')) {
            $legacyKey = 'links.joomlalinks' . substr($key, strlen('links.joomla'));
        }

        // get any legacy value, falling back to $default
        $legacyValue = $legacyKey ? parent::getParam($legacyKey, $default) : $default;

        // get standard value, falling back to legacy
        return parent::getParam($key, $legacyValue);
    }

    protected function checkOptionAccess($option)
    {
        $option = str_replace('com_', '', $option);

        if ($option == "contact") {
            $option = "contacts";
        }

        $providers = $this->getParam('links.joomla.list.providers');

        // check legacy parameter
        if (empty($providers)) {
            $state = $this->getParam('links.joomlalinks.' . $option);

            if (is_numeric($state)) {
                return (bool) $state;
            }

            $providers = ['content', 'contacts', 'weblinks', 'menu', 'tags'];
        }

        if (!in_array($option, $providers)) {
            return false;
        }

        return true;
    }

    public function getOption()
    {
        $options = array();
    
        foreach ($this->providers as $provider) {
            $options[] = $provider->getOption();
        }

        return $options;
    }

    public function getList()
    {
        $list = '';

        foreach ($this->providers as $provider) {
            $list .= $provider->getList();
        }

        return $list;
    }

    public function getLinks($args)
    {
        if ((int) $this->getParam('links.joomla.list.enable', 1) === 0) {
            return [];
        }
    
        foreach ($this->providers as $provider) {
            if ($provider->getOption() == $args->option) {

                if (!$this->checkOptionAccess($args->option)) {
                    continue;
                }

                return $provider->getLinks($args);
            }
        }

        return [];
    }

    public function getSearchAreas()
    {
        $results = array();

        if ((int) $this->getParam('links.joomla.search.enable', 1) === 0) {
            return $results;
        }

        foreach ($this->getSearchProviders() as $provider) {
            $results = array_merge($results, $provider->getSearchAreas());
        }

        return $results;
    }

    public function doSearch(string $text, ?string $phrase = '', ?string $ordering = '', ?array $areas = null): array
    {
        $results = array();

        if ((int) $this->getParam('links.joomla.search.enable', 1) === 0) {
            return $results;
        }

        $options = new Registry([
            'text' => $text,
            'phrase' => $phrase,
            'ordering' => $ordering,
            'areas' => $areas
        ]);

        foreach ($this->getSearchProviders() as $provider) {
            $providerAreas = $provider->getSearchAreas();

            if (empty($providerAreas)) {
                continue;
            }

            if (!empty($areas) && !array_intersect($areas, array_keys($providerAreas))) {
                continue;
            }

            $rows = (array) $provider->doSearch($options);

            // core providers are grouped by area, eg: com_content
            if (!$provider instanceof \Wfe\Plugins\Links\Joomla\Provider\SearchPlugin) {
                $results[key($providerAreas)] = $rows;
                continue;
            }

            // legacy plugins are grouped by result section, falling back to the area name
            foreach ($rows as $row) {
                $group = !empty($row->section) ? $row->section : reset($providerAreas);

                $results[$group][] = $row;
            }
        }

        return $results;
    }
}
