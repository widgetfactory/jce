<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2009 - 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\View\Mediabox;

defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Helper\ContentHelper;
use Joomla\CMS\Language\Associations;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\View\GenericDataException;
use Joomla\CMS\MVC\View\HtmlView as BaseHtmlView;
use Joomla\CMS\Toolbar\ToolbarHelper;
use Joomla\CMS\Uri\Uri;

/**
 * View to edit a release.
 *
 * @since  1.5
 */
class HtmlView extends BaseHtmlView
{
    /**
     * The Form object
     *
     * @var  \Joomla\CMS\Form\Form
     */
    public $form;

    /**
     * Display the view.
     *
     * @param   string  $tpl  The name of the template file to parse; automatically searches through the template paths.
     *
     * @return  mixed  A string if successful, otherwise an Error object.
     */
    public function display($tpl = null)
    {
        $this->form = $this->get('Form');

        $this->name = Text::_('WF_MEDIABOX');
        $this->fieldsname = 'options';
        $this->formclass = 'options-form';

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
     * @return  void
     *
     * @since   3.2
     */
    protected function addToolbar()
    {
        ToolbarHelper::title('JCE - ' . Text::_('WF_MEDIABOX'), 'pictures');

		// If not checked out, can save the item.
        if (Factory::getApplication()->getIdentity()->authorise('jce.config', 'com_jce')) {
        	ToolbarHelper::apply('mediabox.apply');
        	ToolbarHelper::divider();
        	ToolbarHelper::save('mediabox.save');
        	ToolbarHelper::divider();
		}

        ToolbarHelper::cancel('mediabox.cancel', 'JTOOLBAR_CLOSE');
        ToolbarHelper::divider();
		ToolbarHelper::help('WF_MEDIABOX_EDIT');
    }
}
