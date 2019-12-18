<?php

/**
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
class WFFormatPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $settings['inline_styles'] = $wf->getParam('editor.inline_styles', 1, 1);

        // Paragraph handling
        $forced_root_block = $wf->getParam('editor.forced_root_block', 'p');

        // set as boolean if disabled
        if (is_numeric($forced_root_block)) {
            $settings['forced_root_block'] = (bool) intval($forced_root_block);

            if ($wf->getParam('editor.force_br_newlines', 0, 0, 'boolean') === false) {
                // legacy
                $settings['force_p_newlines'] = $wf->getParam('editor.force_p_newlines', 1, 0, 'boolean');
            }
        } else {
            if (strpos($forced_root_block, '|') !== false) {
                // multiple values
                foreach (explode('|', $forced_root_block) as $option) {
                    list($key, $value) = explode(':', $option);

                    $settings[$key] = (bool) $value;
                }
            } else {
                $settings['forced_root_block'] = $forced_root_block;
            }
        }

        $convert_urls = $wf->getParam('editor.convert_urls', 'relative');

        // Relative urls - legacy
        $relative_urls = $wf->getParam('editor.relative_urls');

        if ($convert_urls === 'relative' || $relative_urls == 1) {
            $settings['relative_urls'] = true;
        }

        // absolute urls
        if ($convert_urls === 'absolute' || $relative_urls == 0) {
            $settings['relative_urls'] = false;
            $settings['remove_script_host'] = false;
        }

        // mixed urls - the new default
        if (empty($convert_urls)) {
            $settings['mixed_urls'] = true;
            $settings['remove_script_host'] = false;
        }
    }
}
