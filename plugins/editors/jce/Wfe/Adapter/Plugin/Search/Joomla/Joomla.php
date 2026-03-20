<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Search;

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Filter\InputFilter;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;
use Joomla\String\StringHelper;
use Joomla\Event\Event;

use Wfe\Http\Request;
use Wfe\Helper\LinkHelper;
use Wfe\Document\Document;

class Joomla extends \Wfe\Adapter\Plugin\Search\AbstractSearch
{
    private $enabled = array();

    protected function loadDefaultAdapter($plugin)
    {
        $app = Factory::getApplication();

        // create component name from plugin - special case for "contacts"
        $component = ($plugin == 'contacts') ? 'com_contact' : 'com_' . $plugin;

        // check for associated component
        if (!ComponentHelper::isEnabled($component)) {
            return;
        }

        // Map area names to provider class/file names.
        // 'contacts' is the user-visible area key; the unified provider class is 'Contact'.
        $providerName = ($plugin === 'contacts') ? 'Contact' : ucfirst($plugin);

        // All providers now live in the shared Link/Joomla/Provider directory
        $providerPath = dirname(dirname(__DIR__)) . '/Link/Joomla/Provider';
        $adapter      = $providerPath . '/' . $providerName . '.php';

        if (!is_file($adapter)) {
            return;
        }

        require_once $adapter;

        $className = '\\Wfe\\Plugins\\Link\\Joomla\\Provider\\' . $providerName;

        if (!class_exists($className)) {
            return;
        }

        // simple plugin config
        $config = array(
            'name' => $plugin,
            'type' => 'search',
            'params' => array(
                'search_limit' => 10,
            ),
        );

        $dispatcher = $app->getDispatcher();

        $instance = new $className($dispatcher, (array) $config);
        $instance->registerListeners();

        $this->enabled[] = $plugin;
    }

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        parent::__construct();

        $request = Request::getInstance();

        $request->setRequest(array($this, 'doSearch'));
        $request->setRequest(array($this, 'getAreas'));

        // get plugins
        $plugins = $this->getParam('search.link.plugins', array());

        // set defaults if empty
        if (empty($plugins)) {
            $plugins = array('categories', 'contacts', 'content', 'tags');
        }

        // list core adapters
        $adapters = array('categories', 'contacts', 'content', 'tags', 'weblinks');

        // check and load external search plugins
        foreach ($plugins as $plugin) {
            // process core search plugins
            if (in_array($plugin, $adapters)) {
                $this->loadDefaultAdapter($plugin);
                continue;
            }

            // plugin must be enabled
            if (!PluginHelper::isEnabled('search', $plugin)) {
                continue;
            }

            // check plugin imports correctly - plugin may have a db entry, but is missing files
            if (PluginHelper::importPlugin('search', $plugin)) {
                $this->enabled[] = $plugin;
            }
        }
    }

    public function display()
    {
        parent::display();

        $document = Document::getInstance();
        $document->addStylesheet(array('link'), 'adapters.search.css');
    }

    public function isEnabled()
    {
        //return $this->checkAccess('search.link.enable', 1) && !empty($this->enabled);
        return true;
    }

    /**
     * Method to get the search areas.
     */
    public function getAreas()
    {
        $app = Factory::getApplication('site');

        $areas = array();
        $results = array();

        $event = new Event('onContentSearchAreas', array(
            'subject'   => $this,
            'areas'     => $areas
        ));

        $app->getDispatcher()->dispatch('onContentSearchAreas', $event);

        $areas = $event->getArgument('areas', array());

        foreach ($areas as $area) {
            foreach($area as $key => $value) {
                $results[$key] = Text::_($value);
            }
        }

        return $results;
    }
    
    protected function routeUrl($url)
    {
        // remove link alias
        if ((bool) $this->getParam('search.link.remove_alias', 0)) {
            $url = LinkHelper::removeAlias($url);
        }

        // remove Itemid if "home"
        $url = LinkHelper::removeHomeItemId($url);

        // remove Itemid if set
        if ((bool) $this->getParam('search.link.itemid', 1) === false) {
            $url = LinkHelper::removeItemId($url);
        }

        return $url;
    }

    protected function getItemId($option, $params = array())
    {
        return $this->getContainer()->getItemId($option, $params);
    }
}
