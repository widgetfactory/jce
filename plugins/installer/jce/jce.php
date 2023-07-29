<?php
/**
 *  @copyright Copyright (c)2016 - 2020 Ryan Demmer
 *  @license GNU General Public License version 2, or later
 */
defined('_JEXEC') or die;

/**
 * Handle commercial extension update authorization.
 *
 * @since       2.6
 */
class plgInstallerJce extends JPlugin
{    
    /**
     * Handle adding credentials to package download request.
     *
     * @param string $url     url from which package is going to be downloaded
     * @param array  $headers headers to be sent along the download request (key => value format)
     *
     * @return bool true if credentials have been added to request or not our business, false otherwise (credentials not set by user)
     *
     * @since   3.0
     */
    public function onInstallerBeforePackageDownload(&$url, &$headers)
    {
        $app = JFactory::getApplication();

        $uri = JUri::getInstance($url);
        $host = $uri->getHost();

        if ($host !== 'www.joomlacontenteditor.net') {
            return true;
        }

        // Get the subscription key
        JLoader::import('joomla.application.component.helper');
        $component = JComponentHelper::getComponent('com_jce');

        // load plugin language for warning messages
        JFactory::getLanguage()->load('plg_installer_jce', JPATH_ADMINISTRATOR);

        // check if the key has already been set via the dlid field
        $dlid = $uri->getVar('key', '');

        // check the component params, fallback to the dlid
        $key = $component->params->get('updates_key', $dlid);

        // if no key is set...
        if (empty($key)) {
            // if we are attempting to update JCE Pro, display a notice message
            if (strpos($url, 'pkg_jce_pro') !== false) {
                $app->enqueueMessage(JText::_('PLG_INSTALLER_JCE_KEY_WARNING'), 'notice');
            }

            return true;
        }

        // Append the subscription key to the download URL
        $uri->setVar('key', $key);

        // create the url string
        $url = $uri->toString();

        // check validity of the key and display a message if it is invalid / expired
        try
        {
            $tmpUri = clone $uri;

            $tmpUri->setVar('task', 'update.validate');
            $tmpUri->delVar('file');
            $tmpUrl = $tmpUri->toString();
            $response = JHttpFactory::getHttp()->get($tmpUrl, array());
        } catch (RuntimeException $exception) {}

        // invalid key, display a notice message
        if (403 == $response->code) {
            $app->enqueueMessage(JText::_('PLG_INSTALLER_JCE_KEY_INVALID'), 'notice');
        }

        return true;
    }
}
