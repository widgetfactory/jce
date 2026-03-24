<?php

/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Wfe\Plugins\Lightbox;

\defined('_JEXEC') or die;

use Joomla\CMS\Plugin\PluginHelper;

class Jcemediabox extends \Wfe\Adapter\Plugin\Lightbox\AbstractLightbox
{
    public function display()
    {    
        if ($this->isEnabled()) {
            $document = $this->getDocument();

            $document->addScript('jcemediabox', 'adapters/lightbox/jcemediabox/js');
            $document->addStyleSheet('jcemediabox', 'adapters/lightbox/jcemediabox/css');
        }
    }

    public function getParams()
    {
        return array(
            'width' => 600,
            'album' => '#jcemediabox_popup_group',
            'multiple' => '#jcemediabox_popup_title,#jcemediabox_popup_caption',
            'attribute' => $this->getParam('popups.jcemediabox.attribute', 'data-mediabox'),
            'popup_group' => $this->getParam('popups.jcemediabox.popup_group', ''),
            'popup_icon' => $this->getParam('popups.jcemediabox.popup_icon', 1),
            'popup_icon_position' => $this->getParam('popups.jcemediabox.popup_icon_position', ''),
            'popup_autopopup' => $this->getParam('popups.jcemediabox.popup_autopopup', ''),
            'popup_hide' => $this->getParam('popups.jcemediabox.popup_hide', 0),
            'popup_mediatype' => $this->getParam('popups.jcemediabox.popup_mediatype', ''),
        );
    }

    public function isEnabled()
    {
        if (!PluginHelper::isEnabled('system', 'jcemediabox')) {
            return false;
        }

        if ((int) $this->getParam('popups.jcemediabox.enable', 1) === 0) {
            return false;
        }

        return true;
    }

    public function checkVersion()
    {
        return true;
    }
}
