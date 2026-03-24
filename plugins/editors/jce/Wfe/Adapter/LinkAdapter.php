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

use Joomla\CMS\Filter\InputFilter;
use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Event\Event;
use Joomla\String\StringHelper;

use Wfe\Http\Request;
use Wfe\Helper\AdapterHelper;

class LinkAdapter extends \Wfe\Adapter\AbstractAdapter
{
    /**
     * @var string
     */
    protected $path = __DIR__;

    protected static $links = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($container, $config = array())
    {
        parent::__construct($container, $config);

        $plugins = AdapterHelper::getPlugins('links', false, $config);

        foreach ($plugins as $plugin) {
            $instance = AdapterHelper::createPlugin($plugin, $config, $container);

            if (!is_null($instance)) {
                $this->plugins[$plugin->name] = $instance;
            }

            $type = $plugin->type ?: 'links';

            // import installed Joomla plugins
            PluginHelper::importPlugin('jce', $type . '_' . $plugin->name);
        }

        $request = Request::getInstance();
        $request->setRequest(array($this, 'getLinks'));
        $request->setRequest(array($this, 'doSearch'));
    }

    protected function isEnabled($task)
    {
        return (bool) $this->getParam('links.' . $task . '.enable', 1);
    }

    public function display()
    {
        parent::display();

        $document = $this->getDocument();
        $document->addStyleSheet(
            array('links'),
            'adapters.links.css'
        );

        foreach ($this->plugins as $plugin) {
            $plugin->display();
        }
    }

    public function renderList()
    {
        if (!$this->isEnabled('list')) {
            return '';
        }
    
        $list = $this->getLinkList();

        if (empty($list)) {
            return '';
        }

        $view = new \Wfe\Document\View(
            array(
                'name'      => 'list',
                'layout'    => 'list',
                'template_path' => WF_EDITOR . '/views/adapter/links/tmpl'
            )
        );

        $view->set('list', implode("\n", $list));
        $view->display();
    }

    public function getLinkList()
    {
        $list = array();

        foreach ($this->plugins as $plugin) {
            if (!method_exists($plugin, 'getList')) {
                continue;
            }

            $list[] = $plugin->getList();
        }

        $event = new Event('onWfLinkGetList', ['subject' => $this]);

        Factory::getApplication()->getDispatcher()->dispatch('onWfLinkGetList', $event);

        foreach ((array) $event->getArgument('list', []) as $pluginResult) {
            $list = array_merge($list, (array) $pluginResult);
        }

        return $list;
    }

    public function getLinks($args)
    {
        $args = $this->cleanInput($args, 'STRING');

        $items = array();

        foreach ($this->plugins as $plugin) {
            if (!method_exists($plugin, 'getLinks')) {
                continue;
            }
        
            if (in_array($args->option, $plugin->getOption())) {
                $items = $plugin->getLinks($args);
            }
        }

        $event = new Event('onWfLinkGetLinks', ['subject' => $this, 'args' => $args]);

        Factory::getApplication()->getDispatcher()->dispatch('onWfLinkGetLinks', $event);

        foreach ((array) $event->getArgument('results', []) as $pluginResult) {
            $items[] = $pluginResult;
        }

        $array = array();
        $result = array();

        if (!empty($items)) {
            foreach ($items as $item) {
                $array[] = [
                    'id'    => $this->xmlEncode($item['id'] ?? ''),
                    'url'   => $this->xmlEncode($item['url'] ?? ''),
                    'name'  => $this->xmlEncode($item['name'] ?? ''),
                    'class' => $item['class'] ?? '',
                ];
            }

            $result = array('folders' => $array);
        }

        return $result;
    }

