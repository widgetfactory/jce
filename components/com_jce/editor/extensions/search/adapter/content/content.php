<?php
/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Adapted from the Joomla Search.content plugin - plugins/search/content/content.php
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */

defined('JPATH_PLATFORM') or die;

/**
 * Content search plugin.
 *
 */
class PlgWfSearchContent extends JPlugin
{
    /**
     * Determine areas searchable by this plugin.
     *
     * @return  array  An array of search areas.
     *
     */
    public function onContentSearchAreas()
    {
        static $areas = array(
            'content' => 'JGLOBAL_ARTICLES',
        );

        return $areas;
    }

    /**
     * Search content (articles).
     * The SQL must return the following fields that are used in a common display
     * routine: href, title, section, created, text, browsernav.
     *
     * @param   string  $text      Target search string.
     * @param   string  $phrase    Matching option (possible values: exact|any|all).  Default is "any".
     * @param   string  $ordering  Ordering option (possible values: newest|oldest|popular|alpha|category).  Default is "newest".
     * @param   mixed   $areas     An array if the search it to be restricted to areas or null to search all areas.
     *
     * @return  array  Search results.
     *
     */
    public function onContentSearch($text, $phrase = '', $ordering = '', $areas = null)
    {
        $db = JFactory::getDbo();
        $serverType = $db->getServerType();
        $app = JFactory::getApplication();
        $user = JFactory::getUser();
        $groups = implode(',', $user->getAuthorisedViewLevels());
        $tag = JFactory::getLanguage()->getTag();

        $searchText = $text;

        if (is_array($areas) && !array_intersect($areas, array_keys($this->onContentSearchAreas()))) {
            return array();
        }

        $limit = $this->params->def('search_limit', 50);

        $nullDate = $db->getNullDate();
        $date = JFactory::getDate();
        $now = $date->toSql();

        $text = trim($text);

        if ($text === '') {
            return array();
        }

        $relevance = array();

        switch ($phrase) {
            case 'exact':
                $text = $db->quote('%' . $db->escape($text, true) . '%', false);
                $wheres2 = array();
                $wheres2[] = 'a.title LIKE ' . $text;
                $wheres2[] = 'a.introtext LIKE ' . $text;
                $wheres2[] = 'a.fulltext LIKE ' . $text;

                $relevance[] = ' CASE WHEN ' . $wheres2[0] . ' THEN 5 ELSE 0 END ';

                $where = '(' . implode(') OR (', $wheres2) . ')';
                break;

            case 'all':
            case 'any':
            default:
                $words = explode(' ', $text);
                $wheres = array();

                foreach ($words as $word) {
                    $word = $db->quote('%' . $db->escape($word, true) . '%', false);
                    $wheres2 = array();
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

        $rows = array();
        $query = $db->getQuery(true);

        // Search articles.
        if ($limit > 0) {
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

            if (!empty($relevance)) {
                $query->select(implode(' + ', $relevance) . ' AS relevance');
                $order = ' relevance DESC, ' . $order;
            }

            $query->select('a.id AS slug, b.id AS catslug, a.alias, a.state, a.title AS title, a.access, ' . $query->concatenate(array('a.introtext', 'a.fulltext')) . ' AS text, a.language' . $case);
            $query->from('#__content AS a');
            $query->innerJoin('#__categories AS b ON b.id = a.catid');
            $query->where('(' . $where . ') AND a.state = 1 AND b.published = 1');

            if (!$user->authorise('core.admin')) {
                $query->where('a.access IN (' . $groups . ')');
                $query->where('b.access IN (' . $groups . ')');
            }

            $query->order($order);

            $db->setQuery($query, 0, $limit);

            try
            {
                $rows = $db->loadObjectList();
            } catch (RuntimeException $e) {
                $rows = array();
                JFactory::getApplication()->enqueueMessage(JText::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
            }

            if ($rows) {
                // create a new RouteHelper instance
                $router = new JHelperRoute();

                foreach ($rows as $key => $row) {
                    $rows[$key]->href = $router->getRoute($row->slug, 'com_content.article', '', $row->language, $row->catslug);
                }
            }
        }

        return $rows;
    }
}
