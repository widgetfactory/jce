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
use Joomla\CMS\Language\Text;
use Joomla\Database\DatabaseInterface;
use Joomla\CMS\Uri\Uri;

class Weblinks extends \Wfe\Plugins\Links\Joomla\Provider\AbstractProvider
{
    protected $option = 'com_weblinks';

    public function getSearchAreas(): array
    {
        static $areas = [
            'com_weblinks' => 'PLG_SEARCH_WEBLINKS_WEBLINKS',
        ];

        return $areas;
    }

    /**
     * Search weblinks.
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

        if ($text == '') {
            return [];
        }

        switch ($phrase) {
            case 'exact':
                $text    = $db->quote('%' . $db->escape($text, true) . '%', false);
                $wheres2 = [];
                $wheres2[] = 'a.url LIKE ' . $text;
                $wheres2[] = 'a.description LIKE ' . $text;
                $wheres2[] = 'a.title LIKE ' . $text;
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
                    $wheres2[] = 'a.url LIKE ' . $word;
                    $wheres2[] = 'a.description LIKE ' . $word;
                    $wheres2[] = 'a.title LIKE ' . $word;
                    $wheres[] = implode(' OR ', $wheres2);
                }

                $where = '(' . implode(($phrase == 'all' ? ') AND (' : ') OR ('), $wheres) . ')';
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

        $query = $db->getQuery(true);

        // SQLSRV-compatible slug columns
        $case_when  = ' CASE WHEN ';
        $case_when .= $query->charLength('a.alias', '!=', '0');
        $case_when .= ' THEN ';
        $a_id       = $query->castAs('CHAR', 'a.id');
        $case_when .= $query->concatenate([$a_id, 'a.alias'], ':');
        $case_when .= ' ELSE ';
        $case_when .= $a_id . ' END as slug';

        $case_when1  = ' CASE WHEN ';
        $case_when1 .= $query->charLength('c.alias', '!=', '0');
        $case_when1 .= ' THEN ';
        $c_id        = $query->castAs('CHAR', 'c.id');
        $case_when1 .= $query->concatenate([$c_id, 'c.alias'], ':');
        $case_when1 .= ' ELSE ';
        $case_when1 .= $c_id . ' END as catslug';

        $query->select('a.title AS title, a.created AS created, a.url, a.description AS text, a.language, ' . $case_when . ',' . $case_when1)
            ->from('#__weblinks AS a')
            ->join('INNER', '#__categories as c ON c.id = a.catid')
            ->where('(' . $where . ') AND a.state = 1 AND c.published = 1 AND c.access IN (' . $groups . ')')
            ->order($order);

        $db->setQuery($query, 0, $limit);
        $rows = $db->loadObjectList();

        if ($rows) {
            // Use the component RouteHelper if available
            if (class_exists('\\Joomla\\Component\\Weblinks\\Site\\Helper\\RouteHelper')) {

                foreach ($rows as $key => $row) {
                    $href = \Joomla\Component\Weblinks\Site\Helper\RouteHelper::getWeblinkRoute($row->slug, $row->catslug, $row->language);

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
        return '<li id="index.php?option=com_weblinks&view=categories" class="folder menu nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . Text::_('WF_LINKS_JOOMLALINKS_WEBLINKS') . '</span></a></div></li>';
    }

    public function getLinks($args): array
    {
        $items    = [];
        $language = '';

        $helperFile = JPATH_SITE . '/components/com_weblinks/helpers/route.php';
        if (is_file($helperFile)) {
            require_once $helperFile;
        }

        switch ($args->view) {
            default:
            case 'categories':
                $categories = $this->getCategory('com_weblinks');

                foreach ($categories as $category) {
                    $url = '';

                    if (method_exists('WeblinksHelperRoute', 'getCategoryRoute')) {
                        if (isset($category->language)) {
                            $language = $category->language;
                        }

                        $id = \WeblinksHelperRoute::getCategoryRoute($category->id, $language);

                        if (strpos($id, 'index.php?Itemid=') !== false) {
                            $url = $id;
                            $id  = 'index.php?option=com_weblinks&view=category&id=' . $category->id;
                        }
                    } else {
                        $itemid = $this->getItemId('com_weblinks', ['categories' => null, 'category' => $category->id]);
                        $id     = 'index.php?option=com_weblinks&view=category&id=' . $category->id . $itemid;
                    }

                    $items[] = [
                        'url'   => $this->routeUrl($url),
                        'id'    => $id,
                        'name'  => $category->title . ' / ' . $category->alias,
                        'class' => 'folder weblink',
                    ];
                }
                break;

            case 'category':
                $categories = $this->getCategory('com_weblinks', $args->id);

                if (count($categories)) {
                    foreach ($categories as $category) {
                        $children = $this->getCategory('com_weblinks', $category->id);
                        $url      = '';

                        if ($children) {
                            $id = 'index.php?option=com_weblinks&view=category&id=' . $category->id;
                        } else {
                            if (method_exists('WeblinksHelperRoute', 'getCategoryRoute')) {
                                if (isset($category->language)) {
                                    $language = $category->language;
                                }

                                $id = \WeblinksHelperRoute::getCategoryRoute($category->id, $language);

                                if (strpos($id, 'index.php?Itemid=') !== false) {
                                    $url = $id;
                                    $id  = 'index.php?option=com_weblinks&view=category&id=' . $category->id;
                                }
                            } else {
                                $itemid = $this->getItemId('com_weblinks', ['categories' => null, 'category' => $category->id]);
                                $id     = 'index.php?option=com_weblinks&view=category&id=' . $category->id . $itemid;
                            }
                        }

                        $items[] = [
                            'url'   => $this->routeUrl($url),
                            'id'    => $id,
                            'name'  => $category->title . ' / ' . $category->alias,
                            'class' => 'folder weblink',
                        ];
                    }
                }

                $weblinks = $this->getWeblinks($args->id);

                foreach ($weblinks as $weblink) {
                    if (isset($weblink->language)) {
                        $language = $weblink->language;
                    }

                    $id = \WeblinksHelperRoute::getWeblinkRoute($weblink->slug, $weblink->catslug, $language);

                    $id .= '&task=weblink.go';

                    $items[] = [
                        'id'    => $this->routeUrl($id),
                        'name'  => $weblink->title . ' / ' . $weblink->alias,
                        'class' => 'file',
                    ];
                }
                break;
        }

        return $items;
    }

    private function getWeblinks($id)
    {
        $db    = Factory::getContainer()->get(DatabaseInterface::class);
        $user  = Factory::getApplication()->getIdentity();
        $query = $db->getQuery(true);
        $case  = '';

        if ((int) $this->getParam('weblinks_alias', 0)) {
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

            $case .= ',' . $case_when1 . ',' . $case_when2;
        }

        $query->select('a.id AS slug, b.id AS catslug, a.title AS title, a.description AS text, a.url, a.alias, a.language' . $case);
        $query->from('#__weblinks AS a');
        $query->innerJoin('#__categories AS b ON b.id = ' . (int) $id);
        $query->where('a.catid = ' . (int) $id);
        $query->where('a.state = 1');

        if (!$user->authorise('core.admin')) {
            $query->where('b.access IN (' . implode(',', array_map('intval', $user->getAuthorisedViewLevels())) . ')');
        }

        $query->where('b.published = 1');
        $query->order('a.title');

        $db->setQuery($query, 0);

        return $db->loadObjectList();
    }
}
