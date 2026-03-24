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

use Wfe\Helper\AdapterHelper;

class MediaAdapter extends \Wfe\Adapter\AbstractAdapter
{
    public function __construct($container, $config = array())
    {
        parent::__construct($container, $config);

        // Load plugin definitions only (no instantiation here)
        $plugins = AdapterHelper::getPlugins('media');

        foreach($plugins as $plugin) {
            $this->plugins[] = AdapterHelper::createPlugin($plugin, $config, $container);
        }
    }

    public function display()
    {
        $document = $this->getDocument();

        foreach ($this->plugins as $plugin) {        
            $plugin->display();

            $params = $plugin->getParams();

            if (!empty($params)) {
                $document->addScriptDeclaration('WfMediaAdapter.setParams("' . $plugin->getName() . '",' . json_encode($params) . ');');
            }
        }
    }

    /**
     * @param object $player
     *
     * @return string
     */
    public function loadTemplate($name, $tpl = '')
    {
        $path = WF_PLUGINS . '/Media/' . $name;

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
