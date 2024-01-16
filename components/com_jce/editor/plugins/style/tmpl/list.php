<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Language\Text;
?>

<div class="uk-form-row uk-grid uk-grid-small">
  <label class="uk-form-label uk-width-2-10" for="list_type"><?php echo Text::_('WF_STYLES_LIST_TYPE'); ?></label>
  <div class="uk-form-controls uk-width-4-10">
    <select id="list_type" name="list_type"></select>
  </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
  <label class="uk-form-label uk-width-2-10" for="list_position"><?php echo Text::_('WF_STYLES_POSITION'); ?></label>
  <div class="uk-form-controls uk-width-4-10">
    <select id="list_position" name="list_position"></select>
  </div>
</div>
<div class="uk-form-row uk-grid uk-grid-small">
  <label class="uk-form-label uk-width-2-10" for="list_bullet_image"><?php echo Text::_('WF_STYLES_BULLET_IMAGE'); ?></label>
  <div class="uk-form-controls uk-width-8-10">
    <input id="list_bullet_image" name="list_bullet_image" type="text" class="browser image" />
  </div>
</div>
