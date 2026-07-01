<?php

/**
 * @copyright   Copyright (c) 2021-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Joomla\Plugin\System\Jce\Templates;

defined('JPATH_BASE') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Registry\Registry;
use Joomla\Event\SubscriberInterface;
use Joomla\Event\Event;

class Wright extends CMSPlugin implements SubscriberInterface
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

        // not a wright template
        if (!is_dir($path . '/wright')) {
            return;
        }

        // add bootstrap
        $files[] = 'templates/' . $template->name . '/wright/css/bootstrap.min.css';

        $params = new Registry($template->params);
        $style = $params->get('style', 'default');

        // check style-custom.css file
        $file = $path . '/css/style-' . $style . '.css';

        // add base theme.css file
        if (is_file($file)) {
            $files[] = 'templates/' . $template->name . '/css/style-' . $style . '.css';
        }

        $event->setArgument('files', $files);
    }
}