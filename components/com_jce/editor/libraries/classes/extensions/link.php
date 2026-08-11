<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Application\CMSApplication;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Filter\InputFilter;

/**
 * Link extension.
 *
 * Loads the installed "links" extensions, eg: Joomla Links, and provides the
 * link tree displayed in the editor Link dialog, along with a number of helper
 * methods shared by the individual link extensions.
 */
class WFLinkExtension extends WFExtension
{
    /**
     * Loaded link extension instances.
     *
     * @var array
     */
    private $extensions = array();

    /**
     * Singleton instance.
     *
     * @var WFLinkExtension
     */
    protected static $instance;

    /**
     * Link extension instances, keyed by extension name.
     *
     * @var array
     */
    protected static $links = array();

    /**
     * Constructor.
     *
     * Loads the available link extensions and registers the request method
     * callable from the editor.
     */
    public function __construct($config = array())
    {
        parent::__construct($config);

        $extensions = self::loadExtensions('links');

        // Load all link extensions
        foreach ($extensions as $link) {
            $extension = $this->getLinkExtension($link->name);

            if ($extension->isEnabled()) {
                $this->extensions[] = $extension;
            }
        }

        $request = WFRequest::getInstance();
        $request->setRequest(array($this, 'getLinks'));
    }

    /**
     * Get a singleton instance of this class.
     *
     * @param array $config Optional configuration, only used when the instance is first created
     *
     * @return WFLinkExtension
     */
    public static function getInstance($config = array())
    {
        if (!isset(self::$instance)) {
            self::$instance = new self($config);
        }

        return self::$instance;
    }

    /**
     * Display this extension and each of the loaded link extensions.
     *
     * @return void
     */
    public function display()
    {
        parent::display();

        foreach ($this->extensions as $extension) {
            $extension->display();
        }
    }

    /**
     * Get a link extension instance by name, creating it if required.
     *
     * @param string $name Link extension name, eg: "joomlalinks"
     *
     * @return object The link extension instance
     */
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

    /**
     * Get the rendered list markup from each enabled link extension.
     *
     * @return array
     */
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

    /**
     * Render the link list view.
     *
     * @return string Empty string if no link extensions are enabled, otherwise the view is displayed
     */
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

    /**
     * Clean each value of a request arguments object.
     *
     * Values are filtered, stripped of low ascii and backtick characters, then
     * stripped of tags and html encoded.
     *
     * @param object $args   Request arguments
     * @param string $method Filter type to apply, eg: "string"
     *
     * @return object The cleaned arguments object
     */
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

    /**
     * Get the link list items for a request.
     *
     * The request is passed to the link extension that supports the requested
     * option, and the returned items are xml encoded for the editor.
     *
     * @param object $args Request arguments, including the component option to list links for
     *
     * @return array Array with a "folders" key, or an empty array if no items were found
     */
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
     * Get a list of published categories the user is allowed to view.
     *
     * Used by many link extensions.
     *
     * @param string $section Category extension name, eg: "com_content"
     * @param int    $parent  Parent category id
     *
     * @return array Category list objects
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

            // Joomla 3 compatibility
            if (method_exists($query, 'castAsChar')) {
                $a_id = $query->castAsChar('id');
            } else {
                $a_id = $query->castAs('CHAR', 'id');
            }

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
     * Searches the site menu for an item that points at the given component
     * and matches one of the view / id pairs passed in.
     *
     * @param string $component Component name, eg: "com_content"
     * @param array  $needles   Array of view name => item id to match against
     *
     * @return string Url fragment, eg: "&Itemid=101", or an empty string if no match was found
     */
    public static function getItemId($component, $needles = array())
    {
        $match = null;

        $version = new Joomla\CMS\Version();

        $app = CMSApplication::getInstance('site');
        $tag = $version->isCompatible('4.0') ? 'component_id' : 'componentid';

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
     * @param string $string String to encode
     *
     * @return string Encoded string
     */
    private static function xmlEncode($string)
    {
        return str_replace(array('&', '<', '>', "'", '"'), array('&amp;', '&lt;', '&gt;', '&apos;', '&quot;'), $string);
    }
}

/**
 * Base class for individual link extensions, eg: WFLinkBrowser_Joomlalinks.
 */
abstract class WFLinkBrowser extends WFLinkExtension
{
}
