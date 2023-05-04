<?php

/**
 * @copyright     Copyright (c) 2009-2022 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

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
        $app = JFactory::getApplication();
        $token = JFactory::getSession()->getFormToken();


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
            'converted' => false
        );

        // load editor class
        require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

        // get editor instance
        $wf = WFApplication::getInstance();

        // check the current user is in a profile
        if ($wf->getProfile('browser')) {
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

            foreach ($options as $key => $value) {
                if ($value) {
                    $data['url'] .= '&' . $key . '=' . $value;
                }
            }

            // get allowed extensions
            $accept = $wf->getParam('browser.extensions', 'jpg,jpeg,png,gif,mp3,m4a,mp4a,ogg,mp4,mp4v,mpeg,mov,webm,doc,docx,odg,odp,ods,odt,pdf,ppt,pptx,txt,xcf,xls,xlsx,csv,zip,tar,gz');
            
            $data['accept'] = array_map(function ($value) {                
                if ($value[0] != '-') {
                    return $value;
                }
            }, explode(',', $accept));

            $data['accept'] = implode(',', array_filter($data['accept']));

            $data['upload'] = (bool) $wf->getParam('browser.mediafield_upload', 1);
        }

        return $data;
    }
}
