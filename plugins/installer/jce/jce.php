<?php
/**
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (C) 2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Http\HttpFactory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Uri\Uri;

/**
 * Handle commercial extension update authorization.
 *
 * @since       2.6
 */
class plgInstallerJce extends CMSPlugin
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
        $app = Factory::getApplication();

        $uri = Uri::getInstance($url);
        $host = $uri->getHost();

        if ($host !== 'www.joomlacontenteditor.net') {
            return true;
        }

        $component = ComponentHelper::getComponent('com_jce');

        // load plugin language for warning messages
        Factory::getLanguage()->load('plg_installer_jce', JPATH_ADMINISTRATOR);

        // check if the key has already been set via the dlid field
        $dlid = $uri->getVar('key', '');

        // check the component params, fallback to the dlid
        $key = $component->params->get('updates_key', $dlid);

        // if no key is set...
        if (empty($key)) {
            // if we are attempting to update JCE Pro, display a notice message
            if (strpos($url, 'pkg_jce_pro') !== false) {
                $app->enqueueMessage(Text::_('PLG_INSTALLER_JCE_KEY_WARNING'), 'notice');
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
            $response = HttpFactory::getHttp()->get($tmpUrl, array());
        } catch (RuntimeException $exception) {}

        // invalid key, display a notice message
        if (403 == $response->code) {
            $app->enqueueMessage(Text::_('PLG_INSTALLER_JCE_KEY_INVALID'), 'notice');
        }

        return true;
    }
}
