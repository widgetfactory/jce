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
use Joomla\CMS\Language\Multilanguage;
use Joomla\CMS\Language\Text;
use Joomla\Database\DatabaseInterface;
use Joomla\CMS\Uri\Uri;

class Tags extends \Wfe\Plugins\Links\Joomla\Provider\AbstractProvider
{
    protected $option = 'com_tags';

    public function getParam($key, $default = null)
    {
        if ($key == 'alias') {
            $value = parent::getParam($key);

            if ($value == '') {
                $value = parent::getParam('links.joomlalinks.tags_alias');
            }

            if (is_numeric($value)) {
                return (bool) $value;
            }

            return (bool) $default;
        }

        return parent::getParam($key, $default);
    }

    public function getSearchAreas(): array
    {
        static $areas = [
            'com_tags' => 'PLG_SEARCH_TAGS_TAGS',
        ];

        return $areas;
    }

    /**
     * Search tags.
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

        $query = $db->getQuery(true);

        $limit = $this->getParam('search_limit', 50);

        if (is_array($areas) && !array_intersect($areas, array_keys($this->getSearchAreas()))) {
            return [];
        }

        $text = trim($text);

        if ($text === '') {
            return [];
        }

        $text = $db->quote('%' . $db->escape($text, true) . '%', false);

        switch ($ordering) {
            case 'alpha':   $order = 'a.title ASC';        break;
            case 'newest':  $order = 'a.created_time DESC'; break;
            case 'oldest':  $order = 'a.created_time ASC';  break;
            case 'popular':
            default:        $order = 'a.title DESC';        break;
        }

        $query->select('a.id, a.title, a.alias, a.note, a.published, a.access'
            . ', a.checked_out, a.checked_out_time, a.created_user_id'
            . ', a.path, a.parent_id, a.level, a.lft, a.rgt'
            . ', a.language, a.created_time AS created, a.description');

        $case_when_item_alias  = ' CASE WHEN ';
        $case_when_item_alias .= $query->charLength('a.alias', '!=', '0');
        $case_when_item_alias .= ' THEN ';
        $a_id                  = $query->castAs('CHAR', 'a.id');
        $case_when_item_alias .= $query->concatenate([$a_id, 'a.alias'], ':');
        $case_when_item_alias .= ' ELSE ';
        $case_when_item_alias .= $a_id . ' END as slug';
        $query->select($case_when_item_alias);

        $query->from('#__tags AS a');
        $query->where('a.alias <> ' . $db->quote('root'));
        $query->where('(a.title LIKE ' . $text . ' OR a.alias LIKE ' . $text . ')');
        $query->where($db->qn('a.published') . ' = 1');

        if (!$user->authorise('core.admin')) {
            $groups = implode(',', array_map('intval', $user->getAuthorisedViewLevels()));
            $query->where('a.access IN (' . $groups . ')');
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
                $href = $router->getRoute($row->slug, 'com_tags.tag', '', $row->language);

                // remove base url
                if (Uri::base(true) && strpos($href, Uri::base(true)) !== false) {
                    $href = substr_replace($href, '', 0, strlen(Uri::base(true)) + 1);
                }

                $href = $this->routeUrl($href);

                $rows[$key]->href = $href;

                $rows[$key]->text  = ($row->description !== '' ? $row->description : $row->title);
                $rows[$key]->text .= $row->note;
            }
        }

        return $rows;
    }

    public function getList(): string
    {
        return '<li id="index.php?option=com_tags" class="folder content nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . Text::_('WF_LINKS_JOOMLALINKS_TAGS') . '</span></a></div></li>';
    }

    public function getLinks($args): array
    {
        $items    = [];
        $language = '';

        $router = new RouteHelper();

        if (!isset($args->id)) {
            $args->id = 1;
        }

        $tags = $this->getTags($args->id);

        if (!empty($tags)) {
            foreach ($tags as $tag) {
                if (isset($tag->language)) {
                    $language = $tag->language;
                }

                $id = $router->getRoute($tag->id, 'com_tags.tag', '', $language);
                $id = $this->routeUrl($id);

                $items[] = [
                    'id'    => $id,
                    'name'  => $tag->title . ' / ' . $tag->alias,
                    'class' => 'file',
                ];
            }
        }

        return $items;
    }

    private function getTags($id)
    {
        $app  = Factory::getApplication();
        $db   = Factory::getContainer()->get(DatabaseInterface::class);
        $user = $app->getIdentity();

        $query = $db->getQuery(true);
        $query->select('a.id, a.title, a.alias');

        if ($this->getParam('alias', 0)) {
            $case_when_item_alias  = ' CASE WHEN ';
            $case_when_item_alias .= $query->charLength('a.alias', '!=', '0');
            $case_when_item_alias .= ' THEN ';
            $a_id                  = $query->castAs('CHAR', 'a.id');
            $case_when_item_alias .= $query->concatenate([$a_id, 'a.alias'], ':');
            $case_when_item_alias .= ' ELSE ';
            $case_when_item_alias .= $a_id . ' END as slug';
            $query->select($case_when_item_alias);
        }

        $query->from('#__tags AS a');
        $query->where('a.alias <> ' . $db->quote('root'));
        $query->where($db->qn('a.published') . ' = 1');

        if (!$user->authorise('core.admin')) {
            $groups = implode(',', array_map('intval', $user->getAuthorisedViewLevels()));
            $query->where('a.access IN (' . $groups . ')');
        }

        if (Multilanguage::isEnabled()) {
            $tag = $app->getLanguage()->getTag();
            $query->where('a.language in (' . $db->quote($tag) . ',' . $db->quote('*') . ')');
        }

        $query->order('a.title');

        $db->setQuery($query, 0);

        return $db->loadObjectList();
    }
}
