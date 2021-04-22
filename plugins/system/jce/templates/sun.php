<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

class WfTemplateSun extends JPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {                        
        $path = JPATH_SITE . '/templates/' . $template->name;

        if (!is_file($path . '/template.defines.php')) {
            return false;
        }

        // add bootstrap
        $files[] = 'plugins/system/jsntplframework/assets/3rd-party/bootstrap/css/bootstrap-frontend.min.css';

        // add base template.css file
        $files[] = 'templates/' . $template->name . '/css/template.css';

        $params = new JRegistry($template->params);
        $preset = $params->get('preset', '');

        $data = json_decode($preset);

        if ($data) {
            if (isset($data->templateColor)) {
                $files[] = 'templates/' . $template->name . '/css/color/' . $data->templateColor . '.css';
            }

            if (isset($data->fontStyle) && isset($data->fontStyle->style)) {
                $files[] = 'templates/' . $template->name . '/css/styles/' . $data->fontStyle->style . '.css';
            }
        }
    }
}