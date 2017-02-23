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

wfimport('admin.classes.controller');
wfimport('admin.classes.error');
wfimport('admin.helpers.xml');
wfimport('admin.helpers.extension');

class WFControllerEditor extends WFControllerBase
{
    public function execute($task)
    {
        // Load language
        $language = JFactory::getLanguage();
        $language->load('com_jce', JPATH_ADMINISTRATOR);

        $plugin = JRequest::getCmd('plugin');

        if ($plugin) {
            if (strpos($plugin, '.') !== false) {
                $parts = explode('.', $plugin);
                $plugin = $parts[0];
            }

            $path = WF_EDITOR_PLUGINS.'/'.$plugin;

            if (strpos($plugin, 'editor-') !== false) {
                $path = JPATH_PLUGINS.'/jce/'.$plugin;
            }

            if (is_dir($path) && file_exists($path.'/'.$plugin.'.php')) {
                include_once $path.'/'.$plugin.'.php';
            } else {
                throw new InvalidArgumentException('File "'.$plugin.'" not found!');
            }
        } else {
            if ($task == 'pack' || $task == 'loadlanguages' || $task == 'compileless') {
                wfimport('admin.models.editor');
                $model = new WFModelEditor();

                switch ($task) {
                    case 'loadlanguages':
                        $model->loadLanguages();
                        break;
                    case 'pack':
                        $model->pack();
                        break;
                    case 'compileless':
                        $model->compileLess();
                        break;
                }

                exit();
            }
        }

        throw new InvalidArgumentException('Invalid URL parameters');
    }
}
