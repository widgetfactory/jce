<?php
/**
 * @copyright     Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Uri\Uri;

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

        JHtmlSidebar::addEntry(
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
                JHtmlSidebar::addEntry(
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
