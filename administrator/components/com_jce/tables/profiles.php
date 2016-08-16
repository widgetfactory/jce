<?php

/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('JPATH_BASE') or die('RESTRICTED');

require_once(dirname(dirname(__FILE__)) . '/helpers/extension.php');
require_once(dirname(dirname(__FILE__)) . '/helpers/encrypt.php');

class WFTableProfiles extends JTable {

    /**
     * Primary Key
     *
     *  @var int
     */
    var $id = null;

    /**
     *
     *
     * @var varchar
     */
    var $name = null;

    /**
     *
     *
     * @var varchar
     */
    var $description = null;

    /**
     *
     *
     * @var varchar
     */
    var $components = null;

    /**
     *
     *
     * @var int
     */
    var $area = null;

    /**
     *
     *
     * @var varchar
     */
    var $device = null;

    /**
     *
     *
     * @var varchar
     */
    var $users = null;

    /**
     *
     *
     * @var varchar
     */
    var $types = null;

    /**
     *
     *
     * @var varchar
     */
    var $custom = null;

    /**
     *
     *
     * @var varchar
     */
    var $rows = null;

    /**
     *
     *
     * @var varchar
     */
    var $plugins = null;

    /**
     *
     *
     * @var tinyint
     */
    var $published = 0;

    /**
     *
     *
     * @var tinyint
     */
    var $ordering = 1;

    /**
     *
     *
     * @var int unsigned
     */
    var $checked_out = 0;

    /**
     *
     *
     * @var datetime
     */
    var $checked_out_time = "";

    /**
     *
     *
     * @var text
     */
    var $params = null;

    public function __construct(& $db) {
        parent::__construct('#__wf_profiles', 'id', $db);
    }

    /**
     * Overridden JTable::load to decrypt parameters
     *
     * @param   integer  $id  An optional profile id.
     * @param   boolean  $reset   False if row not found or on error
     * (internal error state set in that case).
     *
     * @return  boolean  True on success, false on failure.
     *
     * @since   2.4
     */
    public function load($id = null, $reset = true) {
        $return = parent::load($id, $reset);

        if ($return !== false && !empty($this->params)) {
            $this->params = WFEncryptHelper::decrypt($this->params);
        }

        return $return;
    }

    /**
     * Overridden JTable::store to encrypt parameters
     *
     * @param   boolean  $updateNulls  True to update fields even if they are null.
     *
     * @return  boolean  True on success.
     *
     * @since   2.4
     */
    public function store($updateNulls = false) {

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

?>
