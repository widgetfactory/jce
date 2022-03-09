<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

class WfTemplateCore extends JPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {                        
        // already processed by a framework
        if (!empty($files)) {
            return false;
        }

        // search for template.css file using JPath
        $file = JPath::find(array(
            JPATH_SITE . '/templates/' . $template->name . '/css',
            JPATH_SITE . '/media/templates/site/' . $template->name . '/css'
        ), 'template.css');
                
        if (!$file) {
            return false;
        }

        // make relative
        $file = str_replace(JPATH_SITE, '', $file);
        
        // remove leading slash
        $file = trim($file, '/');

        $files[] = $file;
    }
}