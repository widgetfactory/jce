<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFLinkPluginConfig
{
    public static function getConfig(&$settings)
    {
        require_once __DIR__ . '/link.php';

        $plugin = new WFLinkPlugin();
        $attributes = $plugin->getDefaults();

        $config = array(
            'attributes' => $plugin->getDefaults(),
        );

        // expose globally for use by Autolink and Clipboard
        $settings['default_link_target'] = $plugin->getParam('target', '');

        // expose globally for use by Autolink and Clipboard (must be boolean)
        $settings['autolink_email'] = $plugin->getParam('autolink_email', 1, 1, 'boolean');
        $settings['autolink_url'] = $plugin->getParam('autolink_url', 1, 1, 'boolean');

        if ($plugin->getParam('link.quicklink', 1) == 0) {
            $config['quicklink'] = false;
        }

        if ($plugin->getParam('link.basic_dialog', 0) == 1) {
            $config['basic_dialog'] = true;
            $config['file_browser'] = $plugin->getParam('file_browser', 1);

            $config['target_ctrl']  = $plugin->getParam('attributes_target', 1, 1, 'boolean');
            $config['title_ctrl']   = $plugin->getParam('attributes_title', 1, 1, 'boolean');
        }

        $settings['link'] = $config;
    }
}
