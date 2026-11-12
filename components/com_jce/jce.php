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
use Joomla\CMS\Language\Language;
use Joomla\CMS\Language\LanguageFactoryInterface;
use Joomla\CMS\Language\LanguageHelper;
use Joomla\CMS\MVC\Controller\BaseController;

$app = Factory::getApplication();

// The task value should only ever be a string
if (!is_string($app->input->get('task', '', 'raw'))) {
    throw new \Exception('Restricted', 403);
}

// the cmd filter does not lowercase, so normalise before matching
$task = strtolower($app->input->getCmd('task', ''));

$ctrl = strpos($task, '.') !== false ? strstr($task, '.', true) : '';

// Hard allowlist: runs before MVC dispatch, independent of class loading and
// file discovery. Only plugin and editor may be reached from the frontend.
// Any other controller name — including an empty task — returns 403 here.
if (!in_array($ctrl, ['plugin', 'editor'], true)) {
    throw new \Exception('Restricted', 403);
}

// constants and autoload — only reached for permitted controllers
require_once JPATH_ADMINISTRATOR . '/components/com_jce/includes/base.php';

// write the normalised task back so the dispatch below resolves the controller that
// was actually gated, not the raw mixed-case value
$app->input->set('task', $task);

// editor requests have no language prefix, so the Language Filter runs them in the default language
$wfLang = $app->input->getCmd('wf_lang', '');

if (preg_match('/^[a-z]{2,3}-[A-Z]{2}$/', $wfLang) && $wfLang !== $app->getLanguage()->getTag() && LanguageHelper::exists($wfLang, JPATH_SITE)) {
    $debug = (bool) $app->get('debug_lang');

    if (interface_exists(LanguageFactoryInterface::class)) {
        $language = Factory::getContainer()->get(LanguageFactoryInterface::class)->createLanguage($wfLang, $debug);
    } else {
        $language = Language::getInstance($wfLang, $debug);
    }

    $app->loadLanguage($language);
    Factory::$language = $language;

    $language->load('com_jce', JPATH_BASE) || $language->load('com_jce', JPATH_COMPONENT);
}

// Dispatch using the frontend controller path only.
// The controller stubs in controller/ load the admin classes, which carry
// their own independent security (CSRF token, profile check, task allowlist).
// The fallback JceController handles anything that slips past the above gate.
$controller = BaseController::getInstance('Jce', ['base_path' => JPATH_COMPONENT]);

// Re-read the task rather than reusing the $task captured above: getInstance() rewrites
// the input to the bare task, and the controllers expect that form, not "controller.task".
$controller->execute($app->input->getCmd('task'));
$controller->redirect();
