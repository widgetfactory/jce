<?php

/**
 * @copyright 	Copyright (c) 2009 - 2023 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Language\Text;

/**
 * JCE File Browser Quick Icon plugin.
 *
 * @since		2.1
 */
class plgQuickiconJce extends CMSPlugin
{
    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);

        $app = Factory::getApplication();

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

        $user = Factory::getUser();

        if (!$user->authorise('jce.browser', 'com_jce')) {
            return;
        }

        $language = Factory::getLanguage();
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
