<?php

/**
 * @copyright     Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
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

        // Root block handling
        $forced_root_block = $wf->getParam('editor.forced_root_block', 'p');

        // set as boolean if disabled
        if (is_numeric($forced_root_block)) {
            $settings['forced_root_block'] = (bool) intval($forced_root_block);

            if ($settings['forced_root_block'] === false) {
                $settings['force_block_newlines'] = false;
            }

            // legacy value
            if ($wf->getParam('editor.force_br_newlines', 0, 0, 'boolean') === false) {
                $settings['force_block_newlines'] = $wf->getParam('editor.force_p_newlines', 1, 0, 'boolean');
            }
        } else {
            if (strpos($forced_root_block, '|') !== false) {
                // multiple values
                foreach (explode('|', $forced_root_block) as $option) {
                    list($key, $value) = explode(':', $option);

                    // update legacy key
                    if ($key === 'force_p_newlines') {
                        $key = 'force_block_newlines';
                    }

                    $settings[$key] = is_numeric($value) ? (bool) $value : $value;
                }
            } else {
                $settings['forced_root_block'] = $forced_root_block;
            }
        }

        $convert_urls = $wf->getParam('editor.convert_urls');

        // Relative urls - legacy
        $relative_urls = $wf->getParam('editor.relative_urls');

        // if a legacy value is set as a numeric value, and convert_urls is not, then process legacy value
        if (is_numeric($relative_urls) && empty($convert_urls)) {
            $relative_urls = intval($relative_urls);

            if ($relative_urls === 1) {
                $convert_urls = 'relative';
            }

            if ($relative_urls === 0) {
                $convert_urls = 'absolute';
            }
        }

        switch ($convert_urls) {
            default:
            case 'relative':
                $settings['relative_urls'] = true;
                break;
            case 'absolute':
                $settings['relative_urls'] = false;
                $settings['remove_script_host'] = false;
                break;
            case 'none':
                $settings['mixed_urls'] = true;
                $settings['remove_script_host'] = false;
                break;
        }
    }
}
