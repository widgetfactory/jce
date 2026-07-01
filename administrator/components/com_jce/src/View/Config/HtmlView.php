<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\View\Config;

defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\View\HtmlView as BaseHtmlView;
use Joomla\CMS\Toolbar\Toolbar;
use Joomla\CMS\Toolbar\ToolbarFactoryInterface;
use Joomla\CMS\Toolbar\ToolbarHelper;

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

        $this->name = Text::_('WF_CONFIG');
        $this->fieldsname = 'config';
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
     * @return  void
     *
     * @since   3.2
     */
    protected function addToolbar()
    {
        $document = $this->getDocument();

        if (method_exists($document, 'getToolbar')) {
            $toolbar = $document->getToolbar();
        } else {
            $toolbar = Toolbar::getInstance('toolbar');
        }

        ToolbarHelper::title('JCE - ' . Text::_('WF_CONFIGURATION'), 'cog config');

        // If not checked out, can save the item.
        if (Factory::getApplication()->getIdentity()->authorise('jce.config', 'com_jce')) {
            $toolbar->apply('config.apply');
            $toolbar->divider();
            $toolbar->save('config.save');
            $toolbar->divider();
        }

        $toolbar->cancel('config.cancel', 'JTOOLBAR_CLOSE');
        $toolbar->divider();
        $toolbar->inlinehelp('hide-aware-inline-help');
        $toolbar->help('WF_CONFIG_EDIT');
    }
}
