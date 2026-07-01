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
                   
        $path = JPATH_SITE . '/templates/' . $template->name;

        if (!is_dir($path . '/astroid')) {
            return;
        }
            
        $items = glob($path . '/css/compiled-*.css');

        foreach($items as $item) {
            // add compiled css file
            $files[] = 'templates/' . $template->name . '/css/' . basename($item);
        }

        $event->setArgument('files', $files);
    }
}