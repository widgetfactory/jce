<?php

/**
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_BASE') or die;

class JceTableProfiles extends JTable
{
    public function __construct(&$db)
    {
        parent::__construct('#__wf_profiles', 'id', $db);
    }

    /*public function bind($src, $ignore = array())
    {
        $data = array();

        foreach ($src as $key => $value) {
            $data[$key] = $value;
        }

        if (!empty($data['config'])) {
            $json = array();

            $config = $data['config'];

            // get existing parameters and decode to array
            $params = (array) json_decode($this->params, true);

            if (empty($data['plugins'])) {
                $data['plugins'] = $this->plugins;
            }

            // get plugins
            $items = explode(',', $data['plugins']);

            // add editor as param key
            array_unshift($items, 'editor');

            // data for editor and plugins
            foreach ($items as $item) {
                // add config data
                if (array_key_exists($item, $config)) {
                    $json[$item] = filter_var_array($config[$item], FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW);
                }
            }

            $params = WFUtility::array_merge_recursive_distinct($params, $json);

            // combine with stored data and encode as json string
            $data['params'] = json_encode($params, JSON_UNESCAPED_SLASHES);
        }

        return parent::bind($data, $ignore);
    }*/

    public function load($id = null, $reset = true)
    {
        $return = parent::load($id, $reset);

        if ($return !== false) {
            // decrypt address
            if (!empty($this->params)) {
                $this->params = JceEncryptHelper::decrypt($this->params);
            }
        }

        return $return;
    }

    public function store($updateNulls = false)
    {
        // encrypt address
        if (!empty($this->params)) {
            
            $params = JComponentHelper::getParams('com_jce');

            if ($params->get('secureparams', 0)) {
                $this->params = JceEncryptHelper::encrypt($this->params);
            }

        }

        return parent::store($updateNulls);
    }
}
