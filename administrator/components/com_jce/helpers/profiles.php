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
use Joomla\CMS\Filter\InputFilter;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Table\Table;
use Joomla\String\StringHelper;

abstract class JceProfilesHelper
{
    /**
     * Create the Profiles database table from the SQL schema file.
     *
     * @return bool True if the table was created successfully.
     */
    public static function createProfilesTable()
    {
        $app = Factory::getApplication();
        $db = Factory::getDBO();

        $driver = strtolower($db->name);

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
     * @return bool True on success, false on error or if profiles already exist.
     */
    public static function installProfiles()
    {
        if (!self::createProfilesTable()) {
            return false;
        }

        $db = Factory::getDBO();
        $query = $db->getQuery(true);
        $query->select('COUNT(id)')->from('#__wf_profiles');
        $db->setQuery($query);

        if ((int) $db->loadResult() > 0) {
            return false;
        }

        $app = Factory::getApplication();

        $xml = JPATH_ADMINISTRATOR . '/components/com_jce/models/profiles.xml';

        if (!is_file($xml)) {
            $app->enqueueMessage(Text::_('WF_INSTALL_PROFILES_NOFILE_ERROR'), 'error');
            return false;
        }

        if (!self::processImport($xml, 'install')) {
            $app->enqueueMessage(Text::_('WF_INSTALL_PROFILES_ERROR'), 'error');
            return false;
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

    /**
     * Get user groups with content creation permissions for the given area.
     *
     * @param int    $area       0 = all, 1 = frontend only, 2 = backend only.
     * @param string $permission ACL action a group must be granted to qualify. Defaults to 'core.create';
     *                           pass 'core.edit.state' to limit to publisher-level groups and above.
     *
     * @return array List of user group IDs.
     */
    public static function getUserGroups($area, $permission = 'core.create')
    {
        $db = Factory::getDBO();

        $query = $db->getQuery(true);
        $query->select('id')->from('#__usergroups');
        $db->setQuery($query);

        $groups = $db->loadColumn();

        $front = array();
        $back = array();

        foreach ($groups as $group) {
            if (Access::checkGroup($group, 'core.admin')) {
                $back[] = $group;
            } elseif (Access::checkGroup($group, $permission)) {
                if (Access::checkGroup($group, 'core.login.admin')) {
                    $back[] = $group;
                } else {
                    $front[] = $group;
                }
            }
        }

        switch ($area) {
            case 0:
                return array_merge($front, $back);
            case 1:
                return $front;
            case 2:
                return $back;
        }

        return array();
    }

    /**
     * Canonical Joomla default user groups, keyed by their default id.
     * Each entry is array(title, permission) and is used to confirm an id has
     * not been renamed or repurposed on this installation.
     *
     * @return array
     */
    protected static function defaultUserGroups()
    {
        return array(
            3 => array('Author', 'core.create'),
            4 => array('Editor', 'core.edit'),
            5 => array('Publisher', 'core.edit.state'),
            6 => array('Manager', 'core.login.admin'),
            7 => array('Administrator', 'core.manage'),
            8 => array('Super Users', 'core.admin'),
        );
    }

    /**
     * Validate a list of default group ids against the live installation. An id is
     * kept only when a group with that id exists, still carries the expected default
     * title, and holds the matching permission level.
     *
     * @param array $ids Candidate group ids.
     *
     * @return array Validated group ids.
     */
    public static function validateGroups($ids)
    {
        $ids = array_filter(array_map('intval', (array) $ids));

        if (empty($ids)) {
            return array();
        }

        $map = self::defaultUserGroups();

        $db = Factory::getDBO();
        $query = $db->getQuery(true)
            ->select($db->quoteName(array('id', 'title')))
            ->from($db->quoteName('#__usergroups'))
            ->where($db->quoteName('id') . ' IN (' . implode(',', $ids) . ')');
        $db->setQuery($query);
        $rows = $db->loadObjectList('id');

        $valid = array();

        foreach ($ids as $id) {
            // Must be a known default id that still exists with the expected title
            // and permission level on this site.
            if (!isset($map[$id], $rows[$id])) {
                continue;
            }

            if ($rows[$id]->title !== $map[$id][0]) {
                continue;
            }

            if (!Access::checkGroup($id, $map[$id][1])) {
                continue;
            }

            $valid[] = $id;
        }

        return $valid;
    }

    /**
     * Process and import profile data from an XML file.
     *
     * @param string $file    Path to the XML file.
     * @param string $context 'install' for seeding/repair of the bundled profiles (group ids are
     *                        validated against the canonical Joomla defaults); 'import' for
     *                        user-supplied uploads (ids are validated against existing groups only).
     *
     * @return int|false Number of profiles imported, or false on error.
     */
    public static function processImport($file, $context = 'import')
    {
        $data = trim(file_get_contents($file));

        $data = preg_replace('#<params>{(.+?)}<\/params>#', '<params><![CDATA[{$1}]]></params>', $data);

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

        if (!$xml) {
            return 0;
        }

        $app = Factory::getApplication();
        $user = Factory::getUser();
        $date = Factory::getDate();

        Table::addIncludePath(JPATH_ADMINISTRATOR . '/components/com_jce/tables');

        $language = Factory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR, null, true);

        $whitelist = (array) ComponentHelper::getParams('com_jce')->get('profile_groups_whitelist', []);
        $whitelist = array_filter(array_map('intval', $whitelist));

        $filter = InputFilter::getInstance();
        $allowedKeys = ['name', 'description', 'users', 'types', 'components', 'area', 'device', 'rows', 'plugins', 'published', 'ordering', 'params'];

        $n = 0;

        foreach ($xml->profiles->children() as $profile) {
            $table = Table::getInstance('Profiles', 'JceTable');

            foreach ($profile->children() as $item) {
                $key = $item->getName();

                if (!in_array($key, $allowedKeys, true)) {
                    continue;
                }

                $value = (string) $item;

                switch ($key) {
                    case 'name':
                        $value = $filter->clean($value, 'STRING');

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
                        if ($context === 'install') {
                            // Seed profiles list canonical Joomla default group ids; keep only
                            // those whose live group still matches the expected default title
                            // and permission level, so repurposed ids are never applied.
                            $ids = self::validateGroups(explode(',', $value));

                            if (empty($ids)) {
                                // No default group survived validation on this install, so fall
                                // back to the Super Users (core.admin) groups.
                                $ids = self::getUserGroups(2, 'core.admin');
                            }
                        } elseif ($value === '') {
                            $area = !empty($profile->area) ? (int) $profile->area[0] : 0;
                            $ids = self::getUserGroups($area);
                        } else {
                            $ids = array_filter(array_map('intval', explode(',', $value)));

                            if (!empty($ids)) {
                                // Imported profiles may carry group ids from another installation;
                                // keep only those that match a user group on this site.
                                $db = Factory::getDBO();
                                $query = $db->getQuery(true)
                                    ->select($db->quoteName('id'))
                                    ->from($db->quoteName('#__usergroups'))
                                    ->where($db->quoteName('id') . ' IN (' . implode(',', $ids) . ')');
                                $db->setQuery($query);
                                $ids = array_map('intval', $db->loadColumn());
                            }

                            // None of the imported ids match a group here, so fall back to
                            // the Super Users (core.admin) groups rather than trusting stale ids.
                            if (empty($ids)) {
                                $ids = self::getUserGroups(2, 'core.admin');
                            }
                        }

                        $value = implode(',', array_unique($ids));

                        if (!empty($whitelist)) {
                            $filtered = !empty($value) ? array_intersect(explode(',', $value), $whitelist) : [];

                            if (!empty($filtered)) {
                                $value = implode(',', $filtered);
                            } elseif (empty((string) $profile->users)) {
                                $value = implode(',', $whitelist);
                            } else {
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
                        $value = 0;
                        break;

                    case 'ordering':
                        $value = (int) $value;
                        break;
                }

                $table->$key = $value;
            }

            $table->id = 0;
            $table->checked_out = $user->get('id');
            $table->checked_out_time = $date->toSQL();
            $table->created = $date->toSQL();
            $table->created_by = $user->get('id');
            $table->modified = $date->toSQL();
            $table->modified_by = $user->get('id');

            if (!$table->store()) {
                $app->enqueueMessage($table->getError(), 'error');
                return false;
            }

            $table->checkin();

            ++$n;
        }

        return $n;
    }

    /**
     * CDATA-encode a string if it contains XML-special characters and escape double quotes.
     *
     * @param string $data The string to encode.
     *
     * @return string The encoded string.
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
