<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

use Joomla\String\StringHelper;

class WFLinkSearchExtension extends WFSearchExtension
{
    private $enabled = array();

    protected function loadDefaultAdapter($plugin)
    {
        $app = JFactory::getApplication();
        
        // create component name from plugin - special case for "contacts"
        $component = ($plugin == 'contacts') ? 'com_contact' : 'com_' . $plugin;

        // check for associated component
        if (!JComponentHelper::isEnabled($component)) {
            return;
        }

        $adapter = __DIR__ . '/adapter/' . $plugin . '/' . $plugin . '.php';

        if (!is_file($adapter)) {
            return;
        }

        require_once $adapter;

        // create classname, eg: PlgSearchContent
        $className = 'PlgWfSearch' . ucfirst($plugin);

        if (!class_exists($className)) {
            return;
        }

        // simple plugin config
        $config = array(
            'name' => $plugin,
            'type' => 'search',
            'params' => array(
                'search_limit' => 10
            ),
        );

        // Joomla 4
        if (method_exists($app, 'getDispatcher')) {
            $dispatcher = $app->getDispatcher();
            $instance = new $className($dispatcher, (array) $config);
            $instance->registerListeners();
        } else {
            $dispatcher = JEventDispatcher::getInstance();
            $instance = new $className($dispatcher, (array) $config);
        }

        $this->enabled[] = $plugin;
    }

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        parent::__construct();

        $request = WFRequest::getInstance();

        $request->setRequest(array($this, 'doSearch'));
        $request->setRequest(array($this, 'getAreas'));

        $wf = WFEditorPlugin::getInstance();

        // get plugins
        $plugins = $wf->getParam('search.link.plugins', array());

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
            if (!JPluginHelper::isEnabled('search', $plugin)) {
                continue;
            }

