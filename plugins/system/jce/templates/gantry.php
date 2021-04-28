<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

class WfTemplateGantry extends JPlugin
{
    public function onWfGetTemplateStylesheets(&$files, $template)
    {                        
        $path = JPATH_SITE . '/templates/' . $template->name;

        // not a gantry template
        if (!is_dir($path . '/gantry') && !is_file($path . '/gantry.config.php')) {
            return false;
        }

        $name = substr($template->name, strpos($template->name, '_') + 1);

        // try Gantry5 templates
        $gantry5 = $path . '/custom/css-compiled';
        $gantry4 = $path . '/css-compiled';

        if (is_dir($gantry5)) {
            $items = array();
            
            $files = glob($gantry5 . '/' . $name . '_[0-9]*.css');

            foreach($files as $file) {
                $items[filemtime($file)] = $file;
            }

            // sort by modified time key
            ksort($items, SORT_NUMERIC);

            // get the last item in the array
            $item = end($items);
                        
            // update url
            $url = 'templates/' . $template->name . '/custom/css-compiled';

            $path = dirname($item);
            $file = basename($item);

            // check for editor.css file
            if (is_file($path) && filesize($path) > 0) {
                $files[] = $url . '/' . basename($css);
                return true;
            }

            // load gantry base files
            $files[] = 'media/gantry5/assets/css/bootstrap-gantry.css';
            $files[] = 'media/gantry5/engines/nucleus/css-compiled/nucleus.css';

            // load css files
            $files[] = $url . '/' . $file;

            // create name of possible custom.css file
            $custom = str_replace($name, 'custom', $file);

            // load custom css file if it exists
            if (is_file($path . '/' . $custom)) {
                $files[] = $url . '/' . $custom;
            }
        }

        if (is_dir($gantry4)) {
            $items = array();
            
            $list = glob($gantry4 . '/master-*.css');

            foreach($list as $file) {
                $items[filemtime($file)] = $file;
            }

            // sort by modified time key
            ksort($items, SORT_NUMERIC);

            // get the last item in the array
            $item = end($items);
            
            // update url
            $url = 'templates/' . $template->name . '/css-compiled';
            // load gantry bootstrap files
            $files[] = $url . '/bootstrap.css';
            // load css files
            $files[] = $url . '/' . basename($item);
        }
    }
}