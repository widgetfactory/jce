<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_BASE') or die('RESTRICTED');

require_once dirname(dirname(__FILE__)).'/helpers/extension.php';
require_once dirname(dirname(__FILE__)).'/helpers/encrypt.php';

class WFTableProfiles extends JTable
{
    /*
     * Primary Key
     *
     *  @var int
     */
    public $id = null;

    /*
     *
     *
     * @var varchar
     */
    public $name = null;

    /*
     *
     *
     * @var varchar
     */
    public $description = null;

    /*
     *
     *
     * @var varchar
     */
    public $components = null;

    /*
     *
     *
     * @var int
     */
    public $area = null;

    /*
     *
     *
     * @var varchar
     */
    public $device = null;

    /*
     *
     *
     * @var varchar
     */
    public $users = null;

    /*
     *
     *
     * @var varchar
     */
    public $types = null;

    /*
     *
     *
     * @var varchar
     */
    public $rows = null;

    /*
     *
     *
     * @var varchar
     */
    public $plugins = null;

    /*
     *
     *
     * @var tinyint
     */
    public $published = 0;

    /*
     *
     *
     * @var tinyint
     */
    public $ordering = 1;

    /*
     *
     *
     * @var int unsigned
     */
    public $checked_out = 0;

    /*
     *
     *
     * @var datetime
     */
    public $checked_out_time = '';

    /*
     *
     *
     * @var text
     */
    public $params = null;

    public function __construct(&$db)
    {
        parent::__construct('#__wf_profiles', 'id', $db);
    }

    /**
     * Overridden JTable::load to decrypt parameters.
     *
     * @param int  $id    An optional profile id
     * @param bool $reset False if row not found or on error
     *                    (internal error state set in that case)
     *
     * @return bool True on success, false on failure
     *
     * @since   2.4
     */
    public function load($id = null, $reset = true)
    {
        $return = parent::load($id, $reset);

        if ($return !== false && !empty($this->params)) {
            $this->params = WFEncryptHelper::decrypt($this->params);
        }

        return $return;
    }

    /**
     * Overridden JTable::store to encrypt parameters.
     *
     * @param bool $updateNulls True to update fields even if they are null
     *
     * @return bool True on success
     *
     * @since   2.4
     */
    public function store($updateNulls = false)
    {
        if ($this->id && $this->params) {
            $component = WFExtensionHelper::getComponent();

            // get params definitions
            $params = new WFParameter($component->params, '', 'preferences');

            if ($params->get('secureparams', 0)) {
                $this->params = WFEncryptHelper::encrypt($this->params);
            }
        }

        return parent::store($updateNulls);
    }
}
