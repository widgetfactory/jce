<?php
/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Adapted from the Joomla Search.contacts plugin - plugins/search/contacts/contacts.php
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */

defined('JPATH_PLATFORM') or die;

/**
 * Contacts search plugin.
 */
class PlgWfSearchContacts extends JPlugin
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
	 */
	public function onContentSearchAreas()
	{
		static $areas = array(
			'contacts' => 'PLG_SEARCH_CONTACTS_CONTACTS'
		);

		return $areas;
	}

	/**
	 * Search content (contacts).
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
	 */
	public function onContentSearch($text, $phrase = '', $ordering = '', $areas = null)
	{
		$db     = JFactory::getDbo();
		$app    = JFactory::getApplication();
		$user   = JFactory::getUser();
		$groups = implode(',', $user->getAuthorisedViewLevels());

		// create a new RouteHelper instance
        $router = new JHelperRoute();

		if (is_array($areas) && !array_intersect($areas, array_keys($this->onContentSearchAreas())))
		{
			return array();
		}

		$limit = $this->params->def('search_limit', 50);

		$text = trim($text);

		if ($text === '')
		{
			return array();
		}

		$section = JText::_('PLG_SEARCH_CONTACTS_CONTACTS');

		switch ($ordering)
		{
			case 'alpha':
				$order = 'a.name ASC';
				break;

			case 'category':
				$order = 'c.title ASC, a.name ASC';
				break;

			case 'popular':
			case 'newest':
			case 'oldest':
			default:
				$order = 'a.name DESC';
		}

		$text = $db->quote('%' . $db->escape($text, true) . '%', false);

		$query = $db->getQuery(true);

		// SQLSRV changes.
		$case_when  = ' CASE WHEN ';
		$case_when .= $query->charLength('a.alias', '!=', '0');
		$case_when .= ' THEN ';
		$a_id = $query->castAsChar('a.id');
		$case_when .= $query->concatenate(array($a_id, 'a.alias'), ':');
		$case_when .= ' ELSE ';
		$case_when .= $a_id . ' END as slug';

		$case_when1  = ' CASE WHEN ';
		$case_when1 .= $query->charLength('c.alias', '!=', '0');
		$case_when1 .= ' THEN ';
		$c_id        = $query->castAsChar('c.id');
		$case_when1 .= $query->concatenate(array($c_id, 'c.alias'), ':');
		$case_when1 .= ' ELSE ';
		$case_when1 .= $c_id . ' END as catslug';

		$query->select(
			'a.name AS title, a.con_position, a.misc, a.language, '
				. $case_when . ',' . $case_when1 . ', '
				. $query->concatenate(array('a.name', 'a.con_position', 'a.misc'), ',') . ' AS text'
		);
		$query->from('#__contact_details AS a')
			->join('INNER', '#__categories AS c ON c.id = a.catid')
			->where(
				'(a.name LIKE ' . $text . ' OR a.misc LIKE ' . $text . ' OR a.con_position LIKE ' . $text
					. ' OR a.address LIKE ' . $text . ' OR a.suburb LIKE ' . $text . ' OR a.state LIKE ' . $text
					. ' OR a.country LIKE ' . $text . ' OR a.postcode LIKE ' . $text . ' OR a.telephone LIKE ' . $text
					. ' OR a.fax LIKE ' . $text . ') AND a.published = 1 AND c.published = 1 '
					. ' AND a.access IN (' . $groups . ') AND c.access IN (' . $groups . ')'
			)
			->order($order);

		$db->setQuery($query, 0, $limit);

		try
		{
			$rows = $db->loadObjectList();
		}
		catch (RuntimeException $e)
		{
			$rows = array();
			JFactory::getApplication()->enqueueMessage(JText::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
		}

		if ($rows)
		{
			 // create a new RouteHelper instance
			 $router = new JHelperRoute();
			
			foreach ($rows as $key => $row)
			{
				$rows[$key]->href  = $router->getRoute($row->slug, 'com_contact.contact', '', $row->language, $row->catslug);
				$rows[$key]->text  = $row->title;
				$rows[$key]->text .= $row->con_position ? ', ' . $row->con_position : '';
				$rows[$key]->text .= $row->misc ? ', ' . $row->misc : '';

				$rows[$key]->section = $section;
			}
		}

		return $rows;
	}
}
