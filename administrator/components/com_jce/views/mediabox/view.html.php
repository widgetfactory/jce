<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\View\HtmlView;
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
