<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('JPATH_PLATFORM') or die('RESTRICTED');

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Filesystem\File;
use Joomla\CMS\Filesystem\Folder;
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
        return JceProfilesHelper::installProfiles();
    }

    public function install($installer)
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

        // install profiles
        $this->installProfiles();

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
            // swap array values with keys, convert to lowercase and return array keys as values
            $tables = array_keys(array_change_key_case(array_flip($tables)));
            $app = Factory::getApplication();
            $match = str_replace('#__', strtolower($app->getCfg('dbprefix', '')), '#__wf_profiles');

            return in_array($match, $tables);
        }

        // try with query
        $query = $db->getQuery(true);

        $query->select('COUNT(id)')->from('#__wf_profiles');
        $db->setQuery($query);

        return $db->execute();
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
        if ($db->loadResult() === 0) {
            $db->dropTable('#__wf_profiles', true);
            $db->execute();
        }
    }

    public function update($installer)
    {
        return $this->install($installer);
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
        if (version_compare(JVERSION, '3.10', 'lt')) {
            throw new RuntimeException('JCE requires Joomla 3.10 or later - ' . $requirements);
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
        
        $app = Factory::getApplication();
        $extension = Table::getInstance('extension');
        $parent = $installer->getParent();

        $db = Factory::getDBO();

        Table::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_jce/tables');

        // remove legacy jcefilebrowser quickicon and jce content plugins
        $plugins = [
            'jcefilebrowser' => 'quickicon',
            'jce' => 'content'
        ];

        foreach ($plugins as $element => $folder) {
            $plugin = PluginHelper::getPlugin($folder, $element);

            if ($plugin) {
                $inst = new Installer();

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

            // update toolbar_theme for 2.7.x
            if (version_compare($current_version, '2.8', 'lt')) {
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

            $this->cleanupInstall($installer);
        }

        // Borrowed from the script.ats.php file from Akeeba Ticket System
		// Forcibly create the autoload_psr4.php file afresh.
		if (class_exists(JNamespacePsr4Map::class))
		{
			try
			{
				$nsMap = new JNamespacePsr4Map();

				@clearstatcache(JPATH_CACHE . '/autoload_psr4.php');

				if (function_exists('opcache_invalidate'))
				{
					@opcache_invalidate(JPATH_CACHE . '/autoload_psr4.php');
				}

				@clearstatcache(JPATH_CACHE . '/autoload_psr4.php');
				$nsMap->create();

				if (function_exists('opcache_invalidate'))
				{
					@opcache_invalidate(JPATH_CACHE . '/autoload_psr4.php');
				}

				$nsMap->load();
			}
			catch (\Throwable $e)
			{
				// In case of failure, just try to delete the old autoload_psr4.php file
				if (function_exists('opcache_invalidate'))
				{
					@opcache_invalidate(JPATH_CACHE . '/autoload_psr4.php');
				}

				@unlink(JPATH_CACHE . '/autoload_psr4.php');
				@clearstatcache(JPATH_CACHE . '/autoload_psr4.php');

                Factory::getApplication()->createExtensionNamespaceMap();
			}
		}
    }

    protected static function cleanupInstall($installer)
    {
        $app = Factory::getApplication();
        
        $parent = $installer->getParent();
        $current_version = self::$current_version; //$parent->get('current_version');

        $admin = JPATH_ADMINISTRATOR . '/components/com_jce';
        $site = JPATH_SITE . '/components/com_jce';
        $media = JPATH_SITE . '/media/com_jce';

        $folders = array();
        $files = array();

        $folders['2.6.38'] = array(
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

        // remove flexicontent
        if (!ComponentHelper::isInstalled('com_flexicontent')) {
            $files['2.7.0'] = array(
                $site . '/editor/extensions/links/flexicontentlinks.php',
                $site . '/editor/extensions/links/flexicontentlinks.xml',
            );

            $folders['2.7.0'] = array(
                $site . '/editor/extensions/links/flexicontentlinks',
            );
        }

        // remove help files
        $folders['2.8.6'] = array(
            $admin . '/views/help',
        );

        // remove mediaplayer
        $folders['2.8.11'] = array(
            $site . '/editor/libraries/mediaplayer',
        );

        // remove fields folder
        $folders['2.9.7'] = array(
            JPATH_PLUGINS . '/system/jce/fields',
        );

        // remove media folder
        $folders['2.9.17'] = array(
            $admin . '/media',
        );

        // remove folders moved to media/com_jce
        $folders['2.9.50'] = array(
            $site . '/editor/tiny_mce',
            $site . '/editor/libraries/css',
            $site . '/editor/libraries/fonts',
            $site . '/editor/libraries/img',
            $site . '/editor/libraries/js',
            $site . '/editor/libraries/pro/css',
            $site . '/editor/libraries/pro/fonts',
            $site . '/editor/libraries/pro/img',
            $site . '/editor/libraries/pro/js',
            $media . '/css',
            $media . '/img',
            $media . '/js'
        );

        // clean up editor folder
        $folders['2.9.60'] = array(
            JPATH_PLUGINS . '/editors/jce/src/Provider'
        );

        // remove old layout file
        $files['2.9.60'] = array(
            JPATH_PLUGINS . '/editors/jce/layouts/editor/textarea.php'
        );

        // remove pro plugins
        $folders['2.9.70'] = array(
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

        // remove pro source plugin
        $files['2.9.70'] = array(
            $site . '/editor/plugins/source/config.php',
            $site . '/editor/plugins/source/source.php',
            // mediafield files
            JPATH_PLUGINS . '/fields/mediajce/fields/extendedmedia.php'
        );

        $files['2.6.38'] = array(
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

        // remove help files
        $files['2.8.6'] = array(
            $admin . '/controller/help.php',
            $admin . '/models/help.php',
        );

        $files['2.8.11'] = array(
            $admin . '/views/cpanel/default_pro.php',
        );

        foreach ($folders as $version => $list) {
            // version check
            if (version_compare($version, $current_version, 'lt')) {
                continue;
            }

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

        foreach ($files as $version => $list) {
            // version check
            if (version_compare($version, $current_version, 'lt')) {
                continue;
            }

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
