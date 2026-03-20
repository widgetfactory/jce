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
use Joomla\Registry\Registry;

class Joomla extends \Wfe\Adapter\Plugin\Links\AbstractLink
{
    protected $providers = array();

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

        foreach ($this->providers as $provider) {
            $option = $provider->getOption();

            if (!$this->checkOptionAccess($option)) {
                continue;
            }

            $areas = $provider->getSearchAreas();

            $results = array_merge($results, $areas);
        }

        return $results;
    }

    public function doSearch(string $text, ?string $phrase = '', ?string $ordering = '', ?array $areas = null): array
    {
        $results = array();

        $options = new Registry([
            'text' => $text,
            'phrase' => $phrase,
            'ordering' => $ordering,
            'areas' => $areas
        ]);

        foreach ($this->providers as $provider) {
            $option = $provider->getOption();

            if (!$this->checkOptionAccess($option)) {
                continue;
            }

            if (!empty($areas) && !in_array($option, $areas)) {
                continue;
            }

            $results[$option] = $provider->doSearch($options);
        }

        return $results;
    }
}
