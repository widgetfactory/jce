<?php

/**
 * @copyright     Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('_JEXEC') or die('RESTRICTED');
?>
<fieldset>
    <legend><?php echo WFText::_('WF_PROFILES_DETAILS'); ?></legend>
    <div class="control-group">
      <label for="profile_name" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_NAME').'::'.WFText::_('WF_PROFILES_NAME_DESC'); ?>">
          <?php echo WFText::_('WF_PROFILES_NAME'); ?>
      </label>
      <div class="controls">
        <input class="text_area required" type="text" name="name" id="profile_name" value="<?php echo $this->profile->name; ?>" />
      </div>
    </div>
        <div class="control-group">
            <label for="profile_description" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_DESCRIPTION').'::'.WFText::_('WF_PROFILES_DESCRIPTION_DESC'); ?>">
                <?php echo WFText::_('WF_PROFILES_DESCRIPTION'); ?>
            </label>
            <div class="controls">
              <input class="text_area" type="text" name="description" id="profile_description" value="<?php echo $this->profile->description; ?>" />
            </div>
        </div>
        <div class="control-group">
            <label for="profile_published" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_ENABLED').'::'.WFText::_('WF_PROFILES_ENABLED_DESC'); ?>">
                <?php echo WFText::_('WF_PROFILES_ENABLED'); ?>
            </label>
            <div class="controls">
              <?php echo $this->lists['published']; ?>
            </div>
        </div>
        <div class="control-group">
            <label for="ordering" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_ORDERING').'::'.WFText::_('WF_PROFILES_ORDERING_DESC'); ?>">
                <?php echo WFText::_('WF_PROFILES_ORDERING'); ?>
            </label>
            <div class="controls">
              <?php echo $this->lists['ordering']; ?>
            </div>
        </div>
</fieldset>
<fieldset>
    <legend><?php echo WFText::_('WF_PROFILES_ASSIGNMENT'); ?></legend>
        <div class="control-group">
            <label for="ordering" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_AREA').'::'.WFText::_('WF_PROFILES_AREA_DESC'); ?>">
                <?php echo WFText::_('WF_PROFILES_AREA'); ?>
            </label>
            <div class="controls">
              <?php echo $this->lists['area']; ?>
            </div>
        </div>
        <div class="control-group">
            <label for="ordering" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_DEVICE').'::'.WFText::_('WF_PROFILES_DEVICE_DESC'); ?>">
                <?php echo WFText::_('WF_PROFILES_DEVICE'); ?>
            </label>
            <div class="controls">
              <?php echo $this->lists['device']; ?>
            </div>
        </div>
        <div class="control-group">
            <label for="components" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_COMPONENTS').'::'.WFText::_('WF_PROFILES_COMPONENTS_DESC'); ?>">
                <?php echo WFText::_('WF_PROFILES_COMPONENTS'); ?>
            </label>
            <div class="controls">
              <?php echo $this->lists['components-select']; ?>
            </div>
            <div class="controls">
              <?php echo $this->lists['components']; ?>
              <input type="hidden" name="components[]" value="" />
            </div>
        </div>
        <div class="control-group">
            <label for="usergroups" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_GROUPS').'::'.WFText::_('WF_PROFILES_GROUPS_DESC'); ?>">
                <?php echo WFText::_('WF_PROFILES_GROUPS'); ?>
            </label>
            <div class="controls">
                <label class="checkbox"><input class="checkbox-list-toggle-all" type="checkbox" />&nbsp;<?php echo WFText::_('WF_PROFILES_TOGGLE_ALL'); ?></label>
            </div>
            <div class="controls">
              <?php echo $this->lists['usergroups']; ?>
            </div>
        </div>
        <div class="control-group">
            <label for="users" class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_USERS').'::'.WFText::_('WF_PROFILES_USERS_DESC'); ?>">
                <?php echo WFText::_('WF_PROFILES_USERS'); ?>
            </label>
            <div class="controls clearfix">
                <?php echo $this->lists['users']; ?>
            </div>
            <div class="controls clearfix">
                <div class="span4 text-right">
                    <a class="modal btn" id="users-add" rel="{'handler':'iframe','size':{x:760,y:540}}" title="<?php echo WFText::_('WF_PROFILES_USERS_ADD'); ?>" href="index.php?option=com_jce&tmpl=component&view=users">
                        <i class="icon-user"></i>&nbsp;<?php echo WFText::_('WF_PROFILES_USERS_ADD'); ?>
                    </a>
                </div>
            </div>
        </div>
</fieldset>
