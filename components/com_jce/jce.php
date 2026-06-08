<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Controller\BaseController;

$app = Factory::getApplication();

$task = $app->input->getCmd('task', '');
$ctrl = strpos($task, '.') !== false ? strstr($task, '.', true) : '';

// Hard allowlist: runs before MVC dispatch, independent of class loading and
// file discovery. Only plugin and editor may be reached from the frontend.
// Any other controller name — including an empty task — returns 403 here.
if (!in_array($ctrl, ['plugin', 'editor'], true)) {
    throw new \Exception('Restricted', 403);
}

// constants and autoload — only reached for permitted controllers
require_once JPATH_ADMINISTRATOR . '/components/com_jce/includes/base.php';

// Dispatch using the frontend controller path only.
// The controller stubs in controller/ load the admin classes, which carry
// their own independent security (CSRF token, profile check, task allowlist).
// The fallback JceController handles anything that slips past the above gate.
$controller = BaseController::getInstance('Jce', ['base_path' => JPATH_COMPONENT]);
$controller->execute($task);
$controller->redirect();