            // check plugin imports correctly - plugin may have a db entry, but is missing files
            if (JPluginHelper::importPlugin('search', $plugin)) {
                $this->enabled[] = $plugin;
            }
        }
    }

    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();
        $document->addScript(array('link'), 'extensions.search.js');
        $document->addStylesheet(array('link'), 'extensions.search.css');
    }

    public function isEnabled()
    {
        $wf = WFEditorPlugin::getInstance();
        return (bool) $wf->getParam('search.link.enable', 1) && !empty($this->enabled);
    }

    /**
     * Method to get the search areas.
     */
    public function getAreas()
    {
        $app = JFactory::getApplication('site');

        $areas = array();
        $results = array();

        $searchareas = $app->triggerEvent('onContentSearchAreas');

        foreach ($searchareas as $area) {
            if (is_array($area)) {
                $areas = array_merge($areas, $area);
            }
        }

        foreach ($areas as $k => $v) {
            $results[$k] = JText::_($v);
        }

        return $results;
    }

    /*
     * Truncate search text
     * This method uses portions of components/com_finder/views/search/tmpl/default_result.php
     * @copyright Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
     */
    private function truncateText($text, $searchword)
    {
        // Calculate number of characters to display around the result
        $term_length = StringHelper::strlen($searchword);

        $lang = JFactory::getLanguage();
        $desc_length = $lang->getSearchDisplayedCharactersNumber();

        $pad_length = $term_length < $desc_length ? (int) floor(($desc_length - $term_length) / 2) : 0;

        // Find the position of the search term
        $pos = $term_length ? StringHelper::strpos(StringHelper::strtolower($text), StringHelper::strtolower($searchword)) : false;

        // Find a potential start point
        $start = ($pos && $pos > $pad_length) ? $pos - $pad_length : 0;

        // Find a space between $start and $pos, start right after it.
        $space = StringHelper::strpos($text, ' ', $start > 0 ? $start - 1 : 0);
        $start = ($space && $space < $pos) ? $space + 1 : $start;

        $text = JHtml::_('string.truncate', StringHelper::substr($text, $start), $desc_length, false);

        return $text;
    }

    /*
     * Prepare search content by clean and truncating
     * This method uses portions of SearchHelper::prepareSearchContent from administrator/components/com_search/helpers/search.php
     * @copyright Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
     */
    public function prepareSearchContent($text, $searchword)
    {
        // Replace line breaking tags with whitespace.
        $text = preg_replace("'<(br[^/>]*?/|hr[^/>]*?/|/(div|h[1-6]|li|p|td))>'si", ' ', $text);

        // clean text
        $text = filter_var($text, FILTER_SANITIZE_STRING);

        // remove shortcode
        $text = preg_replace('#{.+?}#', '', $text);

        // truncate text based around searchword
        $text = $this->truncateText(strip_tags($text), $searchword);

        // highlight searchword
        $text = preg_replace('#\b(' . preg_quote($searchword, '#') . ')\b#i', '<mark>$1</mark>', $text);

        return $text;
    }

    /*
     * Render Search fields
     * This method uses portions of SearchViewSearch::display from components/com_search/views/search/view.html.php
     * @copyright Copyright (C) 2005 - 2012 Open Source Matters, Inc. All rights reserved.
     */

    public function render()
    {
        if (!$this->isEnabled()) {
            return '';
        }

        // built select lists
        $orders = array();
        $orders[] = JHtml::_('select.option', 'newest', JText::_('WF_SEARCH_NEWEST_FIRST'));
        $orders[] = JHtml::_('select.option', 'oldest', JText::_('WF_SEARCH_OLDEST_FIRST'));
        $orders[] = JHtml::_('select.option', 'popular', JText::_('WF_SEARCH_MOST_POPULAR'));
        $orders[] = JHtml::_('select.option', 'alpha', JText::_('WF_SEARCH_ALPHABETICAL'));
        $orders[] = JHtml::_('select.option', 'category', JText::_('WF_CATEGORY'));

        $lists = array();
        $lists['ordering'] = JHtml::_('select.genericlist', $orders, 'ordering', 'class="inputbox"', 'value', 'text');

        $searchphrases = array();
        $searchphrases[] = JHtml::_('select.option', 'all', JText::_('WF_SEARCH_ALL_WORDS'));
        $searchphrases[] = JHtml::_('select.option', 'any', JText::_('WF_SEARCH_ANY_WORDS'));
        $searchphrases[] = JHtml::_('select.option', 'exact', JText::_('WF_SEARCH_EXACT_PHRASE'));
        $lists['searchphrase'] = JHtml::_('select.radiolist', $searchphrases, 'searchphrase', '', 'value', 'text', 'all');

        $view = $this->getView(array('name' => 'search', 'layout' => 'search'));

        $view->searchareas = self::getAreas();
        $view->lists = $lists;

        $view->display();
    }

    private static function getSearchAreaFromUrl($url)
    {
        $query = parse_url($url, PHP_URL_QUERY);

        if (empty($query)) {
            return "";
        }

        parse_str($query, $values);

        if (!array_key_exists('option', $values)) {
            return "";
        }

        $language = JFactory::getLanguage();

        $option = $values['option'];

        // load system language file
        $language->load($option . '.sys', JPATH_ADMINISTRATOR);
        $language->load($option, JPATH_ADMINISTRATOR);

        return JText::_($option);
    }

    /**
     * Process search.
     *
     * @param type $query Search query
     * @return array Search Results
     *
     * This method uses portions of SearchController::search from components/com_search/controller.php
     *
     * @copyright Copyright (C) 2005 - 2012 Open Source Matters, Inc. All rights reserved
     */
    public function doSearch($query)
    {
        $wf = WFEditorPlugin::getInstance();

        $results = array();

        if (empty($query)) {
            return $results;
        }

        // search area
        $area = null;

        // available search areas
        $areas = $this->getAreas();

        // query using a specific plugin
        if (strpos($query, ':') !== false) {
            preg_match('#^(' . implode('|', $areas) . ')\:(.+)#', $query, $matches);

            if ($matches) {
                $area = array($matches[1]);
                $query = $matches[2];
            }
        }

        if (!class_exists('JSite')) {
            // Load JSite class
            JLoader::register('JSite', JPATH_SITE . '/includes/application.php');
        }

        $app = JFactory::getApplication('site');
        $filter = JFilterInput::getInstance();
        $router = $app::getRouter('site');

        // get router mode
        $sef = (int) $wf->getParam('search.link.sef_url', 0);

        $limit = (int) $wf->getParam('search.link.limit', 50);

        // set router off so a raw url is returned by the Search plugin
        if ($router) {
            //$router->setMode(0);
        }

        // slashes cause errors, <> get stripped anyway later on. # causes problems.
        $searchword = trim(str_replace(array('#', '>', '<', '\\'), '', $filter->clean($query)));

        $ordering = null;
        $searchphrase = 'all';

        // if searchword enclosed in double quotes, strip quotes and do exact match
        if (substr($searchword, 0, 1) == '"' && substr($searchword, -1) == '"') {
            $searchword = substr($searchword, 1, -1);
            $searchphrase = 'exact';
        }

        $searchphrase = $app->input->post->getWord('searchphrase', $searchphrase);

        // get passed through ordering
        $ordering = $app->input->post->getWord('ordering', $ordering);

        // get passed through area
        $area = $app->input->post->getCmd('areas', (array) $area);

        if (empty($area)) {
            $area = null;
        }

        // trigger search on loaded plugins
        $searches = $app->triggerEvent('onContentSearch', array(
            $searchword,
            $searchphrase,
            $ordering,
            $area,
        ));

        $rows = array();

        foreach ($searches as $search) {
            $rows = array_merge((array) $rows, (array) $search);
        }

        // get first 10
        $rows = array_slice($rows, 0, $limit);

        $areas = array();

        for ($i = 0, $count = count($rows); $i < $count; ++$i) {
            $row = &$rows[$i];

            if (empty($row->href) || empty($row->title)) {
                continue;
            }

            $area = isset($row->section) ? $row->section : self::getSearchAreaFromUrl($row->href);

            if (!isset($areas[$area])) {
                $areas[$area] = array();
            }

            $result = new StdClass;

            if ($searchphrase == 'exact') {
                $searchwords = array($searchword);
                $needle = $searchword;
            } else {
                $searchworda = preg_replace('#\xE3\x80\x80#s', ' ', $searchword);
                $searchwords = preg_split("/\s+/u", $searchworda);
                $needle = $searchwords[0];
            }

            // get anchors if any...
            $row->anchors = self::getAnchors($row->text);

            // prepare and truncate search text
            $row->text = $this->prepareSearchContent($row->text, $needle);

            // remove base url
            if (JURI::base(true) && strpos($row->href, JURI::base(true)) !== false) {
                $row->href = substr_replace($row->href, '', 0, strlen(JURI::base(true)) + 1);
            }

            // remove the alias or ItemId from a link
            $row->href = self::route($row->href);

            $result->title = $row->title;
            $result->text = $row->text;
            $result->link = $row->href;

            if (!empty($row->anchors)) {
                $result->anchors = $row->anchors;
            }

            $areas[$area][] = $result;
        }

        if (!empty($areas)) {
            $results[] = $areas;
        }

        return $results;
    }

    private static function route($url)
    {
        $wf = WFEditorPlugin::getInstance();

        if ((bool) $wf->getParam('search.link.remove_alias', 0)) {
            $url = WFLinkHelper::route($url);
        }

        // remove Itemid if "home"
        $url = WFLinkHelper::removeHomeItemId($url);

        // remove Itemid if set
        if ((bool) $wf->getParam('search.link.itemid', 1) === false) {
            $url = WFLinkHelper::removeItemId($url);
        }

        return $url;
    }

    private static function getAnchors($content)
    {
        preg_match_all('#<a([^>]+)(name|id)="([a-z]+[\w\-\:\.]*)"([^>]*)>#i', $content, $matches, PREG_SET_ORDER);

        $anchors = array();

        if (!empty($matches)) {
            foreach ($matches as $match) {
                if (strpos($match[0], 'href') === false) {
                    $anchors[] = $match[3];
                }
            }
        }

        return $anchors;
    }
}
