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
     * Create the Profiles database table from the SQL schema file.
     *
     * @return bool True if the table was created successfully.
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

        $file = JPATH_ADMINISTRATOR . '/components/com_jce/sql/' . $driver . '.sql';

        if (!is_file($file)) {
            $app->enqueueMessage(Text::_('WF_INSTALL_TABLE_PROFILES_ERROR') . ' - SQL FILE MISSING', 'error');
            return false;
        }

        $query = file_get_contents($file);

        if (!$query) {
            $app->enqueueMessage(Text::_('WF_INSTALL_TABLE_PROFILES_ERROR') . ' - NO SQL QUERY', 'error');
            return false;
        }

        $query = $db->replacePrefix((string) $query);
        $db->setQuery(trim($query));

        try {
            $db->execute();
        } catch (\RuntimeException $e) {
            $app->enqueueMessage(Text::_('WF_INSTALL_TABLE_PROFILES_ERROR') . ' - ' . $e->getMessage(), 'error');
            return false;
        }

        return true;
    }

    /**
     * Install default profiles for a new installation.
     * Creates the table if needed and imports profiles only if the table is empty.
     *
     * @return bool True on success or if profiles already exist, false on error.
     */
    public static function installProfiles()
    {
        if (!self::createProfilesTable()) {
            return false;
        }

        $db = Factory::getContainer()->get(DatabaseInterface::class);
        $query = $db->getQuery(true);
        $query->select('COUNT(id)')->from('#__wf_profiles');
        $db->setQuery($query);

        if ((int) $db->loadResult() > 0) {
            return true;
        }

        $app = Factory::getApplication();

        if (!is_file(self::PROFILES_XML)) {
            $app->enqueueMessage(Text::_('WF_INSTALL_PROFILES_NOFILE_ERROR'), 'error');
            return false;
        }

        if (!self::processImport(self::PROFILES_XML)) {
            $app->enqueueMessage(Text::_('WF_INSTALL_PROFILES_ERROR'), 'error');
            return false;
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

    /**
     * Get user groups with content creation permissions for the given area.
     *
     * @param   int  $area  0 = all, 1 = frontend only, 2 = backend only.
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
            if (Access::checkGroup($group, 'core.admin')) {
                $back[] = $group;
            } elseif (Access::checkGroup($group, 'core.create')) {
                if (Access::checkGroup($group, 'core.login.admin')) {
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
            $data = '<![CDATA[' . str_replace(']]>', ']]]]><![CDATA[>', $data) . ']]>';
        }

        $data = preg_replace('/"/', '\"', $data);

        return $data;
    }
}
