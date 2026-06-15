<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Field;

defined('JPATH_SITE') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Form\Field\UserGroupListField;

/**
 * User group list filtered by the global profile_groups_whitelist setting.
 * When no whitelist is configured all groups are shown (default behaviour).
 */
class UsergroupsField extends UserGroupListField
{
    public $type = 'Usergroups';

    protected function getOptions()
    {
        $options = parent::getOptions();

        $whitelist = array_filter(array_map('intval', (array) ComponentHelper::getParams('com_jce')->get('profile_groups_whitelist', [])));

        if (empty($whitelist)) {
            return $options;
        }

        return array_values(array_filter($options, function ($option) use ($whitelist) {
            return !is_numeric($option->value) || in_array((int) $option->value, $whitelist, true);
        }));
    }
}
