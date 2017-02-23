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

$position = 'mce'.ucfirst($this->profile->layout_params->get('toolbar_align', 'left'));

// width and height
$width = $this->profile->layout_params->get('width');
$height = $this->profile->layout_params->get('height');

if (!empty($width)) {
    if (is_numeric($width) || strpos('%', $width) === false) {
        $width .= 'px';
    }

    if (strpos('%', $width) !== false) {
        $height = 600;
    }
} else {
    $width = '100%';
}

if (!empty($height)) {
    if (is_numeric($height) || strpos('%', $height) === false) {
        $height .= 'px';
    }

    if (strpos('%', $height) !== false) {
        $height = 'auto';
    }
}

$theme = $this->profile->layout_params->get('toolbar_theme', 'default');
if (strpos($theme, '.') === false) {
    $theme = $theme.'Skin';
} else {
    $theme = str_replace(array('o2k7.silver', 'o2k7.black'), array('o2k7.Silver', 'o2k7.Black'), $theme);
    $theme = preg_replace('#([\w]+)\.([\w]+)#', '$1Skin $1Skin$2', $theme);
}
?>
<fieldset class="first">
    <legend><?php echo WFText::_('WF_PROFILES_FEATURES_LAYOUT'); ?></legend>
    <!-- Layout Params -->
    <div id="layout_params">
        <?php foreach ($this->profile->layout_groups as $group) : ?>
            <div id="tabs-editor-<?php echo $group ?>">
            <?php echo $this->profile->layout_params->render('params[editor]', $group); ?>
            </div>
        <?php endforeach; ?>
    </div>

    <div class="adminformlist" id="profileLayoutTable">
        <!-- Active Editor Layout -->
        <div class="controls-group">
            <label class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_FEATURES_LAYOUT_EDITOR').'::'.WFText::_('WF_PROFILES_FEATURES_LAYOUT_EDITOR_DESC'); ?>"><?php echo WFText::_('WF_PROFILES_FEATURES_LAYOUT_EDITOR'); ?></label>

            <div class="profileLayoutContainer profileLayoutContainerCurrent">
              <div class="mceEditor defaultSkin <?php echo $theme; ?>" role="application">

                <span id="editor_toggle"></span>
                <span class="widthMarker"><span><?php echo $width; ?></span></span>

                <div class="mceLayout" role="presentation" style="max-width:<?php echo $width; ?>">
                    <div role="toolbar" class="sortableList mceToolbar <?php echo $position; ?> mceFirst">
                          <?php for ($i = 1; $i <= count($this->rows); ++$i) : ?>
                              <div class="sortableListItem">
                                <div class="sortableRow mceToolbarRow mceToolbarRow<?php echo $i; ?> Enabled" role="toolbar" tabindex="-1">
                                  <?php for ($x = 1; $x <= count($this->rows); ++$x) : ?>
                                      <?php if ($i == $x) : ?>
                                          <?php foreach (explode(',', $this->rows[$x]) as $icon) : ?>
                                              <?php if ($icon == 'spacer') : ?>
                                                  <div class="mceToolBarItem sortableRowItem spacer" data-name="spacer"><div class="mceSeparator"></div></div>
                                              <?php endif;
                                              foreach ($this->plugins as $name => $plugin) :
                                                  if ($plugin->icon && $name == $icon) : ?>
                                                      <div data-name="<?php echo $name; ?>" class="mceToolBarItem sortableRowItem <?php echo $plugin->type; ?> wf-tooltip wf-tooltip-cancel-ondrag" title="<?php echo WFText::_($plugin->title); ?>::<?php echo WFText::_($plugin->description); ?>"><?php echo $this->model->getIcon($plugin); ?></div>
                                                  <?php
                                                  endif;
                                              endforeach;
                                          endforeach;
                                      endif;
                                  endfor;
                                  ?>
                                </div>
                                <div class="sortableRowHandle"><span class="icon-menu"></span></div>
                                <div class="sortableOption" role="button"><span class="icon-trash"></span><span class="icon-plus-2"></span></div>
                            </div>
                          <?php endfor; ?>
                    </div>
                    <!--  Editor -->
                    <div id="editor_container" class="profileLayoutContainerEditor mceIframeContainer" style="height:<?php echo $height; ?>">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </div>

                    <div class="mceStatusbar mceLast">
                        <div tabindex="-1" style="display: block;" class="mcePathRow" role="group" >
                          <span class="mcePathLabel">Path: </span>
                          <span class="mcePathPath"><a tabindex="-1" class="mcePath_0" onmousedown="return false;" role="button" href="javascript:;">p</a></span></div>
                          <a tabindex="-1" class="mceResize" onclick="return false;" href="javascript:;"></a>
                        <div style="float: right; display: block;">Words: <span>69</span></div>
                    </div>
                </div>
            </div>
          </div>
        </div>
        <!-- Available Buttons -->
        <div class="controls-group">
            <label class="control-label wf-tooltip" title="<?php echo WFText::_('WF_PROFILES_FEATURES_LAYOUT_AVAILABLE').'::'.WFText::_('WF_PROFILES_FEATURES_LAYOUT_AVAILABLE_DESC'); ?>"><?php echo WFText::_('WF_PROFILES_FEATURES_LAYOUT_AVAILABLE'); ?></label>
            <div class="profileLayoutContainer profileLayoutContainerToolbar">
                <div class="mceEditor defaultSkin <?php echo $theme; ?>" role="application">

                  <div class="mceLayout" role="presentation">
                    <div role="toolbar" class="sortableList mceToolbar <?php echo $position; ?> mceFirst mceLast">
                          <?php for ($i = 1; $i <= 5; ++$i) :?>
                              <div class="sortableListItem">
                              <div class="sortableRow mceToolbarRow mceToolbarRow<?php echo $i; ?> Enabled" role="toolbar" tabindex="-1">
                                <?php foreach ($this->plugins as $name => $plugin) :
                                    if (!in_array($name, explode(',', implode(',', $this->rows)))) :
                                        if ($plugin->icon && (int) $plugin->row == $i) :
                                            echo '<div class="mceToolBarItem sortableRowItem '.$plugin->type.' wf-tooltip wf-tooltip-cancel-ondrag" data-name="'.$name.'" title="'.WFText::_($plugin->title).'::'.WFText::_($plugin->description).'">'.$this->model->getIcon($plugin).'</div>';
                                        endif;
                                    endif;
                                endforeach;
                                ?>
                              </div>
                              <div class="sortableRowHandle"><span class="icon-menu"></span></div>
                              <div class="sortableOption" role="button"><span class="icon-trash"></span><span class="icon-plus-2"></span></div>
                            </div>
                          <?php endfor; ?>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    </div>
    <input type="hidden" name="rows" value="<?php echo $this->profile->rows; ?>" />
    <input type="hidden" name="plugins" value="<?php echo $this->profile->plugins; ?>" />
