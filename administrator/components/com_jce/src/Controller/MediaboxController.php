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

use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\FormController;
use Joomla\CMS\Router\Route;

/**
 * Releases Main Controller
 *
 * @since  1.5
 */
class MediaboxController extends FormController
{
	/**
	 * The default view.
	 *
	 * @var    string
	 * @since  1.6
	 */
	protected $default_view = 'mediabox';

	/**
	 * The view to redirect to after save.
	 *
	 * @var    string
	 * @since  1.6
	 */
	protected $view_list = 'cpanel';

	public function display($cachable = false, $urlparams = [])
	{
		if (!$this->app->getIdentity()->authorise('jce.mediabox', 'com_jce')) {
			throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
		}

		parent::display($cachable, $urlparams);
	}

	protected function allowAdd($data = [])
	{
		return $this->app->getIdentity()->authorise('jce.config', 'com_jce');
	}

	protected function allowEdit($data = [], $key = 'id')
	{
		return $this->app->getIdentity()->authorise('jce.config', 'com_jce');
	}

	public function cancel($id = null)
	{
		$this->checkToken();
		$this->setRedirect(Route::_('index.php?option=com_jce', false));

		return true;
	}
}
