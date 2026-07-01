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

class Helix extends CMSPlugin implements SubscriberInterface
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

        if (!is_file($path . '/comingsoon.php')) {
            return;
        }

        // add bootstrap
        $files[] = 'templates/' . $template->name . '/css/bootstrap.min.css';

        // add base template.css file
        $files[] = 'templates/' . $template->name . '/css/template.css';

        $params = new Registry($template->params);
        $preset = $params->get('preset', '');

        $data = json_decode($preset);

        if ($data) {
            if (isset($data->preset)) {
                $files[] = 'templates/' . $template->name . '/css/presets/' . $data->preset . '.css';
            }
        }

        $event->setArgument('files', $files);
    }
}