<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2009 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Model;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormHelper;
use Joomla\CMS\MVC\Model\AdminModel;

use Wfe\Helper\StringHelper;

/**
 * Releases model.
 *
 * @since  1.5
 */
class ConfigModel extends AdminModel
{
    /**
     * The type alias for this content type.
     *
     * @var    string
     * @since  3.0
     */
    public $typeAlias = 'com_jce.config';

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
        Form::addFieldPath(JPATH_ADMINISTRATOR . '/components/com_jce/src/Field');
        FormHelper::addFieldPrefix('Joomla\Component\Jce\Administrator\Field');

        return $this->loadForm('com_jce.config', 'config', array('control' => 'jform', 'load_data' => $loadData));
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
        $data = Factory::getApplication()->getUserState('com_jce.config.data', array());

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

                if (!StringHelper::isJson($config['custom_config'])) {
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

    public function getTable($type = 'Config', $prefix = '', $config = array())
    {
        $classname = '\\Joomla\\CMS\\Table\\' . $type;
        
        if ($prefix) {
            $classname = $prefix . '\\Table\\' . $type;
        }
        
        $db = $this->getDatabase();
        $table = new \Joomla\CMS\Table\Extension($db);

        return $table;
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

        $data = new \StdClass;
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
            throw new \Exception('Invalid plugin');
        }

        // Load the previous Data
        if (!$table->load($id)) {
            throw new \Exception($table->getError());
        }

        // Bind the data.
        if (!$table->bind($data)) {
            throw new \Exception($table->getError());
        }

        // Check the data.
        if (!$table->check()) {
            throw new \Exception($table->getError());
        }

        // Store the data.
        if (!$table->store()) {
            throw new \Exception($table->getError());
        }

        return true;
    }
}
