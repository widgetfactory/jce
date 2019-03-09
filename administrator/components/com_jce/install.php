<?php

/**
 * @copyright     Copyright (c) 2009-2019 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

// try to set time limit
@set_time_limit(0);

// try to increase memory limit
if ((int) ini_get('memory_limit') < 32) {
    @ini_set('memory_limit', '32M');
}

abstract class WfInstall
{
    public static function install($installer)
    {
        error_reporting(E_ERROR | E_WARNING);

        // load languages
        $language = JFactory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);
        $language->load('com_jce.sys', JPATH_ADMINISTRATOR, null, true);

        // get manifest
        $manifest = $installer->getManifest();
        $new_version = (string) $manifest->version;

        // get version from xml file
        if (!$manifest) {
            $manifest = JApplicationHelper::parseXMLInstallFile($installer->getPath('manifest'));
            if (is_array($manifest)) {
                $new_version = $manifest['version'];
            }
        }

        $state = false;

        // the current version
        $current_version = $new_version;

        $xml_file = $installer->getPath('extension_administrator') . '/jce.xml';

        // check for an xml file
        if (is_file($xml_file)) {
            if ($xml = JApplicationHelper::parseXMLInstallFile($xml_file)) {
                $current_version = $xml['version'];
            }
        }

        // install profiles etc.
        $state = self::installProfiles();

        if ($state) {
            $message = '<div id="jce" class="mt-4 p-4 jumbotron jumbotron-fluid hero-unit" style="text-align:left">';

            $message .= '<h2>' . JText::_('COM_JCE') . ' ' . $new_version . '</h2>';
            $message .= JText::_('COM_JCE_XML_DESCRIPTION');
            $message .= '</div>';

            $installer->set('message', $message);

            // post-install
            self::addIndexfiles(array(__DIR__, JPATH_SITE . '/components/com_jce', JPATH_PLUGINS . '/jce'));
        } else {
            $installer->abort();

            return false;
        }
    }

    public static function uninstall()
    {
        $db = JFactory::getDBO();

        // remove Profiles table if its empty
        if ((int) self::checkTableContents('#__wf_profiles') == 0) {
            if (method_exists($db, 'dropTable')) {
                $db->dropTable('#__wf_profiles', true);
            } else {
                $query = 'DROP TABLE IF EXISTS #__wf_profiles';
                $db->setQuery($query);
            }

            $db->execute();
        }
    }

    private static function paramsToObject($data)
    {
        $registry = new JRegistry();
        $registry->loadIni($data);

        return $registry->toObject();
    }

    private static function loadXMLFile($file)
    {
        $xml = null;

        // Disable libxml errors and allow to fetch error information as needed
        libxml_use_internal_errors(true);

        if (is_file($file)) {
            // Try to load the xml file
            $xml = simplexml_load_file($file);
        }

        return $xml;
    }

    private static function installProfile($name)
    {
        $db = JFactory::getDBO();

        $query = $db->getQuery(true);
        $query->select('COUNT(id)')->from('#__wf_profiles')->where('name = ' . $db->Quote($name));

        $db->setQuery($query);
        $id = $db->loadResult();

        if (!$id) {
            // Blogger
            $file = JPATH_ADMINISTRATOR . '/components/com_jce/models/profiles.xml';

            $xml = self::loadXMLFile($file);

            if ($xml) {
                foreach ($xml->profiles->children() as $profile) {
                    if ((string) $profile->attributes()->name == $name) {
                        $row = JTable::getInstance('profiles', 'WFTable');

                        require_once JPATH_ADMINISTRATOR . '/components/com_jce/models/profiles.php';
                        $groups = WFModelProfiles::getUserGroups((int) $profile->children('area'));

                        foreach ($profile->children() as $item) {
                            switch ((string) $item->getName()) {
                                case 'types':
                                    $row->types = implode(',', $groups);
                                    break;
                                case 'area':
                                    $row->area = (int) $item;
                                    break;
                                case 'rows':
                                    $row->rows = (string) $item;
                                    break;
                                case 'plugins':
                                    $row->plugins = (string) $item;
                                    break;
                                default:
                                    $key = $item->getName();
                                    $row->$key = (string) $item;

                                    break;
                            }
                        }
                        $row->store();
                    }
                }
            }
        }
    }

    private static function getProfiles()
    {
        $db = JFactory::getDBO();

        $query->select('id')->from('#__wf_profiles');
        $db->setQuery($query);

        return $db->loadObjectList();
    }

    private static function createProfilesTable()
    {
        include_once __DIR__ . '/models/profiles.php';

        $profiles = new JceModelProfiles();

        if (method_exists($profiles, 'createProfilesTable')) {
            return $profiles->createProfilesTable();
        }

        return false;
    }

    private static function installProfiles()
    {
        include_once __DIR__ . '/models/profiles.php';

        $profiles = new JceModelProfiles();

        if (method_exists($profiles, 'installProfiles')) {
            return $profiles->installProfiles();
        }

        return false;
    }

    private static function addIndexfiles($paths)
    {
        jimport('joomla.filesystem.folder');
        jimport('joomla.filesystem.file');

        // get the base file
        $file = JPATH_ADMINISTRATOR . '/components/com_jce/index.html';

        if (is_file($file)) {
            foreach ((array) $paths as $path) {
                if (is_dir($path)) {
                    // admin component
                    $folders = JFolder::folders($path, '.', true, true);

                    foreach ($folders as $folder) {
                        JFile::copy($file, $folder . '/' . basename($file));
                    }
                }
            }
        }
    }

    private static function checkTable($table)
    {
        $db = JFactory::getDBO();

        $tables = $db->getTableList();

        if (!empty($tables)) {
            // swap array values with keys, convert to lowercase and return array keys as values
            $tables = array_keys(array_change_key_case(array_flip($tables)));
            $app = JFactory::getApplication();
            $match = str_replace('#__', strtolower($app->getCfg('dbprefix', '')), $table);

            return in_array($match, $tables);
        }

        // try with query
        $query = $db->getQuery(true);

        if (is_object($query)) {
            $query->select('COUNT(id)')->from($table);
        } else {
            $query = 'SELECT COUNT(id) FROM ' . $table;
        }

        $db->setQuery($query);

        return $db->execute();
    }

    /**
     * Check table contents.
     *
     * @return int
     *
     * @param string $table Table name
     */
    private static function checkTableContents($table)
    {
        $db = JFactory::getDBO();

        $query = $db->getQuery(true);

        if (is_object($query)) {
            $query->select('COUNT(id)')->from($table);
        } else {
            $query = 'SELECT COUNT(id) FROM ' . $table;
        }

        $db->setQuery($query);

        return $db->loadResult();
    }

    private static function checkTableColumn($table, $column)
    {
        $db = JFactory::getDBO();

        // use built in function
        if (method_exists($db, 'getTableColumns')) {
            $fields = $db->getTableColumns($table);
        } else {
            $db->setQuery('DESCRIBE ' . $table);
            $fields = $db->loadResultArray();

            // we need to check keys not values
            $fields = array_flip($fields);
        }

        return array_key_exists($column, $fields);
    }
}
