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

use Joomla\CMS\Language\Text;
use Joomla\CMS\Object\CMSObject;

final class WFTabs extends CMSObject
{
    private $_tabs = array();
    private $_panels = array();
    private $_paths = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        if (!array_key_exists('base_path', $config)) {
            $config['base_path'] = WF_EDITOR_LIBRARIES;
        }

        $this->setProperties($config);

        if (array_key_exists('template_path', $config)) {
            $this->addTemplatePath($config['template_path']);
        } else {
            $this->addTemplatePath($this->get('base_path') . '/tmpl');
        }
    }

    /**
     * Returns a reference to a WFTabs object.
     *
     * This method must be invoked as:
     *    <pre>  $tabs = WFTabs::getInstance();</pre>
     *
     * @return object WFTabs
     */
    public static function getInstance($config = array())
    {
        static $instance;

        if (!is_object($instance)) {
            $instance = new self($config);
        }

        return $instance;
    }

    /**
     * Add a template path.
     *
     * @param string $path
     */
    public function addTemplatePath($path)
    {
        $this->_paths[] = $path;
    }

    /**
     * Load a panel view.
     *
     * @param object $layout Layout (panel) name
     *
     * @return panel WFView object
     */
    private function loadPanel($panel, $state)
    {
        $view = new WFView(array(
            'name' => $panel,
            'layout' => $panel,
        ));

        // add tab paths
        foreach ($this->_paths as $path) {
            $view->addTemplatePath($path);
        }

        // assign panel state to view
        $view->state = (int) $state;

        return $view;
    }

    public function getPanel($panel)
    {
        if (array_key_exists($panel, $this->_panels)) {
            return $this->_panels[$panel];
        }

        return false;
    }

    /**
     * Add a tab to the document. A panel is automatically created and assigned.
     *
     * @param object $tab    Tab name
     * @param int    $state  Tab state (active or inactive)
     * @param array  $values An array of values to assign to panel view
     */
    public function addTab($tab, $state = 1, $values = array())
    {
        if (!array_key_exists($tab, $this->_tabs)) {
            $this->_tabs[$tab] = (int) $state === 1 ? $tab : '';

            $panel = $this->addPanel($tab, $state);

            // array is not empty and is associative
            if (!empty($values) && array_values($values) !== $values) {
                foreach ($values as $key => $value) {
                    $panel->$key = $value;
                }
            }
        }
    }

    /**
     * Add a panel to the document.
     *
     * @param object $panel Panel name
     */
    public function addPanel($tab, $state)
    {
        if (!array_key_exists($tab, $this->_panels)) {
            $this->_panels[$tab] = $this->loadPanel($tab, $state);

            return $this->_panels[$tab];
        }
    }

    /**
     * Remove a tab from the document.
     *
     * @param object $tab Tab name
     */
    public function removeTab($tab)
    {
        if (array_key_exists($tab, $this->_tabs)) {
            unset($this->_tabs[$tab]);
        }
    }

    /**
     * Render the document tabs and panels.
     */
    public function render()
    {
        $output = '';

        if (!empty($this->_tabs)) {
            $output .= '<div id="tabs">';
        }

        // add tabs
        if (count($this->_tabs) > 1) {
            $output .= '<ul class="uk-tab" role="tablist">' . "\n";

            $x = 0;

            foreach ($this->_tabs as $name => $tab) {
                $class = '';

                if ($x === 0) {
                    $class .= ' uk-active';
                }

                if (!$tab) {
                    $class .= ' uk-hidden';
                }

                $output .= "\t" . '<li role="presentation" aria-selected="false" class="' . $class . '"><button type="button" class="uk-button uk-button-link uk-button-tab" tabindex="-1" value="' . $name . '">' . Text::_('WF_TAB_' . strtoupper($name)) . '</button></li>' . "\n";
                ++$x;
            }

            $output .= "</ul>\n";
        }

        // add panels
        if (!empty($this->_panels)) {
            $x = 0;

            $output .= '<div class="uk-switcher">';

            foreach ($this->_panels as $key => $panel) {
                $class = '';

                if ($panel->state === 0) {
                    $class .= ' uk-hidden';
                }

                if (!empty($this->_tabs)) {
                    if ($x === 0) {
                        $class .= ' uk-active';
                    } else {
                        $class .= ' uk-tabs-hide';
                    }
                }

                $output .= '<div id="' . $key . '_tab" class="' . $class . '" role="tabpanel" aria-hidden="true">';
                $output .= $panel->loadTemplate();
                $output .= '</div>';

                ++$x;
            }

            $output .= '</div>';
        }

        // add closing div
        if (!empty($this->_tabs)) {
            $output .= "</div>\n";
        }

        echo $output;
    }
}
