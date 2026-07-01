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

use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Router\Route;

/**
 * Releases Main Controller
 *
 * @since  1.5
 */
class FilebrowserController extends BaseController
{
	/**
	 * The default view.
	 *
	 * @var    string
	 * @since  1.6
	 */
	protected $default_view = 'filebrowser';

	public function display($cachable = false, $urlparams = [])
	{
		if (!$this->app->getIdentity()->authorise('jce.browser', 'com_jce')) {
			throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
		}

		parent::display($cachable, $urlparams);
	}

	public function cancel()
	{
		// Redirect to the list screen.
        $this->setRedirect(Route::_('index.php?option=com_jce', false));

        return true;
	}
}
