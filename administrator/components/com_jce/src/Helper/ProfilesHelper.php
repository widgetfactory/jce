<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2009 - 2024 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Helper;

\defined('_JEXEC') or die;

use Joomla\CMS\Access\Access;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\Database\DatabaseInterface;
use Joomla\Component\Jce\Administrator\Table\ProfilesTable;

abstract class ProfilesHelper
{
    /**
     * Path to the default profiles XML manifest.
     */
    private const PROFILES_XML = JPATH_ADMINISTRATOR . '/components/com_jce/data/profiles.xml';

    /**
     * Create the Profiles table.
     *
     * @return bool
     */
    public static function createProfilesTable()
    {
        $app = Factory::getApplication();
        $db  = Factory::getContainer()->get(DatabaseInterface::class);

        $driver = strtolower($db->getName());

        switch ($driver) {
            case 'sqlsrv':
            case 'sqlazure':
            case 'sqlzure':
                $driver = 'sqlsrv';
                break;
            case 'postgresql':
            case 'pgsql':
                $driver = 'postgresql';
                break;
            default:
                $driver = 'mysql';
                break;
        }

        $file  = JPATH_ADMINISTRATOR . '/components/com_jce/sql/' . $driver . '.sql';
        $error = null;

        if (is_file($file)) {
            $query = file_get_contents($file);

            if ($query) {
                $query = $db->replacePrefix((string) $query);
                $db->setQuery(trim($query));

                if (!$db->execute()) {
                    $app->enqueueMessage(Text::_('WF_INSTALL_TABLE_PROFILES_ERROR') . $db->stdErr(), 'error');
                    return false;
                }

                return true;
            }

            $error = 'NO SQL QUERY';
        } else {
            $error = 'SQL FILE MISSING';
        }

        $app->enqueueMessage(Text::_('WF_INSTALL_TABLE_PROFILES_ERROR') . ($error ? ' - ' . $error : ''), 'error');

        return false;
    }

    /**
     * Install default Profiles.
     *
     * @return bool
     */
    public static function installProfiles()
    {
        $app = Factory::getApplication();
        $db  = Factory::getContainer()->get(DatabaseInterface::class);

        if (!self::createProfilesTable()) {
            return false;
        }

        self::buildCountQuery();

        if (!$db->loadResult()) {
            if (!is_file(self::PROFILES_XML)) {
                $app->enqueueMessage(Text::_('WF_INSTALL_PROFILES_NOFILE_ERROR'), 'error');
                return false;
            }

            if (!self::processImport(self::PROFILES_XML)) {
                $app->enqueueMessage(Text::_('WF_INSTALL_PROFILES_ERROR'), 'error');
                return false;
            }
        }

        return true;
    }

    /**
     * Process an XML profiles file and insert rows into the database.
     *
     * Used for both install-time seeding and the repair action.
     *
     * @param   string  $file  Absolute path to the XML file.
     *
     * @return  bool
     */
    public static function processImport($file)
    {
        $db  = Factory::getContainer()->get(DatabaseInterface::class);
        $app = Factory::getApplication();

        $data = file_get_contents($file);

        // Wrap bare JSON params values in CDATA so SimpleXML doesn't mangle them.
        $data = preg_replace('#<params>\{(.+?)\}</params>#s', '<params><![CDATA[{$1}]]></params>', $data);

        $xml = simplexml_load_string($data);

        if (!$xml) {
            return false;
        }

        foreach ($xml->profiles->children() as $profile) {
            $table = new ProfilesTable($db);

            foreach ($profile->children() as $item) {
                $key   = $item->getName();
                $value = (string) $item;

                switch ($key) {
                    case 'description':
                        $value = Text::_($value);
                        break;
                    case 'types':
                        if ($value === '') {
                            $area   = (int) ($profile->area[0] ?? 0);
                            $groups = self::getUserGroups($area);
                            $value  = implode(',', array_unique($groups));
                        }
                        break;
                    case 'area':
                        if ($value === '') {
                            $value = '0';
                        }
                        break;
                    case 'published':
                    case 'ordering':
                        $value = (int) $value;
                        break;
                }

                $table->$key = $value;
            }

            // Force an INSERT, not an UPDATE.
            $table->id = 0;

            if (!isset($table->custom)) {
                $table->custom = '';
            }

            if (!$table->store()) {
                $app->enqueueMessage($table->getError(), 'error');
                return false;
            }
        }

        return true;
    }

    /**
     * Return a ProfilesTable pre-populated with the default profile from the manifest.
     *
     * @return  ProfilesTable|null
     */
    public static function getDefaultProfile()
    {
        $db  = Factory::getContainer()->get(DatabaseInterface::class);
        $xml = simplexml_load_file(self::PROFILES_XML);

        if (!$xml) {
            return null;
        }

        foreach ($xml->profiles->children() as $profile) {
            if (!$profile->attributes()->default) {
                continue;
            }

            $table = new ProfilesTable($db);

            foreach ($profile->children() as $item) {
                $key         = $item->getName();
                $table->$key = (string) $item;
            }

            $table->name        = '';
            $table->description = '';

            return $table;
        }

        return null;
    }

    /**
     * Check whether the profiles table exists.
     *
     * @return bool
     */
    public static function checkTable()
    {
        $db     = Factory::getContainer()->get(DatabaseInterface::class);
        $tables = $db->getTableList();

        if (!empty($tables)) {
            $tables = array_keys(array_change_key_case(array_flip($tables)));
            $match  = str_replace('#__', strtolower($db->getPrefix()), '#__wf_profiles');

            return in_array($match, $tables);
        }

        // Fallback: try a direct query.
        self::buildCountQuery();

        return $db->execute();
    }

    /**
     * Return the number of rows in the profiles table.
     *
     * @return int
     */
    public static function checkTableContents()
    {
        self::buildCountQuery();

        return Factory::getContainer()->get(DatabaseInterface::class)->loadResult();
    }

    /**
     * Build and set a COUNT query on the profiles table.
     */
    private static function buildCountQuery()
    {
        $db    = Factory::getContainer()->get(DatabaseInterface::class);
        $query = $db->getQuery(true);
        $query->select('COUNT(id)')->from('#__wf_profiles');
        $db->setQuery($query);
    }

    /**
     * Return user group IDs for the given area.
     *
     * @param   int  $area  0 = all, 1 = front-end, 2 = back-end
     *
     * @return  int[]
     */
    public static function getUserGroups($area)
    {
        $db    = Factory::getContainer()->get(DatabaseInterface::class);
        $query = $db->getQuery(true);
        $query->select('id')->from('#__usergroups');
        $db->setQuery($query);
        $groups = $db->loadColumn();

        $front = [];
        $back  = [];

        foreach ($groups as $group) {
            $super  = Access::checkGroup($group, 'core.admin');
            $create = Access::checkGroup($group, 'core.create');
            $admin  = Access::checkGroup($group, 'core.login.admin');

            if ($super) {
                $back[] = $group;
            } elseif ($create) {
                if ($admin) {
                    $back[] = $group;
                } else {
                    $front[] = $group;
                }
            }
        }

        switch ($area) {
            case 1:
                return $front;
            case 2:
                return $back;
            default:
                return array_merge($front, $back);
        }
    }

    /**
     * CDATA-encode a value if it contains & < > characters.
     *
     * @param   string  $data
     *
     * @return  string
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
