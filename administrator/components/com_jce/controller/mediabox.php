<?php

/**
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
defined('JPATH_PLATFORM') or die;

class JceControllerMediabox extends JControllerForm
{
    public function __construct($config = array())
	{
		parent::__construct($config);
		// return to control panel on cancel/close
		$this->view_list = 'cpanel';
	}

	public function save($key = null, $urlVar = null)
	{
		JSession::checkToken() or jexit(JText::_('JINVALID_TOKEN'));

		$data = $this->input->get('jform', array(), 'array');
		$user = JFactory::getUser();

		// Check if the user is authorised to do this.
		if (!$user->authorise('core.admin', 'com_jce')) {
			$this->app->enqueueMessage(JText::_('JERROR_ALERTNOAUTHOR'), 'error');
			$this->app->redirect('index.php?option=com_jce');
		}

		$model = $this->getModel();

        // Validate the posted data.
		// Sometimes the form needs some posted data, such as for plugins and modules.
		$form = $model->getForm($data, false);

		if (!$form) {
			$app->enqueueMessage($model->getError(), 'error');

			return false;
		}

		$validData = $model->validate($form, $data);

		if ($validData === false) {
            // Get the validation messages.
			$errors = $model->getErrors();

			// Push up to three validation messages out to the user.
			for ($i = 0, $n = count($errors); $i < $n && $i < 3; $i++) {
				if ($errors[$i] instanceof \Exception) {
					$app->enqueueMessage($errors[$i]->getMessage(), 'warning');
				} else {
					$app->enqueueMessage($errors[$i], 'warning');
				}
			}

			$this->app->redirect('index.php?option=com_jce&view=mediabox');
		}

		try {
			$model->save($data);
		} catch (RuntimeException $e) {
			// Save failed, go back to the screen and display a notice.
			$this->app->enqueueMessage(JText::sprintf('JERROR_SAVE_FAILED', $e->getMessage()), 'error');
			$this->app->redirect(JRoute::_('index.php?option=com_jce&view=mediabox', false));
		}

		$this->setMessage(JText::_($prefix . ($recordId === 0 && $app->isClient('site') ? '_SUBMIT' : '') . '_SAVE_SUCCESS'));

		switch ($this->getTask()) {
			case 'apply':
				$this->app->redirect('index.php?option=com_jce&view=mediabox');
				break;
			case 'save':
				$this->app->redirect('index.php?option=com_jce');
				break;
		}

        // Invoke the postSave method to allow for the child class to access the model.
		$this->postSaveHook($model, $validData);

		return true;
	}
}
