<?php

/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Model;

use Exception;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\MVC\Model\ListModel;
use Joomla\Component\Jce\Administrator\Helper\ProfilesHelper;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * Methods supporting a list of profile records.
 *
 * @since  3.0.0
 */
class ProfilesModel extends ListModel
{
    /**
     * Constructor.
     *
     * @param   array  $config  An optional associative array of configuration settings.
     *
     * @since   1.6
     */
    public function __construct($config = [])
    {
        if (empty($config['filter_fields'])) {
            $config['filter_fields'] = [
                'id',
                'id',
                'name',
                'name',
                'checked_out',
                'checked_out',
                'checked_out_time',
                'checked_out_time',
                'published',
                'published',
                'ordering',
                'ordering',
            ];
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
     * @since   3.9.0
     *
     * @throws  Exception
     */
    protected function populateState($ordering = null, $direction = null)
    {
        // Load the parameters.
        $params = ComponentHelper::getParams('com_jce');
        $this->setState('params', $params);

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
     * @return  \Joomla\Database\DatabaseQuery
     *
     * @since   1.6
     */
    protected function getListQuery()
    {
        // Create a new query object.
        $db    = $this->getDatabase();
        $query = $db->getQuery(true);

        // Select the required fields from the table.
        $query->select(
            $this->getState(
                'list.select',
                'a.*'
            )
        )->select(
            [
                $db->quoteName('uc.name', 'editor')
            ]
        );

        $query->from(
            $db->quoteName('#__wf_profiles', 'a')
        )->join('LEFT', $db->quoteName('#__users', 'uc'), $db->quoteName('uc.id') . ' = ' . $db->quoteName('a.checked_out'));

        // Filter by published state
        $published = $this->getState('filter.published');

        if (is_numeric($published)) {
            $query->where($db->quoteName('a.published') . ' = ' . (int) $published);
        } elseif ($published === '') {
            $query->where('(' . $db->quoteName('a.published') . ' = 0 OR ' . $db->quoteName('a.published') . ' = 1)');
        }

        // Filter by area
        $area = (int) $this->getState('filter.area');

        if ($area) {
            $query->where($db->quoteName('a.area') . ' = ' . (int) $area);
        }

        // Filter by search in title
        $search = $this->getState('filter.search');

        if (!empty($search)) {
            if (stripos($search, 'id:') === 0) {
                $query->where($db->quoteName('a.id') . ' = ' . (int) substr($search, 3));
            } else {
                $search = $db->quote('%' . str_replace(' ', '%', $db->escape(trim($search), true) . '%'));
                $query->where('(' . $db->quoteName('a.name') . ' LIKE ' . $search . ' OR ' . $db->quoteName('a.description') . ' LIKE ' . $search . ')');
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
        $file = JPATH_ADMINISTRATOR . '/components/com_jce/data/profiles.xml';

        if (!is_file($file)) {
            return false;
        }

        if (!ProfilesHelper::processImport($file)) {
            return false;
        }

        // publish the "Default" profile as per its manifest setting
        $db = $this->getDatabase();
        $query = $db->getQuery(true);
        $query->update('#__wf_profiles')->set('published = 1')->where('name = ' . $db->quote('Default'));
        $db->setQuery($query);
        $db->execute();

        return true;
    }
}
