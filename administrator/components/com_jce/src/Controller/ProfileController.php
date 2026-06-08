<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2023 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\MVC\Controller\FormController;
use Joomla\CMS\MVC\Model\BaseDatabaseModel;
use Joomla\CMS\Router\Route;
use Joomla\CMS\Versioning\VersionableControllerTrait;

/**
 * Profile controller class.
 *
 * @since  1.6
 */
class ProfileController extends FormController
{
	use VersionableControllerTrait;

	/**
	 * The default view.
	 *
	 * @var    string
	 * @since  1.6
	 */
	protected $view_list = 'profiles';

	/**
	 * Method to run batch operations.
	 *
	 * @param   object  $model  The model.
	 *
	 * @return  boolean   True if successful, false otherwise and internal error is set.
	 *
	 * @since   1.7
	 */
	public function batch($model = null)
	{
		$this->checkToken();

		// Set the model
		$model = $this->getModel('Profile', 'Administrator', array());

		// Preset the redirect
		$this->setRedirect(Route::_('index.php?option=com_jce&view=profiles' . $this->getRedirectToListAppend(), false));

		return parent::batch($model);
	}

	/**
	 * Function that allows child controller access to model data after the data has been saved.
	 *
	 * @param   \Joomla\CMS\MVC\Model\BaseDatabaseModel  $model      The data model object.
	 * @param   array                                    $validData  The validated data.
	 *
	 * @return  void
	 *
	 * @since   1.6
	 */
	protected function postSaveHook(BaseDatabaseModel $model, $validData = array())
	{
		$task = $this->getTask();

		if ($task == 'save') {
			$this->setRedirect(Route::_('index.php?option=com_jce&view=profiles', false));
		}
	}

    protected function allowAdd($data = [])
    {
        return $this->app->getIdentity()->authorise('jce.profiles', 'com_jce');
    }

    protected function allowEdit($data = [], $key = 'id')
    {
        return $this->app->getIdentity()->authorise('jce.profiles', 'com_jce');
    }
}
