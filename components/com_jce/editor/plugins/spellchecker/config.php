<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFSpellcheckerPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();
        $engine = $wf->getParam('spellchecker.engine', 'browser', 'browser');

        switch ($engine) {
            default:
            case 'browser':
            case 'googlespell':
                $languages = '';

                $settings['spellchecker_browser_state'] = $wf->getParam('spellchecker.browser_state', 0, 0);

                $engine = 'browser';

                break;

            case 'pspell':
            case 'pspellshell':
                $languages = (array) $wf->getParam('spellchecker.languages', 'English=en', '');

                if ($engine === 'pspellshell') {
                    $engine = 'pspell';
                }

                if (!function_exists('pspell_new')) {
                    $engine = 'browser';
                }

                break;
            case 'enchantspell':
                $languages = (array) $wf->getParam('spellchecker.languages', 'English=en', '');

                if (!function_exists('enchant_broker_init')) {
                    $engine = 'browser';
                }
                break;
        }

        if (!empty($languages)) {
            $settings['spellchecker_languages'] = '+' . implode(',', $languages);
        }

        // only needs to be set if not "browser"
        if ($engine !== "browser") {
            $settings['spellchecker_engine'] = $engine;

            $settings['spellchecker_suggestions'] = $wf->getParam('spellchecker.suggestions', 1, 1);
        }
    }
}
