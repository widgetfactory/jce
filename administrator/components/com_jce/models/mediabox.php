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

use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;
use Joomla\CMS\MVC\Model\FormModel;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Table\Table;

class JceModelMediabox extends FormModel
{
    /**
     * Returns a Table object, always creating it.
     *
     * @param type   $type   The table type to instantiate
     * @param string $prefix A prefix for the table class name. Optional
     * @param array  $config Configuration array for model. Optional
     *
     * @return Joomla\CMS\Table\Table A database object
     *
     * @since   1.6
     */
    public function getTable($type = 'Extension', $prefix = 'JTable', $config = array())
    {
        return Table::getInstance($type, $prefix, $config);
    }

    /**
     * Method to get a form object.
     *
     * @param array $data     Data for the form
     * @param bool  $loadData True if the form is to load its own data (default case), false if not
     *
     * @return mixed A JForm object on success, false on failure
     *
     * @since    1.6
     */
    public function getForm($data = array(), $loadData = true)
    {
        Form::addFormPath(JPATH_PLUGINS . '/system/jcemediabox');

        Factory::getLanguage()->load('plg_system_jcemediabox', JPATH_PLUGINS . '/system/jcemediabox');
        Factory::getLanguage()->load('plg_system_jcemediabox', JPATH_ADMINISTRATOR);

        // Get the form.
        $form = $this->loadForm('com_jce.mediabox', 'jcemediabox', array('control' => 'jform', 'load_data' => $loadData), true, '//config');

        if (empty($form)) {
            return false;
        }

        return $form;
    }

    /**
     * Method to get the data that should be injected in the form.
     *
     * @return mixed The data for the form
     *
     * @since    1.6
     */
    protected function loadFormData()
    {
        // Check the session for previously entered form data.
        $data = Factory::getApplication()->getUserState('com_jce.mediabox.plugin.data', array());

        if (empty($data)) {
            $data = $this->getData();
        }

        return $data;
    }

    /**
     * Method to get the configuration data.
     *
     * This method will load the global configuration data straight from
     * JConfig. If configuration data has been saved in the session, that
     * data will be merged into the original data, overwriting it.
     *
     * @return array An array containg all global config data
     *
     * @since    1.6
     */
    public function getData()
    {
        // Get the editor data
        $plugin = PluginHelper::getPlugin('system', 'jcemediabox');

        // json_decode
        $json = json_decode($plugin->params, true);

        array_walk($json, function (&$value, $key) {
            if (is_numeric($value)) {
                $value = $value + 0;
            }
        });

        $data = new StdClass;
        $data->params = $json;

        return $data;
    }

    /**
     * Method to save the form data.
     *
     * @param   array  The form data
     *
     * @return bool True on success
     *
     * @since    2.7
     */
    public function save($data)
    {
        $table = $this->getTable();

        $id = $table->find(array(
            'type' => 'plugin',
            'element' => 'jcemediabox',
            'folder' => 'system',
        ));

        if (!$id) {
            $this->setError('Invalid plugin');
            return false;
        }

        // Load the previous Data
        if (!$table->load($id)) {
            $this->setError($table->getError());
            return false;
        }

        // Bind the data.
        if (!$table->bind($data)) {
            $this->setError($table->getError());
            return false;
        }

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

        return true;
    }
}
