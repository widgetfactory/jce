<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;

abstract class WfBrowserHelper
{
    public static function getBrowserLink($element = null, $mediatype = '', $callback = '')
    {
        $options = self::getMediaFieldOptions(array(
            'element' => $element,
            'mediatype' => $mediatype,
            'callback' => $callback,
        ));

        return $options['url'];
    }

    public static function getMediaFieldLink($element = null, $mediatype = 'images', $callback = '')
    {
        $options = self::getMediaFieldOptions(array(
            'element' => $element,
            'mediatype' => $mediatype,
            'callback' => $callback,
        ));

        return $options['url'];
    }

    public static function getMediaFieldOptions($options = array())
    {
        $app = Factory::getApplication();
        $token = Factory::getSession()->getFormToken();

        if (!isset($options['element'])) {
            $options['element'] = null;
        }

        if (!isset($options['mediatype'])) {
            $options['mediatype'] = 'images';
        }

        if (!isset($options['callback'])) {
            $options['callback'] = '';
        }

        if (!isset($options['converted'])) {
            $options['converted'] = false;
        }

        // set $url as empty string
        $data = array(
            'url' => '',
            'upload' => 0,
            'converted' => false,
        );

        // load editor class
        require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

        // get editor instance
        $wf = WFApplication::getInstance();

        $profile = $wf->getProfile('browser');

        // check the current user is in a profile
        if ($profile) {
            // is conversion enabled?
            if ($options['converted']) {
                $data['converted'] = (bool) $wf->getParam('browser.mediafield_conversion', 1);
            }

            $data['url'] = 'index.php?option=com_jce&task=plugin.display';

            // add default context
            if (!isset($options['context'])) {
                $options['context'] = $wf->getContext();
            }

            // append "caller" plugin
            if (!empty($options['plugin'])) {
                if (strpos($options['plugin'], 'browser') === false) {
                    $options['plugin'] = 'browser.' . $options['plugin'];
                }
            } else {
                $options['plugin'] = 'browser';
            }

            $options['standalone'] = 1;
            $options[$token] = 1;
            $options['client'] = $app->getClientId();

            // assign custom query values
            if (!empty($profile->custom)) {
                $options['profile_custom'] = $app->input->get('profile_custom', array());
                                
                // get custom query values
                foreach($profile->custom as $key => $value) {
                    // not set in the $_REQUEST array
                    if ($app->input->get($key, null) === null) {
                        continue;
                    }

                    if ($value == '') {
                        continue;
                    }
                    
                    $options['profile_custom'][$key] = $value;
                }
            }

            // filter options values
            $options = array_filter($options, function ($value) {
                if (is_array($value)) {
                    return !empty($value);
                }
                
                return $value !== '' && $value !== null;
            });

            $data['url'] .= '&' . http_build_query($options);

            // get allowed extensions
            $accept = $wf->getParam('browser.extensions', 'jpg,jpeg,png,gif,mp3,m4a,mp4a,ogg,mp4,mp4v,mpeg,mov,webm,doc,docx,odg,odp,ods,odt,pdf,ppt,pptx,txt,xcf,xls,xlsx,csv,zip,tar,gz');

            $data['accept'] = array_map(function ($value) {
                if ($value[0] != '-') {
                    return $value;
                }
            }, explode(',', $accept));

            $data['accept'] = implode(',', array_filter($data['accept']));
            $data['upload'] = (bool) $wf->getParam('browser.mediafield_upload', 1);

            $app->triggerEvent('onWfMediaFieldGetOptions', array(&$data));
        }

        return $data;
    }
}
