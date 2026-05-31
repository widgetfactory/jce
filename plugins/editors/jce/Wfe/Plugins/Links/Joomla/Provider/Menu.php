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
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;
use Joomla\Registry\Registry;
use Joomla\Database\DatabaseInterface;

class Menu extends \Wfe\Plugins\Links\Joomla\Provider\AbstractProvider
{
    protected $option = 'com_menu';

    public function getParam($key, $default = null)
    {
        if ($key == 'alias') {
            $legacyKey = 'links.joomlalinks.menu_resolve_alias';

            $legacyValue = parent::getParam($legacyKey, $default);

            if (is_numeric($legacyValue)) {
                return (bool) $legacyValue;
            }
        }

        return parent::getParam($key, $default);
    }

    public function getList()
    {
        return '<li id="index.php?option=com_menu" class="folder menu nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . Text::_('WF_LINKS_JOOMLALINKS_MENU') . '</span></a></div></li>';
    }

    public function getLinks($args)
    {
        $items = array();
        $view = isset($args->view) ? $args->view : '';
        switch ($view) {
            // create top-level (non-linkable) menu types
            default:
                $types = $this->getMenuTypes();
                foreach ($types as $type) {
                    $items[] = array(
                        'id' => 'index.php?option=com_menu&view=menu&type=' . $type->id,
                        'name' => $type->title,
                        'class' => 'folder menu nolink',
                    );
                }
                break;
            // get menus and sub-menus
            case 'menu':
                $type = isset($args->type) ? $args->type : 0;
                $id = $type ? 0 : $args->id;

                $menus = $this->getMenu($id, $type);

                foreach ($menus as $menu) {
                    $class = array();

                    // bypass errors in menu parameters syntax
                    try {
                        $params = new Registry($menu->params);
                    } catch (\Exception $e) {
                        $params = new Registry();
                    }

                    switch ($menu->type) {
                        case 'separator':
                            if (!$menu->link) {
                                $class[] = 'nolink';
                            }

                            $link = '';
                            break;

                        case 'alias':
                            // If this is an alias use the item id stored in the parameters to make the link.
                            $link = 'index.php?Itemid=' . $params->get('aliasoptions');
                            break;

                        default:
                            // resolve link
                            $link = $this->resolveLink($menu);
                            break;
                    }

                    $children = (int) $this->getChildren($menu->id);
                    $title = isset($menu->name) ? $menu->name : $menu->title;

                    if ($children) {
                        $class = array_merge($class, array('folder', 'menu'));
                    } else {
                        $class[] = 'file';
                    }

                    if ($params->get('secure')) {
                        $link = $this->toSSL($link);
                    }

                    // language
                    if (isset($menu->language)) {
                        $link .= $this->getLangauge($menu->language);
                    }

                    $items[] = array(
                        'id' => $children ? 'index.php?option=com_menu&view=menu&id=' . $menu->id : $link,
                        'url' => $this->routeUrl($link),
                        'name' => $title . ' / ' . $menu->alias,
                        'class' => implode(' ', $class),
                    );
                }
                break;
            // get menu items
            case 'submenu':
                $menus = $this->getMenu($args->id);
                foreach ($menus as $menu) {
                    if ($menu->type == 'menulink') {
                        //$menu = AdvlinkMenu::_alias($menu->id);
                    }

                    $children = (int) $this->getChildren($menu->id);

                    $title = isset($menu->name) ? $menu->name : $menu->title;

                    // get params
                    $params = new Registry($menu->params);

                    // resolve link
                    $link = $this->resolveLink($menu);

                    // language
                    if (isset($menu->language)) {
                        $link .= $this->getLangauge($menu->language);
                    }

                    if ($params->get('secure')) {
                        $link = $this->toSSL($link);
                    }

                    $items[] = array(
                        'id' => $this->routeUrl($link),
                        'name' => $title . ' / ' . $menu->alias,
                        'class' => $children ? 'folder menu' : 'file',
                    );
                }
                break;
        }

        return $items;
    }

