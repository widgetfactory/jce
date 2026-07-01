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

class Sun extends CMSPlugin implements SubscriberInterface
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

        if (!is_file($path . '/template.defines.php')) {
            return;
        }

        // add bootstrap
        $files[] = 'plugins/system/jsntplframework/assets/3rd-party/bootstrap/css/bootstrap-frontend.min.css';

        // add base template.css file
        $files[] = 'templates/' . $template->name . '/css/template.css';

        $params = new Registry($template->params);
        $preset = $params->get('preset', '');

        $data = json_decode($preset);

        if ($data) {
            if (isset($data->templateColor)) {
                $files[] = 'templates/' . $template->name . '/css/color/' . $data->templateColor . '.css';
            }

            if (isset($data->fontStyle) && isset($data->fontStyle->style)) {
                $files[] = 'templates/' . $template->name . '/css/styles/' . $data->fontStyle->style . '.css';
            }
        }

        $event->setArgument('files', $files);
    }
}