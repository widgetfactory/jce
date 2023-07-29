<?php

/**
 * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\MVC\View\HtmlView;
use Joomla\CMS\Factory;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Toolbar\ToolbarHelper;

class JceViewMediabox extends HtmlView
{
    public $form;
    public $data;

    public function display($tpl = null)
    {
        $document = Factory::getDocument();

        $form = $this->get('Form');
        $data = $this->get('Data');

        // Bind the form to the data.
        if ($form && $data) {
            $form->bind($data);
        }

        $this->form = $form;
        $this->data = $data;

        $this->name = Text::_('WF_MEDIABOX');
        $this->fieldsname = "";
        $this->formclass = 'form-horizontal options-grid-form options-grid-form-full';

        $params = ComponentHelper::getParams('com_jce');

        if ($params->get('inline_help', 1)) {
            $this->formclass .= ' form-help-inline';
        }

        $this->addToolbar();
        parent::display($tpl);
    }

    /**
     * Add the page title and toolbar.
     *
     * @since   3.0
     */
    protected function addToolbar()
    {
        Factory::getApplication()->input->set('hidemainmenu', true);

        $user = Factory::getUser();
        ToolbarHelper::title(Text::_('WF_MEDIABOX'), 'pictures');

        // If not checked out, can save the item.
        if ($user->authorise('jce.config', 'com_jce')) {
            ToolbarHelper::apply('mediabox.apply');
            ToolbarHelper::save('mediabox.save');
        }

        ToolbarHelper::cancel('mediabox.cancel', 'JTOOLBAR_CLOSE');

        ToolbarHelper::divider();
        ToolbarHelper::help('WF_MEDIABOX_EDIT');
    }
}
