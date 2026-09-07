<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
\defined('_JEXEC') or die;

use Joomla\CMS\Access\Access;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;
use Joomla\CMS\Installer\Installer;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Table\Extension as ExtensionTable;
use Joomla\Database\DatabaseAwareInterface;
use Joomla\Database\DatabaseAwareTrait;


class pkg_jceInstallerScript implements DatabaseAwareInterface
{
	use DatabaseAwareTrait;

    /**
     * The current installed version
     * @var string
     */
    private static $current_version;

    /**
     * The current installed variant, eg: core, pro
     *
     * @var string
     */
    private static $current_variant = 'core';
    
    private function addIndexfiles($paths)
    {
        // get the base file
        $file = JPATH_ADMINISTRATOR . '/components/com_jce/index.html';

        if (is_file($file)) {
            foreach ((array) $paths as $path) {
                if (is_dir($path)) {
                    // admin component
                    $folders = Folder::folders($path, '.', true, true);

                    foreach ($folders as $folder) {
                        File::copy($file, $folder . '/' . basename($file));
                    }
                }
            }
        }
    }

    private function installProfiles()
    {
        include_once JPATH_ADMINISTRATOR . '/components/com_jce/src/Helper/ProfilesHelper.php';

        // publish the "Default" profile if successful
        if (\Joomla\Component\Jce\Administrator\Helper\ProfilesHelper::installProfiles()) {
            $db = $this->getDatabase();

            $query = $db->getQuery(true);
            $query->update('#__wf_profiles')->set('published = 1')->where('name = ' . $db->quote('Default'));
            $db->setQuery($query);

            $db->execute();

            return true;
        }

        return false;
    }

    public function install($installer, $update = false)
    {
        $db = $this->getDatabase();

        // enable plugins
        $plugin = new ExtensionTable($db);

        $plugins = array(
            'jce' => array('content', 'system', 'quickicon', 'extension', 'installer'),
            'jcepro' => array('system'),
            'mediajce' => array('fields')
        );

        $parent = $installer->getParent();

        foreach ($plugins as $element => $folders) {
            foreach ($folders as $folder) {
                $id = $plugin->find(array('type' => 'plugin', 'folder' => $folder, 'element' => $element));

                if ($id) {
                    $plugin->load($id);
                    $plugin->enabled = 1;
                    $plugin->store();
                }
            }
        }

        $language = Factory::getApplication()->getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);
        $language->load('com_jce.sys', JPATH_ADMINISTRATOR, null, true);

        if (!$update) {
            // install profiles
            $this->installProfiles();
        }

        // set layout base path
        LayoutHelper::$defaultBasePath = JPATH_ADMINISTRATOR . '/components/com_jce/layouts';

        // override existing message
        $message = '';
        $message .= '<div id="jce" class="mt-4 mb-4 p-4 border-dark well text-start" role="alert">';
        $message .= '   <h1>' . Text::_('COM_JCE') . ' ' . $parent->manifest->version . '</h1>';
        $message .= '   <div>';

        // variant messates
        if ((string) $parent->manifest->variant != 'pro') {
            $message .= LayoutHelper::render('message.upgrade');
        } else {
            // show core to pro upgrade message
            if ($parent->isUpgrade()) {
                $variant = (string) self::$current_variant; //$parent->get('current_variant', 'core');

                if ($variant == 'core') {
                    $message .= LayoutHelper::render('message.welcome');
                }
            }
        }

        $message .= Text::_('COM_JCE_XML_DESCRIPTION');

        $message .= '   </div>';
        $message .= '</div>';

        $parent->set('message', $message);

        // add index files to each folder
        $this->addIndexfiles(array(
            __DIR__,
            JPATH_SITE . '/components/com_jce',
            JPATH_PLUGINS . '/jce',
        ));

