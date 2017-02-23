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
  <div class="row-fluid">
    <div class="lhs">
  	   <div id="help-menu"><?php echo $this->model->renderTopics(); ?></div>
  	</div>
    <div id="help-menu-toggle">
      <div class="toggle-handle"><i class="icon-arrow-right"></i><i class="icon-arrow-left"></i></div>
      <div class="resize-handle"><i class="icon-menu"></i></div>
    </div>
    <div class="rhs">
      <div id="help-frame"><iframe id="help-iframe" src="javascript:;" scrolling="auto" frameborder="0"></iframe></div>
  	</div>
  </div>
</div>
