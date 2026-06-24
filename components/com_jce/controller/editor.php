<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

\defined('_JEXEC') or die;

// Load the admin controller — it handles all security internally
// (CSRF token, profile access check, task allowlist: loadlanguages, pack).
require_once JPATH_ADMINISTRATOR . '/components/com_jce/controller/editor.php';