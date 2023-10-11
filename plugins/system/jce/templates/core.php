<?php

/**
 * @copyright   Copyright (C) 2021 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later
 */
defined('JPATH_BASE') or die;

use Joomla\CMS\Filesystem\Path;
use Joomla\CMS\Plugin\CMSPlugin;

class WfTemplateCore extends CMSPlugin
{
    private function findFile($template, $name)
    {
        // template.css
        $file = Path::find(array(
            JPATH_SITE . '/templates/' . $template . '/css',
            JPATH_SITE . '/media/templates/site/' . $template . '/css',
        ), $name);

        if ($file) {
            // make relative
            $file = str_replace(JPATH_SITE, '', $file);

            // remove leading slash
            $file = trim($file, '/');

            return $file;
        }

        return false;
    }

    public function onWfGetTemplateStylesheets(&$files, $template)
    {
        // already processed by a framework
        if (!empty($files)) {
            return false;
        }

        if ($template->parent) {
            foreach (array('template.css', 'user.css') as $name) {
                $file = $this->findFile($template->parent, $name);

                if ($file) {
                    $files[] = $file;
                }
            }
        }

        foreach (array('template.css', 'user.css') as $name) {
            $file = $this->findFile($template->name, $name);

            if ($file) {
                $files[] = $file;
            }
        }
    }
}
