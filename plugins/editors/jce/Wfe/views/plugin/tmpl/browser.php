<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;

defined('WF_EDITOR') or die('RESTRICTED!!');
?>
<div class="uk-position-cover uk-browser uk-browser-external">
	<?php $this->get('filebrowser')->render(); ?>

	<input type="hidden" value="" class="filebrowser" data-filebrowser />
</div>
<div class="actionPanel uk-modal-footer">
	<button class="uk-button cancel" id="cancel"><?php echo Text::_('WF_LABEL_CANCEL'); ?></button>
	<button class="uk-button" id="refresh"><?php echo Text::_('WF_LABEL_REFRESH'); ?></button>
	<button class="uk-button confirm" id="insert"><?php echo Text::_('WF_LABEL_INSERT'); ?></button>
</div>
