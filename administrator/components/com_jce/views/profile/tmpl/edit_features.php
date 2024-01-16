<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;

$this->name = Text::_('WF_PROFILES_FEATURES_LAYOUT');
$this->fieldsname = 'editor.features';
echo LayoutHelper::render('joomla.content.options_default', $this);
?>

<div class="form-horizontal">
    <?php echo LayoutHelper::render('edit.layout', $this); ?>
    <?php echo LayoutHelper::render('edit.additional', $this); ?>
</div>
<input type="hidden" name="jform[plugins]" value="" />
<input type="hidden" name="jform[rows]" value="" />