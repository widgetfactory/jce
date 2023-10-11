<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

use Joomla\CMS\Plugin\CMSPlugin;

class WfTemplateAstroid extends CMSPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {                        
        // Joomla 4
        $path = JPATH_SITE . '/media/templates/site/' . $template->name;
            
        if (is_dir($path . '/astroid')) {
            $items = glob($path . '/css/compiled-*.css');

            foreach($items as $item) {
                $files[] = 'media/templates/site/' . $template->name . '/css/' . basename($item);
            }

            // add custom css file
            if (is_file($path . '/css/custom.css')) {
                $files[] = 'media/templates/site/' . $template->name . '/css/custom.css';
            }

            return true;
        }
        
        // Joomla 3
        $path = JPATH_SITE . '/templates/' . $template->name;

        if (is_dir($path . '/astroid')) {
            $items = glob($path . '/css/compiled-*.css');

            foreach($items as $item) {
                // add compiled css file
                $files[] = 'templates/' . $template->name . '/css/' . basename($item);
            }

            // add custom css file
            if (is_file($path . '/css/custom.css')) {
                $files[] = 'templates/' . $template->name . '/css/custom.css';
            }
        }
    }
}