<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

class WfTemplateHelix extends JPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {                        
        $path = JPATH_SITE . '/templates/' . $template->name;

        if (!is_file($path . '/comingsoon.php')) {
            return false;
        }

        // add bootstrap
        $files[] = 'templates/' . $template->name . '/css/bootstrap.min.css';

        // add base template.css file
        $files[] = 'templates/' . $template->name . '/css/template.css';

        $params = new JRegistry($template->params);
        $preset = $params->get('preset', '');

        $data = json_decode($preset);

        if ($data) {
            if (isset($data->preset)) {
                $files[] = 'templates/' . $template->name . '/css/presets/' . $data->preset . '.css';
            }
        }
    }
}