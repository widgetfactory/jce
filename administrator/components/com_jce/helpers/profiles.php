<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
\defined('_JEXEC') or die;

use Joomla\CMS\Access\Access;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Filter\InputFilter;
use Joomla\Filesystem\File;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Table\Table;
use Joomla\String\StringHelper;

abstract class JceProfilesHelper
{
    /**
     * Create the Profiles table.
     *
     * @return bool
     */
    public static function createProfilesTable()
    {
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
     * Process import data from XML file.
     *
     * @param  string $file XML file path
     * @return int 
     */
    public static function processImport($file)
    {
        $n = 0;

        $app = Factory::getApplication();

        // load data from file
        $data = file_get_contents($file);

        $data = trim($data);

        // format params data as CDATA
        $data = preg_replace('#<params>{(.+?)}<\/params>#', '<params><![CDATA[{$1}]]></params>', $data);

        // external entities are disabled by default in PHP 8+; guard PHP 7.x explicitly
        $prev = false;

        if (PHP_MAJOR_VERSION < 8) {
            $prev = libxml_disable_entity_loader(true);
        }

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($data);
        libxml_clear_errors();

        if (PHP_MAJOR_VERSION < 8) {
            libxml_disable_entity_loader($prev);
        }

        $user = Factory::getUser();
        $date = Factory::getDate();

        Table::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_jce/tables');

        $language = Factory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);

        if ($xml) {
            $whitelist = (array) ComponentHelper::getParams('com_jce')->get('profile_groups_whitelist', []);
            $whitelist = array_filter(array_map('intval', $whitelist));

            foreach ($xml->profiles->children() as $profile) {
                $table = Table::getInstance('Profiles', 'JceTable');

                $allowedKeys = ['name', 'description', 'users', 'types', 'components', 'area', 'device', 'rows', 'plugins', 'published', 'ordering', 'params'];

                foreach ($profile->children() as $item) {
                    $key = $item->getName();

                    if (!in_array($key, $allowedKeys, true)) {
                        continue;
                    }

                    $value = (string) $item;

                    $filter = InputFilter::getInstance();

                    switch ($key) {
                        case 'name':
                            $value = $filter->clean($value, 'STRING');
                            // create name copy if exists
                            if ($value) {
                                while ($table->load(array('name' => $value))) {
                                    if ($value === $table->name) {
                                        $value = StringHelper::increment($value);
                                    }
                                }
                            }
                            break;

                        case 'description':
                            $value = $filter->clean(Text::_($value), 'STRING');
                            break;

                        case 'types':
                            if ($value === '') {
                                $area = (string) $profile->area[0] || 0;
                                $groups = self::getUserGroups($area);
                                $value = implode(',', array_unique($groups));
                            } else {
                                $value = implode(',', array_filter(array_map('intval', explode(',', $value))));
                            }

                            if (!empty($whitelist)) {
                                $filtered = !empty($value) ? array_intersect(explode(',', $value), $whitelist) : [];

                                if (!empty($filtered)) {
                                    $value = implode(',', $filtered);
                                } elseif (empty((string) $profile->users)) {
                                    // no group overlap and no individual users — default to full whitelist
                                    $value = implode(',', $whitelist);
                                } else {
                                    // individual users are set, so empty types is valid
                                    $value = '';
                                }
                            }

                            break;

                        case 'users':
                            if ($value !== '') {
                                $ids = array_filter(array_map('intval', explode(',', $value)));

                                if (!empty($ids)) {
                                    $db = Factory::getDBO();
                                    $query = $db->getQuery(true)
                                        ->select($db->quoteName('id'))
                                        ->from($db->quoteName('#__users'))
                                        ->where($db->quoteName('id') . ' IN (' . implode(',', $ids) . ')');
                                    $db->setQuery($query);
                                    $value = implode(',', array_map('intval', $db->loadColumn()));
                                } else {
                                    $value = '';
                                }
                            }
                            break;

                        case 'area':
                            $value = $value === '' ? 0 : (int) $value;
                            break;

                        case 'components':
                            $value = $filter->clean($value, 'STRING');
                            break;

                        case 'params':
                            if (!empty($value)) {
                                $decoded = json_decode($value, true);

                                if (is_array($decoded)) {
                                    array_walk($decoded, function (&$param, $key) {
                                        if (is_string($param) && WFUtility::isJson($param)) {
                                            $param = json_decode($param, true);
                                        }
                                    });
                                }

                                $value = json_encode($decoded);
                            }

                            if (empty($value)) {
                                $value = "{}";
                            }

                            break;

                        case 'rows':
                            $value = preg_replace('#[^\w,;]+#', '', $value);
                            break;

                        case 'plugins':
                            $value = preg_replace('#[^\w_,]+#', '', $value);
                            break;

                        case 'published':
                            // always import as unpublished; only users with permission may enable it
                            $value = 0;
                            break;

                        case 'ordering':
                            $value = (int) $value;
                            break;
                    }

                    $table->$key = $value;
                }

                // set new id
                $table->id = 0;

                // set checked_out
                $table->checked_out = $user->get('id');

                // set checked_out_time
                $table->checked_out_time = $date->toSQL();

                $table->created    = $date->toSQL();
                $table->created_by = $user->get('id');
                $table->modified    = $date->toSQL();
                $table->modified_by = $user->get('id');

                if (!$table->store()) {
                    $app->enqueueMessage($table->getError(), 'error');
                    return false;
                }

                // check-in
                $table->checkin();

                ++$n;
            }
        }

        return $n;
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
