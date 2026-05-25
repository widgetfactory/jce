<?php
/**
 * @package     com_jce
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (C) 2026 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\MVC\Controller\BaseController;

/**
 * Releases Main Controller
 *
 * @since  1.5
 */
class DisplayController extends BaseController
{
	/**
	 * The default view.
	 *
	 * @var    string
	 * @since  1.6
	 */
	protected $default_view = 'cpanel';

	public function display($cachable = false, $urlparams = [])
    {
        $viewName = $this->input->get('view');

		if ($viewName == 'browser') {
			$this->input->set('view', 'filebrowser');
		}

		parent::display($cachable, $urlparams);
	}
}