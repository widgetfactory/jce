<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Model\ListModel;
use Joomla\CMS\Table\Table;

require_once JPATH_COMPONENT_ADMINISTRATOR . '/helpers/profiles.php';

class JceModelProfiles extends ListModel
{
    /**
     * Constructor.
     *
     * @param   array  $config  An optional associative array of configuration settings.
     *
     * @see     JControllerLegacy
     * @since   1.6
     */
    public function __construct($config = array())
    {
        if (empty($config['filter_fields'])) {
            $config['filter_fields'] = array(
                'id', 'id',
                'name', 'name',
                'checked_out', 'checked_out',
                'checked_out_time', 'checked_out_time',
                'published', 'published',
                'ordering', 'ordering',
            );
        }

        parent::__construct($config);
    }

    /**
     * Method to auto-populate the model state.
     *
     * @param   string  $ordering   An optional ordering field.
     * @param   string  $direction  An optional direction (asc|desc).
     *
     * @return  void
     *
     * @note    Calling getState in this method will result in recursion.
     * @since   1.6
     */
    protected function populateState($ordering = 'id', $direction = 'asc')
    {
        // Load the filter state.
        $this->setState('filter.search', $this->getUserStateFromRequest($this->context . '.filter.search', 'filter_search', '', 'string'));

        // Load the parameters.
        $params = ComponentHelper::getParams('com_jce');
        $this->setState('params', $params);

        // List state information.
        parent::populateState($ordering, $direction);
    }

    /**
     * Method to get a store id based on model configuration state.
     *
     * This is necessary because the model is used by the component and
     * different modules that might need different sets of data or different
     * ordering requirements.
     *
     * @param   string  $id  A prefix for the store id.
     *
     * @return  string  A store id.
     *
     * @since   1.6
     */
    protected function getStoreId($id = '')
    {
        // Compile the store id.
        $id .= ':' . $this->getState('filter.search');
        $id .= ':' . $this->getState('filter.published');
        $id .= ':' . $this->getState('filter.components');

        return parent::getStoreId($id);
    }

    /**
     * Method to get an array of data items.
     *
     * @return  mixed  An array of data items on success, false on failure.
     *
     * @since   1.6
     */
    public function getItems()
    {
        $items = parent::getItems();

        // Filter by device
        $device = $this->getState('filter.device');

        // Filter by component
        $components = $this->getState('filter.components');

        // Filter by user groups
        $usergroups = $this->getState('filter.usergroups');

        $items = array_filter($items, function ($item) use ($device, $components, $usergroups) {
            $state = true;

            if ($device) {
                $state = in_array($device, explode(',', $item->device));
            }

            if ($components) {
                $state = in_array($components, explode(',', $item->components));
            }

            if ($usergroups) {
                $state = in_array($usergroups, explode(',', $item->types));
            }

            return $state;
        });

        // Get a storage key.
        $store = $this->getStoreId();

        // update cache store
        $this->cache[$store] = $items;

        return $items;
    }

    /**
     * Build an SQL query to load the list data.
     *
     * @return  JDatabaseQuery
     *
     * @since   1.6
     */
    protected function getListQuery()
    {
        // Create a new query object.
        $db = $this->getDbo();
        $query = $db->getQuery(true);
        $user = Factory::getUser();

        // Select the required fields from the table.
        $query->select(
            $this->getState(
                'list.select',
                '*'
            )
        );

        $query->from($db->quoteName('#__wf_profiles'));

        // Filter by published state
        $published = $this->getState('filter.published');

        if (is_numeric($published)) {
            $query->where($db->quoteName('published') . ' = ' . (int) $published);
        } elseif ($published === '') {
            $query->where('(' . $db->quoteName('published') . ' = 0 OR ' . $db->quoteName('published') . ' = 1)');
        }

        // Filter by area
        $area = (int) $this->getState('filter.area');

        if ($area) {
            $query->where($db->quoteName('area') . ' = ' . (int) $area);
        }

        // Filter by search in title
        $search = $this->getState('filter.search');

        if (!empty($search)) {
            if (stripos($search, 'id:') === 0) {
                $query->where($db->quoteName('id') . ' = ' . (int) substr($search, 3));
            } else {
                $search = $db->quote('%' . str_replace(' ', '%', $db->escape(trim($search), true) . '%'));
                $query->where('(' . $db->quoteName('name') . ' LIKE ' . $search . ' OR ' . $db->quoteName('description') . ' LIKE ' . $search . ')');
            }
        }

        // Add the list ordering clause.
        $listOrder = $this->getState('list.ordering', 'ordering');
        $listDirn = $this->getState('list.direction', 'ASC');

        $query->order($db->escape($listOrder . ' ' . $listDirn));

        return $query;
    }

    public function repair()
    {
        $file = __DIR__ . '/profiles.xml';

        if (!is_file($file)) {
            $this->setError(Text::_('WF_PROFILES_REPAIR_ERROR'));
            return false;
        }

        $xml = simplexml_load_file($file);

        if (!$xml) {
            $this->setError(Text::_('WF_PROFILES_REPAIR_ERROR'));
            return false;
        }

        foreach ($xml->profiles->children() as $profile) {
            $groups = JceProfilesHelper::getUserGroups((int) $profile->children('area'));

            $table = Table::getInstance('Profiles', 'JceTable');

            foreach ($profile->children() as $item) {
                switch ((string) $item->getName()) {
                    case 'description':
                        $table->description = Text::_((string) $item);
                    case 'types':
                        $table->types = implode(',', $groups);
                        break;
                    case 'area':
                        $table->area = (int) $item;
                        break;
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

            // default
            $table->checked_out = 0;
            $table->checked_out_time = '0000-00-00 00:00:00';

            // Check the data.
            if (!$table->check()) {
                $this->setError($table->getError());

                return false;
            }

            // Store the data.
            if (!$table->store()) {
                $this->setError($table->getError());

                return false;
            }
        }

        return true;
    }
}
