<?php

/**
 * @copyright   Copyright (c) 2021-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('JPATH_BASE') or die;

use Joomla\Filesystem\Path;
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

        // cassiopeia and its child templates load fontawesome as a dependency
        if (($template->name === 'cassiopeia' || ($template->parent ?? '') === 'cassiopeia') && is_file(JPATH_SITE . '/media/system/css/joomla-fontawesome.min.css')) {
            $files[] = 'media/system/css/joomla-fontawesome.min.css';
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
