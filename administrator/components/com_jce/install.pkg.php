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
use Joomla\CMS\MVC\Model\BaseDatabaseModel;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Table\Table;

class pkg_jceInstallerScript
{
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
        include_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/profiles.php';

        // publish the "Default" profile if successful
        if (JceProfilesHelper::installProfiles()) {
            $db = Factory::getDBO();

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
        // enable plugins
        $plugin = Table::getInstance('extension');

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

        if (!$update) {
            // install profiles
            $this->installProfiles();
        }

        $language = Factory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);
        $language->load('com_jce.sys', JPATH_ADMINISTRATOR, null, true);

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
        $db = Factory::getDBO();

        $tables = $db->getTableList();

        if (!empty($tables)) {
            $tables = array_keys(array_change_key_case(array_flip($tables)));
            $app = Factory::getApplication();
            $match = str_replace('#__', strtolower($app->getCfg('dbprefix', '')), '#__wf_profiles');

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
        $db = Factory::getDBO();

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
        if (version_compare(PHP_VERSION, '7.4', 'lt')) {
            throw new RuntimeException('JCE requires PHP 7.4 or later - ' . $requirements);
        }

        // joomla version check
        if (version_compare(JVERSION, '3.9', 'lt')) {
            throw new RuntimeException('JCE requires Joomla 3.9 or later - ' . $requirements);
        }

        // joomla 4 version check, must be 4.2 or later
        if (version_compare(JVERSION, '4.0', 'ge') && version_compare(JVERSION, '4.2', 'lt')) {
            throw new RuntimeException('JCE requires Joomla 4.2 or later - ' . $requirements);
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

        $extension = Table::getInstance('extension');

        // disable content, system and quickicon plugins. This is to prevent errors if the install fails and some core files are missing
        foreach (array('system', 'quickicon', 'content') as $folder) {
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
        $db = Factory::getDBO();

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
        if ($route === 'uninstall') {
            return true;
        }

        $extension = Table::getInstance('extension');
        $parent = $installer->getParent();

        $db = Factory::getDBO();

        Table::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_jce/tables');

        // remove legacy files and folders. Run before anything that can fail so cleanup is never skipped
        try {
            $this->cleanupInstall();
        } catch (Throwable $e) {
        }

        // turn off any profile assigned to a guest user group unless guest access is enabled
        try {
            $this->unpublishGuestProfiles();
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
                $branding = JPATH_SITE . '/media/com_jce/editor/tinymce/plugins/branding';

                if (is_dir($branding)) {
                    Folder::delete($branding);
                }

                // clean up updates sites
                $query = $db->getQuery(true);

                $query->select('update_site_id')->from('#__update_sites');
                $query->where($db->qn('location') . ' = ' . $db->q('https://cdn.joomlacontenteditor.net/updates/xml/editor/pkg_jce.xml'));
                $db->setQuery($query);
                $id = $db->loadResult();

                if ($id) {
                    BaseDatabaseModel::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_installer/models');
                    $model = BaseDatabaseModel::getInstance('Updatesites', 'InstallerModel');

                    if ($model) {
                        $model->delete(array($id));
                    }
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
                $table = Table::getInstance('Profiles', 'JceTable');

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
                $query = "ALTER TABLE #__wf_profiles CHANGE COLUMN " . $db->qn('checked_out') . " " . $db->qn('checked_out') . " INT UNSIGNED NULL";
                $db->setQuery($query);
                $db->execute();

                // fix checked_out_time default value
                $query = "ALTER TABLE #__wf_profiles CHANGE COLUMN " . $db->qn('checked_out_time') . " " . $db->qn('checked_out_time') . " DATETIME NULL DEFAULT NULL";
                $db->setQuery($query);
                $db->execute();
            }

            // add created/modified tracking columns for existing installations
            if (strpos($db->getName(), 'mysql') !== false) {
                $db->setQuery("DESCRIBE #__wf_profiles");
                $existing = array_column($db->loadObjectList(), 'Field');

                $cols = [
                    'created'     => 'DATETIME NULL DEFAULT NULL',
                    'created_by'  => 'INT UNSIGNED NOT NULL DEFAULT 0',
                    'modified'    => 'DATETIME NULL DEFAULT NULL',
                    'modified_by' => 'INT UNSIGNED NOT NULL DEFAULT 0',
                ];

                foreach ($cols as $col => $def) {
                    if (!in_array($col, $existing, true)) {
                        $db->setQuery("ALTER TABLE #__wf_profiles ADD COLUMN " . $db->qn($col) . " " . $def);
                        $db->execute();
                    }
                }
            }
        }

        // Borrowed from the script.ats.php file from Akeeba Ticket System
        // Forcibly create the autoload_psr4.php file afresh.
        if (class_exists(JNamespacePsr4Map::class)) {
            try {
                $nsMap = new JNamespacePsr4Map();

                @clearstatcache(JPATH_CACHE . '/autoload_psr4.php');

                if (function_exists('opcache_invalidate')) {
                    @opcache_invalidate(JPATH_CACHE . '/autoload_psr4.php');
                }

                @clearstatcache(JPATH_CACHE . '/autoload_psr4.php');
                $nsMap->create();

                if (function_exists('opcache_invalidate')) {
                    @opcache_invalidate(JPATH_CACHE . '/autoload_psr4.php');
                }

                $nsMap->load();
            } catch (\Throwable $e) {
                // In case of failure, just try to delete the old autoload_psr4.php file
                if (function_exists('opcache_invalidate')) {
                    @opcache_invalidate(JPATH_CACHE . '/autoload_psr4.php');
                }

                @unlink(JPATH_CACHE . '/autoload_psr4.php');
                @clearstatcache(JPATH_CACHE . '/autoload_psr4.php');

                Factory::getApplication()->createExtensionNamespaceMap();
            }
        }
    }

    /**
     * Unpublish every published profile assigned to a guest user group.
     *
     * The editor is not loaded for unauthenticated users unless the "allow_profile_guests"
     * parameter is enabled, so a profile assigned to a guest group is configuration that
     * cannot work as intended. This brings the stored profiles in line with that rule.
     *
     * @return void
     */
    private function unpublishGuestProfiles()
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

        $db = Factory::getDBO();

        $query = $db->getQuery(true);
        $query->select(array('id', 'name', 'types'))->from('#__wf_profiles')->where('published = 1');

        $db->setQuery($query);
        $rows = $db->loadObjectList();

        if (empty($rows)) {
            return;
        }

        $ids = array();
        $names = array();

        foreach ($rows as $row) {
            // a profile without groups is assigned to specific users only
            if (empty($row->types)) {
                continue;
            }

            $types = array_map('intval', explode(',', $row->types));

            if (array_intersect($guestGroups, $types)) {
                $ids[] = (int) $row->id;
                $names[] = $row->name;
            }
        }

        if (empty($ids)) {
            return;
        }

        $query = $db->getQuery(true);
        $query->update('#__wf_profiles')->set('published = 0')->where('id IN (' . implode(',', $ids) . ')');

        $db->setQuery($query);
        $db->execute();

        $this->enqueueGuestProfilesMessage($names);
    }

    /**
     * Report the profiles unpublished by unpublishGuestProfiles().
     *
     * The list can be long on a site that was compromised by the profile import vulnerability in
     * 2.9.99.4 and earlier, so only the first few names are shown and the rest are counted. Names
     * are escaped as they are stored values that may contain markup on such a site.
     *
     * @param array $names Profile names.
     *
     * @return void
     */
    private function enqueueGuestProfilesMessage($names)
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

        Factory::getApplication()->enqueueMessage(Text::sprintf('COM_JCE_INSTALL_GUEST_PROFILES_UNPUBLISHED', $total, $text), 'warning');
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

        // 2.6.38
        $folders[] = array(
            // admin
            $admin . '/classes',
            $admin . '/elements',
            $admin . '/media/fonts',
            $admin . '/img/menu',
            $admin . '/views/preferences',
            $admin . '/views/users',
            // site
            $site . '/editor/elements',
            $site . '/editor/extensions/aggregator/vine',
            $site . '/editor/extensions/popups/window'
        );

        // 2.7.0 - remove flexicontent
        $files[] = array(
            $site . '/editor/extensions/links/flexicontentlinks.php',
            $site . '/editor/extensions/links/flexicontentlinks.xml',
        );

        $folders[] = array(
            $site . '/editor/extensions/links/flexicontentlinks',
        );

        // 2.8.6 - remove help files
        $folders[] = array(
            $admin . '/views/help',
        );

        // 2.8.11 - remove mediaplayer
        $folders[] = array(
            $site . '/editor/libraries/mediaplayer',
        );

        // 2.9.7 - remove fields folder
        $folders[] = array(
            JPATH_PLUGINS . '/system/jce/fields',
        );

        // 2.9.17 - remove media folder
        $folders[] = array(
            $admin . '/media',
        );

        // 2.9.50 - remove folders moved to media/com_jce
        $folders[] = array(
            $site . '/editor/tiny_mce',
            $site . '/editor/libraries/css',
            $site . '/editor/libraries/fonts',
            $site . '/editor/libraries/img',
            $site . '/editor/libraries/js',
            $site . '/editor/libraries/vendor',
            $site . '/editor/libraries/pro/css',
            $site . '/editor/libraries/pro/fonts',
            $site . '/editor/libraries/pro/img',
            $site . '/editor/libraries/pro/js',
            $media . '/css',
            $media . '/img',
            $media . '/js'
        );

        // 2.9.60 - clean up editor folder
        $folders[] = array(
            JPATH_PLUGINS . '/editors/jce/src/Provider'
        );

        // 2.9.60 - remove old layout file
        $files[] = array(
            JPATH_PLUGINS . '/editors/jce/layouts/editor/textarea.php'
        );

        // 2.9.70 - remove pro plugins
        $folders[] = array(
            $site . '/editor/plugins/caption',
            $site . '/editor/plugins/columns',
            $site . '/editor/plugins/iframe',
            $site . '/editor/plugins/imgmanager_ext',
            $site . '/editor/plugins/mediamanager',
            $site . '/editor/plugins/microdata',
            $site . '/editor/plugins/source/tmpl',
            $site . '/editor/plugins/templatemanager',
            $site . '/editor/plugins/textpattern'
        );

        // 2.9.70 - remove extendedmedia.php
        $files[] = array(
            JPATH_SITE . '/plugins/fields/mediajce/fields/extendedmedia.php'
        );

        // 2.9.96 - clean up editor vendor libraries
        $folders[] = array(
            $site . '/editor/libraries/vendor',
            $site . '/editor/libraries/pro'
        );

        // 2.9.96 - remove jQuery UI Touch
        $files[] = array(
            $media . '/editor/vendor/jquery/js/jquery-ui.touch.min.js'
        );

        // 2.9.98 - remove MobileDetect
        $folders[] = array(
            $site . '/editor/libraries/classes/vendor/MobileDetect'
        );

        // 2.9.99
        $folders[] = array(
            $site . '/views'
        );

        // 2.9.99.7 - remove exported profile manifests
        $files[] = glob(JPATH_SITE . '/tmp/jce_editor_profile_*.xml') ?: array();

        // 2.9.99.10 - remove editor.php in pro
        $files[] = array(
            JPATH_SITE . '/plugins/system/jcepro/editor/libraries/classes/editor.php'
        );

        // 2.9.70 - remove pro source plugin
        $files[] = array(
            $site . '/editor/plugins/source/config.php',
            $site . '/editor/plugins/source/source.php'
        );

        // 2.6.38
        $files[] = array(
            $admin . '/install.php',
            $admin . '/install.script.php',
            // controller
            $admin . '/controller/preferences.php',
            $admin . '/controller/popups.php',
            $admin . '/controller/updates.php',
            // helpers
            $admin . '/helpers/cacert.pem',
            $admin . '/helpers/editor.php',
            $admin . '/helpers/toolbar.php',
            $admin . '/helpers/updates.php',
            $admin . '/helpers/xml.php',
            // includes
            $admin . '/includes/loader.php',
            // models
            $admin . '/models/commands.json',
            $admin . '/models/config.xml',
            $admin . '/models/cpanel.xml',
            $admin . '/models/model.php',
            $admin . '/models/plugins.json',
            $admin . '/models/plugins.php',
            $admin . '/models/preferences.php',
            $admin . '/models/preferences.xml',
            $admin . '/models/pro.json',
            $admin . '/models/updates.php',
            $admin . '/models/users.php',
            // views
            $admin . '/views/cpanel/tmpl/default_pro_footer.php',
            $admin . '/views/profiles/tmpl/form_editor.php',
            $admin . '/views/profiles/tmpl/form_features.php',
            $admin . '/views/profiles/tmpl/form_plugin.php',
            $admin . '/views/profiles/tmpl/form_setup.php',
            $admin . '/views/profiles/tmpl/form.php',
            // site - extensions
            $site . '/editor/extensions/aggregator/vine.php',
            $site . '/editor/extensions/aggregator/vine.xml',
            $site . '/editor/extensions/popups/window.php',
            $site . '/editor/extensions/popups/window.xml',
            // site - libraries
            $site . '/editor/libraries/classes/token.php'
        );

        // 2.8.6 - remove help files
        $files[] = array(
            $admin . '/controller/help.php',
            $admin . '/models/help.php',
        );

        // 2.8.11
        $files[] = array(
            $admin . '/views/cpanel/default_pro.php',
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
                        } catch (Exception $e) {
                        }
                    }
                }

                $items = Folder::folders($folder, '.', false, true, array(), array());

                foreach ($items as $dir) {
                    if (!@rmdir($dir)) {
                        try {
                            Folder::delete($dir);
                        } catch (Exception $e) {
                        }
                    }
                }

                if (!@rmdir($folder)) {
                    try {
                        Folder::delete($folder);
                    } catch (Exception $e) {
                    }
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
                } catch (Exception $e) {
                }
            }
        }
    }
}
