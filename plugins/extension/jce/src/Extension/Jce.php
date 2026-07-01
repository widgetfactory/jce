<?php

/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Extension\Jce\Extension;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Database\DatabaseAwareTrait;
use Joomla\CMS\Installer\Installer;
use Joomla\Event\SubscriberInterface;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;

use Joomla\CMS\Event\Extension\BeforeInstallEvent;
use Joomla\CMS\Event\Extension\AfterInstallEvent;
use Joomla\CMS\Event\Extension\AfterUninstallEvent;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * JCE WYSIWYG Editor Plugin.
 *
 * @since 1.5
 */
final class Jce extends CMSPlugin implements SubscriberInterface
{
    use DatabaseAwareTrait;

    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    /**
     * Returns an array of events this subscriber will listen to.
     *
     * @return array
     *
     * @since   5.2.0
     */
    public static function getSubscribedEvents(): array
    {
        return [
            'onExtensionBeforeInstall'      => 'onExtensionBeforeInstall',
            'onExtensionAfterInstall'       => 'onExtensionAfterInstall',
            'onExtensionAfterUninstall'     => 'onExtensionAfterUninstall'
        ];
    }

    /**
     * Check the installer is for a valid plugin group.
     *
     * @param Joomla\CMS\Installer\Installer $installer Installer object
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

        foreach (array('type', 'group') as $var) {
            $$var = (string) $installer->manifest->attributes()->{$var};
        }

        return $type === 'plugin' && $group === 'jce';
    }

    public function onExtensionBeforeInstall(BeforeInstallEvent $event): void
    {
        $type = $event->getType();

        if ((string) $type === "file") {

            // get a reference to the current installer
            $manifestPath = $event->getManifest();

            if (empty($manifestPath)) {
                return;
            }

            // get the filename of the manifest file, eg: pkg_jce_de-DE
            $element = basename($manifestPath, '.xml');

            // if this matches the current install...
            if (strpos($element, 'pkg_jce_') !== false) {
                // find an existing legacy language install, eg: jce-de-DE
                $element = str_replace('pkg_jce_', 'jce-', $element);

                $db = $this->getDatabase();
                $query = $db->getQuery(true);

                $query->select('extension_id')
                    ->from($db->quoteName('#__extensions'))
                    ->where($db->quoteName('type') . ' = ' . $db->quote('file'))
                    ->where($db->quoteName('element') . ' = ' . $db->quote($element));

                $db->setQuery($query);
                $id = $db->loadResult();

                if ($id) {
                    $installer = new Installer();

                    // try uninstall, if this fails, delete database entry
                    if (!$installer->uninstall('file', $id)) {
                        $query = $db->getQuery(true);
                        $query->delete()
                            ->from($db->quoteName('#__extensions'))
                            ->where($db->quoteName('extension_id') . ' = ' . $db->quote($id));
                        $db->setQuery($query);
                        $db->execute();
                    }
                }
            }
        }
    }
    /**
     * Handle post extension install update sites.
     *
     * @param JInstaller $installer Installer object
     * @param int        $eid       Extension Identifier
     *
     * @since   2.6
     */
    public function onExtensionAfterInstall(AfterInstallEvent $event): void
    {
        $eid = $event->getEid();

        if ($eid) {
            $installer = $event->getInstaller();

            if (!$this->isValidPlugin($installer)) {
                return;
            }

            $basename = basename($installer->getPath('extension_root'));

            // must be a valid plugin
            if (!preg_match('/^(editor|filesystem|links|popups)[-_]/', $basename)) {
                return;
            }

            $db = $this->getDatabase();
            $query = $db->getQuery(true);

            // enable plugin
            $query->update($db->quoteName('#__extensions'))
                ->set($db->quoteName('enabled') . ' = 1')
                ->where($db->quoteName('extension_id') . ' = ' . $db->quote($eid));

            $db->setQuery($query);
            $db->execute();

            [$type, $name] = preg_split('/[-_]/', $basename, 2);

            $plugin = new \StdClass();
            $plugin->name = $name;

            if ($type == 'editor') {
                $plugin->icon = (string) $installer->manifest->icon;
                $plugin->row = (int) (string) $installer->manifest->attributes()->row;
                $plugin->type = 'plugin';
            } else {
                $plugin->type = 'extension';
            }

            $plugin->path = $installer->getPath('extension_root');

            \Joomla\Component\Jce\Administrator\Helper\PluginsHelper::postInstall('install', $plugin, $installer);

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
    }

    /**
     * Handle extension uninstall.
     *
     * @param JInstaller $installer Installer instance
     * @param int        $eid       Extension id
     * @param int        $result    Installation result
     *
     * @since   1.6
     */
    public function onExtensionAfterUninstall(AfterUninstallEvent $event): void
    {
        $eid = $event->getEid();
        
        if ($eid) {
            $installer = $event->getInstaller();
        
            if (!$this->isValidPlugin($installer)) {
                return;
            }

            $basename = basename($installer->getPath('extension_root'));

            if (strpos($basename, '-') === false) {
                return;
            }

            $parts = explode('-', $basename);
            $type = $parts[0];
            $name = $parts[1];

            $plugin = new \StdClass();
            $plugin->name = $name;

            if ($type === 'editor') {
                $plugin->icon = (string) $installer->manifest->icon;
                $plugin->row = (int) (string) $installer->manifest->attributes()->row;
                $plugin->type = 'plugin';
            }

            $plugin->path = $installer->getPath('extension_root');

            \Joomla\Component\Jce\Administrator\Helper\PluginsHelper::postInstall('uninstall', $plugin, $installer);
        }
    }
}
