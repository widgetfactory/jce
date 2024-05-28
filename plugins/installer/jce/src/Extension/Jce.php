<?php
/**
 * @package     JCE
 * @subpackage  Installer.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (C) 2023 - 2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Installer\Jce\Extension;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Database\DatabaseAwareTrait;
use Joomla\Plugin\Installer\Jce\PluginTraits\EventsTrait;

class Jce extends CMSPlugin
{
    use EventsTrait;
    use DatabaseAwareTrait;

    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    private function getDownloadKeyFromUpdateSites()
    {
        $db = $this->getDatabase();

        $query = $db->getQuery(true)
            ->select('package_id')
            ->from('#__extensions')
            ->where('element = ' . $db->quote('com_jce'));

        $db->setQuery($query);
        $packageId = $db->loadResult();

        if (is_null($packageId)) {
            return null;
        }

        $query = $db->getQuery(true)
            ->select($db->quoteName('update_sites.extra_query'))
            ->from($db->quoteName('#__update_sites', 'update_sites'))
            ->join(
                'INNER',
                $db->quoteName('#__update_sites_extensions', 'update_sites_extensions') . ' ON ' . $db->quoteName('update_sites_extensions.update_site_id') . ' = ' . $db->quoteName('update_sites.update_site_id')
            )
            ->where($db->quoteName('update_sites_extensions.extension_id') . ' = ' . (int) $packageId);

        $db->setQuery($query);
        $result = $db->loadResult();

        if ($result) {
            // Parse the `extra_query` to extract the key value
            parse_str($result, $parsedQuery);

            if (isset($parsedQuery['key'])) {
                return $parsedQuery['key'];
            }
        }

        return null;
    }

    /**
     * Get the download key from the update sites table.
     *
     * @return string|null The download key or null if not found
     */
    public function getDownloadKey()
    {
        $component = ComponentHelper::getComponent('com_jce');

        // check the component params for the key
        $key = $component->params->get('updates_key', '');

        // try get the key directly from the update sites table, eg: when updating a plugin
        if (empty($key)) {
            $key = $this->getDownloadKeyFromUpdateSites();
        }

        // Return null or an appropriate value if the key is not found
        return $key;
    }
}
