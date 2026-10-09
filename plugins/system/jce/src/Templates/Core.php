<?php

/**
 * @copyright   Copyright (c) 2021-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Joomla\Plugin\System\Jce\Templates;

defined('JPATH_BASE') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Filesystem\Path;
use Joomla\Event\SubscriberInterface;
use Joomla\Event\Event;

class Core extends CMSPlugin implements SubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            'onWfGetTemplateStylesheets' => 'onWfGetTemplateStylesheets'
        ];
    }

    private function findFile($template, $name)
    {
        // search for file using Path
        $file = Path::find(array(
            JPATH_SITE . '/templates/' . $template . '/css',
            JPATH_SITE . '/media/templates/site/' . $template . '/css'
        ), $name);

        if (!$file) {
            return false;
        }

        // make relative
        $file = str_replace(JPATH_SITE, '', $file);

        // remove leading slash
        return trim($file, '/');
    }

    public function onWfGetTemplateStylesheets(Event $event) : void
    {
        $files = $event->getArgument('files');
        $template = $event->getArgument('template');

        // already processed by a framework
        if (!empty($files)) {
            return;
        }

        // parent template stylesheets, eg: child template of cassiopeia
        if (!empty($template->parent)) {
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

        $event->setArgument('files', $files);
    }
}
