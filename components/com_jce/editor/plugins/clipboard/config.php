<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFClipboardPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $mode = $wf->getParam('clipboard.paste_cleanup_mode', 0);

        $settings['paste_force_cleanup'] = true;
        $settings['paste_strip_class_attributes'] = 1;
        $settings['paste_remove_styles'] = true;
        $settings['paste_remove_spans'] = true;
        $settings['paste_remove_styles_if_webkit'] = true;
        $settings['paste_remove_empty_paragraphs'] = true;

        // any cleanup mode will keep the following
        if ($mode) {
            $settings['paste_force_cleanup'] = false; // set to detect so only Word classes are removed
            $settings['paste_strip_class_attributes'] = 2; // Only remove Word classes
        }

        // mode 2 = keep styles (only in Word content)
        if ($mode == 2) {
            $settings['paste_remove_styles'] = false;
            $settings['paste_remove_spans'] = false; // styles are usually applied to spans
        }

        $settings['clipboard_paste_text'] = $wf->getParam('clipboard.paste_text', 1, 1, 'boolean');
        $settings['clipboard_paste_html'] = $wf->getParam('clipboard.paste_html', 1, 1, 'boolean');
    }

    private static function cleanStringList($value)
    {
        $value = trim($value);
        $values = explode(',', $value);
        // remove whitespace
        $values = array_map('trim', $values);
        // remove duplicates and emtpy values
        $values = array_unique(array_filter($values));

        return implode(',', $values);
    }
}
