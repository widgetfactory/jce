<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

 defined('JPATH_PLATFORM') or die;

 use Joomla\CMS\Client\ClientHelper;
 use Joomla\CMS\Factory;
 use Joomla\CMS\Filesystem\File;
 use Joomla\CMS\Filesystem\Folder;
 use Joomla\CMS\Language\Text;
 use Joomla\CMS\Uri\Uri;
 
defined('WF_EDITOR') or die('RESTRICTED');
?>
<div class="uk-position-cover uk-browser uk-browser-external">
	<?php $this->filebrowser->render(); ?>

	<input type="hidden" value="" class="filebrowser" data-filebrowser />
</div>
<div class="actionPanel uk-modal-footer">
	<button class="uk-button cancel" id="cancel"><?php echo Text::_('WF_LABEL_CANCEL')?></button>
	<button class="uk-button" id="refresh"><?php echo Text::_('WF_LABEL_REFRESH')?></button>
	<button class="uk-button confirm" id="insert"><?php echo Text::_('WF_LABEL_INSERT')?></button>
</div>
