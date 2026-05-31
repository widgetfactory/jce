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
use Joomla\Database\DatabaseInterface;
use Joomla\CMS\Uri\Uri;

/**
 * Search-only provider for Joomla content categories.
 *
 * This provider has no link-browsing counterpart (categories are already
 * accessible via the Content provider tree). It only implements the search
 * interface so that content categories appear in search results.
 */
class Categories extends \Wfe\Plugins\Links\Joomla\Provider\AbstractProvider
{
    public function getSearchAreas(): array
    {
        static $areas = [
            'com_categories' => 'PLG_SEARCH_CATEGORIES_CATEGORIES',
        ];

        return $areas;
    }

    /**
     * Search content categories.
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

        switch ($ordering) {
            case 'alpha':
                $order = 'a.title ASC';
                break;
            default:
                $order = 'a.title DESC';
                break;
        }

        $text  = $db->quote('%' . $db->escape($text, true) . '%', false);
        $query = $db->getQuery(true);

        // SQLSRV-compatible slug column
        $case_when  = ' CASE WHEN ';
        $case_when .= $query->charLength('a.alias', '!=', '0');
        $case_when .= ' THEN ';
        $a_id       = $query->castAs('CHAR', 'a.id');
        $case_when .= $query->concatenate([$a_id, 'a.alias'], ':');
        $case_when .= ' ELSE ';
        $case_when .= $a_id . ' END as slug';

        $query->select('a.title, a.description AS text, a.id AS catid, a.created_time, a.language, ' . $case_when);
        $query->from('#__categories AS a');
        $query->where(
            '(a.title LIKE ' . $text . ' OR a.description LIKE ' . $text . ') AND a.published = 1 AND a.extension = '
                . $db->quote('com_content') . ' AND a.access IN (' . $groups . ')'
        );

        $query->group('a.id, a.title, a.description, a.alias, a.created_time');
        $query->order($order);

        $db->setQuery($query, 0, $limit);

        try {
            $rows = $db->loadObjectList();
        } catch (\RuntimeException $e) {
            $rows = [];
            Factory::getApplication()->enqueueMessage(Text::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
        }

        if ($rows) {
            foreach ($rows as $key => $row) {
                $href = RouteHelper::getCategoryRoute($row->slug, $row->language, 'com_content');
                $rows[$key]->section = Text::_('JCATEGORY');

                // remove base url
                if (Uri::base(true) && strpos($href, Uri::base(true)) !== false) {
                    $href = substr_replace($href, '', 0, strlen(Uri::base(true)) + 1);
                }

                $href = $this->routeUrl($href);

                $rows[$key]->href = $href;
            }
        }

        return $rows;
    }
}
