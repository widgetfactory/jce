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
use Joomla\CMS\Component\ComponentHelper;

JLoader::register('WFApplication', JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php');

abstract class WfBrowserHelper
{
    public static function getBrowserLink($element = null, $mediatype = '', $callback = '', $options = array())
    {
        $options = array_merge($options, array(
            'element'   => $element,
            'mediatype' => $mediatype,
            'callback'  => $callback,
        ));
        
        $values = self::getMediaFieldOptions($options);

        return $values['url'];
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

        // get component params to check for media field conversion
        $componentParams = ComponentHelper::getParams('com_jce');

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

        if (!isset($options['mediafolder'])) {
            $options['mediafolder'] = '';
        }

        // set $url as empty string
        $data = array(
            'url' => '',
            'upload' => 0,
            'select_button' => 1,
            'converted' => false,
        );

        // load editor class
        require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

        // get editor instance
        $wf = WFApplication::getInstance();

        $profile = $wf->getActiveProfile(
            array('plugin' => 'browser')
        );
        
        // check the current user is in a profile
        if ($profile) {            
            
            if ((int) $wf->getParam('browser.mediafield_enable', 1) == 0) {
                return $data;
            }
            
            // is conversion enabled?
            $data['converted'] = (int) $componentParams->get('replace_media_manager', 1) && (int) $wf->getParam('browser.mediafield_conversion', 1);

            // set base url
            $data['url'] = 'index.php?option=com_jce&task=plugin.display';

            // add default context
            if (empty($options['context'])) {
                $options['context'] = $wf->getContext();
            }

            // update context value for external use
            $data['context'] = $options['context'];

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
            $data['upload'] = (int) $wf->getParam('browser.mediafield_upload', 1);
            $data['select_button'] = (int) $wf->getParam('browser.mediafield_select_button', 1);

            $app->triggerEvent('onWfMediaFieldGetOptions', array(&$data, $profile));
        }

        return $data;
    }
}
