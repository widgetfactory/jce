<?php
/**
 * @package     Wfx.JCE
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2023-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Controller\FormController;
use Joomla\CMS\Router\Route;

/**
 * Releases Main Controller
 *
 * @since  1.5
 */
class ConfigController extends FormController
{
	/**
	 * The default view.
	 *
	 * @var    string
	 * @since  1.6
	 */
	protected $default_view = 'config';

	/**
	 * The view list.
	 *
	 * @var    string
	 * @since  1.6
	 */
	protected $view_list = 'cpanel';

	protected function allowEdit($data = [], $key = 'id')
	{
		return $this->app->getIdentity()->authorise('jce.config', 'com_jce');
	}

	public function cancel($id = null)
	{
		$this->checkToken();

		// Redirect to the list screen.
        $this->setRedirect(Route::_('index.php?option=com_jce', false));

        return true;
	}
}
