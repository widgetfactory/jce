<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Adapter;

\defined('_JEXEC') or die;

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;

use Wfe\Document\View;
use Wfe\Helper\AdapterHelper;

class LightboxAdapter extends \Wfe\Adapter\AbstractAdapter
{
    private $templates = array();

    public function __construct($container, $config = array())
    {
        parent::__construct($container, $config);

        // Load plugin definitions only (no instantiation here)
        $plugins = AdapterHelper::getPlugins('lightbox');

        // set the default lightbox
        $config['default'] = $this->getParam('popups.default', '');

        foreach ($plugins as $plugin) {
            $this->plugins[] = AdapterHelper::createPlugin($plugin, $config, $container);
        }
    }

    public function display()
    {
        parent::display();

        $document = $this->getDocument();
        $config   = $this->getProperties();

        if ($config) {
            $document->addScriptDeclaration('WfLightboxAdapter.setConfig(' . json_encode($config) . ');');
        }

        $count = 0;

        // Create instances only to check enabled + get params
        foreach ($this->plugins as $plugin) {
            if ($plugin->isEnabled()) {
                $count++;

                $params = $plugin->getParams();

                if (!empty($params)) {
                    $document->addScriptDeclaration(
                        'WfLightboxAdapter.setParams("' . $plugin->getName() . '",' . json_encode($params) . ');'
                    );
                }
            }
        }

        if ($count) {
            $tabs = $this->getTabs();
            $tabs->addTab('lightbox');

            $panel = $tabs->getPanel('lightbox');
            $panel->addTemplatePath(WF_EDITOR . '/views/adapter/lightbox/tmpl');
            $panel->set('lightbox', $this);
        }
    }

    protected function getTemplates()
    {
        return $this->templates;
    }

    protected function addTemplate($template)
    {
        $this->templates[] = $template;
    }

    /**
     * Build list from definitions only.
     */
    public function getLightboxList()
    {
        $options = array();

        $options[] = HTMLHelper::_('select.option', '', '-- ' . Text::_('WF_POPUP_TYPE_SELECT') . ' --');

        foreach ($this->plugins as $plugin) {
            $options[] = HTMLHelper::_('select.option', $plugin->getName(), Text::_($plugin->getTitle()));
        }

        return HTMLHelper::_('select.genericlist', $options, 'lightbox_list', '', 'value', 'text', $this->getConfig('default'));
    }

    /**
     * Renders templates for all lightbox adapters.
     */
    public function getLightboxTemplates()
    {
        $output = '';

        $view = $this->getContainer()->getView();

        foreach ($this->getTemplates() as $template) {
            $output .= $view->loadTemplate($template);
        }

        // If you have a default / active adapter, render only that one.
        $active = strtolower((string) $this->getConfig('default'));

        foreach ($this->plugins as $plugin) {
            $path = $plugin->getPath();
            $name = $plugin->getName();

            $path = dirname($path);

            if ($active && strtolower($name) !== $active) {
                continue;
            }

            if (!is_dir($path . '/tmpl')) {
                continue;
            }

            if (!file_exists($path . '/tmpl/default.php')) {
                continue;
            }

            $adapterView = new View(array(
                'name' => $name,
                'base_path' => $path,
                'template_path' => $path . '/tmpl'
            ));

            $adapterView->setContainer('lightbox', $plugin);

            ob_start();

            $output .= '<div id="lightbox_adapter_' . $name . '" style="display:none;">';

            $adapterView->display();

            $output .= ob_get_contents();
            $output .= '</div>';

            ob_end_clean();
        }

        return $output;
    }
}
