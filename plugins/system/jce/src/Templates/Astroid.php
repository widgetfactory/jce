<?php

/**
 * @copyright   Copyright (c) 2021-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Joomla\Plugin\System\Jce\Templates;

defined('JPATH_BASE') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\SubscriberInterface;
use Joomla\Event\Event;

class Astroid extends CMSPlugin implements SubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            'onWfGetTemplateStylesheets' => 'onWfGetTemplateStylesheets'
        ];
    }

    public function onWfGetTemplateStylesheets(Event $event) : void
    {
        $files = $event->getArgument('files');
        $template = $event->getArgument('template');

        // Joomla 4+ media folder first, then legacy template folder
        foreach (array('media/templates/site/', 'templates/') as $base) {
            $url = $base . $template->name;
            $path = JPATH_SITE . '/' . $url;

            if (!is_dir($path . '/astroid')) {
                continue;
            }

            // add template css file (bootstrap)
            if (is_file($path . '/css/template.css')) {
                $files[] = $url . '/css/template.css';
            }

            $items = glob($path . '/css/compiled-*.css');

            if (!empty($items)) {
                // newest compiled file only
                usort($items, function ($a, $b) {
                    return filemtime($b) - filemtime($a);
                });

                $files[] = $url . '/css/' . basename($items[0]);
            }

            // add custom css file
            if (is_file($path . '/css/custom.css')) {
                $files[] = $url . '/css/custom.css';
            }

            $event->setArgument('files', $files);

            return;
        }
    }
}
