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
        
        // Joomla! 1.5 standard
        $file = 'template.css';
        $css = array();

        $path = JPATH_SITE . '/templates/' . $template->name . '/css';

        if (!is_dir($path)) {
            return false;
        }

        $css = JFolder::files($path, '(base|core|template|template_css)\.(css|less)$', false, true);

        if (!empty($css)) {
            // use the first result
            $file = $css[0];
        }

        // check for php version, eg: template.css.php
        if (is_file($path . '/' . $file . '.php')) {
            $file .= '.php';
        }

        // get file name only
        $file = basename($file);

        // check for default css file
        if (is_file($path . '/' . $file)) {
            $files[] = 'templates/' . $template->name . '/css/' . $file;
        }
    }
}