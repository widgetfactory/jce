<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

class WfTemplateAstroid extends JPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {                        
        $path = JPATH_SITE . '/templates/' . $template->name;

        if (!is_dir($path . '/astroid')) {
            return false;
        }
            
        $items = glob($path . '/css/compiled-*.css');

        foreach($items as $item) {
            // add compiled css file
            $files[] = 'templates/' . $template->name . '/css/' . basename($item);
        }
    }
}