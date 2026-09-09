<?php
/**
 * @package     com_jce
 * @subpackage  JCE Admin
 *
 * @copyright   Copyright (c) 2026-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Component\Jce\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\Access\Exception\NotAllowed;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\BaseController;

/**
 * Releases Main Controller
 *
 * @since  1.5
 */
class DisplayController extends BaseController
{
	/**
	 * Permission required to open each view, checked after the browser alias is resolved.
	 *
	 * Every screen is linked task-less as &view=x, which routes here rather than to the
	 * matching controller, so the view is what has to be gated - not the controller name.
	 * A null value means no jce.* permission of its own; core.manage has already run in
	 * the dispatcher for every view except filebrowser, which jce.browser grants on its
	 * own - see Dispatcher::isSelfAuthorising().
	 *
	 * The action is stated per view rather than derived from the view name: "profile"
	 * needs jce.profiles and "filebrowser" needs jce.browser, so a derived name would be
	 * wrong for two of the five.
	 *
	 * This mirrors JceController::ALLOWED_VIEWS in 2999.
	 *
	 * @var array
	 */
	private const ALLOWED_VIEWS = [
		'cpanel' => null,
		'config' => 'jce.config',
		'profiles' => 'jce.profiles',
		'profile' => 'jce.profiles',
		'mediabox' => 'jce.mediabox',
		'filebrowser' => 'jce.browser',
	];

	/**
	 * The default view.
	 *
	 * @var    string
	 * @since  1.6
	 */
	protected $default_view = 'cpanel';

	public function display($cachable = false, $urlparams = [])
    {
        $viewName = strtolower($this->input->getCmd('view', $this->default_view));

		// An empty value means "the default view"; Input::get() returns it rather than
		// falling back to the default above.
		if ($viewName === '') {
			$viewName = $this->default_view;
		}

		// "browser" is the legacy alias for the filebrowser view.
		if ($viewName === 'browser') {
			$viewName = 'filebrowser';
		}

		$this->input->set('view', $viewName);

		if (!\array_key_exists($viewName, self::ALLOWED_VIEWS)) {
			throw new NotAllowed(Text::_('JERROR_ALERTNOAUTHOR'), 403);
		}

		$action = self::ALLOWED_VIEWS[$viewName];

		if ($action !== null && !$this->app->getIdentity()->authorise($action, 'com_jce')) {
			throw new NotAllowed(Text::_('JERROR_ALERTNOAUTHOR'), 403);
		}

		parent::display($cachable, $urlparams);
	}
}