        return true;
    }

    private function checkTable()
    {
        $db = $this->getDatabase();

        $tables = $db->getTableList();

        if (!empty($tables)) {
            $tables = array_keys(array_change_key_case(array_flip($tables)));
            $match = str_replace('#__', strtolower(Factory::getApplication()->get('dbprefix', '')), '#__wf_profiles');

            return in_array($match, $tables);
        }

        try {
            $query = $db->getQuery(true);
            $query->select('COUNT(id)')->from('#__wf_profiles');
            $db->setQuery($query);
            $db->execute();

            return true;
        } catch (\RuntimeException $e) {
            return false;
        }
    }

    public function uninstall()
    {
        $db = $this->getDatabase();

        if ($this->checkTable() === false) {
            return true;
        }

        $query = $db->getQuery(true);
        $query->select('COUNT(id)')->from('#__wf_profiles');
        $db->setQuery($query);

        // profiles table is empty, remove...
        if ((int) $db->loadResult() === 0) {
            $db->dropTable('#__wf_profiles', true);
        }
    }

    public function update($installer)
    {
        return $this->install($installer, true);
    }

    protected function getCurrentVersion()
    {
        // get current package version
        $manifest = JPATH_ADMINISTRATOR . '/manifests/packages/pkg_jce.xml';
        $version = 0;
        $variant = "core";

        if (is_file($manifest)) {
            if ($xml = @simplexml_load_file($manifest)) {
                $version = (string) $xml->version;
                $variant = (string) $xml->variant;
            }
        }

        return array($version, $variant);
    }

    public function preflight($route, $installer)
    {
        // skip on uninstall etc.
        if ($route == 'remove' || $route == 'uninstall') {
            return true;
        }

        $parent = $installer->getParent();

        $requirements = '<a href="https://www.joomlacontenteditor.net/support/documentation/editor/requirements" title="Editor Requirements" target="_blank" rel="noopener">https://www.joomlacontenteditor.net/support/documentation/editor/requirements</a>';

        // php version check
        if (version_compare(PHP_VERSION, '8.0', 'lt')) {
            throw new RuntimeException('JCE requires PHP 8.0 or later - ' . $requirements);
        }

        // joomla version check
        if (version_compare(JVERSION, '5.0', 'lt')) {
            throw new RuntimeException('JCE requires Joomla 5.0 or later - ' . $requirements);
        }

        // set current package version and variant
        list($version, $variant) = $this->getCurrentVersion();

        // set current version
        self::$current_version = $version;

        // set current variant
        self::$current_variant = $variant;

        // core cannot be installed over pro
        if ($variant === "pro" && (string) $parent->manifest->variant === "core") {
            throw new RuntimeException('JCE Core cannot be installed over JCE Pro. Please install JCE Pro. To downgrade, please first uninstall JCE Pro.');
        }

        // end here if not an upgrade
        if ($route != 'update') {
            return true;
        }

        $extension = new ExtensionTable($this->getDatabase());

        // disable content, system and quickicon plugins. This is to prevent errors if the install fails and some core files are missing
        foreach (array('system', 'quickicon') as $folder) {
            $plugin = $extension->find(array(
                'type' => 'plugin',
                'element' => 'jce',
                'folder' => $folder,
            ));

            if ($plugin) {
                $extension->publish(null, 0);
            }
        }

        // disable legacy jcefilebrowser quickicon to remove when the install is finished
        $plugin = $extension->find(array(
            'type' => 'plugin',
            'element' => 'jcefilebrowser',
            'folder' => 'quickicon',
        ));

        if ($plugin) {
            $extension->publish(null, 0);
        }

        // clean up fields in JCE Pro before install
        $files = array(
            JPATH_PLUGINS . '/system/jcepro/fields/ExtendedMedia.php',
            JPATH_PLUGINS . '/system/jcepro/fields/EditorPlugins.php'
        );

        foreach ($files as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
    }

    private function checkTableUpdate()
    {
        $db = $this->getDatabase();

        $state = true;

        // only for mysql / mysqli
        if (strpos($db->getName(), 'mysql') === false) {
            return $state;
        }

        $query = "DESCRIBE #__wf_profiles";
        $db->setQuery($query);
        $items = $db->loadObjectList();

        foreach ($items as $item) {
            if ($item->Field == 'checked_out') {
                if (strpos($item->Type, 'unsigned') === false) {
                    $state = false;
                }
            }

            if ($item->Field == 'checked_out_time') {
                $item = (array) $item;

                if (strtolower($item['Null']) == 'no') {
                    $state = false;
                }
            }
        }

        return $state;
    }

    public function postflight($route, $installer)
    {
        // Do not run on uninstallation.
		if ($route === 'uninstall')
		{
			return true;
		}
        
        $db = $this->getDatabase();
        $extension = new ExtensionTable($db);
        $parent = $installer->getParent();

        // remove legacy files and folders. Run before anything that can fail so cleanup is never skipped
        try {
            $this->cleanupInstall();
        } catch (Throwable $e) {
        }

        // remove any guest user group assignment unless guest access is enabled
        try {
            $this->removeGuestProfileAccess();
        } catch (Throwable $e) {
        }

        // remove legacy jcefilebrowser quickicon plugin
        $plugins = [
            'jcefilebrowser' => 'quickicon'
        ];

        foreach ($plugins as $element => $folder) {
            $plugin = PluginHelper::getPlugin($folder, $element);

            if ($plugin) {
                $inst = Installer::getInstance();

                // try uninstall
                if (!$inst->uninstall('plugin', $plugin->id)) {
                    if ($extension->load($plugin->id)) {
                        $extension->publish(null, 0);
                    }
                }
            }
        }

        if ($route == 'update') {
            $version = (string) $parent->manifest->version;
            $current_version = (string) self::$current_version; //$parent->get('current_version');

            // process core to pro upgrade - remove branding plugin
            if ((string) $parent->manifest->variant === "pro") {
                // remove branding plugin
                $branding = JPATH_SITE . '/media/com_jce/editor/ibis/plugins/branding';

                if (is_dir($branding)) {
                    Folder::delete($branding);
                }

                // clean up updates sites
                $query = $db->getQuery(true);

                $query->select('update_site_id')->from('#__update_sites');
                $query->where($db->quoteName('location') . ' = ' . $db->quote('https://cdn.joomlacontenteditor.net/updates/xml/editor/pkg_jce.xml'));
                $db->setQuery($query);
                $id = $db->loadResult();

                if ($id) {
                    // remove the old core update site and its extension links
                    $query = $db->getQuery(true)
                        ->delete('#__update_sites_extensions')
                        ->where($db->quoteName('update_site_id') . ' = ' . (int) $id);
                    $db->setQuery($query)->execute();

                    $query = $db->getQuery(true)
                        ->delete('#__update_sites')
                        ->where($db->quoteName('update_site_id') . ' = ' . (int) $id);
                    $db->setQuery($query)->execute();
                }
            }

            $theme = '';

            // update toolbar_theme for 2.8.0 and 2.8.1 beta
            if (version_compare($current_version, '2.8.0', 'ge') && version_compare($current_version, '2.8.1', 'lt')) {
                $theme = 'modern';
            }

            // update toolbar_theme for 2.7.x. Skip if the current version could not be determined
            if ($current_version && version_compare($current_version, '2.8', 'lt')) {
                $theme = 'default';
            }

            // update toolbar_theme if one has been set
            if ($theme) {
                $table = new \Joomla\Component\Jce\Administrator\Table\ProfilesTable($db);

                $query = $db->getQuery(true);

                $query->select('*')->from('#__wf_profiles');
                $db->setQuery($query);
                $profiles = $db->loadObjectList();

                foreach ($profiles as $profile) {
                    if (empty($profile->params)) {
                        $profile->params = '{}';
                    }

                    $data = json_decode($profile->params, true);

                    if (false !== $data) {
                        if (empty($data)) {
                            $data = array();
                        }

                        // no editor parameters set at all!
                        if (!isset($data['editor'])) {
                            $data['editor'] = array();
                        }

                        $param = array(
                            'toolbar_theme' => $theme,
                        );

                        // add variant for "mobile" profile
                        if ($profile->name === "Mobile") {
                            $param['toolbar_theme'] .= '.touch';
                        }

                        if (empty($data['editor']['toolbar_theme'])) {
                            $data['editor']['toolbar_theme'] = $param['toolbar_theme'];

                            if (!$table->load($profile->id)) {
                                throw new Exception('Unable to update profile - ' . $profile->name);
                            }

                            $table->params = json_encode($data);

                            if (!$table->store()) {
                                throw new Exception('Unable to update profile - ' . $profile->name);
                            }
                        }
                    }
                }
            }

            // enable content, system and quickicon plugins
            foreach (array('content', 'system', 'quickicon') as $folder) {
                $plugin = $extension->find(array(
                    'type' => 'plugin',
                    'element' => 'jce',
                    'folder' => $folder,
                ));

                if ($plugin) {
                    $extension->publish(null, 1);
                }
            }

            // check for "unsigend" in "checked_out" and default value in "checked_out_time" fields and update if necessary
            if (false == $this->checkTableUpdate()) {
                // fix checked_out table
                $query = "ALTER TABLE #__wf_profiles CHANGE COLUMN " . $db->quoteName('checked_out') . " " . $db->quoteName('checked_out') . " INT UNSIGNED NULL";
                $db->setQuery($query);
                $db->execute();

                // fix checked_out_time default value
                $query = "ALTER TABLE #__wf_profiles CHANGE COLUMN " . $db->quoteName('checked_out_time') . " " . $db->quoteName('checked_out_time') . " DATETIME NULL DEFAULT NULL";
                $db->setQuery($query);
                $db->execute();
            }
        }

        // Rebuild the extension namespace map so autoloading picks up new classes immediately.
        $app = Factory::getApplication();

        if (method_exists($app, 'createExtensionNamespaceMap')) {
            $app->createExtensionNamespaceMap();
        }
    }

    /**
     * Remove the guest user group from every published profile assigned to one.
     *
     * The editor is not loaded for unauthenticated users unless the "allow_profile_guests"
     * parameter is enabled, so a guest group assignment cannot work as intended. Only that
     * group is removed: unpublishing the whole profile would drop its other groups through
     * to the next profile in the ordering, which may be more permissive than the one they
     * were assigned.
     *
     * A profile left with no groups and no users cannot match anyone, so that is unpublished
     * instead, with its group assignment intact so it can be restored.
     *
     * @return void
     */
    private function removeGuestProfileAccess()
    {
        // nothing to do if guest access has been deliberately enabled
        if (ComponentHelper::getParams('com_jce')->get('allow_profile_guests', 0)) {
            return;
        }

        // the groups a guest is a member of, eg: Public and the configured Guest group
        $guestGroups = array_map('intval', (array) Access::getGroupsByUser(0, true));

        if (empty($guestGroups)) {
            return;
        }

        $db = $this->getDatabase();

        $query = $db->getQuery(true);
        $query->select(array('id', 'name', 'types', 'users'))->from('#__wf_profiles')->where('published = 1');

        $db->setQuery($query);
        $rows = $db->loadObjectList();

        if (empty($rows)) {
            return;
        }

        $unpublished = array();
        $modified = array();

        foreach ($rows as $row) {
            // a profile without groups is assigned to specific users only
            if (empty($row->types)) {
                continue;
            }

            $types = array_map('intval', explode(',', $row->types));

            if (!array_intersect($guestGroups, $types)) {
                continue;
            }

            $remaining = array_values(array_diff($types, $guestGroups));

            $query = $db->getQuery(true);
            $query->update('#__wf_profiles')->where('id = ' . (int) $row->id);

            if (empty($remaining) && empty($row->users)) {
                // nothing left to match, so the profile cannot apply to anyone. The group
                // assignment is left in place so the profile can simply be published again.
                $query->set('published = 0');

                $unpublished[] = $row->name;
            } else {
                // the profile still applies to its remaining groups or assigned users
                $query->set('types = ' . $db->quote(implode(',', $remaining)));

                $modified[] = $row->name;
            }

            $db->setQuery($query);
            $db->execute();
        }

        $this->enqueueGuestProfilesMessage($unpublished, $modified);
    }

    /**
     * Report the profiles changed by removeGuestProfileAccess().
     *
     * @param array $unpublished Names of profiles that were unpublished.
     * @param array $modified    Names of profiles that had the guest group removed.
     *
     * @return void
     */
    private function enqueueGuestProfilesMessage($unpublished, $modified)
    {
        $app = Factory::getApplication();

        if (!empty($unpublished)) {
            $app->enqueueMessage(Text::sprintf('COM_JCE_INSTALL_GUEST_PROFILES_UNPUBLISHED', count($unpublished), $this->formatProfileNames($unpublished)), 'warning');
        }

        if (!empty($modified)) {
            $app->enqueueMessage(Text::sprintf('COM_JCE_INSTALL_GUEST_PROFILES_MODIFIED', count($modified), $this->formatProfileNames($modified)), 'warning');
        }
    }

    /**
     * Format a list of profile names for display.
     *
     * The list can be long on a site that was compromised by the profile import vulnerability
     * in 2.9.99.4 and earlier, so only the first few names are shown and the rest are counted.
     * Names are escaped as they are stored values that may contain markup on such a site.
     *
     * @param array $names Profile names.
     *
     * @return string
     */
    private function formatProfileNames($names)
    {
        $total = count($names);
        $limit = 5;

        $list = array_slice($names, 0, $limit);

        foreach ($list as &$name) {
            $name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        }

        unset($name);

        $text = implode(', ', $list);

        if ($total > $limit) {
            $text = Text::sprintf('COM_JCE_INSTALL_GUEST_PROFILES_UNPUBLISHED_MORE', $text, $total - $limit);
        }

        return $text;
    }

    /**
     * Remove files and folders left behind by earlier releases.
     *
     * The lists are cumulative and are not gated by version. Every entry is checked for existence
     * on each run, so a cleanup that was missed on one upgrade path is still picked up on the next.
     * Nothing listed here is shipped by the current package.
     */
    private function cleanupInstall()
    {
        $admin = JPATH_ADMINISTRATOR . '/components/com_jce';
        $site = JPATH_SITE . '/components/com_jce';
        $media = JPATH_SITE . '/media/com_jce';

        $folders = array();
        $files = array();

        // J4 -> J5: remove legacy non-namespaced MVC structure replaced by src/ and clean up
        $folders[] = array(
            // remove fields folder
            JPATH_PLUGINS . '/system/jce/fields',
            JPATH_PLUGINS . '/editors/jce/src/Provider',
             // remove old layout file
            JPATH_PLUGINS . '/editors/jce/layouts/editor/textarea.php',
            // mediafield fields folder
            JPATH_PLUGINS . '/fields/mediajce/fields',
            // JCE Pro fields folder
            JPATH_PLUGINS . '/system/jcepro/fields',
        
            $admin . '/controller',
            $admin . '/helpers',
            $admin . '/models',
            $admin . '/views',
            $admin . '/tables',
            $admin . '/media',
            $admin . '/vendor',

            $admin . '/layouts/joomla',

            $site . '/controller',
            $site . '/editor',
            $site . '/views',

            $media . '/editor',
            $media . '/css',
            $media . '/img',
            $media . '/js',
            $media . '/tinymce'
        );

        // remove exported profile manifests
        $files[] = glob(JPATH_SITE . '/tmp/jce_editor_profile_*.xml') ?: array();

        $files[] = array(
            $admin . '/controller.php',
            $admin . '/jce.php',
            $admin . '/includes/classmap.php',
            $site  . '/controller.php',
            $site  . '/jce.php',
        );

        foreach ($folders as $list) {
            foreach ($list as $folder) {
                if (!@is_dir($folder)) {
                    continue;
                }

                $items = Folder::files($folder, '.', false, true, array(), array());

                foreach ($items as $file) {
                    if (!@unlink($file)) {
                        try {
                            File::delete($file);
                        } catch (Exception $e) {}
                    }
                }

                $items = Folder::folders($folder, '.', false, true, array(), array());

                foreach ($items as $dir) {
                    if (!@rmdir($dir)) {
                        try {
                            Folder::delete($dir);
                        } catch (Exception $e) {}
                    }
                }

                if (!@rmdir($folder)) {
                    try {
                        Folder::delete($folder);
                    } catch (Exception $e) {}
                }
            }
        }

        foreach ($files as $list) {
            foreach ($list as $file) {
                if (!@file_exists($file)) {
                    continue;
                }

                if (@unlink($file)) {
                    continue;
                }

                try {
                    File::delete($file);
                } catch (Exception $e) {}
            }
        }
    }
}
