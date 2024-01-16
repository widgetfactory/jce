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

class WFSearchExtension extends WFExtension
{
    private static $instances = array();

    /**
     * Returns a reference to a plugin object.
     *
     * This method must be invoked as:
     *         <pre>  $advlink =AdvLink::getInstance();</pre>
     *
     * @return JCE The editor object
     *
     * @since    1.5
     */
    public static function getInstance($type, $config = array())
    {
        if (!isset(self::$instances)) {
            self::$instances = array();
        }

        if (empty(self::$instances[$type])) {
            $file = WF_EDITOR . '/extensions/search/' . $type . '.php';

            if (is_file($file)) {
                require_once WF_EDITOR . '/extensions/search/' . $type . '.php';
            }

            $classname = 'WF' . ucfirst($type) . 'SearchExtension';

            if (class_exists($classname)) {
                self::$instances[$type] = new $classname($config);
            } else {
                self::$instances[$type] = new self();
            }
        }

        return self::$instances[$type];
    }
}
