<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

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
                'inline' => $plugin->getParam('inline_upload', 1),
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
