<?php
/**
 * @package     JCE
 * @subpackage  Extension.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

JLoader::registerNamespace('Joomla\\Plugin\\Extension\\Jce', JPATH_PLUGINS . '/extension/jce/src', false, false, 'psr4');

use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Plugin\Extension\Jce\PluginTraits\EventsTrait;

/**
 * JCE extension plugin for Joomla 3. Joomla 4+ uses services/provider.php.
 *
 * @since  2.6
 */
class PlgExtensionJce extends CMSPlugin
{
    use EventsTrait;

    /**
     * Get the database driver.
     *
     * @return \JDatabaseDriver
     */
    protected function getExtensionDatabase()
    {
        return Factory::getDbo();
    }

    public function onExtensionBeforeInstall($method, $type, $manifest, $extension = 0)
    {
        $this->processBeforeInstall($type);
    }

    public function onExtensionAfterInstall($installer, $eid)
    {
        $this->processAfterInstall($installer, $eid);
    }

    public function onExtensionAfterUninstall($installer, $eid, $result)
    {
        $this->processAfterUninstall($installer, $eid);
    }
}
