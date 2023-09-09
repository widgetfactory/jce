<?php

use Joomla\CMS\Language\Text;

$plugins = $displayData->get('additional');

?>
<fieldset class="<?php echo !empty($displayData->formclass) ? $displayData->formclass : ''; ?>">
    <legend><?php echo Text::_('WF_PROFILES_FEATURES_ADDITIONAL'); ?></legend>
    <div class="control-group">
        <div class="control-label"></div>
        <div class="controls">
            <div class="editor-features">
                <?php foreach ($plugins as $plugin): ?>
                    <div class="control-group">
                        <label class="checkbox">
                            <input type="checkbox" value="<?php echo $plugin->name; ?>" <?php echo $plugin->active ? ' checked="checked"' : ''; ?>> <?php echo Text::_($plugin->title); ?>
                        </label>
                        <span class="help-block form-text text-muted w-100"><?php echo Text::_($plugin->description); ?></span>
                    </div>
                <?php endforeach;?>
            </div>
        </div>
    </div>
</fieldset>