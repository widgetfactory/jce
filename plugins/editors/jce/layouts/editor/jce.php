<?php
/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_BASE') or die;

extract($displayData);

$classes = version_compare(JVERSION, '4', 'lt') ? 'joomla3' : 'mb-2';

?>
<div class="editor wf-editor-container <?php echo $classes; ?>">
	<div class="wf-editor-header"></div>
	<textarea
		spellcheck="false"
		autocomplete="off"
		name="<?php echo $name; ?>"
		id="<?php echo $id; ?>"
		cols="<?php echo $cols; ?>"
		rows="<?php echo $rows; ?>"
		style="width: <?php echo $width; ?>; height: <?php echo $height; ?>;"
		class="<?php echo $class; ?>"
	><?php echo $content; ?></textarea>
</div>
<?php echo $buttons ?? ''; ?>