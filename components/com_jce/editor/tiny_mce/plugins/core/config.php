<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
class WFCorePluginConfig
{
    private static function extractContent($content)
    {
        $content = htmlspecialchars_decode($content);

        // Remove body etc.
        if (preg_match('/<body[^>]*>([\s\S]+?)<\/body>/', $content, $matches)) {
            $content = trim($matches[1]);
        }

        return $content;
    }

    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $startup_content_url = $wf->getParam('editor.startup_content_url', '');
        $startup_content_html = $wf->getParam('editor.startup_content_html', '');

        if ($startup_content_url) {
            if (preg_match("#\.(htm|html|txt|md)$#", $startup_content_url) && strpos('://', $startup_content_url) === false) {
                $startup_content_url = trim($startup_content_url, '/');

                $file = JPATH_SITE . '/' . $startup_content_url;

                if (is_file($file)) {
                    $startup_content_html = @file_get_contents($file);
                }
            }
        }

        if ($startup_content_html) {
            $settings['startup_content_html'] = htmlspecialchars(self::extractContent($startup_content_html));
        }
    }
}
