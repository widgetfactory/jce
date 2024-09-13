<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @copyright   Copyright (C) 2005 - 2021 Open Source Matters, Inc. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

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

        $custom_css = $wf->getParam('editor.custom_css', []);

        if (!empty($custom_css)) {
            // trim
            $custom_css = array_map('trim', $custom_css);

            array_walk($custom_css, function (&$value) {
                $value = htmlspecialchars($value, ENT_QUOTES);
                $value = self::stripCssExpressions($value);
            });
            
            $settings['custom_css'] = implode(';', $custom_css);
        }
    }

    /**
	 * Remove CSS Expressions in the form of <property>:expression(...)
     * From libraries/vendor/joomla/filter/src/InputFilter.php
	 *
	 * @param   string  $source  The source string.
	 *
	 * @return  string  Filtered string
	 */
	protected static function stripCssExpressions($source)
	{
		// Strip any comments out (in the form of /*...*/)
		$test = preg_replace('#\/\*.*\*\/#U', '', $source);

		// Test for :expression
		if (!stripos($test, ':expression'))
		{
			// Not found, so we are done
			return $source;
		}

		// At this point, we have stripped out the comments and have found :expression
		// Test stripped string for :expression followed by a '('
		if (preg_match_all('#:expression\s*\(#', $test, $matches))
		{
			// If found, remove :expression
			return str_ireplace(':expression', '', $test);
		}

		return $source;
	}
}
