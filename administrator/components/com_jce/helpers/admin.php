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
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\HTML\Helpers\Sidebar;

/**
 * Admin helper.
 *
 * @since       3.0
 */
class JceHelperAdmin
{
    /**
     * Configure the Submenu links.
     *
     * @param string $vName The view name
     *
     * @since   3.0
     */
    public static function addSubmenu($vName)
    {
        $uri = (string) Uri::getInstance();
        $return = urlencode(base64_encode($uri));

        $user = Factory::getUser();

        Sidebar::addEntry(
            Text::_('WF_CPANEL'),
            'index.php?option=com_jce&view=cpanel',
            $vName == 'cpanel'
        );

        $views = array(
            'config' => 'WF_CONFIGURATION',
            'profiles' => 'WF_PROFILES',
            'browser' => 'WF_CPANEL_BROWSER',
            'mediabox' => 'WF_MEDIABOX',
        );

        foreach ($views as $key => $label) {

            if ($key === "mediabox" && !PluginHelper::isEnabled('system', 'jcemediabox')) {
                continue;
            }

            if ($user->authorise('jce.' . $key, 'com_jce')) {
                Sidebar::addEntry(
                    Text::_($label),
                    'index.php?option=com_jce&view=' . $key,
                    $vName == $key
                );
            }
        }
    }

    public static function getTemplateStylesheets()
    {
        require_once JPATH_SITE . '/components/com_jce/editor/libraries/classes/editor.php';

        return WFEditor::getTemplateStyleSheets();
    }
}
