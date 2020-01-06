<?php

/**
 * @copyright     Copyright (c) 2009-2020 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
class WFLinkPluginConfig
{
    public static function getConfig(&$settings)
    {
        require_once __DIR__ . '/link.php';

        $plugin = new WFLinkPlugin();
        $config = $plugin->getDefaults();

        // expose globally for use by Autolink and Clipboard
        $settings['default_link_target'] = $plugin->getParam('link.target', '');
        
        // expose globally for use by Autolink and Clipboard
        $settings['autolink_email'] = $plugin->getParam('link.autolink_email', 1, 1);
        $settings['autolink_url'] = $plugin->getParam('link.autolink_url', 1, 1);

        if ($plugin->getParam('link.quicklink', 1) == 0) {
            $settings['link_quicklink'] = false;
        }

        $settings['link'] = $config;
    }
}
