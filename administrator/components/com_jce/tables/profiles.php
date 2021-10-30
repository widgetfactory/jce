<?php

/**
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_BASE') or die;

require_once(JPATH_ADMINISTRATOR . '/components/com_jce/helpers/encrypt.php');

class JceTableProfiles extends JTable
{
    public function __construct(&$db)
    {
        parent::__construct('#__wf_profiles', 'id', $db);
    }

    public function load($id = null, $reset = true)
    {
        $return = parent::load($id, $reset);

        if ($return !== false) {
            // decrypt params
            if (!empty($this->params)) {
                $this->params = JceEncryptHelper::decrypt($this->params);
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
			if (!empty($this->params))
			{
				$this->params = '{}';
			}
		}
		
		return true;
	}
}
