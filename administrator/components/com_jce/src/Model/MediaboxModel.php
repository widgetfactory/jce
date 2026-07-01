<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Model;

defined('_JEXEC') or die;

use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Model\FormModel;
use Joomla\CMS\Form\Form;
use Joomla\CMS\Form\FormHelper;
use Joomla\CMS\Table\Table;

/**
 * MediaBox model.
 *
 * @since  3.0
 */
class MediaboxModel extends FormModel
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
    public function getTable($type = 'Extension', $prefix = 'Joomla\\CMS\\Table\\', $config = [])
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
        Form::addFieldPath(JPATH_ADMINISTRATOR . '/components/com_jce/src/Field');
        Form::addFormPath(JPATH_PLUGINS . '/system/jcemediabox');

        FormHelper::addFieldPrefix('Joomla\Component\Jce\Administrator\Field');

        Factory::getLanguage()->load('plg_system_jcemediabox', JPATH_ADMINISTRATOR);
        Factory::getLanguage()->load('plg_system_jcemediabox', JPATH_PLUGINS . '/system/jcemediabox');

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
     * @since    3.0
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
     * @since	1.6
     */
    public function getData()
    {
        // Get the editor data
        $plugin = PluginHelper::getPlugin('system', 'jcemediabox');

        // json_decode
        $json = json_decode($plugin->params, true);

        array_walk($json, function(&$value, $key) {
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
            'type'      => 'plugin',
            'element'   => 'jcemediabox',
            'folder'    => 'system'
        )); 

        if (!$id) {
            $this->setError('Invalid plugin');
            return false;
        }

        // Load the previous Data
		if (!$table->load($id))
		{
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
