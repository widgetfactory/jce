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

wfimport('admin.classes.view');

class WFViewMediabox extends WFView
{
    public function getParams($data)
    {
        jimport('joomla.form.form');

        $xml = JPATH_PLUGINS.'/system/jcemediabox/jcemediabox.xml';

        if (class_exists('JForm')) {
            $control = 'config:fields:fieldset';
        } else {
            $control = 'params';
            $xml = JPATH_PLUGINS.'/system/jcemediabox.xml';
        }

        $params = new WFParameter($data, $xml, '', array('control' => $control));
        $params->addElementPath(JPATH_PLUGINS.'/system/jcemediabox/elements');

        $groups = array();
        $array = array();

        foreach ($params->getGroups() as $group) {
            $groups[] = $params->getParams('params', $group);
        }

        foreach ($groups as $group) {
            $array = array_merge($array, $group);
        }

        return $array;
    }

    public function display($tpl = null)
    {
        $db = JFactory::getDBO();

        $lang = JFactory::getLanguage();
        $lang->load('plg_system_jcemediabox');

        $client = JRequest::getWord('client', 'site');
        $model = $this->getModel();

        $plugin = JPluginHelper::getPlugin('system', 'jcemediabox');

        $params = $this->getParams($plugin->params);

        $this->assign('params', $params);
        $this->assign('client', $client);

        wfimport('admin.models.editor');

        $options = array(
            'stylesheets' => (array) WFModelEditor::getStyleSheets(),
            'labels' => array(
                'picker' => WFText::_('WF_COLORPICKER_PICKER'),
                'palette' => WFText::_('WF_COLORPICKER_PALETTE'),
                'named' => WFText::_('WF_COLORPICKER_NAMED'),
                'template' => WFText::_('WF_COLORPICKER_TEMPLATE'),
                'color' => WFText::_('WF_COLORPICKER_COLOR'),
                'apply' => WFText::_('WF_COLORPICKER_APPLY'),
                'name' => WFText::_('WF_COLORPICKER_NAME'),
            ),
            'parent' => '.ui-jce',
        );

        $this->addScriptDeclaration('jQuery(document).ready(function($){$("input.color").colorpicker('.json_encode($options).');});');

        WFToolbarHelper::apply();
        WFToolbarHelper::save();
        WFToolbarHelper::cancel();
        WFToolbarHelper::help('mediabox.config');

        parent::display($tpl);
    }
}
