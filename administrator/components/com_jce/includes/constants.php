<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('_JEXEC') or die;

use Joomla\CMS\Uri\Uri;

// Some shortcuts to make life easier
define('WF_VERSION', '@@version@@');

// JCE Administration Component
define('WF_ADMINISTRATOR', JPATH_ADMINISTRATOR . '/components/com_jce');

// JCE Site Component
define('WF_SITE', JPATH_SITE . '/components/com_jce');

// JCE Plugin
define('WF_PLUGIN', JPATH_SITE . '/plugins/editors/jce/Wfe');

// JCE Editor
define('WF_EDITOR', WF_PLUGIN);

// JCE Editor Media
define('WF_EDITOR_MEDIA', JPATH_SITE . '/media/plg_editors_jce');

// JCE Plugin
define('WF_PLUGINS', WF_EDITOR . '/Plugins');

// JCE Editor Plugins
define('WF_EDITOR_PLUGINS', WF_PLUGINS . '/Editor');

// JCE Editor Themes
define('WF_EDITOR_THEMES', WF_EDITOR_MEDIA . '/ibis/themes');

define('WF_EDITOR_URI', Uri::root(true) . '/media/plg_editors_jce/wfe');

define('_WF_EXT', true);