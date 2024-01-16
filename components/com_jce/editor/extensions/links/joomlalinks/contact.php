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
use Joomla\CMS\Object\CMSObject;
use Joomla\CMS\Helper\RouteHelper;

class JoomlalinksContact extends CMSObject
{
    private $option = 'com_contact';

    /**
     * Returns a reference to a editor object.
     *
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
        return '<li id="index.php?option=com_contact" class="folder contact nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . Text::_('WF_LINKS_JOOMLALINKS_CONTACTS') . '</span></a></div></li>';
    }

    public function getLinks($args)
    {
        $items = array();
        $view = isset($args->view) ? $args->view : '';

        $language = '';

        // create a new RouteHelper instance
        $router = new RouteHelper();

        switch ($view) {
            default:
                $categories = WFLinkBrowser::getCategory('com_contact', 1, $this->get('category_alias', 1));

                foreach ($categories as $category) {
                    // language
                    if (isset($category->language)) {
                        $language = $category->language;
                    }

                    $url = RouteHelper::getCategoryRoute($category->id, $language, 'com_contact');

                    // convert to SEF
                    $url = self::route($url);

                    $items[] = array(
                        'id' => 'index.php?option=com_contact&view=category&id=' . $category->id,
                        'url' => $url,
                        'name' => $category->title . ' / ' . $category->alias,
                        'class' => 'folder contact',
                    );
                }
                break;
            case 'category':
                $categories = WFLinkBrowser::getCategory('com_contact', $args->id, $this->get('category_alias', 1));

                foreach ($categories as $category) {
                    $children = WFLinkBrowser::getCategory('com_contact', $category->id, $this->get('category_alias', 1));

                    // language
                    if (isset($category->language)) {
                        $language = $category->language;
                    }

                    if ($children) {
                        $id = RouteHelper::getCategoryRoute($category->id, $language, 'com_contact');
                    } else {
                        $id = RouteHelper::getCategoryRoute($category->slug, $language, 'com_contact');
                    }

                    // convert to SEF
                    $url = self::route($id);

                    $items[] = array(
                        'url' => $url,
                        'id' => $id,
                        'name' => $category->title . ' / ' . $category->alias,
                        'class' => 'folder content',
                    );
                }

                $contacts = self::getContacts($args->id);

                foreach ($contacts as $contact) {
                    // language
                    if (isset($contact->language)) {
                        $language = $contact->language;
                    }

                    $id = $router->getRoute($contact->id, 'com_contact.contact', '', $language, $args->id);
                    $id = self::route($id);

                    $items[] = array(
                        'id' => $id,
                        'name' => $contact->name . ' / ' . $contact->alias,
                        'class' => 'file',
                    );
                }
                break;
        }

        return $items;
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

    private static function getContacts($id)
    {
        $db = Factory::getDBO();
        $user = Factory::getUser();

        $query = $db->getQuery(true);
        $query->select('id, name, alias, language')->from('#__contact_details')->where(array('catid=' . (int) $id, 'published = 1'));

        if (!$user->authorise('core.admin')) {
            $query->where('access IN (' . implode(',', $user->getAuthorisedViewLevels()) . ')');
        }

        $db->setQuery($query);

        return $db->loadObjectList();
    }
}
