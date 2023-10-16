<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Uri\Uri;

// Some shortcuts to make life easier
define('WF_VERSION', '@@version@@');

// JCE Administration Component
define('WF_ADMINISTRATOR', JPATH_ADMINISTRATOR . '/components/com_jce');

// JCE Site Component
define('WF_SITE', JPATH_SITE . '/components/com_jce');

// JCE Plugin
define('WF_PLUGIN', JPATH_SITE . '/plugins/editors/jce');

// JCE Editor
define('WF_EDITOR', WF_SITE . '/editor');

// JCE Editor Media
define('WF_EDITOR_MEDIA', JPATH_SITE . '/media/com_jce/editor');

// JCE Editor Plugins
define('WF_EDITOR_PLUGINS', WF_EDITOR . '/plugins');

// JCE Editor Pro Plugins
define('WF_EDITOR_PRO_PLUGINS', JPATH_PLUGINS . '/system/jcepro/src/editor/plugins');

// JCE Editor Pro Media
define('WF_EDITOR_PRO_MEDIA', JPATH_SITE . '/media/plg_system_jcepro/editor');

// JCE Editor Pro Libraries
define('WF_EDITOR_PRO_LIBRARIES', JPATH_PLUGINS . '/system/jcepro/src/editor');

// JCE Editor Pro Classes
define('WF_EDITOR_PRO_CLASSES', WF_EDITOR_PRO_LIBRARIES . '/classes');

// JCE Editor Themes
define('WF_EDITOR_THEMES', WF_EDITOR_MEDIA . '/tinymce/themes');

// JCE Editor Libraries
define('WF_EDITOR_LIBRARIES', WF_EDITOR . '/libraries');

// JCE Editor Classes
define('WF_EDITOR_CLASSES', WF_EDITOR_LIBRARIES . '/classes');

// JCE Editor Extensions
define('WF_EDITOR_EXTENSIONS', WF_EDITOR . '/extensions');

define('WF_EDITOR_URI', Uri::root(true) . '/components/com_jce/editor');

// required for some legacy plugins
defined('DS') or define('DS', DIRECTORY_SEPARATOR);

// legacy plugin support
define('_WF_EXT', 1);
