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
use Joomla\CMS\Uri\Uri;

class JceViewConfig extends HtmlView
{
    public $form;

    public function display($tpl = null)
    {
        $document = Factory::getDocument();

        $this->form = $this->get('Form');

        $this->name = Text::_('WF_CONFIG');
        $this->fieldsname = "config";
        $this->formclass = 'form-horizontal options-grid-form options-grid-form-full';

        $params = ComponentHelper::getParams('com_jce');

        if ($params->get('inline_help', 1)) {
            $this->formclass .= ' form-help-inline';
        }

        $this->addToolbar();
        parent::display($tpl);

        $hash = md5(WF_VERSION);

        $document->addScript(Uri::root(true) . '/media/com_jce/editor/vendor/jquery/js/jquery-ui.min.js?' . $hash);
        $document->addScript(Uri::root(true) . '/media/com_jce/editor/vendor/jquery/js/jquery-ui.touch.min.js?' . $hash);

        $document->addScript(Uri::root(true) . '/media/com_jce/admin/js/core.min.js?' . $hash);
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
        ToolbarHelper::title('JCE - ' . Text::_('WF_CONFIGURATION'), 'equalizer');

        // If not checked out, can save the item.
        if ($user->authorise('jce.config', 'com_jce')) {
            ToolbarHelper::apply('config.apply');
            ToolbarHelper::save('config.save');
        }

        ToolbarHelper::cancel('config.cancel', 'JTOOLBAR_CLOSE');

        ToolbarHelper::divider();
        ToolbarHelper::help('WF_CONFIG_EDIT');
    }
}