</fieldset>
<fieldset>
    <legend><?php echo WFText::_('WF_PROFILES_FEATURES_ADDITIONAL'); ?></legend>
    <div id="profileAdditionalFeatures" class="adminformlist">
        <?php
        $i = 0;
        foreach ($this->plugins as $name => $plugin) :
            if (!$plugin->icon) :
                if ($plugin->editable) :
                    ?>
                    <div class="control-group editable">
                        <label class="control-label"><?php echo WFText::_($plugin->title); ?></label>
                        <div class="controls">
                          <label class="checkbox">
                            <input type="checkbox" value="<?php echo $name; ?>" <?php echo in_array($name, explode(',', $this->profile->plugins)) ? 'checked="checked"' : ''; ?>/>
                            <?php echo WFText::_('WF_'.strtoupper($name).'_DESC'); ?>
                          </label>
                        </div>
                    </div>
                <?php else : ?>
                    <div class="control-group">
                        <label class="control-label"><?php echo WFText::_($plugin->title); ?></label>
                        <div class="controls">
                          <label class="checkbox">
                            <input type="checkbox" value="<?php echo $name; ?>" <?php echo in_array($name, explode(',', $this->profile->plugins)) ? 'checked="checked"' : ''; ?>/>
                            <?php echo WFText::_('WF_'.strtoupper($name).'_DESC'); ?>
                          </label>
                        </div>
                    </div>
                <?php
                endif;
            endif;
            ++$i;
        endforeach;
        ?>
    </div>
</fieldset>
