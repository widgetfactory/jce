<?php

/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

defined( 'WF_EDITOR' ) or die('RESTRICTED');
?>
<div class="ui-position-cover ui-browser ui-browser-<?php echo $this->filebrowser->get('position');?>">
<?php
	// render tabs and panels
	WFTabs::getInstance()->render();

	if ($this->filebrowser->get('position') !== 'external') {
		$this->filebrowser->render();
	}
?>
</div>
<div class="actionPanel ui-modal-footer">
	<button class="ui-button ui-button-refresh" id="refresh"><?php echo WFText::_('WF_LABEL_REFRESH')?></button>
	<button class="ui-button ui-button-confirm" id="insert"><?php echo WFText::_('WF_LABEL_INSERT')?></button>
	<button class="ui-button ui-button-cancel" id="cancel"><?php echo WFText::_('WF_LABEL_CANCEL')?></button>
</div>
