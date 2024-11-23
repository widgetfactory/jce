<?php
/**
 * @package     JCE
 * @subpackage  Installer.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (C) 2023 - 2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Installer\Jce\PluginTraits;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Http\HttpFactory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;

/**
 * JCE Installer Events Trait
 *
 * @since  2.9.73
 */
trait EventsTrait
{
    private function checkIfKeyRequired($query)
    {
        // get the file name from the url without the xml extension
        $file = isset($query['file']) ? $query['file'] : '';

        if (empty($file)) {
            return false;
        }
        
        // jce pro requires a key
        if (strpos($file, 'pkg_jce_pro_') !== false) {
            return true;
        }

        // jce core does not require a key
        if (strpos($file, 'pkg_jce_') !== false) {
            return false;
        }

        // jce plugins require a key
        if (strpos($file, 'plg_jce_') !== false) {
            return true;
        }

        // mediabox does not require a key
        if (strpos($file, 'plg_system_jcemediabox') !== false) {
            return false;
        }

        return false;
    }
    
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

        // check if the key has already been set via the dlid field. This will only be available in Joomla 4.x and later
        $key = $uri->getVar('key', '');

        // get the key from the component params or Update Sites (in the case of plugin updates)
        if (empty($key)) {
            $key = $this->getDownloadKey();
        }

        // if no key is set...
        if (empty($key)) {
            $query = $uri->getQuery(true);
            
            // if we are attempting to update JCE Pro or JCE Plugins, display a notice message
            if ($this->checkIfKeyRequired($query) === true) {
                $app->enqueueMessage(Text::_('PLG_INSTALLER_JCE_KEY_WARNING'), 'notice');

                return true;
            }
        }

        // Append the subscription key to the download URL if it exists
        if (!empty($key)) {
            $uri->setVar('key', $key);
        }

        // create the url string
        $url = $uri->toString();

        // check validity of the key and display a message if it is invalid / expired
        try {
            $tmpUri = clone $uri;
            $tmpUri->setVar('task', 'update.validate');

            $tmpUrl = $tmpUri->toString();
            $response = HttpFactory::getHttp()->get($tmpUrl, array());
        } catch (\RuntimeException $exception) {
            $app->enqueueMessage($exception->getMessage(), 'notice');
            return true;
        }

        // invalid key, display a notice message
        if (403 == $response->code || 401 == $response->code) {
            $app->enqueueMessage(Text::_('PLG_INSTALLER_JCE_KEY_INVALID'), 'notice');
        }

        // update limit exceeded
        if (498 === $response->code) {
            $app->enqueueMessage(Text::_('PLG_INSTALLER_JCE_KEY_LIMIT'), 'notice');
        }

        return true;
    }
}