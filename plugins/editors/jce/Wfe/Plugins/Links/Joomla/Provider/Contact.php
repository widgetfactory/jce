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

class Contact extends \Wfe\Plugins\Links\Joomla\Provider\AbstractProvider
{
    protected $option = 'com_contact';

    public function getSearchAreas(): array
    {
        static $areas = [
            'com_contact' => 'PLG_SEARCH_CONTACTS_CONTACTS',
        ];

        return $areas;
    }

    /**
     * Search contacts.
     *
     * @param \Joomla\Registry\Registry $options
     */
    public function doSearch($options = null) : array
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
        $router = new RouteHelper();

        if (is_array($areas) && !array_intersect($areas, array_keys($this->getSearchAreas()))) {
            return [];
        }

        $limit = $this->getParam('search_limit', 50);

        $text = trim($text);

        if ($text === '') {
            return [];
        }

        $section = Text::_('PLG_SEARCH_CONTACTS_CONTACTS');

        switch ($ordering) {
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
                break;
        }

        $text = $db->quote('%' . $db->escape($text, true) . '%', false);

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

        $query->select(
            'a.name AS title, a.con_position, a.misc, a.language, '
                . $case_when . ',' . $case_when1 . ', '
                . $query->concatenate(['a.name', 'a.con_position', 'a.misc'], ',') . ' AS text'
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

        try {
            $rows = $db->loadObjectList();
        } catch (\RuntimeException $e) {
            $rows = [];
            Factory::getApplication()->enqueueMessage(Text::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
        }

        if ($rows) {
            foreach ($rows as $key => $row) {
                $href  = $router->getRoute($row->slug, 'com_contact.contact', '', $row->language, $row->catslug);

                // remove base url
                if (Uri::base(true) && strpos($href, Uri::base(true)) !== false) {
                    $href = substr_replace($href, '', 0, strlen(Uri::base(true)) + 1);
                }

                $href = $this->routeUrl($href);

                $rows[$key]->href = $href;

                $rows[$key]->text  = $row->title;
                $rows[$key]->text .= $row->con_position ? ', ' . $row->con_position : '';
                $rows[$key]->text .= $row->misc         ? ', ' . $row->misc         : '';

                $rows[$key]->section = $section;
            }
        }

        return $rows;
    }

    public function getList(): string
    {
        return '<li id="index.php?option=com_contact" class="folder contact nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . Text::_('WF_LINKS_JOOMLALINKS_CONTACTS') . '</span></a></div></li>';
    }

    public function getLinks($args): array
    {
        $items    = [];
        $view     = isset($args->view) ? $args->view : '';
        $language = '';

        $router = new RouteHelper();

        switch ($view) {
            default:
                $categories = $this->getCategory('com_contact');

                foreach ($categories as $category) {
                    if (isset($category->language)) {
                        $language = $category->language;
                    }

                    $url = RouteHelper::getCategoryRoute($category->id, $language, 'com_contact');
                    $url = $this->routeUrl($url);

                    $items[] = [
                        'id'    => 'index.php?option=com_contact&view=category&id=' . $category->id,
                        'url'   => $url,
                        'name'  => $category->title . ' / ' . $category->alias,
                        'class' => 'folder contact',
                    ];
                }
                break;

            case 'category':
                $categories = $this->getCategory('com_contact', $args->id);

                foreach ($categories as $category) {
                    $children = $this->getCategory('com_contact', $category->id);

                    if (isset($category->language)) {
                        $language = $category->language;
                    }

                    if ($children) {
                        $id = RouteHelper::getCategoryRoute($category->id, $language, 'com_contact');
                    } else {
                        $id = RouteHelper::getCategoryRoute($category->slug, $language, 'com_contact');
                    }

                    $url = $this->routeUrl($id);

                    $items[] = [
                        'url'   => $url,
                        'id'    => $id,
                        'name'  => $category->title . ' / ' . $category->alias,
                        'class' => 'folder content',
                    ];
                }

                $contacts = $this->getContacts($args->id);

                foreach ($contacts as $contact) {
                    if (isset($contact->language)) {
                        $language = $contact->language;
                    }

                    $id = $router->getRoute($contact->id, 'com_contact.contact', '', $language, $args->id);
                    $id = $this->routeUrl($id);

                    $items[] = [
                        'id'    => $id,
                        'name'  => $contact->name . ' / ' . $contact->alias,
                        'class' => 'file',
                    ];
                }
                break;
        }

        return $items;
    }

    private function getContacts($id)
    {
        $user = Factory::getApplication()->getIdentity();
        $db   = Factory::getContainer()->get(DatabaseInterface::class);

        $query = $db->getQuery(true);
        $query->select('id, name, alias, language')
            ->from('#__contact_details')
            ->where(['catid=' . (int) $id, 'published = 1']);

        if (!$user->authorise('core.admin')) {
            $query->where('access IN (' . implode(',', array_map('intval', $user->getAuthorisedViewLevels())) . ')');
        }

        $db->setQuery($query);

        return $db->loadObjectList();
    }
}