    /**
     * Method to get the search areas.
     */
    public function getSearchAreas()
    {
        $results = array();

        foreach ($this->plugins as $name => $plugin) {
            if (!method_exists($plugin, 'getSearchAreas')) {
                continue;
            }

            $areas = $plugin->getSearchAreas();
        
            $results = array_merge($results, $areas);
        }

        $event = new Event('onWfLinkSearchGetAreas', ['subject' => $this]);

        Factory::getApplication()->getDispatcher()->dispatch('onWfLinkSearchGetAreas', $event);

        foreach ((array) $event->getArgument('areas', []) as $pluginResult) {
            $results = array_merge($results, (array) $pluginResult);
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
        $app = Factory::getApplication();

        // Calculate number of characters to display around the result
        $term_length = StringHelper::strlen($searchword);

        $lang = $app->getLanguage();
        $desc_length = 200;

        $pad_length = $term_length < $desc_length ? (int) floor(($desc_length - $term_length) / 2) : 0;

        // Find the position of the search term
        $pos = $term_length ? StringHelper::strpos(StringHelper::strtolower($text), StringHelper::strtolower($searchword)) : false;

        // Find a potential start point
        $start = ($pos && $pos > $pad_length) ? $pos - $pad_length : 0;

        // Find a space between $start and $pos, start right after it.
        $space = StringHelper::strpos($text, ' ', $start > 0 ? $start - 1 : 0);
        $start = ($space && $space < $pos) ? $space + 1 : $start;

        $text = HTMLHelper::_('string.truncate', StringHelper::substr($text, $start), $desc_length, false);

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
        $text = htmlspecialchars(strip_tags($text));

        // remove shortcode
        $text = preg_replace('#{.+?}#', '', $text);

        // truncate text based around searchword
        $text = $this->truncateText($text, $searchword);

        // highlight searchword
        $text = preg_replace('#\b(' . preg_quote($searchword, '#') . ')\b#i', '<mark>$1</mark>', $text);

        return $text;
    }

    /*
     * Render Search fields
     * This method uses portions of SearchViewSearch::display from components/com_search/views/search/view.html.php
     * @copyright Copyright (C) 2005 - 2012 Open Source Matters, Inc. All rights reserved.
     */

    public function renderSearch($options = array())
    {
        if (!$this->isEnabled('search')) {
            return '';
        }

        // built select lists
        $orders = array();
        $orders[] = HTMLHelper::_('select.option', 'newest', Text::_('WF_SEARCH_NEWEST_FIRST'));
        $orders[] = HTMLHelper::_('select.option', 'oldest', Text::_('WF_SEARCH_OLDEST_FIRST'));
        $orders[] = HTMLHelper::_('select.option', 'popular', Text::_('WF_SEARCH_MOST_POPULAR'));
        $orders[] = HTMLHelper::_('select.option', 'alpha', Text::_('WF_SEARCH_ALPHABETICAL'));
        $orders[] = HTMLHelper::_('select.option', 'category', Text::_('WF_CATEGORY'));

        $lists = array();
        $lists['ordering'] = HTMLHelper::_('select.genericlist', $orders, 'ordering', 'class="inputbox"', 'value', 'text');

        $searchphrases = array();
        $searchphrases[] = HTMLHelper::_('select.option', 'all', Text::_('WF_SEARCH_ALL_WORDS'));
        $searchphrases[] = HTMLHelper::_('select.option', 'any', Text::_('WF_SEARCH_ANY_WORDS'));
        $searchphrases[] = HTMLHelper::_('select.option', 'exact', Text::_('WF_SEARCH_EXACT_PHRASE'));
        $lists['searchphrase'] = HTMLHelper::_('select.radiolist', $searchphrases, 'searchphrase', '', 'value', 'text', 'all');

        $view = new \Wfe\Document\View(
            array(
                'name'          => 'search',
                'layout'        => 'search',
                'template_path' => WF_EDITOR . '/views/adapter/links/tmpl'
            )
        );

        $searchAreas = $this->getSearchAreas();

        $view->set('searchareas', $searchAreas);
        $view->set('lists', $lists);

        $view->display();
    }

    /**
     * Process search.
     *
     * @param  string $query Search query
     * @return array  Search Results
     *
     * This method uses portions of SearchController::search from components/com_search/controller.php
     *
     * @copyright Copyright (C) 2005 - 2012 Open Source Matters, Inc. All rights reserved
     */
    public function doSearch($query)
    {
        $results = array();

        if (empty($query)) {
            return $results;
        }

        // search area
        $area = null;

        // available search areas
        $areas = $this->getSearchAreas();

        // query using a specific plugin
        if (strpos($query, ':') !== false) {
            preg_match('#^(' . implode('|', $areas) . ')\:(.+)#', $query, $matches);

            if ($matches) {
                $area = array($matches[1]);
                $query = $matches[2];
            }
        }

        $app = Factory::getApplication('site');
        $filter = InputFilter::getInstance();

        $limit = (int) $this->getParam('search_limit', 50);

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

        $searches = array();

        foreach ($this->plugins as $name => $plugin) {
            if (!method_exists($plugin, 'doSearch')) {
                continue;
            }

            $searches[$name] = $plugin->doSearch($searchword, $searchphrase, $ordering, $area);
        }

        $searchEvent = new Event('onWfLinkSearch', [
            'subject'   => $this,
            'text'      => $searchword,
            'phrase'    => $searchphrase,
            'ordering'  => $ordering,
            'areas'     => $area,
        ]);

        $app->getDispatcher()->dispatch('onWfLinkSearch', $searchEvent);

        foreach ((array) $searchEvent->getArgument('results', []) as $pluginResult) {
            $searches = array_merge($searches, (array) $pluginResult);
        }

        $rows = [];

        foreach ($searches as $search) {
            foreach ((array) $search as $component => $items) {
                $rows[$component] = array_merge($rows[$component] ?? [], (array) $items);
            }
        }

        // calculate needle once outside the loop
        if ($searchphrase === 'exact') {
            $needle = $searchword;
        } else {
            $searchworda = preg_replace('#\xE3\x80\x80#s', ' ', $searchword);
            $needle = preg_split("/\s+/u", $searchworda)[0];
        }

        $areas = [];
        $total = 0;
        $language = Factory::getApplication()->getLanguage();

        foreach ($rows as $component => $items) {
            if (empty($items)) {
                continue;
            }

            $language->load($component . '.sys', JPATH_ADMINISTRATOR);
            $language->load($component, JPATH_ADMINISTRATOR);

            $areaData = [];

            foreach ($items as $row) {
                if ($total >= $limit) {
                    break 2;
                }

                if (empty($row->href) || empty($row->title)) {
                    continue;
                }

                // prepare and truncate search text
                $row->text = $this->prepareSearchContent($row->text, $needle);

                $result = new \StdClass;
                $result->title = $row->title;
                $result->text = $row->text;
                $result->url = $row->href;

                if (!empty($row->anchors)) {
                    $result->anchors = $row->anchors;
                }

                $areaData[] = $result;
                $total++;
            }

            if (!empty($areaData)) {
                $areas[] = [
                    'label' => Text::_($component),
                    'type'  => 'content',
                    'data'  => $areaData,
                ];
            }
        }

        $results = array_values($areas);

        return $results;
    }

    private function cleanInput($args, $method = 'string')
    {
        $filter = InputFilter::getInstance();

        foreach ($args as $k => $v) {
            $args->$k = $filter->clean($v, $method);
            $args->$k = (string) filter_var($args->$k, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_BACKTICK);
            $args->$k = htmlspecialchars(strip_tags($args->$k));
        }

        return $args;
    }

    /**
     * XML encode a string.
     *
     * @param     string    String to encode
     *
     * @return string Encoded string
     */
    private function xmlEncode($string)
    {
        return htmlspecialchars($string, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}
