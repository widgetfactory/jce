<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright     Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Table\Table;

require_once JPATH_ADMINISTRATOR . '/components/com_jce/helpers/encrypt.php';

class JceTableProfiles extends Table
{
    /**
     * Indicates that columns fully support the NULL value in the database
     *
     * @var    boolean
     * @since  4.0.0
     */
    protected $_supportNullValue = true;

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
        } catch (Exception $e) {
            $this->setError($e->getMessage());

            return false;
        }

        /**
         * Ensure any new items have compulsory fields set
         */
        if (!$this->id) {
            if (!isset($this->device)) {
                $this->device = 'desktop,tablet,phone';
            }

            if (!isset($this->area)) {
                $this->area = '0';
            }

            // Params can be an empty json string for new tables
            if (empty($this->params)) {
                $this->params = '{}';
            }
        }

        return true;
    }
}
