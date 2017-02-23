<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');

?>
<div class="ui-jce">
  <form action="index.php" method="post" name="adminForm" id="adminForm" class="form-horizontal">
    <fieldset class="adminform panelform">
  	   <legend><?php echo JText :: _('WF_MEDIABOX_PARAMETERS'); ?></legend>
      <?php foreach ($this->params as $param): ?>
        <div class="control-group">
          <?php echo $param['label'].$param['element']; ?>
        </div>
      <?php endforeach; ?>
    </fieldset>  
    <input type="hidden" name="option" value="com_jce" />
    <input type="hidden" name="client" value="<?php echo $this->client; ?>" />
    <input type="hidden" name="view" value="mediabox" />
    <input type="hidden" name="task" value="" />
    <?php echo JHTML::_('form.token'); ?>
  </form>
</div>
