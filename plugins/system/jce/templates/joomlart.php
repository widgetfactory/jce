<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

class WfTemplateJoomlart extends JPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {                        
        $path = JPATH_SITE . '/templates/' . $template->name;

        if (!is_file($path . '/templateInfo.php')) {
            return false;
        }

        // add base template.css file
        $files[] = 'templates/' . $template->name . '/css/template.css';

        $items = array();
            
        $list = glob(JPATH_SITE . '/media/t4/css/*.css');

        foreach($list as $file) {
            $items[filemtime($file)] = $file;
        }

        // sort by modified time key
        ksort($items, SORT_NUMERIC);

        // get the last item in the array
        $item = end($items);

        // add compiled css file
        $files[] = 'media/t4/css/' . basename($item);
    }
}