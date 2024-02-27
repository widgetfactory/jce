<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFFormatselectPluginConfig
{
    protected static $formats = array(
        'p' => 'advanced.paragraph',
        'address' => 'advanced.address',
        'pre' => 'advanced.pre',
        'h1' => 'advanced.h1',
        'h2' => 'advanced.h2',
        'h3' => 'advanced.h3',
        'h4' => 'advanced.h4',
        'h5' => 'advanced.h5',
        'h6' => 'advanced.h6',
        'div' => 'advanced.div',
        'div_container' => 'advanced.div_container',
        'blockquote' => 'advanced.blockquote',
        'code' => 'advanced.code',
        'samp' => 'advanced.samp',
        'span' => 'advanced.span',
        'section' => 'advanced.section',
        'article' => 'advanced.article',
        'aside' => 'advanced.aside',
        'header' => 'advanced.header',
        'footer' => 'advanced.footer',
        'nav' => 'advanced.nav',
        'figure' => 'advanced.figure',
        //'figcaption' => 'advanced.figcaption',
        'dl' => 'advanced.dl',
        'dt' => 'advanced.dt',
        'dd' => 'advanced.dd',
    );

    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        // html5 block elements
        $html5 = array('section', 'article', 'aside', 'figure');
        // get current schema
        $schema = $wf->getParam('editor.schema', 'html4');
        $verify = (bool) $wf->getParam('editor.verify_html', 0);

        $legacy = $wf->getParam('editor.theme_advanced_blockformats');
        $default = 'p,div,address,pre,h1,h2,h3,h4,h5,h6,code,samp,span,section,article,aside,header,footer,nav,figure,dl,dt,dd';

        // get blockformats from parameter
        $blockformats = $wf->getParam('formatselect.blockformats');

        $settings['formatselect_preview_styles'] = $wf->getParam('formatselect.preview_styles', 1, 1);

        // handle empty list
        if (empty($blockformats)) {
            if (!empty($legacy)) {
                $blockformats = $legacy;
            } else {
                return '';
            }
        }

        $list = array();
        $blocks = array();

        // make an array
        if (is_string($blockformats)) {
            $blockformats = explode(',', $blockformats);
        }

        // create label / value list using default
        foreach ($blockformats as $key) {
            if (array_key_exists($key, self::$formats)) {
                $label = self::$formats[$key];
            }

            // skip html5 blocks for html4 schema
            if ($verify && $schema == 'html4' && in_array($key, $html5)) {
                continue;
            }

            if (isset($label)) {
                $list[$key] = $label;
            }

            $blocks[] = $key;
        }

        // Format list / Remove Format
        $settings['formatselect_blockformats'] = json_encode($list);
    }
}
