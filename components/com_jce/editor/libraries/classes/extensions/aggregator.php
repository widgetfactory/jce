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

use Joomla\CMS\Filesystem\Folder;

class WFAggregatorExtension extends WFExtension
{
    protected static $instance;

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
    public static function getInstance($config = array())
    {
        if (!isset(self::$instance)) {
            self::$instance = new self($config);
        }

        return self::$instance;
    }

    public function getName()
    {
        return $this->get('name');
    }

    public function getTitle()
    {
        return $this->get('title');
    }

    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();

        $aggregators = $this->getAggregators();

        foreach ($aggregators as $aggregator) {
            $aggregator->display();

            $params = $aggregator->getParams();

            if (!empty($params)) {
                $document->addScriptDeclaration('WFExtensions.Aggregator.setParams("' . $aggregator->getName() . '",' . json_encode($params) . ');');
            }
        }
    }

    public function getAggregators()
    {
        static $aggregators;

        if (!isset($aggregators)) {
            $aggregators = array();
        }

        // get the aggregator format for this instance
        $format = $this->get('format');

        if (empty($aggregators[$format])) {

            // get a plugin instance
            $plugin = WFEditorPlugin::getInstance();

            $aggregators[$format] = array();

            $path = WF_EDITOR_EXTENSIONS . '/aggregator';
            $files = Folder::files($path, '\.php$', false, true);

            foreach ($files as $file) {
                require_once $file;

                $name = basename($file, '.php');
                $classname = 'WFAggregatorExtension_' . ucfirst($name);

                // only load if enabled
                if (class_exists($classname)) {
                    $aggregator = new $classname();

                    // check if enabled
                    if ($aggregator->isEnabled()) {
                        if ($aggregator->get('format') == $format) {
                            $aggregator->set('name', $name);
                            $aggregator->set('title', 'WF_AGGREGATOR_' . strtoupper($name) . '_TITLE');
                            $aggregators[$format][] = $aggregator;
                        }
                    }
                }
            }
        }

        return $aggregators[$format];
    }

    /**
     * @param object $player
     *
     * @return string
     */
    public function loadTemplate($name, $tpl = '')
    {
        $path = WF_EDITOR_EXTENSIONS . '/aggregator/' . $name;

        $output = '';

        $file = 'default.php';

        if ($tpl) {
            $file = 'default_' . $tpl . '.php';
        }

        if (file_exists($path . '/tmpl/' . $file)) {
            ob_start();

            include $path . '/tmpl/' . $file;

            $output .= ob_get_contents();
            ob_end_clean();
        }

        return $output;
    }
}