    /**
     * Convert link to SSL.
     *
     * @param string $link
     *
     * @return string
     */
    private function toSSL($link)
    {
        if (strcasecmp(substr($link, 0, 4), 'http') && (strpos($link, 'index.php?') !== false)) {
            $uri = Uri::getInstance();

            // Get prefix
            $prefix = $uri->toString(array('host', 'port'));

            // trim slashes
            $link = trim($link, '/');

            // Build the URL.
            $link = 'https://' . $prefix . '/' . $link;
        }

        return $link;
    }

    private function resolveLink($menu)
    {
        // get link from menu object
        $link = $menu->link;

        // internal link
        if ($link && strpos($link, 'index.php') === 0) {
            if ((bool) $this->getParam('alias', 0)) {
                // no Itemid
                if (strpos($link, 'Itemid=') === false) {
                    $link .= '&Itemid=' . $menu->id;
                }
                // short link
            } else {
                $link = 'index.php?Itemid=' . $menu->id;
            }
        }

        return $link;
    }

    private function getMenuTypes()
    {
        $db = Factory::getContainer()->get(DatabaseInterface::class);

        $query = $db->getQuery(true);

        $query->select('*')->from('#__menu_types')->where('client_id = 0')->order('title');

        $db->setQuery($query, 0);

        return $db->loadObjectList();
    }

    private function getAlias($id)
    {
        $db = Factory::getContainer()->get(DatabaseInterface::class);
        $user = Factory::getApplication()->getIdentity();

        $query = $db->getQuery(true);

        $query->select('params')->from('#__menu')->where('id = ' . (int) $id);

        $db->setQuery($query, 0);
        $params = new Registry($db->loadResult());

        $query->clear();
        $query->select('id, name, link, alias')->from('#__menu')->where(array('published = 1', 'id = ' . (int) $params->get('menu_item')));

        if (!$user->authorise('core.admin')) {
            $query->where('access IN (' . implode(',', array_map('intval', $user->getAuthorisedViewLevels())) . ')');
        }

        $query->order('name');

        $db->setQuery($query, 0);

        return $db->loadObject();
    }

    private function getChildren($id)
    {
        $db = Factory::getContainer()->get(DatabaseInterface::class);
        $user = Factory::getApplication()->getIdentity();

        $query = $db->getQuery(true);

        $query->select('COUNT(id)')->from('#__menu')->where(array('published = 1', 'client_id = 0'));

        if (!$user->authorise('core.admin')) {
            $query->where('access IN (' . implode(',', array_map('intval', $user->getAuthorisedViewLevels())) . ')');
        }

        if ($id) {
            $query->where('parent_id = ' . (int) $id);
        }

        $db->setQuery($query, 0);

        return $db->loadResult();
    }

    private function getMenu($parent = 0, $type = 0)
    {
        $db = Factory::getContainer()->get(DatabaseInterface::class);
        $user = Factory::getApplication()->getIdentity();

        $query = $db->getQuery(true);

        $query->select('m.*')->from('#__menu AS m');

        if ($type) {
            $query->innerJoin('#__menu_types AS s ON s.id = ' . (int) $type);
            $query->where('m.menutype = s.menutype');
        }

        if ($parent == 0) {
            $parent = 1;
        }

        $query->where(array('m.published = 1', 'm.parent_id = ' . (int) $parent));

        if (!$user->authorise('core.admin')) {
            $query->where('m.access IN (' . implode(',', array_map('intval', $user->getAuthorisedViewLevels())) . ')');
        }

        // only site menu items
        $query->where('m.client_id = 0');

        $query->order('m.lft ASC');

        $db->setQuery($query, 0);

        return $db->loadObjectList();
    }

    private function getLangauge($language)
    {
        $db = Factory::getContainer()->get(DatabaseInterface::class);
        $query = $db->getQuery(true);

        $link = '';

        $query->select('a.sef AS sef');
        $query->select('a.lang_code AS lang_code');
        $query->from('#__languages AS a');
        $db->setQuery($query);
        $langs = $db->loadObjectList();

        foreach ($langs as $lang) {
            if ($language == $lang->lang_code) {
                $language = $lang->sef;
                $link .= '&lang=' . $language;
            }
        }
        return $link;
    }
}
