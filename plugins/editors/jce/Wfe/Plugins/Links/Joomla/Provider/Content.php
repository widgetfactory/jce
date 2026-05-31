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

use Joomla\CMS\Factory;
use Joomla\CMS\Helper\RouteHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Table\Table;
use Joomla\Database\DatabaseInterface;
use Joomla\CMS\Uri\Uri;
use Wfe\Helper\LinkHelper;

class Content extends \Wfe\Plugins\Links\Joomla\Provider\AbstractProvider
{
    protected $option = 'com_content';

    public function getSearchAreas(): array
    {
        static $areas = [
            'com_content' => 'JGLOBAL_ARTICLES',
        ];

        return $areas;
    }

    public function getParam($key, $default = null)
    {
        $legacyKey = '';

        if ($key == 'alias') {
            $legacyKey = 'article_alias';
        }

        $value = parent::getParam($key, '');

        if ($value === '' && $legacyKey !== '') {
            $value = parent::getParam($legacyKey);
        }

        if (is_numeric($value)) {
            return (bool) $value;
        }

        if ($value === '') {
            return $default;
        }

        return $value;
    }

    /**
     * Search content articles.
     *
     * @param \Joomla\Registry\Registry $options
     */
    public function doSearch($options = null): array
    {
        if (empty($options)) {
            return [];
        }

        $text      = $options->get('text', '');
        $phrase    = $options->get('phrase', 'any');
        $ordering  = $options->get('ordering', 'newest');
        $areas     = $options->get('areas', null);

        $app  = Factory::getApplication();
        $db   = Factory::getContainer()->get(DatabaseInterface::class);
        $user = $app->getIdentity();

        $groups = implode(',', array_map('intval', $user->getAuthorisedViewLevels()));

        if (is_array($areas) && !array_intersect($areas, array_keys($this->getSearchAreas()))) {
            return [];
        }

        $limit = $this->getParam('search_limit', 50);

        $text = trim($text);

        if ($text === '') {
            return [];
        }

        $relevance = [];

        switch ($phrase) {
            case 'exact':
                $text    = $db->quote('%' . $db->escape($text, true) . '%', false);
                $wheres2 = [];
                $wheres2[] = 'a.title LIKE ' . $text;
                $wheres2[] = 'a.introtext LIKE ' . $text;
                $wheres2[] = 'a.fulltext LIKE ' . $text;

                $relevance[] = ' CASE WHEN ' . $wheres2[0] . ' THEN 5 ELSE 0 END ';

                $where = '(' . implode(') OR (', $wheres2) . ')';
                break;

            case 'all':
            case 'any':
            default:
                $words  = explode(' ', $text);
                $wheres = [];

                foreach ($words as $word) {
                    $word    = $db->quote('%' . $db->escape($word, true) . '%', false);
                    $wheres2 = [];
                    $wheres2[] = 'LOWER(a.title) LIKE LOWER(' . $word . ')';
                    $wheres2[] = 'LOWER(a.introtext) LIKE LOWER(' . $word . ')';
                    $wheres2[] = 'LOWER(a.fulltext) LIKE LOWER(' . $word . ')';

                    $relevance[] = ' CASE WHEN ' . $wheres2[0] . ' THEN 5 ELSE 0 END ';

                    $wheres[] = implode(' OR ', $wheres2);
                }

                $where = '(' . implode(($phrase === 'all' ? ') AND (' : ') OR ('), $wheres) . ')';
                break;
        }

        switch ($ordering) {
            case 'oldest':
                $order = 'a.created ASC';
                break;
            case 'popular':
                $order = 'a.hits DESC';
                break;
            case 'alpha':
                $order = 'a.title ASC';
                break;
            case 'category':
                $order = 'c.title ASC, a.title ASC';
                break;
            case 'newest':
            default:
                $order = 'a.created DESC';
                break;
        }

        $rows  = [];
        $query = $db->getQuery(true);

        if ($limit > 0) {
            // SQLSRV-compatible slug columns
            $case_when1  = ' CASE WHEN ';
            $case_when1 .= $query->charLength('a.alias', '!=', '0');
            $case_when1 .= ' THEN ';
            $a_id        = $query->castAs('CHAR', 'a.id');
            $case_when1 .= $query->concatenate([$a_id, 'a.alias'], ':');
            $case_when1 .= ' ELSE ';
            $case_when1 .= $a_id . ' END as slug';

            $case_when2  = ' CASE WHEN ';
            $case_when2 .= $query->charLength('b.alias', '!=', '0');
            $case_when2 .= ' THEN ';
            $c_id        = $query->castAs('CHAR', 'b.id');
            $case_when2 .= $query->concatenate([$c_id, 'b.alias'], ':');
            $case_when2 .= ' ELSE ';
            $case_when2 .= $c_id . ' END as catslug';

            $case = ',' . $case_when1 . ',' . $case_when2;

            if (!empty($relevance)) {
                $query->select(implode(' + ', $relevance) . ' AS relevance');
                $order = ' relevance DESC, ' . $order;
            }

            $query->select('a.id AS slug, b.id AS catslug, a.alias, a.state, a.title AS title, a.access, '
                . $query->concatenate(['a.introtext', 'a.fulltext']) . ' AS text, a.language' . $case);
            $query->from('#__content AS a');
            $query->innerJoin('#__categories AS b ON b.id = a.catid');
            $query->where('(' . $where . ') AND a.state = 1 AND b.published = 1');

            if (!$user->authorise('core.admin')) {
                $query->where('a.access IN (' . $groups . ')');
                $query->where('b.access IN (' . $groups . ')');
            }

            $query->order($order);

            $db->setQuery($query, 0, $limit);

            try {
                $rows = $db->loadObjectList();
            } catch (\RuntimeException $e) {
                $rows = [];
                Factory::getApplication()->enqueueMessage(Text::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
            }

            if ($rows) {
                $router = new RouteHelper();

                foreach ($rows as $key => $row) {
                    $href = $router->getRoute($row->slug, 'com_content.article', '', $row->language, $row->catslug);

                    // remove base url
                    if (Uri::base(true) && strpos($href, Uri::base(true)) !== false) {
                        $href = substr_replace($href, '', 0, strlen(Uri::base(true)) + 1);
                    }

                    $href = $this->routeUrl($href);

                    $rows[$key]->href = $href;
                }
            }
        }

        return $rows;
    }

    public function getList(): string
    {
        return '<li id="index.php?option=com_content" class="folder content nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . Text::_('WF_LINKS_JOOMLALINKS_CONTENT') . '</span></a></div></li>';
    }

    /**
     * Get links from content articles by category
     *
     * @param [type] $args
     * @return array
     */
    public function getLinks($args): array
    {
        $items    = [];
        $view     = isset($args->view) ? $args->view : '';
        $language = '';

        $router = new RouteHelper();

        switch ($view) {
            // Top-level categories (and articles in them)
            default:
                if (!isset($args->id)) {
                    $args->id = 1;
                }

                $categories = $this->getCategory('com_content', $args->id);
                $articles   = $this->getArticles($args->id);

                foreach ($categories as $category) {
                    if (isset($category->language)) {
                        $language = $category->language;
                    }

                    $id  = RouteHelper::getCategoryRoute($category->id, $language, 'com_content');
                    $url = $id;

                    if (strpos($id, 'index.php?Itemid=') !== false) {
                        $url = $this->getMenuLink($id);
                        $id  = 'index.php?option=com_content&view=category&id=' . $category->id;
                    }

                    $items[] = [
                        'url'   => $this->routeUrl($url),
                        'id'    => $id,
                        'name'  => $category->title . ' / ' . $category->alias,
                        'class' => 'folder content',
                    ];
                }

                foreach ($articles as $article) {
                    if (isset($article->language)) {
                        $language = $article->language;
                    }

                    $id = $router->getRoute($article->slug, 'com_content.article', '', $language, $article->catslug);
                    $id = $this->routeUrl($id);

                    $items[] = [
                        'id'    => $id,
                        'name'  => $article->title . ' / ' . $article->alias,
                        'class' => 'file',
                    ];

                    $anchors = LinkHelper::getAnchors($article->content);

                    foreach ($anchors as $anchor) {
                        $items[] = [
                            'id'    => $id . '#' . $anchor,
                            'name'  => '#' . $anchor,
                            'class' => 'file anchor',
                        ];
                    }
                }

                break;

            // Sub-categories and articles within a category
            case 'category':
                $articles   = $this->getArticles($args->id);
                $categories = $this->getCategory('com_content', $args->id);

                if (count($categories)) {
                    foreach ($categories as $category) {
                        $sub = $this->getCategory('com_content', $category->id);

                        if (isset($category->language)) {
                            $language = $category->language;
                        }

                        $id  = RouteHelper::getCategoryRoute($category->id, $language, 'com_content');
                        $url = $id;

                        if (count($sub)) {
                            $id = 'index.php?option=com_content&view=section&id=' . $category->id;
                        } else {
                            if (strpos($id, 'index.php?Itemid=') !== false) {
                                $url = $id;
                                $id  = 'index.php?option=com_content&view=category&id=' . $category->id;
                            }
                        }

                        if (strpos($url, 'index.php?Itemid=') !== false) {
                            $url = $this->getMenuLink($url);
                        }

                        $items[] = [
                            'url'   => $this->routeUrl($url),
                            'id'    => $id,
                            'name'  => $category->title . ' / ' . $category->alias,
                            'class' => 'folder content',
                        ];
                    }
                }

                foreach ($articles as $article) {
                    if (isset($article->language)) {
                        $language = $article->language;
                    }

                    $id = $router->getRoute($article->slug, 'com_content.article', '', $language, $article->catslug);
                    $id = $this->routeUrl($id);

                    $items[] = [
                        'id'    => $id,
                        'name'  => $article->title . ' / ' . $article->alias,
                        'class' => 'file' . ($article->state ? '' : ' unpublished uk-text-muted'),
                    ];

                    $anchors = LinkHelper::getAnchors($article->content);

                    foreach ($anchors as $anchor) {
                        $items[] = [
                            'id'    => $id . '#' . $anchor,
                            'name'  => '#' . $anchor,
                            'class' => 'file anchor',
                        ];
                    }
                }

                break;
        }

        return $items;
    }

    private function getMenuLink($url)
    {
        if ($this->getParam('alias', 1)) {
            preg_match('#Itemid=([\d]+)#', $url, $matches);

            if (count($matches) > 1) {
                $menu = Table::getInstance('menu');
                $menu->load($matches[1]);

                if ($menu->link) {
                    return $menu->link . '&Itemid=' . $menu->id;
                }
            }
        }

        return $url;
    }

    private function getArticles($id)
    {
        $db   = Factory::getContainer()->get(DatabaseInterface::class);
        $user = Factory::getApplication()->getIdentity();

        $query  = $db->getQuery(true);
        $groups = implode(',', array_map('intval', $user->getAuthorisedViewLevels()));

        $case = '';

        if ($this->getParam('alias', 0)) {
            $case_when1  = ' CASE WHEN ';
            $case_when1 .= $query->charLength('a.alias', '!=', '0');
            $case_when1 .= ' THEN ';
            $a_id        = $query->castAs('CHAR', 'a.id');
            $case_when1 .= $query->concatenate([$a_id, 'a.alias'], ':');
            $case_when1 .= ' ELSE ';
            $case_when1 .= $a_id . ' END as slug';

            $case_when2  = ' CASE WHEN ';
            $case_when2 .= $query->charLength('b.alias', '!=', '0');
            $case_when2 .= ' THEN ';
            $c_id        = $query->castAs('CHAR', 'b.id');
            $case_when2 .= $query->concatenate([$c_id, 'b.alias'], ':');
            $case_when2 .= ' ELSE ';
            $case_when2 .= $c_id . ' END as catslug';

            $case = ',' . $case_when1 . ',' . $case_when2;
        }

        $query->select('a.id AS slug, b.id AS catslug, a.alias, a.state, a.title AS title, a.access, '
            . $query->concatenate(['a.introtext', 'a.fulltext']) . ' AS content, a.language' . $case);
        $query->from('#__content AS a');
        $query->innerJoin('#__categories AS b ON b.id = ' . (int) $id);
        $query->where('a.catid = ' . (int) $id);

        if ($this->getParam('unpublished', 0) == 1) {
            $query->where('(a.state = 0 OR a.state = 1)');
        } else {
            $query->where('a.state = 1');
        }

        if (!$user->authorise('core.admin')) {
            $query->where('a.access IN (' . $groups . ')');
            $query->where('b.access IN (' . $groups . ')');
        }

        $query->order('a.title');

        $db->setQuery($query, 0);

        return $db->loadObjectList();
    }
}
