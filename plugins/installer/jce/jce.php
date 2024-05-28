<?php
/**
 * @package     JCE
 * @subpackage  Installer.Jce
 * 
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (C) 2023 - 2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('_JEXEC') or die;

JLoader::registerNamespace('Joomla\\Plugin\\Installer\\Jce', JPATH_PLUGINS . '/installer/jce/src', false, false, 'psr4');

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Plugin\Installer\Jce\PluginTraits\EventsTrait;

/**
 * Handle commercial extension update authorization.
 *
 * @since       2.6
 */
class plgInstallerJce extends CMSPlugin
{
    use EventsTrait;

    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    /**
     * Get the download key from the component params or the dlid field.
     *
     * @return string The download key
     */
    public function getDownloadKey()
    {
        $component = ComponentHelper::getComponent('com_jce');

        // get key from component params in Joomla 3.x
        $key = $component->params->get('updates_key', '');

        return $key;
    }
}
