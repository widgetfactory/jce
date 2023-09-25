<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

class WFMediaPluginConfig
{
    public static function getConfig(&$settings)
    {
        $wf = WFApplication::getInstance();

        $tags = array();

        $elements = array(
            'audio' => array('audio', 'source'),
            'video' => array('video', 'source'),
            'embed' => array('embed'),
            'object' => array('object', 'param'),
        );

        $allow_iframes = (int) $wf->getParam('media.iframes', 0);

        if ($allow_iframes) {
            $tags[] = 'iframe';

            // may be overwritten by mediamanager config - ../mediamanager/config.php
            if ($allow_iframes == 2) {
                $settings['media_iframes_allow_local'] = true;
            }

            if ($allow_iframes == 3) {
                $settings['media_iframes_supported_media'] = array();

                $settings['media_iframes_allow_supported'] = true;

                $iframes_supported_media = $wf->getParam('media.iframes_supported_media', array('youtube', 'vimeo', 'dailymotion', 'scribd', 'slideshare', 'soundcloud', 'spotify', 'ted', 'twitch'));

                // get values only
                $iframes_supported_media = array_values($iframes_supported_media);

                $iframes_supported_media_custom = $wf->getParam('media.iframes_supported_media_custom', array());

                // get values only
                if (!empty($iframes_supported_media_custom)) {
                    $iframes_supported_media_custom = array_values($iframes_supported_media_custom);
                }

                $settings['media_iframes_supported_media'] = array_merge($iframes_supported_media, $iframes_supported_media_custom);
            }
        }

        foreach ($elements as $name => $items) {
            $allowed = (int) $wf->getParam('media.' . $name, 1);

            if ($allowed) {
                $tags = array_merge($tags, $items);

                if ($allowed == 2) {
                    $settings['media_' . $name . '_allow_local'] = true;
                }
            }
        }

        $tags = array_unique(array_values($tags));

        $settings['media_valid_elements'] = array_values($tags);
        $settings['media_live_embed'] = $wf->getParam('media.live_embed', 1);

        // allow all elements
        $settings['invalid_elements'] = array_diff($settings['invalid_elements'], array('audio', 'video', 'source', 'embed', 'object', 'param', 'iframe'));
    }
}
