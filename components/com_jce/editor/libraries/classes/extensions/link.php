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

use Joomla\CMS\Application\CMSApplication;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Filter\InputFilter;

class WFLinkExtension extends WFExtension
{
    /*
     *  @var varchar
     */

    private $extensions = array();
    protected static $instance;
    protected static $links = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        parent::__construct();

        $extensions = self::loadExtensions('links');

        // Load all link extensions
        foreach ($extensions as $link) {
            $this->extensions[] = $this->getLinkExtension($link->name);
        }

        $request = WFRequest::getInstance();
        $request->setRequest(array($this, 'getLinks'));
    }

    public static function getInstance($config = array())
    {
        if (!isset(self::$instance)) {
            self::$instance = new self($config);
        }

        return self::$instance;
    }

    public function display()
    {
        parent::display();

        foreach ($this->extensions as $extension) {
            $extension->display();
        }
    }

    private function getLinkExtension($name)
    {
        if (array_key_exists($name, self::$links) === false || empty(self::$links[$name])) {
            $classname = 'WFLinkBrowser_' . ucfirst($name);
            // create class
            if (class_exists($classname)) {
                self::$links[$name] = new $classname();
            }
        }

        return self::$links[$name];
    }

    public function getLists()
    {
        $list = array();

        foreach ($this->extensions as $extension) {
            if ($extension->isEnabled()) {
                $list[] = $extension->getList();
            }
        }

        return $list;
    }

    public function render()
    {
        $list = $this->getLists();

        if (empty($list)) {
            return '';
        }

        $view = $this->getView(array('name' => 'links', 'layout' => 'links'));
        $view->list = implode("\n", $list);
        $view->display();
    }

    private static function cleanInput($args, $method = 'string')
    {
        $filter = InputFilter::getInstance();

        foreach ($args as $k => $v) {
            $args->$k = $filter->clean($v, $method);
            $args->$k = (string) filter_var($args->$k, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_BACKTICK);
            $args->$k = htmlspecialchars(strip_tags($args->$k));
        }

        return $args;
    }

    public function getLinks($args)
    {
        $args = self::cleanInput($args, 'STRING');

        foreach ($this->extensions as $extension) {
            if (in_array($args->option, $extension->getOption())) {
                $items = $extension->getLinks($args);
            }
        }
        $array = array();
        $result = array();
        if (isset($items)) {
            foreach ($items as $item) {
                $array[] = array(
                    'id' => isset($item['id']) ? self::xmlEncode($item['id']) : '',
                    'url' => isset($item['url']) ? self::xmlEncode($item['url']) : '',
                    'name' => self::xmlEncode($item['name']), 'class' => $item['class'],
                );
            }
            $result = array('folders' => $array);
        }

        return $result;
    }

    /**
     * Category function used by many extensions.
     *
     * @return Category list object
     *
     * @since    1.5
     */
    public static function getCategory($section, $parent = 1)
    {
        $db = Factory::getDBO();
        $user = Factory::getUser();
        $wf = WFEditorPlugin::getInstance();

        $query = $db->getQuery(true);

        $where = array();

        $version = new Joomla\CMS\Version();
        $language = $version->isCompatible('3.0') ? ', language' : '';

        $where[] = 'parent_id = ' . (int) $parent;
        $where[] = 'extension = ' . $db->Quote($section);

        if (!$user->authorise('core.admin')) {
            $where[] = 'access IN (' . implode(',', $user->getAuthorisedViewLevels()) . ')';
        }

        if (!$wf->checkAccess('static', 1)) {
            $where[] = 'path != ' . $db->Quote('uncategorised');
        }

        $case = '';

        if ($wf->getParam('category_alias', 1) == 1) {
            //sqlsrv changes
            $case = ', CASE WHEN ';
            $case .= $query->charLength('alias', '!=', '0');
            $case .= ' THEN ';
            $a_id = $query->castAsChar('id');
            $case .= $query->concatenate(array($a_id, 'alias'), ':');
            $case .= ' ELSE ';
            $case .= $a_id . ' END as slug';
        }

        $where[] = 'published = 1';
        $query->select('id AS slug, id AS id, title, alias, access' . $language . $case)->from('#__categories')->where($where)->order('title');

        $db->setQuery($query);

        return $db->loadObjectList();
    }

    /**
     * (Attempt to) Get an Itemid.
     *
     * @param string $component
     * @param array  $needles
     *
     * @return Category list object
     */
    public function getItemId($component, $needles = array())
    {
        $match = null;

        $app = CMSApplication::getInstance('site');
        $tag = defined('JPATH_PLATFORM') ? 'component_id' : 'componentid';

        $component = ComponentHelper::getComponent($component);
        $menu = $app->getMenu('site');
        $items = $menu->getItems($tag, $component->id);

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

    /**
     * XML encode a string.
     *
     * @param     string    String to encode
     *
     * @return string Encoded string
     */
    private static function xmlEncode($string)
    {
        return str_replace(array('&', '<', '>', "'", '"'), array('&amp;', '&lt;', '&gt;', '&apos;', '&quot;'), $string);
    }
}

abstract class WFLinkBrowser extends WFLinkExtension
{
}
