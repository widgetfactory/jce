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
    
    public function onWfGetTemplateStylesheets(Event $event) : void
    {                        
        $files = $event->getArgument('files');
        $template = $event->getArgument('template');
        
        // already processed by a framework
        if (!empty($files)) {
            return;
        }

        // search for template.css file using JPath
        $file = Path::find(array(
            JPATH_SITE . '/templates/' . $template->name . '/css',
            JPATH_SITE . '/media/templates/site/' . $template->name . '/css'
        ), 'template.css');
                
        if (!$file) {
            return;
        }

        // make relative
        $file = str_replace(JPATH_SITE, '', $file);
        
        // remove leading slash
        $file = trim($file, '/');

        $files[] = $file;

        $event->setArgument('files', $files);
    }
}