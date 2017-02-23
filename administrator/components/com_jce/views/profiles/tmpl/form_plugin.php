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

$count = 0;

foreach ($this->plugins as $name => $plugin) :

    if ($plugin->type === 'plugin') :
        $path = JPATH_SITE.$plugin->path;

        // only for editable plugins
        if ($plugin->editable) :

            jimport('joomla.filesystem.folder');
            jimport('joomla.filesystem.file');

            $params = new WFParameter($this->profile->params, $plugin->manifest, $name);

            // set element paths
            $params->addElementPath(array(
                WF_EDITOR.'/elements',
            ));

            // set plugin specific elements
            if (JFolder::exists($path.'/elements')) {
                $params->addElementPath($path.'/elements');
            }

            $class = in_array($plugin->name, explode(',', $this->profile->plugins)) ? 'tabs-plugin-parameters' : '';
            $groups = $params->getGroups();

            if (count($groups)) :
                $count++;
                ?>
                <div id="tabs-plugin-<?php echo $name; ?>" data-name="<?php echo $name; ?>" class="tab-pane <?php echo $class; ?>">
                    <h3><?php echo WFText::_($plugin->title); ?></h3>
                    <?php
                    // Draw parameters
                    foreach ($groups as $group) :
                        $data = $params->render('params['.$name.']', $group);
                        if (!empty($data)) :
                            echo '<div class="adminform panelform">';
                            echo '<h4>'.WFText::_('WF_PROFILES_PLUGINS_'.strtoupper($group)).'</h4>';
                            echo '<hr />';
                            echo $data;
                            echo '</div>';
                        endif;
                    endforeach;

                    $extensions = $this->model->getExtensions($plugin);

                    // Get extensions supported by this plugin
                    foreach ($extensions as $type => $items) :
                        $html = '';

                        // get extension type specific parameters
                        $file = WF_EDITOR_LIBRARIES.'/xml/config/'.$type.'.xml';

                        if (is_file($file)) {
                            $params = new WFParameter($this->profile->params, $file, $name.'.'.$type);

                            // add element paths
                            $params->addElementPath(array(
                                WF_EDITOR.'/elements',
                            ));

                            foreach ($params->getGroups() as $group) :
                                $html .= $params->render('params['.$name.']['.$type.']', $group);
                            endforeach;
                        }

                        foreach ($items as $extension) :
                            // get extension xml file
                            $manifest = $extension->manifest;

                            if (JFile::exists($manifest)) :
                                // get params for plugin
                                $key = $name.'.'.$extension->id;
                                $params = new WFParameter($this->profile->params, $manifest, $key);

                                // add element paths
                                $params->addElementPath(array(
                                    WF_EDITOR.'/elements',
                                ));

                                // render params
                                if (!$params->hasParent()) :
                                    // explode key to array
                                    $key = explode('.', $key);

                                    $enabled = (int) $params->get('enable', 1);
                                    $checked = $enabled ? ' checked="checked"' : '';

                                    $html .= '<h4><input type="checkbox" id="params'.implode('', $key).'enable" data-name="'.$extension->extension.'" name="params['.implode('][', $key).'][enable]" class="plugins-enable-checkbox" value="'.$enabled.'"'.$checked.' />'.WFText::_($extension->title).'</h4>';
                                    $html .= '<p>'.WFText::_($extension->description).'</p>';
                                    foreach ($params->getGroups() as $group) :
                                        $html .= $params->render('params['.implode('][', $key).']', $group, array('enable'));
                                    endforeach;
                                endif;
                            endif;
                        endforeach;

                        if ($html) :
                            echo '<div class="adminform panelform"><h3>'.WFText::_('WF_EXTENSIONS_'.strtoupper($type).'_TITLE').'</h3><hr />';
                            echo $html;
                            echo '</div>';
                        endif;
                    endforeach;
                    ?>
                </div>
                <?php
            endif;
        endif;
    endif;
endforeach;

if (!$count) {
    echo WFText::_('WF_PROFILES_NO_PLUGINS');
}
?>
