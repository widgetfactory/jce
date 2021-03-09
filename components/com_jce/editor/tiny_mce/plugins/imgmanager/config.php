<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
class WFImgmanagerPluginConfig
{
    public static function getConfig(&$settings)
    {
        require_once __DIR__ . '/imgmanager.php';

        $plugin = new WFImgmanagerPlugin();

        $config = array();

        $filetypes = $plugin->getFileTypes();

        if ($plugin->getParam('upload', 1)) {
            $config['upload'] = array(
                'max_size' => $plugin->getParam('max_size', 1024),
                'filetypes' => $filetypes,
                'inline' => $plugin->getParam('inline_upload', 1)
            );
        }

        if ($plugin->getParam('basic_dialog', 0) == 1) {
            $config['basic_dialog'] = true;

            if ($plugin->getParam('basic_dialog_filebrowser', 1) == 1) {
                $config['basic_dialog_filebrowser'] = true;
                $config['filetypes'] = $filetypes;
            }

            $config['always_include_dimensions'] = (bool) $plugin->getParam('always_include_dimensions', 1);
            $config['attributes'] = $plugin->getDefaultAttributes();
        }

        $settings['imgmanager'] = $config;
    }
}
