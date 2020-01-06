<?php

/**
 * @copyright     Copyright (c) 2009-2020 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

// load base model
jimport('joomla.application.component.modelform');

class JceModelConfig extends JModelForm
{
    /**
     * Returns a Table object, always creating it.
     *
     * @param type   $type   The table type to instantiate
     * @param string $prefix A prefix for the table class name. Optional
     * @param array  $config Configuration array for model. Optional
     *
     * @return JTable A database object
     *
     * @since   1.6
     */
    public function getTable($type = 'Extension', $prefix = 'JTable', $config = array())
    {
        return JTable::getInstance($type, $prefix, $config);
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
        // Get the form.
        $form = $this->loadForm('com_jce.config', 'config', array('control' => 'jform', 'load_data' => $loadData));

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
        $data = JFactory::getApplication()->getUserState('com_jce.config.data', array());

        if (empty($data)) {
            $data = $this->getData();
        }

        $this->preprocessData('com_jce.config', $data);

        return $data;
    }

    /* Override to prevent plugins from processing form data */
    protected function preprocessData($context, &$data, $group = 'system')
    {
        if (!isset($data->params)) {
            return;
        }

        $config = $data->params;

        if (is_string($config)) {
            $config = json_decode($config, true);
        }

        if (empty($config)) {
            return;
        }

        if (!empty($config['custom_config'])) {
            // settings syntax, eg: key:value
            if (is_string($config['custom_config']) && strpos($config['custom_config'], ':') !== false) {

                if (!WFUtility::isJson($config['custom_config'])) {
                    $values = explode(';', $config['custom_config']);

                    // reset as array
                    $config['custom_config'] = array();

                    foreach ($values as $value) {
                        list($key, $val) = explode(':', $value);

                        $config['custom_config'][] = array(
                            'name' => $key,
                            'value' => trim($val, " \t\n\r\0\x0B'\""),
                        );
                    }
                }
            }
        }

        $data->params = $config;
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
        $table = $this->getTable();

        $id = $table->find(array(
            'type' => 'plugin',
            'element' => 'jce',
            'folder' => 'editors',
        ));

        if (!$table->load($id)) {
            $this->setError($table->getError());
            return false;
        }

        // json_decode
        $json = json_decode($table->params, true);

        if (empty($json)) {
            $json = array();
        }

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
            'element' => 'jce',
            'folder' => 'editors',
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
