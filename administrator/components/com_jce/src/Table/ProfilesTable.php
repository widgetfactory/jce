<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2009 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Table;

use Joomla\CMS\Application\ApplicationHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Table\Table;
use Joomla\Database\ParameterType;
use Joomla\String\StringHelper;

use Joomla\Component\Jce\Administrator\Helper\EncryptHelper;

defined('_JEXEC') or die;

/**
 * Profiles Table class
 *
 * @since  1.5
 */
class ProfilesTable extends Table
{
	/**
	 * Indicates that columns fully support the NULL value in the database
	 *
	 * @var    boolean
	 * @since  __DEPLOY_VERSION__
	 */
	protected $_supportNullValue = true;

	/**
	 * Ensure the params and metadata in json encoded in the bind method
	 *
	 * @var    array
	 * @since  3.4
	 */
	protected $_jsonEncode = array('params');

	/**
	 * Constructor
	 *
	 * @param   \JDatabaseDriver  &$db  A database connector object
	 *
	 * @since   1.5
	 */
	public function __construct(&$db)
	{
		$this->typeAlias = 'com_jce.profile';

		parent::__construct('#__wf_profiles', 'id', $db);
	}

	public function load($id = null, $reset = true)
    {
        $return = parent::load($id, $reset);

        if ($return !== false) {
            // decrypt params
            if (!empty($this->params)) {
                $this->params = EncryptHelper::decrypt($this->params);
            }
        }

        return $return;
    }

    /**
	 * Overloaded check function
	 *
	 * @return  boolean  True on success, false on failure
	 *
	 * @see     Table::check()
	 * @since   2.9.18
	 */
	public function check()
	{
		try
		{
			parent::check();
		}
		catch (\Exception $e)
		{
			$this->setError($e->getMessage());

			return false;
		}
		
		/**
		 * Ensure any new items have compulsory fields set
		 */
		if (!$this->id)
		{
			if (!isset($this->device))
			{
				$this->device = 'desktop,tablet,phone';
			}
			
			if (!isset($this->area))
			{
				$this->area = '0';
			}
			
			// Params can be an empty json string
			if (empty($this->params))
			{
				$this->params = '{}';
			}
		}
		
		return true;
	}
}
