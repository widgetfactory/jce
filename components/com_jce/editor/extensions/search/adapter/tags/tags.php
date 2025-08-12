<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Helper\RouteHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;

/**
 * Tags search plugin.
 *
 */
class PlgWfSearchTags extends CMSPlugin
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
            'tags' => 'PLG_SEARCH_TAGS_TAGS',
        );

        return $areas;
    }

    /**
     * Search content (tags).
     *
     * The SQL must return the following fields that are used in a common display
     * routine: href, title, section, created, text, browsernav.
     *
     * @param   string  $text      Target search string.
     * @param   string  $phrase    Matching option (possible values: exact|any|all).  Default is "any".
     * @param   string  $ordering  Ordering option (possible values: newest|oldest|popular|alpha|category).  Default is "newest".
     * @param   string  $areas     An array if the search is to be restricted to areas or null to search all areas.
     *
     * @return  array  Search results.
     *
     * @since   3.3
     */
    public function onContentSearch($text, $phrase = '', $ordering = '', $areas = null)
    {
        $db = Factory::getDbo();
        $query = $db->getQuery(true);
        $app = Factory::getApplication();
        $user = Factory::getUser();
        $lang = Factory::getLanguage();

        $section = Text::_('PLG_SEARCH_TAGS_TAGS');
        $limit = $this->params->def('search_limit', 50);

        if (is_array($areas) && !array_intersect($areas, array_keys($this->onContentSearchAreas()))) {
            return array();
        }

        $text = trim($text);

        if ($text === '') {
            return array();
        }

        $text = $db->quote('%' . $db->escape($text, true) . '%', false);

        switch ($ordering) {
            case 'alpha':
                $order = 'a.title ASC';
                break;

            case 'newest':
                $order = 'a.created_time DESC';
                break;

            case 'oldest':
                $order = 'a.created_time ASC';
                break;

            case 'popular':
            default:
                $order = 'a.title DESC';
        }

        $query->select('a.id, a.title, a.alias, a.note, a.published, a.access'
            . ', a.checked_out, a.checked_out_time, a.created_user_id'
            . ', a.path, a.parent_id, a.level, a.lft, a.rgt'
            . ', a.language, a.created_time AS created, a.description');

        $case_when_item_alias = ' CASE WHEN ';
        $case_when_item_alias .= $query->charLength('a.alias', '!=', '0');
        $case_when_item_alias .= ' THEN ';
        $a_id = $query->castAsChar('a.id');
        $case_when_item_alias .= $query->concatenate(array($a_id, 'a.alias'), ':');
        $case_when_item_alias .= ' ELSE ';
        $case_when_item_alias .= $a_id . ' END as slug';
        $query->select($case_when_item_alias);

        $query->from('#__tags AS a');
        $query->where('a.alias <> ' . $db->quote('root'));

        $query->where('(a.title LIKE ' . $text . ' OR a.alias LIKE ' . $text . ')');

        $query->where($db->qn('a.published') . ' = 1');

        if (!$user->authorise('core.admin')) {
            $groups = implode(',', $user->getAuthorisedViewLevels());
            $query->where('a.access IN (' . $groups . ')');
        }

        $query->order($order);

        $db->setQuery($query, 0, $limit);

        try
        {
            $rows = $db->loadObjectList();
        } catch (RuntimeException $e) {
            $rows = array();
            Factory::getApplication()->enqueueMessage(Text::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
        }

        if ($rows) {
            // create a new RouteHelper instance
            $router = new RouteHelper();

            foreach ($rows as $key => $row) {
                $rows[$key]->href = $router->getRoute($row->slug, 'com_tags.tag', '', $row->language);
                $rows[$key]->text = ($row->description !== '' ? $row->description : $row->title);
                $rows[$key]->text .= $row->note;
            }
        }

        return $rows;
    }
}
