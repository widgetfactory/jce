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

        /*$settings['paste_dialog_width'] = $wf->getParam('clipboard.paste_dialog_width', 450, 450);
        $settings['paste_dialog_height'] = $wf->getParam('clipboard.paste_dialog_height', 400, 400);
        $settings['paste_use_dialog'] = $wf->getParam('clipboard.paste_use_dialog', 0, 0, 'boolean');*/
        $settings['paste_force_cleanup'] = $wf->getParam('clipboard.paste_force_cleanup', 0, 0, 'boolean');
        $settings['paste_strip_class_attributes'] = $wf->getParam('clipboard.paste_strip_class_attributes', 2, 2);
        $settings['paste_remove_styles'] = $wf->getParam('clipboard.paste_remove_styles', 1, 1, 'boolean');

        $settings['paste_retain_style_properties'] = $wf->getParam('clipboard.paste_retain_style_properties', '', '');
        $settings['paste_remove_style_properties'] = $wf->getParam('clipboard.paste_remove_style_properties', '', '');
        $settings['paste_remove_attributes'] = $wf->getParam('clipboard.paste_remove_attributes', '', '');

        $settings['paste_remove_spans'] = $wf->getParam('clipboard.paste_remove_spans', 0, 0, 'boolean');
        $settings['paste_remove_styles_if_webkit'] = $wf->getParam('clipboard.paste_remove_styles_if_webkit', 0, 0, 'boolean');
        $settings['paste_remove_empty_paragraphs'] = $wf->getParam('clipboard.paste_remove_empty_paragraphs', 1, 1, 'boolean');
        $settings['paste_allow_event_attributes'] = $wf->getParam('clipboard.paste_allow_event_attributes', 0, 0, 'boolean');

        $settings['paste_process_footnotes'] = $wf->getParam('clipboard.paste_process_footnotes', 'convert', 'convert');
        $settings['paste_upload_data_images'] = $wf->getParam('clipboard.paste_upload_images', 0, 0, 'boolean');

        $settings['paste_remove_tags'] = $wf->getParam('clipboard.paste_remove_tags', '', '');
        $settings['paste_keep_tags'] = $wf->getParam('clipboard.paste_keep_tags', '', '');
        $settings['paste_filter'] = $wf->getParam('clipboard.paste_filter', '', '');

        $settings['paste_data_images'] = $wf->getParam('clipboard.paste_data_images', 1, 1, 'boolean');

        // clean to remove duplicate items and empty values
        foreach (['paste_retain_style_properties', 'paste_remove_style_properties', 'paste_remove_attributes', 'paste_remove_tags', 'paste_keep_tags'] as $key) {
            $value = $settings[$key];

            if ($value) {
                $settings[$key] = self::cleanStringList($value);
            }
        }

        // experimental, disabled
        $settings['paste_process_stylesheets'] = $wf->getParam('clipboard.paste_process_stylesheets', 0, 0);

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
