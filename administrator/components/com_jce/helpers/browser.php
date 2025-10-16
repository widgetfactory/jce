<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;

JLoader::register('WFApplication', JPATH_ADMINISTRATOR . '/components/com_jce/helpers/browser.php');

abstract class WfBrowserHelper
{
    public static function getBrowserLink($element = null, $mediatype = '', $callback = '', $options = array())
    {
        $options = array_merge($options, array(
            'element' => $element,
            'mediatype' => $mediatype,
            'callback' => $callback,
        ));

        $url = self::getMediaFieldUrl($options);

        return $url;
    }

    public static function getMediaFieldLink($element = null, $mediatype = 'images', $callback = '')
    {
        $url = self::getMediaFieldUrl(array(
            'element' => $element,
            'mediatype' => $mediatype,
            'callback' => $callback,
        ));

        return $url;
    }

    public static function isMediaFieldEnabled()
    {
        static $enabled = null;

        if ($enabled !== null) {
            return $enabled;
        }

        require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/application.php';

        $wf = WFApplication::getInstance();
        $profile = $wf->getActiveProfile(['plugin' => 'browser']);

        $enabled = $profile ? (bool) $wf->getParam('browser.mediafield_enable', 1) : false;

        return $enabled;
    }

    public static function getMediaFieldUrl($options = array())
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

        if (self::isMediaFieldEnabled() === false) {
            return '';
        }

        // get editor instance
        $wf = WFApplication::getInstance();

        // set base url
        $url = 'index.php?option=com_jce&task=plugin.display';

        // add default context
        if (empty($options['context'])) {
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

        // filter options values
        $options = array_filter($options, function ($value) {
            if (is_array($value)) {
                return !empty($value);
            }

            return $value !== '' && $value !== null;
        });

        $url .= '&' . http_build_query($options);

        return $url;
    }

    public static function getMediaFieldOptions($options = array())
    {
        if (self::isMediaFieldEnabled() === false) {
            return $options;
        }

        $app = Factory::getApplication();

        // get component params to check for media field conversion
        $componentParams = ComponentHelper::getParams('com_jce');

        // merge default options
        $options = array_merge(array(
            'upload' => 0,
            'select_button' => 1,
            'convert' => 0,
            'mediafields' => array(),
        ), $options);

        // get editor instance
        $wf = WFApplication::getInstance();
        $profile = $wf->getActiveProfile(['plugin' => 'browser']);

        // is conversion enabled?
        $options['convert'] = (int) $componentParams->get('replace_media_manager', 1) && (int) $wf->getParam('browser.mediafield_conversion', 1);

        // add default context
        $options['context'] = $wf->getContext();

        // get allowed extensions
        $accept = $wf->getParam('browser.extensions', 'jpg,jpeg,png,gif,mp3,m4a,mp4a,ogg,mp4,mp4v,mpeg,mov,webm,doc,docx,odg,odp,ods,odt,pdf,ppt,pptx,txt,xcf,xls,xlsx,csv,zip,tar,gz');

        $options['accept'] = array_map(function ($value) {
            if ($value[0] != '-') {
                return $value;
            }
        }, explode(',', $accept));

        $options['accept'] = implode(',', array_filter($options['accept']));
        $options['upload'] = (int) $wf->getParam('browser.mediafield_upload', 1);
        $options['select_button'] = (int) $wf->getParam('browser.mediafield_select_button', 1);

        $app->triggerEvent('onWfMediaFieldGetOptions', array(&$options, $profile));

        return $options;
    }
}
