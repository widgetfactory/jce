<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Helper\RouteHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Table\Table;

class JoomlalinksContent extends CMSObject
{
    private $option = 'com_content';

    /**
     * Returns a reference to a editor object.
     *
     * @return JCE The editor object
     *
     * @since    1.5
     */
    public static function getInstance($options = array())
    {
        static $instance;

        if (!is_object($instance)) {
            $instance = new self($options);
        }

        return $instance;
    }

    public function getOption()
    {
        return $this->option;
    }

    public function getList()
    {
        return '<li id="index.php?option=com_content" class="folder content nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . Text::_('WF_LINKS_JOOMLALINKS_CONTENT') . '</span></a></div></li>';
    }

    public function getLinks($args)
    {
        $items = array();
        $view = isset($args->view) ? $args->view : '';

        $language = '';

        // create a new RouteHelper instance
        $router = new RouteHelper();

        switch ($view) {
            // get top-level categories
            default:
                $articles = array();

                if (!isset($args->id)) {
                    $args->id = 1;
                }

                $categories = WFLinkBrowser::getCategory('com_content', $args->id);

                // get any articles in this category (in Joomla! 1.6+ a category can contain sub-categories and articles)
                $articles = self::getArticles($args->id);

                foreach ($categories as $category) {
                    $url = '';

                    if (isset($category->language)) {
                        $language = $category->language;
                    }

                    $id = RouteHelper::getCategoryRoute($category->id, $language, 'com_content');

                    if (strpos($id, 'index.php?Itemid=') !== false) {
                        $url = self::getMenuLink($id);
                        $id = 'index.php?option=com_content&view=category&id=' . $category->id;
                    }

                    $items[] = array(
                        'url' => self::route($url),
                        'id' => $id,
                        'name' => $category->title . ' / ' . $category->alias,
                        'class' => 'folder content',
                    );
                }

                if (!empty($articles)) {
                    // output article links
                    foreach ($articles as $article) {
                        if (isset($article->language)) {
                            $language = $article->language;
                        }

                        $id = $router->getRoute($article->slug, 'com_content.article', '', $language, $article->catslug);
                        $id = self::route($id);

                        $items[] = array(
                            'id' => $id,
                            'name' => $article->title . ' / ' . $article->alias,
                            'class' => 'file',
                        );

                        $anchors = self::getAnchors($article->content);

                        foreach ($anchors as $anchor) {
                            $items[] = array(
                                'id' => $id . '#' . $anchor,
                                'name' => '#' . $anchor,
                                'class' => 'file anchor',
                            );
                        }
                    }
                }

                break;
            // get articles and / or sub-categories
            case 'category':
                // get any articles in this category (in Joomla! 1.6+ a category can contain sub-categories and articles)
                $articles = self::getArticles($args->id);

                // get sub-categories
                $categories = WFLinkBrowser::getCategory('com_content', $args->id);

                if (count($categories)) {
                    foreach ($categories as $category) {
                        // check for sub-categories
                        $sub = WFLinkBrowser::getCategory('com_content', $category->id);

                        // language
                        if (isset($category->language)) {
                            $language = $category->language;
                        }

                        $url = '';
                        $id = RouteHelper::getCategoryRoute($category->id, $language, 'com_content');

                        // get sub-categories
                        if (count($sub)) {
                            $url = $id;
                            $id = 'index.php?option=com_content&view=section&id=' . $category->id;
                            // no sub-categories, get articles for category
                        } else {
                            // no com_content, might be link like index.php?ItemId=1
                            if (strpos($id, 'index.php?Itemid=') !== false) {
                                $url = $id; //$id;
                                $id = 'index.php?option=com_content&view=category&id=' . $category->id;
                            }
                        }

                        if (strpos($url, 'index.php?Itemid=') !== false) {
                            $url = self::getMenuLink($url);
                        }

                        $items[] = array(
                            'url' => self::route($url),
                            'id' => $id,
                            'name' => $category->title . ' / ' . $category->alias,
                            'class' => 'folder content',
                        );
                    }
                }

                // output article links
                foreach ($articles as $article) {
                    // language
                    if (isset($article->language)) {
                        $language = $article->language;
                    }

                    $id = $router->getRoute($article->slug, 'com_content.article', '', $language, $article->catslug);
                    $id = self::route($id);

                    $items[] = array(
                        'id' => $id,
                        'name' => $article->title . ' / ' . $article->alias,
                        'class' => 'file' . ($article->state ? '' : ' unpublished uk-text-muted'),
                    );

                    $anchors = self::getAnchors($article->content);

                    foreach ($anchors as $anchor) {
                        $items[] = array(
                            'id' => $id . '#' . $anchor,
                            'name' => '#' . $anchor,
                            'class' => 'file anchor',
                        );
                    }
                }

                break;
        }

        return $items;
    }

    private static function getMenuLink($url)
    {
        $wf = WFEditorPlugin::getInstance();

        // resolve the url from the menu link
        if ($wf->getParam('links.joomlalinks.article_resolve_alias', 1)) {
            // get itemid
            preg_match('#Itemid=([\d]+)#', $url, $matches);
            // get link from menu
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
        $db = Factory::getDBO();
        $user = Factory::getUser();

        $wf = WFEditorPlugin::getInstance();

        $query = $db->getQuery(true);

        $case = '';

        if ($wf->getParam('links.joomlalinks.article_alias', 1)) {
            //sqlsrv changes
            $case_when1 = ' CASE WHEN ';
            $case_when1 .= $query->charLength('a.alias', '!=', '0');
            $case_when1 .= ' THEN ';
            $a_id = $query->castAsChar('a.id');
            $case_when1 .= $query->concatenate(array($a_id, 'a.alias'), ':');
            $case_when1 .= ' ELSE ';
            $case_when1 .= $a_id . ' END as slug';

            $case_when2 = ' CASE WHEN ';
            $case_when2 .= $query->charLength('b.alias', '!=', '0');
            $case_when2 .= ' THEN ';
            $c_id = $query->castAsChar('b.id');
            $case_when2 .= $query->concatenate(array($c_id, 'b.alias'), ':');
            $case_when2 .= ' ELSE ';
            $case_when2 .= $c_id . ' END as catslug';

            $case = ',' . $case_when1 . ',' . $case_when2;
        }

        $groups = implode(',', $user->getAuthorisedViewLevels());

        $query->select('a.id AS slug, b.id AS catslug, a.alias, a.state, a.title AS title, a.access, ' . $query->concatenate(array('a.introtext', 'a.fulltext')) . ' AS content, a.language' . $case);
        $query->from('#__content AS a');
        $query->innerJoin('#__categories AS b ON b.id = ' . (int) $id);

        $query->where('a.catid = ' . (int) $id);

        if ($wf->getParam('links.joomlalinks.article_unpublished', 0) == 1) {
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

    private static function route($url)
    {
        $wf = WFEditorPlugin::getInstance();

        if ((bool) $wf->getParam('links.joomlalinks.sef_url', 0)) {
            $url = WFLinkHelper::route($url);
        }

        // remove Itemid if "home"
        $url = WFLinkHelper::removeHomeItemId($url);

        // remove Itemid if set
        if ((bool) $wf->getParam('links.joomlalinks.itemid', 1) === false) {
            $url = WFLinkHelper::removeItemId($url);
        }

        return $url;
    }
}
