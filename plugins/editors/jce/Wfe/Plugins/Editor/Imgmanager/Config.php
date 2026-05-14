<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
namespace Wfe\Plugins\Editor\Imgmanager;

\defined('_JEXEC') or die;

class Config
{
    public static function getConfig(&$settings, $application = null)
    {
        $plugin = new \Wfe\Plugins\Editor\Imgmanager\Plugin();

        $config = array();

        $filetypes = $plugin->getFileTypes();

        if ($plugin->getParam('imgmanager.upload', 1)) {
            $config['upload'] = array(
                'max_size' => $plugin->getParam('max_size', 10240),
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
        }

        $config['attributes'] = $plugin->getDefaultAttributes();
        $config['custom_classes'] = $plugin->getParam('custom_classes', []);

        $settings['imgmanager'] = $config;
    }
}
