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

class Joomlart extends CMSPlugin implements SubscriberInterface
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

        if (!is_file($path . '/templateInfo.php')) {
            return;
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

        $event->setArgument('files', $files);
    }
}