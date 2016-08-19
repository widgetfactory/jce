<?php

/**
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
defined('_JEXEC') or die('RESTRICTED');
?>

<div class="ui-form-row">
  <label class="ui-form-label ui-width-2-10" for="list_type"><?php echo WFText::_('WF_STYLES_LIST_TYPE');?></label>
  <div class="ui-form-controls ui-width-4-10 ui-datalist">
    <select id="list_type" name="list_type"></select>
  </div>
</div>
<div class="ui-form-row">
  <label class="ui-form-label ui-width-2-10" for="list_position"><?php echo WFText::_('WF_STYLES_POSITION');?></label>
  <div class="ui-form-controls ui-width-4-10 ui-datalist">
    <select id="list_position" name="list_position"></select>
  </div>
</div>
<div class="ui-form-row">
  <label class="ui-form-label ui-width-2-10" for="list_bullet_image"><?php echo WFText::_('WF_STYLES_BULLET_IMAGE');?></label>
  <div class="ui-form-controls ui-width-8-10">
    <input id="list_bullet_image" name="list_bullet_image" type="text" class="browser image" />
  </div>
</div>
