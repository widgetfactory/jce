<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Registry\Registry;

class WfTemplateHelix extends CMSPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {
        $path = JPATH_SITE . '/templates/' . $template->name;

        if (!is_file($path . '/comingsoon.php')) {
            return false;
        }

        // add bootstrap
        $files[] = 'templates/' . $template->name . '/css/bootstrap.min.css';

        // add font-awesome
        $files[] = 'templates/' . $template->name . '/css/font-awesome.min.css';

        // add base template.css file
        $files[] = 'templates/' . $template->name . '/css/template.css';

        $params = new Registry($template->params);
        $preset = $params->get('preset', '');

        $data = json_decode($preset);

        if ($data) {
            if (isset($data->preset)) {
                $files[] = 'templates/' . $template->name . '/css/presets/' . $data->preset . '.css';
            }
        }

        // add custom.css
        if (is_file($path . '/css/custom.css')) {
            $files[] = 'templates/' . $template->name . '/css/custom.css';
        }
    }
}
