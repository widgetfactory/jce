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
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;

require_once JPATH_SITE . '/components/com_weblinks/helpers/route.php';

/**
 * Weblinks search plugin.
 *
 */
class PlgWfSearchWeblinks extends CMSPlugin
{
    /**
     * Load the language file on instantiation.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    /**
     * Determine areas searchable by this plugin.
     *
     * @return  array  An array of search areas.
     *
     */
    public function onContentSearchAreas()
    {
        static $areas = array(
            'weblinks' => 'PLG_SEARCH_WEBLINKS_WEBLINKS',
        );

        return $areas;
    }

    /**
     * Search content (weblinks).
     *
     * The SQL must return the following fields that are used in a common display
     * routine: href, title, section, created, text, browsernav
     *
     * @param   string  $text      Target search string.
     * @param   string  $phrase    Matching option (possible values: exact|any|all).  Default is "any".
     * @param   string  $ordering  Ordering option (possible values: newest|oldest|popular|alpha|category).  Default is "newest".
     * @param   mixed   $areas     An array if the search it to be restricted to areas or null to search all areas.
     *
     * @return  array  Search results.
     *
     * @since   1.6
     */
    public function onContentSearch($text, $phrase = '', $ordering = '', $areas = null)
    {
        $db = Factory::getDbo();
        $groups = implode(',', Factory::getUser()->getAuthorisedViewLevels());

        $searchText = $text;

        if (is_array($areas)) {
            if (!array_intersect($areas, array_keys($this->onContentSearchAreas()))) {
                return array();
            }
        }

        $limit = $this->params->def('search_limit', 50);
        $state = array();

        $text = trim($text);

        if ($text == '') {
            return array();
        }

        switch ($phrase) {
            case 'exact':
                $text = $db->quote('%' . $db->escape($text, true) . '%', false);
                $wheres2 = array();
                $wheres2[] = 'a.url LIKE ' . $text;
                $wheres2[] = 'a.description LIKE ' . $text;
                $wheres2[] = 'a.title LIKE ' . $text;
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
        }

        $query = $db->getQuery(true);

        // SQLSRV changes.
        $case_when = ' CASE WHEN ';
        $case_when .= $query->charLength('a.alias', '!=', '0');
        $case_when .= ' THEN ';
        $a_id = $query->castAsChar('a.id');
        $case_when .= $query->concatenate(array($a_id, 'a.alias'), ':');
        $case_when .= ' ELSE ';
        $case_when .= $a_id . ' END as slug';

        $case_when1 = ' CASE WHEN ';
        $case_when1 .= $query->charLength('c.alias', '!=', '0');
        $case_when1 .= ' THEN ';
        $c_id = $query->castAsChar('c.id');
        $case_when1 .= $query->concatenate(array($c_id, 'c.alias'), ':');
        $case_when1 .= ' ELSE ';
        $case_when1 .= $c_id . ' END as catslug';

        $query->select('a.title AS title, a.created AS created, a.url, a.description AS text, a.language, ' . $case_when . "," . $case_when1)
            ->from('#__weblinks AS a')
            ->join('INNER', '#__categories as c ON c.id = a.catid')
            ->where('(' . $where . ') AND a.state = 1 AND c.published = 1 AND c.access IN (' . $groups . ')')
            ->order($order);

        $db->setQuery($query, 0, $limit);
        $rows = $db->loadObjectList();

        if ($rows) {
            foreach ($rows as $key => $row) {
                $rows[$key]->href = WeblinksHelperRoute::getWeblinkRoute($row->slug, $row->catslug, $row->language);
            }
        }

        return $rows;
    }
}
