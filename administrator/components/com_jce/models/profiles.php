<?php

/**
 * @copyright     Copyright (c) 2009-2013 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

class JceModelProfiles extends JModelList
{
    public function getProfiles()
    {
        $db = JFactory::getDBO();
        $query = $db->getQuery();

        $query->select('id as value, name AS text')->from('#__wf_profiles')->where('published = 1');
        $db->setQuery($query);

        return $db->loadObjectList();
    }

    /**
     * Constructor.
     *
     * @param   array  An optional associative array of configuration settings
     *
     * @see     JController
     * @since   1.6
     */
    public function __construct($config = array())
    {
        if (empty($config['filter_fields'])) {
            $config['filter_fields'] = array(
                'id', 'a.id',
                'name', 'a.name',
                'checked_out', 'a.checked_out',
                'checked_out_time', 'a.checked_out_time',
                'published', 'a.published',
                'ordering', 'a.ordering',
            );
        }

        parent::__construct($config);
    }

    /**
     * Method to auto-populate the model state.
     *
     * Note. Calling getState in this method will result in recursion.
     *
     * @since   1.6
     */
    protected function populateState($ordering = null, $direction = null)
    {
        // Load the filter state.
        $search = $this->getUserStateFromRequest($this->context.'.filter.search', 'filter_search');
        $this->setState('filter.search', $search);

        $published = $this->getUserStateFromRequest($this->context.'.filter.published', 'filter_published', '', 'string');
        $this->setState('filter.published', $published);

        // List state information.
        parent::populateState('a.name', 'asc');
    }

    /**
     * Method to get a store id based on model configuration state.
     *
     * This is necessary because the model is used by the component and
     * different modules that might need different sets of data or different
     * ordering requirements.
     *
     * @param string $id A prefix for the store id
     *
     * @return string A store id
     *
     * @since   1.6
     */
    protected function getStoreId($id = '')
    {
        // Compile the store id.
        $id .= ':'.$this->getState('filter.search');
        $id .= ':'.$this->getState('filter.published');

        return parent::getStoreId($id);
    }

    /**
	 * Build an SQL query to load the list data.
	 *
	 * @return  JDatabaseQuery
	 */
	protected function getListQuery()
	{
		// Create a new query object.
		$db = $this->getDbo();
		$query = $db->getQuery(true);

		// Select the required fields from the table.
		$query->select(
			$this->getState(
				'list.select',
				'a.id , a.name, a.description, a.checked_out, a.checked_out_time,' .
					' a.published, a.ordering'
			)
		)
			->from($db->quoteName('#__wf_profiles') . ' AS a');

		// Join over the users for the checked out user.
		$query->select('uc.name AS editor')
			->join('LEFT', '#__users AS uc ON uc.id=a.checked_out');

		// Filter by published state.
		$published = $this->getState('filter.published');

		if (is_numeric($published))
		{
			$query->where('a.published = ' . (int) $published);
		}
		elseif ($published === '')
		{
			$query->where('(a.published IN (0, 1))');
		}

		// Filter by state.
		$query->where('a.published >= 0');

		// Filter by search in name or id.
		$search = $this->getState('filter.search');

		if (!empty($search))
		{
			if (stripos($search, 'id:') === 0)
			{
				$query->where('a.id = ' . (int) substr($search, 3));
			}
		}

		return $query;
	}

    /**
     * Create the Profiles table.
     *
     * @return bool
     */
    public function createProfilesTable()
    {
        jimport('joomla.installer.helper');

        $app = JFactory::getApplication();

        $db = JFactory::getDBO();
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

                // Postgresql needs special attention because of the query syntax
                if ($driver == 'postgresql') {
                    $query = "CREATE OR REPLACE FUNCTION create_table_if_not_exists (create_sql text)
                    RETURNS bool as $$
                    BEGIN
                        BEGIN
                            EXECUTE create_sql;
                            EXCEPTION WHEN duplicate_table THEN RETURN false;
                        END;
                        RETURN true;
                    END; $$
                    LANGUAGE plpgsql;
                    SELECT create_table_if_not_exists ('" .$query."');";
                }
                // set query
                $db->setQuery(trim($query));

                if (!$db->execute()) {
                    $app->enqueueMessage(JText::_('WF_INSTALL_TABLE_PROFILES_ERROR').$db->stdErr(), 'error');

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

        $app->enqueueMessage(JText::_('WF_INSTALL_TABLE_PROFILES_ERROR').!is_null($error) ? ' - '.$error : '', 'error');

        return false;
    }

    /**
     * Install Profiles.
     *
     * @return bool
     *
     * @param object $install[optional]
     */
    public function installProfiles()
    {
        $app = JFactory::getApplication();
        $db = JFactory::getDBO();

        if ($this->createProfilesTable()) {
            self::buildCountQuery();

            $profiles = array('Default' => false, 'Front End' => false);

            // No Profiles table data
            if (!$db->loadResult()) {
                $xml = __DIR__.'/profiles.xml';

                if (is_file($xml)) {
                    if (!$this->processImport($xml)) {
                        $app->enqueueMessage(JText::_('WF_INSTALL_PROFILES_ERROR'), 'error');

                        return false;
                    }
                } else {
                    $app->enqueueMessage(JText::_('WF_INSTALL_PROFILES_NOFILE_ERROR'), 'error');

                    return false;
                }
            }

            return true;
        }

        return false;
    }

    private static function buildCountQuery($name = '')
    {
        $db = JFactory::getDBO();

        $query = $db->getQuery(true);

        // check for name
        $query->select('COUNT(id)')->from('#__wf_profiles');

        if ($name) {
            $query->where('name = '.$db->Quote($name));
        }

        $db->setQuery($query);
    }

    public function getDefaultProfile()
    {
        $mainframe = JFactory::getApplication();
        $file = __DIR__.'/profiles.xml';

        $xml = JFactory::getXML($file, true);

        if ($xml) {
            foreach ($xml->profiles->children() as $profile) {
                if ($profile->attributes()->default) {
                    $row = JTable::getInstance('profiles', 'WFTable');

                    foreach ($profile->children() as $item) {
                        switch ($item->getName()) {
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
                    // reset name and description
                    $row->name = '';
                    $row->description = '';

                    return $row;
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
        $db = JFactory::getDBO();

        $tables = $db->getTableList();

        if (!empty($tables)) {
            // swap array values with keys, convert to lowercase and return array keys as values
            $tables = array_keys(array_change_key_case(array_flip($tables)));
            $app = JFactory::getApplication();
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
        $db = JFactory::getDBO();

        self::buildCountQuery();

        return $db->loadResult();
    }

    public function importProfile($data)
    {

    }
}
