<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Document;

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;
use Wfe\Document\View;
use Wfe\Registry\ConfigurationTrait;
use Wfe\Helper\ArrayHelper;

final class Tabs
{
    use ConfigurationTrait;

    private static $sharedInstance;

    private $tabs = array();
    private $panels = array();
    private $paths = array();

    /**
     * Constructor activating the default information of the class.
     */
    public function __construct($config = array())
    {
        if (!array_key_exists('base_path', $config)) {
            $config['base_path'] = WF_EDITOR_LIBRARIES;
        }

        $this->setConfiguration($config);

        if (array_key_exists('template_path', $config)) {
            $this->addTemplatePath($config['template_path']);
        } else {
            $this->addTemplatePath($this->get('base_path') . '/tmpl');
        }
    }

    /**
     * Returns a reference to the shared Tabs instance.
     *
     * @deprecated  Use the container's getTabs() method instead.
     *
     * @return Tabs
     */
    public static function getInstance($config = array())
    {
        if (!is_object(self::$sharedInstance)) {
            self::$sharedInstance = new self($config);
        }

        return self::$sharedInstance;
    }

    /**
     * Register an externally-created instance as the shared singleton.
     * Called by the container at bootstrap so that any remaining legacy
     * call sites that still use getInstance() receive the same object.
     *
     * @param  Tabs  $tabs
     *
     * @return void
     */
    public static function register(Tabs $tabs)
    {
        self::$sharedInstance = $tabs;
    }

    /**
     * Add a template path.
     *
     * @param string $path
     */
    public function addTemplatePath($path)
    {
        $this->paths[] = $path;
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
        $view = new View(array(
            'name' => $panel,
            'layout' => $panel,
        ));

        // add tab paths
        foreach ($this->paths as $path) {
            $view->addTemplatePath($path);
        }

        // assign panel state to view
        $view->set('state', (int) $state);

        return $view;
    }

    public function getPanel($panel)
    {
        if (array_key_exists($panel, $this->panels)) {
            return $this->panels[$panel];
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
        if (!array_key_exists($tab, $this->tabs)) {
            $this->tabs[$tab] = (int) $state === 1 ? $tab : '';

            $panel = $this->addPanel($tab, $state);

            // array is not empty and is associative
            if (!empty($values) && ArrayHelper::isAssociative($values)) {
                foreach ($values as $key => $value) {
                    $panel->set($key, $value);
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
        if (!array_key_exists($tab, $this->panels)) {
            $this->panels[$tab] = $this->loadPanel($tab, $state);

            return $this->panels[$tab];
        }
    }

    /**
     * Remove a tab from the document.
     *
     * @param object $tab Tab name
     */
    public function removeTab($tab)
    {
        if (array_key_exists($tab, $this->tabs)) {
            unset($this->tabs[$tab]);
        }
    }

    /**
     * Render the document tabs and panels.
     */
    public function render()
    {
        $output = '';

        if (!empty($this->tabs)) {
            $output .= '<div id="tabs">';
        }

        // add tabs
        if (count($this->tabs) > 1) {
            $output .= '<ul class="uk-tab" role="tablist">' . "\n";

            $x = 0;

            foreach ($this->tabs as $name => $tab) {
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
        if (!empty($this->panels)) {
            $x = 0;

            $output .= '<div class="uk-switcher">';

            foreach ($this->panels as $key => $panel) {
                $class = '';

                if ($panel->get('state') === 0) {
                    $class .= ' uk-hidden';
                }

                if (!empty($this->tabs)) {
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
        if (!empty($this->tabs)) {
            $output .= "</div>\n";
        }

        echo $output;
    }
}
