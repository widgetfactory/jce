<?php
/**
 *  @package JCE
 *  @copyright Copyright (c)2016 Ryan Demmer
 *  @license GNU General Public License version 2, or later
 */

defined('_JEXEC') or die;

/**
 * Handle commercial extension update authorization
 *
 * @package     Joomla.Plugin
 * @subpackage  Installer.Jce
 * @since       2.6
 */
class plgInstallerJce extends JPlugin
{
	/**
	 * @var    String  your extension identifier, to retrieve its params
	 * @since  2.5
	 */
	private $extension = 'com_jce';

	/**
	 * Handle adding credentials to package download request
	 *
	 * @param   string  $url        url from which package is going to be downloaded
	 * @param   array   $headers    headers to be sent along the download request (key => value format)
	 *
	 * @return  boolean true if credentials have been added to request or not our business, false otherwise (credentials not set by user)
	 *
	 * @since   3.0
	 */
	public function onInstallerBeforePackageDownload(&$url, &$headers)
	{
		$uri 	= JUri::getInstance($url);
		$host = $uri->getHost();

		if ($host !== 'www.joomlacontenteditor.net') {
			return true;
		}

		// Get the download ID
		JLoader::import('joomla.application.component.helper');
		$component = JComponentHelper::getComponent($this->extension);

		$key = $component->params->get('updates_key', '');
		
		// Append the Download ID to the download URL
		$uri->setVar('key', $key);
		$url = $uri->toString();

		return true;
	}
}
