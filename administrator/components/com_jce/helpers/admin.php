<?php

defined('_JEXEC') or die;

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
        $uri = (string)JUri::getInstance();
        $return = urlencode(base64_encode($uri));

        JHtmlSidebar::addEntry(
            JText::_('WF_CPANEL'),
            'index.php?option=com_jce&view=cpanel',
            $vName == 'cpanel'
        );

        JHtmlSidebar::addEntry(
            JText::_('WF_CONFIGURATION'),
            'index.php?option=com_jce&view=config',
            $vName == 'config'
        );

        JHtmlSidebar::addEntry(
            JText::_('WF_PROFILES'),
            'index.php?option=com_jce&view=profiles',
            $vName == 'profiles'
        );

        JHtmlSidebar::addEntry(
            JText::_('WF_CPANEL_BROWSER'),
            'index.php?option=com_jce&view=browser',
            $vName == 'browser'
        );

        if (JPluginHelper::isEnabled('system', 'jcemediabox')) {
            JHtmlSidebar::addEntry(
                JText::_('WF_MEDIABOX'),
                'index.php?option=com_jce&view=mediabox',
                $vName == 'mediabox'
            );
        }
    }

    public static function getTemplateStylesheets()
    {
        require_once(JPATH_SITE . '/components/com_jce/editor/libraries/classes/editor.php');

        return WFEditor::getTemplateStyleSheets();
    }
}
