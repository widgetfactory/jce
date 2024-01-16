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
use Joomla\CMS\Language\Multilanguage;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Object\CMSObject;

class JoomlalinksTags extends CMSObject
{
    private $option = 'com_tags';

    /**
     * Returns a reference to a editor object.
     * @return JCE The editor object
     *
     * @since    1.5
     */
    public static function getInstance($options = array())
    {
        static $instance;

        if (!is_object($instance)) {
            $instance = new self($options);
        }

        return $instance;
    }

    public function getOption()
    {
        return $this->option;
    }

    public function getList()
    {
        return '<li id="index.php?option=com_tags" class="folder content nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . Text::_('WF_LINKS_JOOMLALINKS_TAGS') . '</span></a></div></li>';
    }

    public function getLinks($args)
    {
        require_once JPATH_SITE . '/components/com_tags/helpers/route.php';

        $items = array();
        $view = isset($args->view) ? $args->view : '';

        $language = '';

        // create a new RouteHelper instance
        $router = new RouteHelper();

        $tags = array();

        if (!isset($args->id)) {
            $args->id = 1;
        }

        // get any articles in this category (in Joomla! 1.6+ a category can contain sub-categories and articles)
        $tags = self::getTags($args->id);

        if (!empty($tags)) {
            // output article links
            foreach ($tags as $tag) {
                if (isset($tag->language)) {
                    $language = $tag->language;
                }

                $id = $router->getRoute($tag->slug, 'com_tags.tag', '', $language);
                $id = $this->route($id);

                $items[] = array(
                    'id' => $id,
                    'name' => $tag->title . ' / ' . $tag->alias,
                    'class' => 'file',
                );
            }
        }

        return $items;
    }

    private static function getTags($id)
    {
        $db = Factory::getDBO();
        $user = Factory::getUser();

        $wf = WFEditorPlugin::getInstance();

        $query = $db->getQuery(true);
        $query->select('a.id, a.title, a.alias');

        if ($wf->getParam('links.joomlalinks.tag_alias', 1)) {
            $case_when_item_alias = ' CASE WHEN ';
            $case_when_item_alias .= $query->charLength('a.alias', '!=', '0');
            $case_when_item_alias .= ' THEN ';
            $a_id = $query->castAsChar('a.id');
            $case_when_item_alias .= $query->concatenate(array($a_id, 'a.alias'), ':');
            $case_when_item_alias .= ' ELSE ';
            $case_when_item_alias .= $a_id . ' END as slug';
            $query->select($case_when_item_alias);
        }

        $query->from('#__tags AS a');
        $query->where('a.alias <> ' . $db->quote('root'));
        $query->where($db->qn('a.published') . ' = 1');

        if (!$user->authorise('core.admin')) {
            $groups = implode(',', $user->getAuthorisedViewLevels());
            $query->where('a.access IN (' . $groups . ')');
        }

        if (Multilanguage::isEnabled()) {
            $tag = Factory::getLanguage()->getTag();
            $query->where('a.language in (' . $db->quote($tag) . ',' . $db->quote('*') . ')');
        }

        $query->order('a.title');

        $db->setQuery($query, 0);

        return $db->loadObjectList();
    }

    private static function route($url)
    {
        $wf = WFEditorPlugin::getInstance();

        if ((bool) $wf->getParam('links.joomlalinks.sef_url', 0)) {
            $url = WFLinkHelper::route($url);
        }

        // remove Itemid if "home"
        $url = WFLinkHelper::removeHomeItemId($url);

        // remove Itemid
        if ((bool) $wf->getParam('links.joomlalinks.itemid', 1) === false) {
            $url = WFLinkHelper::removeItemId($url);
        }

        return $url;
    }
}
