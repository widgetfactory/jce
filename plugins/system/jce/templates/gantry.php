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
            // update url
            $url = 'templates/' . $template->name . '/custom/css-compiled';

            // editor.css file
            $editor_css = $gantry5 . '/editor.css';

            // check for editor.css file
            if (is_file($editor_css) && filesize($editor_css) > 0) {
                $files[] = $url . '/' . basename($editor_css);
                return true;
            }

            // load gantry base files
            $files[] = 'media/gantry5/assets/css/bootstrap-gantry.css';
            $files[] = 'media/gantry5/engines/nucleus/css-compiled/nucleus.css';

            $items  = array();
            $custom = array();

            $list = glob($gantry5 . '/*_[0-9]*.css');

            foreach ($list as $file) {
                if (strpos(basename($file), 'custom_') !== false) {
                    $custom[filemtime($file)] = $file;
                } else {
                    $items[filemtime($file)] = $file;
                }
            }

            if (!empty($items)) {
                // sort items by modified time key
                ksort($items, SORT_NUMERIC);

                // get the last item in the array
                $item = end($items);

                $path = dirname($item);
                $file = basename($item);

                // load css files
                $files[] = $url . '/' . $file;
            }

            // load custom css file if it exists
            if (!empty($custom)) {
                // sort custom by modified time key
                ksort($custom, SORT_NUMERIC);
                
                // get the last custom file in the array
                $custom_file = end($custom);
                // create custom file url
                $files[] = $url . '/' . basename($custom_file);
            }
        }

        if (is_dir($gantry4)) {
            // update url
            $url = 'templates/' . $template->name . '/css-compiled';
            // load gantry bootstrap files
            $files[] = $url . '/bootstrap.css';

            $items = array();

            $list = glob($gantry4 . '/master-*.css');

            if (!empty($list)) {
                foreach ($list as $file) {
                    $items[filemtime($file)] = $file;
                }

                // sort by modified time key
                ksort($items, SORT_NUMERIC);

                // get the last item in the array
                $item = end($items);

                // load css files
                $files[] = $url . '/' . basename($item);
            }
        }
    }
}
