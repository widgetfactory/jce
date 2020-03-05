<?php

/**
 * @copyright     Copyright (c) 2009-2020 Ryan Demmer. All rights reserved
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
            'element'   => $element,
            'mediatype'    => $mediatype,
            'callback'  => $callback
        ));

        return $options['url'];
    }

    public static function getMediaFieldLink($element = null, $mediatype = 'images', $callback = '')
    {
        $options = self::getMediaFieldOptions(array(
            'element'   => $element,
            'mediatype' => $mediatype,
            'callback'  => $callback
        ));

        return $options['url'];
    }

    public static function getMediaFieldOptions($options = array())
    {
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

        $app = JFactory::getApplication();

        // set $url as empty string
        $data = array(
            'url' => '',
            'upload' => 0
        );

        // load editor class
        require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

        // get editor instance
        $wf = WFApplication::getInstance();

        // check the current user is in a profile
        if ($wf->getProfile('browser')) {
            
            // is conversion enabled?
            if ($options['converted'] && (int) $wf->getParam('browser.mediafield_conversion', 1) === 0) {
                return $data;
            }

            $token = JFactory::getSession()->getFormToken();

            $data['url'] = 'index.php?option=com_jce&task=plugin.display&plugin=browser&standalone=1&' . $token . '=1&client=' . $app->getClientId();

            // add context
            $data['url'] .= '&context=' . $wf->getContext();

            foreach ($options as $key => $value) {
                if ($value) {
                    $data['url'] .= '&' . $key . '=' . $value; 
                }
            }

            $data['upload'] = (int) $wf->getParam('browser.mediafield_upload', 1);
        }

        return $data;
    }
}
