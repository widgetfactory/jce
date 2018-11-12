<?php

/**
 * @copyright     Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_WF_EXT') or die('RESTRICTED');

class JoomlalinksContact extends JObject
{
    public $_option = 'com_contact';

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($options = array())
    {
    }

    /**
     * Returns a reference to a editor object.
     *
     * This method must be invoked as:
     *         <pre>  $browser =JContentEditor::getInstance();</pre>
     *
     * @return JCE The editor object
     *
     * @since    1.5
     */
    public static function getInstance()
    {
        static $instance;

        if (!is_object($instance)) {
            $instance = new self();
        }

        return $instance;
    }

    public function getOption()
    {
        return $this->_option;
    }

    public function getList()
    {
        //Reference to JConentEditor (JCE) instance
        $wf = WFEditorPlugin::getInstance();

        if ($wf->checkAccess('links.joomlalinks.contacts', 1)) {
            return '<li data-id="index.php?option=com_contact" class="folder contact nolink"><div class="uk-tree-row"><a href="#"><span class="uk-tree-icon"></span><span class="uk-tree-text">' . WFText::_('WF_LINKS_JOOMLALINKS_CONTACTS') . '</span></a></div></li>';
        }
    }

    public function getLinks($args)
    {
        $items = array();
        $view = isset($args->view) ? $args->view : '';

        $language = '';

        if (defined('JPATH_PLATFORM')) {
            require_once JPATH_SITE . '/components/com_contact/helpers/route.php';
        }

        switch ($view) {
            default:
                if (defined('JPATH_PLATFORM')) {
                    $categories = WFLinkBrowser::getCategory('com_contact');
                } else {
                    $categories = WFLinkBrowser::getCategory('com_contact_details');
                }

                foreach ($categories as $category) {
                    if (defined('JPATH_PLATFORM')) {
                        // language
                        if (isset($category->language)) {
                            $language = $category->language;
                        }
                        $url = ContactHelperRoute::getCategoryRoute($category->id, $language);
                    } else {
                        $itemid = WFLinkBrowser::getItemId('com_contact', array('category' => $category->id));
                        $url = 'index.php?option=com_contact&view=category&catid=' . $category->slug . $itemid;
                    }
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
                if (defined('JPATH_PLATFORM')) {
                    $categories = WFLinkBrowser::getCategory('com_contact', $args->id);

                    foreach ($categories as $category) {
                        $children = WFLinkBrowser::getCategory('com_contact', $category->id);

                        // language
                        if (isset($category->language)) {
                            $language = $category->language;
                        }

                        if ($children) {
                            $id = ContactHelperRoute::getCategoryRoute($category->id, $language);
                        } else {
                            $id = ContactHelperRoute::getCategoryRoute($category->slug, $language);
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
                }

                $contacts = self::_contacts($args->id);

                foreach ($contacts as $contact) {
                    // language
                    if (isset($contact->language)) {
                        $language = $contact->language;
                    }

                    if (defined('JPATH_PLATFORM')) {
                        $id = ContactHelperRoute::getContactRoute($contact->id, $args->id, $language);
                    } else {
                        $catid = $args->id ? '&catid=' . $args->id : '';
                        $itemid = WFLinkBrowser::getItemId('com_contact', array('contact' => $contact->id));

                        if (!$itemid && isset($args->Itemid)) {
                            // fall back to the parent item's Itemid
                            $itemid = '&Itemid=' . $args->Itemid;
                        }

                        $id = 'index.php?option=com_contact&view=contact' . $catid . '&id=' . $contact->id . '-' . $contact->alias . $itemid;
                    }
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

        if ($wf->getParam('links.joomlalinks.sef_url', 0)) {
            $url = WFLinkExtension::route($url);
        }

        return $url;
    }

    private static function _contacts($id)
    {
        $db = JFactory::getDBO();
        $user = JFactory::getUser();

        $where = '';

        $version = new JVersion();
        $language = $version->isCompatible('3.0') ? ', language' : '';

        $query = $db->getQuery(true);

        if (is_object($query)) {
            $query->select('id, name, alias' . $language)->from('#__contact_details')->where(array('catid=' . (int) $id, 'published = 1'));
            
            if (!$user->authorise('core.admin')) {
                $query->where('access IN (' . implode(',', $user->getAuthorisedViewLevels()) . ')');
            }

        } else {
            $query = 'SELECT id, name, alias'
            . ' FROM #__contact_details'
            . ' WHERE catid = ' . (int) $id
            . ' AND published = 1';

            if ($user->get('gid') != 25) {
                $query .= ' AND access <= ' . (int) $user->get('aid');
            }

            $query .= ' ORDER BY name';
        }

        $db->setQuery($query);

        return $db->loadObjectList();
    }
}
