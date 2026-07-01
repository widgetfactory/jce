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

class Yootheme extends CMSPlugin implements SubscriberInterface
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

        // not a yootheme / warp template
        if (!is_dir($path . '/warp') && !is_dir($path . '/vendor/yootheme')) {
            return;
        }

        if (is_dir($path . '/warp')) {
            $file = 'css/theme.css';

            $config = $path . '/config.json';

            if (is_file($config)) {
                $data = file_get_contents($config);
                $json = json_decode($data);

                $style = '';

                if ($json) {
                    if (!empty($json->layouts->default->style)) {
                        $style = $json->layouts->default->style;
                    }
                }

                if ($style && $style !== 'default') {
                    $file = 'styles/' . $style . '/css/theme.css';
                }
            }

            // add base theme.css file
            if (is_file($path . '/' . $file)) {
                $files[] = 'templates/' . $template->name . '/' . $file;
            }

            // add custom css file
            if (is_file($path . '/css/custom.css')) {
                $files[] = 'templates/' . $template->name . '/css/custom.css';
            }
        }

        if (is_dir($path . '/vendor/yootheme')) {
            $files[] = 'templates/' . $template->name . '/css/theme.css';

            // add custom css file
            if (is_file($path . '/css/custom.css')) {
                $files[] = 'templates/' . $template->name . '/css/custom.css';
            }
        }

        $event->setArgument('files', $files);
    }
}