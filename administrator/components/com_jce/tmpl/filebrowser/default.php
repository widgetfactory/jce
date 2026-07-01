<?php

/**
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
\defined('_JEXEC') or die;

$wa = $this->document->getWebAssetManager();
$wa->useScript('com_jce.filebrowser.script')
    ->useStyle('com_jce.filebrowser.style');

?>
<div class="row">
	<?php if (!empty($this->sidebar)) : ?>
	<div id="j-sidebar-container" class="j-sidebar-container span2 col-md-2">
		<?php echo $this->sidebar; ?>
	</div>
	<div id="j-main-container" class="j-main-container span10 col-md-10">
	<?php else : ?>
	<div id="j-main-container">
	<?php endif; ?>
		<div class="jce-ui row-fluid">
			<iframe src="<?php echo $this->state->get('url');?>" frameborder="0" class="wf-admin-browser"></iframe>
		</div>
	</div>
</div>