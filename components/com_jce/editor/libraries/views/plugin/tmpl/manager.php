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

use Joomla\CMS\Language\Text;
?>
<div class="uk-position-cover uk-browser uk-browser-<?php echo $this->filebrowser->get('position'); ?>">
<?php
// render tabs and panels
WFTabs::getInstance()->render();

if ($this->filebrowser->get('position') !== 'external') {
    $this->filebrowser->render();
}
?>
</div>
<div class="actionPanel uk-modal-footer">
    <button class="uk-button uk-button-cancel" id="cancel"><?php echo Text::_('WF_LABEL_CANCEL') ?></button>
    <button class="uk-button uk-button-refresh" id="refresh"><?php echo Text::_('WF_LABEL_REFRESH') ?></button>
    <button class="uk-button uk-button-confirm" id="insert"><?php echo Text::_('WF_LABEL_INSERT') ?></button>
</div>
