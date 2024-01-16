<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Plugin\PluginHelper;

class WFPopupsExtension_Jcemediabox
{
    /**
     * Constructor activating the default information of the class.
     */
    public function __construct()
    {
        if (self::isEnabled()) {
            $scripts = array();

            $document = WFDocument::getInstance();

            $document->addScript('jcemediabox', 'extensions/popups/jcemediabox/js');
            $document->addStyleSheet('jcemediabox', 'extensions/popups/jcemediabox/css');
        }
    }

    public function getParams()
    {
        $wf = WFEditorPlugin::getInstance();

        return array(
            'width' => 600,
            'album' => '#jcemediabox_popup_group',
            'multiple' => '#jcemediabox_popup_title,#jcemediabox_popup_caption',
            'attribute' => $wf->getParam('popups.jcemediabox.attribute', 'data-mediabox'),
            'popup_group' => $wf->getParam('popups.jcemediabox.popup_group', ''),
            'popup_icon' => $wf->getParam('popups.jcemediabox.popup_icon', 1),
            'popup_icon_position' => $wf->getParam('popups.jcemediabox.popup_icon_position', ''),
            'popup_autopopup' => $wf->getParam('popups.jcemediabox.popup_autopopup', ''),
            'popup_hide' => $wf->getParam('popups.jcemediabox.popup_hide', 0),
            'popup_mediatype' => $wf->getParam('popups.jcemediabox.popup_mediatype', ''),
        );
    }

    public function isEnabled()
    {
        $wf = WFEditorPlugin::getInstance();

        if ((PluginHelper::isEnabled('system', 'jcemediabox') || PluginHelper::isEnabled('system', 'wf_lightcase')) && $wf->getParam('popups.jcemediabox.enable', 1) == 1) {
            return true;
        }

        return false;
    }

    public function checkVersion()
    {
        return true;
    }
}
