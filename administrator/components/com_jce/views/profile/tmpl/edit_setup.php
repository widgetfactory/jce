<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;

$this->name = Text::_('WF_PROFILES_DETAILS');
$this->fieldsname = 'setup';
echo LayoutHelper::render('joomla.content.options_default', $this);

$this->name = Text::_('WF_PROFILES_ASSIGNMENT');
$this->fieldsname = 'assignment';
echo LayoutHelper::render('joomla.content.options_default', $this);

// read-only, rendered outside the form fields so it is never submitted
$details = array();

foreach (array('created', 'modified') as $key) {
    $date = isset($this->item->$key) ? $this->item->$key : null;

    if (empty($date) || strpos($date, '0000') === 0) {
        continue;
    }

    $userId = isset($this->item->{$key . '_by'}) ? (int) $this->item->{$key . '_by'} : 0;

    $details['JGLOBAL_FIELD_' . strtoupper($key) . '_LABEL'] = HTMLHelper::_('date', $date, Text::_('DATE_FORMAT_LC2'));

    if ($userId) {
        $user = Factory::getUser($userId);

        $details['JGLOBAL_FIELD_' . strtoupper($key) . '_BY_LABEL'] = $user->id ? $user->name : '#' . $userId;
    }
}
?>
<?php if ($details) : ?>
    <fieldset class="form-horizontal">
        <legend><?php echo Text::_('JGLOBAL_FIELDSET_PUBLISHING'); ?></legend>
        <?php foreach ($details as $label => $value) : ?>
            <div class="control-group">
                <div class="control-label"><?php echo Text::_($label); ?></div>
                <div class="controls"><?php echo $this->escape($value); ?></div>
            </div>
        <?php endforeach; ?>
    </fieldset>
<?php endif; ?>
