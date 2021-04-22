<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

class WfTemplateWright extends JPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {                        
        $path = JPATH_SITE . '/templates/' . $template->name;

        // not a wright template
        if (!is_dir($path . '/wright')) {
            return false;
        }

        // add bootstrap
        $files[] = 'templates/' . $template->name . '/wright/css/bootstrap.min.css';

        $params = new JRegistry($template->params);
        $style = $params->get('style', 'default');

        // check style-custom.css file
        $file = $path . '/css/style-' . $style . '.css';

        // add base theme.css file
        if (is_file($file)) {
            $files[] = 'templates/' . $template->name . '/css/style-' . $style . '.css';
        }
    }
}