<?php
/**
 * @package     JCE
 * @subpackage  Extension.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Extension\Jce\PluginTraits;

\defined('_JEXEC') or die;

use Joomla\CMS\Installer\Installer;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;

/**
 * JCE Extension Events Trait, shared by the Joomla 3 and Joomla 4+ plugin classes.
 *
 * @since  2.9.99
 */
trait EventsTrait
{
    /**
     * Get the database driver.
     *
     * @return \Joomla\Database\DatabaseDriver
     */
    abstract protected function getExtensionDatabase();

    /**
     * Check the installer is for a valid plugin group.
     *
     * @param Installer $installer Installer object
     *
     * @return bool
     *
     * @since   2.6
     */
    private function isValidPlugin($installer)
    {
        if (empty($installer->manifest)) {
            return false;
        }

        $type = (string) $installer->manifest->attributes()->type;
        $group = (string) $installer->manifest->attributes()->group;

        return $type === 'plugin' && $group === 'jce';
    }

    /**
     * Get the plugin type and name from the extension root folder, eg: editor-charmap.
     *
     * @param Installer $installer Installer object
     *
     * @return array|false
     */
    private function getPluginParts($installer)
    {
        $basename = basename($installer->getPath('extension_root'));

        // must be a valid plugin
        if (!preg_match('/^(editor|filesystem|links|popups)[-_]/', $basename)) {
            return false;
        }

        return preg_split('/[-_]/', $basename, 2);
    }

    /**
     * Remove a legacy language file install, eg: jce-de-DE, before a pkg_jce_de-DE install.
     *
     * @param string $type The extension type
     *
     * @return void
     */
    protected function processBeforeInstall($type)
    {
        if ((string) $type !== 'file') {
            return;
        }

        // the event manifest is a SimpleXMLElement, so get the package manifest path from the current installer
        $manifestPath = Installer::getInstance()->getPath('manifest');

        if (empty($manifestPath)) {
            return;
        }

        // get the filename of the manifest file, eg: pkg_jce_de-DE
        $element = basename($manifestPath, '.xml');

        if (strpos($element, 'pkg_jce_') === false) {
            return;
        }

        // find an existing legacy language install, eg: jce-de-DE
        $element = str_replace('pkg_jce_', 'jce-', $element);

        $db = $this->getExtensionDatabase();

        $query = $db->getQuery(true)
            ->select($db->quoteName('extension_id'))
            ->from($db->quoteName('#__extensions'))
            ->where($db->quoteName('type') . ' = ' . $db->quote('file'))
            ->where($db->quoteName('element') . ' = ' . $db->quote($element));

        $db->setQuery($query);
        $id = (int) $db->loadResult();

        if (!$id) {
            return;
        }

        $installer = new Installer();

        // Joomla 4.2+ requires the database to be set, only Installer::getInstance() does this
        if (method_exists($installer, 'setDatabase')) {
            $installer->setDatabase($db);
        }

        // try uninstall, if this fails, delete database entry
        if (!$installer->uninstall('file', $id)) {
            $query = $db->getQuery(true)
                ->delete($db->quoteName('#__extensions'))
                ->where($db->quoteName('extension_id') . ' = ' . $id);

            $db->setQuery($query);
            $db->execute();
        }
    }

    /**
     * Enable and register an installed JCE plugin.
     *
     * @param Installer $installer Installer object
     * @param int       $eid       Extension Identifier
     *
     * @return void
     */
    protected function processAfterInstall($installer, $eid)
    {
        if (!$eid || !$this->isValidPlugin($installer)) {
            return;
        }

        $parts = $this->getPluginParts($installer);

        if (!$parts) {
            return;
        }

        [$type, $name] = $parts;

        $db = $this->getExtensionDatabase();

        // enable plugin
        $query = $db->getQuery(true)
            ->update($db->quoteName('#__extensions'))
            ->set($db->quoteName('enabled') . ' = 1')
            ->where($db->quoteName('extension_id') . ' = ' . (int) $eid);

        $db->setQuery($query);
        $db->execute();

        require_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/plugins.php';

        $plugin = new \stdClass();
        $plugin->name = $name;

        if ($type == 'editor') {
            $plugin->icon = (string) $installer->manifest->icon;
            $plugin->row = (int) (string) $installer->manifest->attributes()->row;
            $plugin->type = 'plugin';
        } else {
            $plugin->type = 'extension';
        }

        $plugin->path = $installer->getPath('extension_root');

        \JcePluginsHelper::postInstall('install', $plugin, $installer);

        // clean up legacy extensions
        if ($plugin->type == 'extension') {
            $path = JPATH_SITE . '/components/com_jce/editor/extensions/' . $type;

            // delete manifest
            if (is_file($path . '/' . $plugin->name . '.xml')) {
                File::delete($path . '/' . $plugin->name . '.xml');
            }
            // delete file
            if (is_file($path . '/' . $plugin->name . '.php')) {
                File::delete($path . '/' . $plugin->name . '.php');
            }
            // delete folder
            if (is_dir($path . '/' . $plugin->name)) {
                Folder::delete($path . '/' . $plugin->name);
            }
        }
    }

    /**
     * Remove an uninstalled JCE plugin from profiles.
     *
     * @param Installer $installer Installer object
     * @param int       $eid       Extension Identifier
     *
     * @return void
     */
    protected function processAfterUninstall($installer, $eid)
    {
        if (!$eid || !$this->isValidPlugin($installer)) {
            return;
        }

        $parts = $this->getPluginParts($installer);

        if (!$parts) {
            return;
        }

        [$type, $name] = $parts;

        require_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/plugins.php';

        $plugin = new \stdClass();
        $plugin->name = $name;

        if ($type === 'editor') {
            $plugin->icon = (string) $installer->manifest->icon;
            $plugin->row = (int) (string) $installer->manifest->attributes()->row;
            $plugin->type = 'plugin';
        }

        $plugin->path = $installer->getPath('extension_root');

        \JcePluginsHelper::postInstall('uninstall', $plugin, $installer);
    }
}
