<?php

/**
 * @package     JCE
 * @subpackage  Installer.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Quickicon\Jce\Extension;

\defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Language\Text;

class Jce extends CMSPlugin
{
    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);

        $app = $this->getApplication();

        // only in Admin and only if the component is enabled
        if ($app->getClientId() !== 1 || ComponentHelper::getComponent('com_jce', true)->enabled === false) {
            return;
        }

        $this->loadLanguage();
    }

    public function onGetIcons($context)
    {
        if ($context != $this->params->get('context', 'mod_quickicon')) {
            return;
        }

        $app = $this->getApplication();

        $user = $app->getIdentity();

        if (!$user->authorise('jce.browser', 'com_jce')) {
            return;
        }

        $language = $app->getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR);

        return array(array(
            'link'      => 'index.php?option=com_jce&view=browser',
            'image'     => 'picture fa fa-image',
            'access'    => array('jce.browser', 'com_jce'),
            'text'      => Text::_('PLG_QUICKICON_JCE_TITLE'),
            'id'        => 'plg_quickicon_jce',
        ));
    }
}
