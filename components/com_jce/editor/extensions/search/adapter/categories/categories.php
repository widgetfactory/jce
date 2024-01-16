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
use Joomla\CMS\Plugin\CMSPlugin;

/**
 * Categories search plugin.
 *
 * @since  1.6
 */
class PlgWfSearchCategories extends CMSPlugin
{
    /**
     * Load the language file on instantiation.
     *
     * @var    boolean
     * @since  3.1
     */
    protected $autoloadLanguage = true;

    /**
     * Determine areas searchable by this plugin.
     *
     * @return  array  An array of search areas.
     *
     * @since   1.6
     */
    public function onContentSearchAreas()
    {
        static $areas = array(
            'categories' => 'PLG_SEARCH_CATEGORIES_CATEGORIES',
        );

        return $areas;
    }

    /**
     * Search content (categories).
     *
     * The SQL must return the following fields that are used in a common display
     * routine: href, title, section, created, text, browsernav.
     *
     * @param   string  $text      Target search string.
     * @param   string  $phrase    Matching option (possible values: exact|any|all).  Default is "any".
     * @param   string  $ordering  Ordering option (possible values: newest|oldest|popular|alpha|category).  Default is "newest".
     * @param   mixed   $areas     An array if the search is to be restricted to areas or null to search all areas.
     *
     * @return  array  Search results.
     *
     * @since   1.6
     */
    public function onContentSearch($text, $phrase = '', $ordering = '', $areas = null)
    {
        $db = Factory::getDbo();
        $user = Factory::getUser();
        $app = Factory::getApplication();
        $groups = implode(',', $user->getAuthorisedViewLevels());
        $searchText = $text;

        if (is_array($areas) && !array_intersect($areas, array_keys($this->onContentSearchAreas()))) {
            return array();
        }

        $limit = $this->params->def('search_limit', 50);
        $text = trim($text);

        if ($text === '') {
            return array();
        }

        switch ($ordering) {
            case 'alpha':
                $order = 'a.title ASC';
                break;

            case 'category':
            case 'popular':
            case 'newest':
            case 'oldest':
            default:
                $order = 'a.title DESC';
        }

        $text = $db->quote('%' . $db->escape($text, true) . '%', false);
        $query = $db->getQuery(true);

        // SQLSRV changes.
        $case_when = ' CASE WHEN ';
        $case_when .= $query->charLength('a.alias', '!=', '0');
        $case_when .= ' THEN ';
        $a_id = $query->castAsChar('a.id');
        $case_when .= $query->concatenate(array($a_id, 'a.alias'), ':');
        $case_when .= ' ELSE ';
        $case_when .= $a_id . ' END as slug';

        $query->select('a.title, a.description AS text, a.id AS catid, a.created_time, a.language, ' . $case_when);
        $query->from('#__categories AS a');
        $query->where(
            '(a.title LIKE ' . $text . ' OR a.description LIKE ' . $text . ') AND a.published = 1 AND a.extension = '
            . $db->quote('com_content') . 'AND a.access IN (' . $groups . ')'
        );

        $query->group('a.id, a.title, a.description, a.alias, a.created_time');
        $query->order($order);

        $db->setQuery($query, 0, $limit);

        try
        {
            $rows = $db->loadObjectList();
        } catch (RuntimeException $e) {
            Factory::getApplication()->enqueueMessage(Text::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
        }

        if ($rows) {
            foreach ($rows as $i => $row) {
                $rows[$i]->href = RouteHelper::getCategoryRoute($row->slug, $row->language, 'com_content');
                $rows[$i]->section = Text::_('JCATEGORY');
            }
        }

        return $rows;
    }
}
