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

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;

extract($displayData);

/**
 * Layout variables
 * ---------------------
 *     $options         : (array)  Optional parameters
 *     $label           : (string) The html code for the label (not required if $options['hiddenLabel'] is true)
 *     $input           : (string) The input field html code
 */

if (!empty($options['showonEnabled'])) {
    // joomla 3
    HTMLHelper::_('jquery.framework');
    HTMLHelper::_('script', 'jui/cms.js', array('version' => 'auto', 'relative' => true));
    // joomla 4
    HTMLHelper::_('script', 'jui/showon.js', array('version' => 'auto', 'relative' => true));
}

$class = empty($options['class']) ? '' : ' ' . $options['class'];
$rel = empty($options['rel']) ? '' : ' ' . $options['rel'];
?>
<div class="control-group<?php echo $class; ?>"<?php echo $rel; ?>>
	<?php if (empty($options['hiddenLabel'])): ?>
		<div class="control-label"><?php echo $label; ?></div>
	<?php endif;?>
	<div class="controls"><?php echo $input; ?></div>
	<?php if (!empty($options['description'])): ?>
		<small class="description"><?php echo Text::_($options['description']); ?></small>
	<?php endif;?>
</div>