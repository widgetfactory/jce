<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\View\Profile;

defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Language\Associations;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\View\GenericDataException;
use Joomla\CMS\MVC\View\HtmlView as BaseHtmlView;
use Joomla\CMS\Toolbar\ToolbarHelper;
use Joomla\CMS\Toolbar\Toolbar;
use Joomla\CMS\HTML\HTMLHelper;

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
	 * The active item
	 *
	 * @var  object
	 */
	protected $item;

	/**
	 * The model state
	 *
	 * @var  \Joomla\CMS\Object\CMSObject
	 */
	protected $state;

	/**
	 * Display the view.
	 *
	 * @param   string  $tpl  The name of the template file to parse; automatically searches through the template paths.
	 *
	 * @return  mixed  A string if successful, otherwise an Error object.
	 */
	public function display($tpl = null)
	{
		$model = $this->getModel();
	
		$this->state 	= $model->getState();
        $this->item 	= $model->getItem();
        $this->form 	= $model->getForm();

        $this->formclass = 'form-horizontal options-grid-form options-grid-form-full p-2';

        $params = ComponentHelper::getParams('com_jce');

        if ($params->get('inline_help', 1)) {
            $this->formclass .= ' form-help-inline';
        }

        $this->editorPlugins = $model->getPlugins();
        $this->rows = $model->getRows();
    	$this->available = $model->getAvailableButtons();
        $this->additional = $model->getAdditionalPlugins();

		// Check for errors.
		if (count($errors = $this->get('Errors')))
		{
			throw new GenericDataException(implode("\n", $errors), 500);
		}

        // load language files
        $language = Factory::getApplication()->getLanguage();
        $language->load('com_jce', JPATH_SITE);
        $language->load('com_jce_pro', JPATH_SITE);

        // set LayoutHelper base path
        LayoutHelper::$defaultBasePath = JPATH_ADMINISTRATOR . '/components/com_jce';

		$this->addToolbar();

		parent::display($tpl);
	}

	/**
	 * Add the page title and toolbar.
	 *
	 * @return  void
	 *
	 * @since   1.6
	 */
	protected function addToolbar()
	{
		$app = Factory::getApplication();
		$app->getInput()->set('hidemainmenu', true);

		$document = $this->getDocument();

        $toolbar = $document->getToolbar();

		$user = $app->getIdentity();

		// Since we don't track these assets at the item level, use the category id.
		$canEdit = $user->authorise('core.create', 'com_jce');

		ToolbarHelper::title(Text::_('WF_PROFILES_EDIT'), 'user');

		// For new records, check the create permission.
		if ($canEdit)
		{			
			$toolbar->apply('profile.apply');

			ToolbarHelper::saveGroup(
				[
					['save', 'profile.save'],
					['save2new', 'profile.save2new']
				],
				'btn-success'
			);
		}

		$toolbar->cancel('profile.cancel');
		$toolbar->divider();
		$toolbar->inlinehelp('hide-aware-inline-help');
	}
}
