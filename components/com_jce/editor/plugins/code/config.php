<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFCodePluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        if (!in_array('code', $settings['plugins'])) {
            $settings['plugins'][] = 'code';
        }

        $settings['code_use_blocks'] = $wf->getParam('editor.code_blocks', 1, 1, 'boolean');

        $settings['code_allow_php'] = $wf->getParam('editor.allow_php', 0, 0, 'boolean');
        $settings['code_allow_script'] = $wf->getParam('editor.allow_javascript', 0, 0, 'boolean');
        $settings['code_allow_style'] = $wf->getParam('editor.allow_css', 0, 0, 'boolean');

        $settings['code_protect_shortcode'] = $wf->getParam('editor.protect_shortcode', 0, 0, 'boolean');
        $settings['code_allow_custom_xml'] = $wf->getParam('editor.allow_custom_xml', 0, 0, 'boolean');

        $remove = array();

        // remove as Invalid Elements
        if ($settings['code_allow_script']) {
            $remove[] = 'script';
        }

        if ($settings['code_allow_style']) {
            $remove[] = 'style';
        }

        $settings['invalid_elements'] = array_diff($settings['invalid_elements'], $remove);
    }
}
