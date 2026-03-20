<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2009 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Helper;

defined('JPATH_SITE') or die();

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\Database\Table;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Date\Date;
use Joomla\CMS\Access\Access;

use Wfe\Utility\StringHelper;

abstract class ProfilesHelper
{
    /**
     * Create the Profiles table.
     *
     * @return bool
     */
    public static function createProfilesTable()
    {
        jimport('joomla.installer.helper');

        $app = Factory::getApplication();

        $db = Factory::getDBO();
        $driver = strtolower($db->name);

        switch ($driver) {
            default:
            case 'mysql':
            case 'mysqli':
                $driver = 'mysql';
                break;
            case 'sqlsrv':
            case 'sqlazure':
            case 'sqlzure':
                $driver = 'sqlsrv';
                break;
            case 'postgresql':
            case 'pgsql':
                $driver = 'postgresql';
                break;
        }

        $file = JPATH_ADMINISTRATOR . '/components/com_jce/sql/' . $driver . '.sql';
        $error = null;

        if (is_file($file)) {
            $query = file_get_contents($file);

            if ($query) {
                // replace prefix
                $query = $db->replacePrefix((string) $query);

                // set query
                $db->setQuery(trim($query));

                if (!$db->execute()) {
                    $app->enqueueMessage(Text::_('WF_INSTALL_TABLE_PROFILES_ERROR') . $db->stdErr(), 'error');

                    return false;
                } else {
                    return true;
                }
            } else {
                $error = 'NO SQL QUERY';
            }
        } else {
            $error = 'SQL FILE MISSING';
        }

        $app->enqueueMessage(Text::_('WF_INSTALL_TABLE_PROFILES_ERROR') . !is_null($error) ? ' - ' . $error : '', 'error');

        return false;
    }

    /**
     * Install Profiles.
     *
     * @return bool
     *
     * @param object $install[optional]
     */
    public static function installProfiles()
    {
        $app = Factory::getApplication();
        $db = Factory::getDBO();

        if (self::createProfilesTable()) {
            self::buildCountQuery();

            $profiles = array('Default' => false, 'Front End' => false);

            // No Profiles table data
            if (!$db->loadResult()) {
                $xml = JPATH_ADMINISTRATOR . '/components/com_jce/models/profiles.xml';

                if (is_file($xml)) {
                    if (!self::processImport($xml)) {
                        $app->enqueueMessage(Text::_('WF_INSTALL_PROFILES_ERROR'), 'error');

                        return false;
                    }
                } else {
                    $app->enqueueMessage(Text::_('WF_INSTALL_PROFILES_NOFILE_ERROR'), 'error');

                    return false;
                }
            }

            return true;
        }

        return false;
    }

    private static function buildCountQuery($name = '')
    {
        $db = Factory::getDBO();

        $query = $db->getQuery(true);

        // check for name
        $query->select('COUNT(id)')->from('#__wf_profiles');

        if ($name) {
            $query->where('name = ' . $db->Quote($name));
        }

        $db->setQuery($query);
    }

    public static function getDefaultProfile()
    {
        $mainframe = Factory::getApplication();
        $file = JPATH_ADMINISTRATOR . '/components/com_jce/models/profiles.xml';

        $xml = simplexml_load_file($file);

        Table::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_jce/tables');

        if ($xml) {
            foreach ($xml->profiles->children() as $profile) {
                if ($profile->attributes()->default) {
                    $table = Table::getInstance('Profiles', 'JceTable');

                    foreach ($profile->children() as $item) {
                        switch ($item->getName()) {
                            case 'rows':
                                $table->rows = (string) $item;
                                break;
                            case 'plugins':
                                $table->plugins = (string) $item;
                                break;
                            default:
                                $key = $item->getName();
                                $table->$key = (string) $item;

                                break;
                        }
                    }

                    // reset name and description
                    $table->name = '';
                    $table->description = '';

                    return $table;
                }
            }
        }

        return null;
    }

    /**
     * Check whether a table exists.
     *
     * @return bool
     *
     * @param string $table Table name
     */
    public static function checkTable()
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
        self::buildCountQuery();

        return $db->execute();
    }

    /**
     * Check table contents.
     *
     * @return int
     *
     * @param string $table Table name
     */
    public static function checkTableContents()
    {
        $db = Factory::getDBO();

        self::buildCountQuery();

        return $db->loadResult();
    }

    public static function getUserGroups($area)
    {
        $db = Factory::getDBO();

        $query = $db->getQuery(true);

        $query->select('id')->from('#__usergroups');

        $db->setQuery($query);
        $groups = $db->loadColumn();

        $front = array();
        $back = array();

        foreach ($groups as $group) {
            $create = Access::checkGroup($group, 'core.create');
            $admin = Access::checkGroup($group, 'core.login.admin');
            $super = Access::checkGroup($group, 'core.admin');

            if ($super) {
                $back[] = $group;
            } else {
                // group can create
                if ($create) {
                    // group has admin access
                    if ($admin) {
                        $back[] = $group;
                    } else {
                        $front[] = $group;
                    }
                }
            }
        }

        switch ($area) {
            case 0:
                return array_merge($front, $back);
                break;
            case 1:
                return $front;
                break;
            case 2:
                return $back;
                break;
        }

        return array();
    }

    /**
     * CDATA encode a parameter if it contains & < > characters, eg: <![CDATA[index.php?option=com_content&view=article&id=1]]>.
     *
     * @param object $param
     *
     * @return CDATA encoded parameter or parameter
     */
    public static function encodeData($data)
    {
        if (preg_match('/[<>&]/', $data)) {
            $data = '<![CDATA[' . $data . ']]>';
        }

        $data = preg_replace('/"/', '\"', $data);

        return $data;
    }
}