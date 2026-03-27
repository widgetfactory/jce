<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Adapter\Plugin\Links;

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\Database\DatabaseInterface;

class AbstractLink extends \Wfe\Adapter\Plugin\AbstractPlugin
{
    public function display() {}

    /**
     * Category function used by many extensions.
     *
     * @return Category list object
     *
     * @since    1.5
     */
    public function getCategory($section, $parent = 1)
    {
        $app = Factory::getApplication();

        $db = Factory::getContainer()->get(DatabaseInterface::class);
        $user = $app->getIdentity();

        $query = $db->getQuery(true);

        $where = array();

        $where[] = 'parent_id = ' . (int) $parent;
        $where[] = 'extension = ' . $db->Quote($section);

        if (!$user->authorise('core.admin')) {
            $where[] = 'access IN (' . implode(',', $user->getAuthorisedViewLevels()) . ')';
        }

        if (!$this->checkAccess('static', 1)) {
            $where[] = 'path != ' . $db->Quote('uncategorised');
        }

        $case = '';

        if ($this->getParam('category_alias', 1) == 1) {
            //sqlsrv changes
            $case = ', CASE WHEN ';
            $case .= $query->charLength('alias', '!=', '0');
            $case .= ' THEN ';
            $a_id = $query->castAs('CHAR', 'id');
            $case .= $query->concatenate(array($a_id, 'alias'), ':');
            $case .= ' ELSE ';
            $case .= $a_id . ' END as slug';
        }

        $where[] = 'published = 1';
        $query->select('id AS slug, id AS id, title, alias, access, language' . $case)->from('#__categories')->where($where)->order('title');

        $db->setQuery($query);

        return $db->loadObjectList();
    }

    /**
     * (Attempt to) Get an Itemid.
     *
     * @param string $option
     * @param array  $needles
     *
     * @return Category list object
     */
    public function getItemId($option, $needles = array())
    {
        $match = null;

        $app = Factory::getContainer()->get('site');

        $component = ComponentHelper::getComponent($option);
        $menu = $app->getMenu('site');
        $items = $menu->getItems('component_id', $component->id);

        if ($items) {
            foreach ($needles as $needle => $id) {
                foreach ($items as $item) {
                    if ((@$item->query['view'] == $needle) && (@$item->query['id'] == $id)) {
                        $match = $item->id;
                        break;
                    }
                }
                if (isset($match)) {
                    break;
                }
            }
        }

        return $match ? '&Itemid=' . $match : '';
    }

    public function getSearchAreas()
    {
        return [];
    }
}
