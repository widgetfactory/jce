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

// load constants
require_once __DIR__ . '/constants.php';

// Core namespace
\JLoader::registerNamespace('Wfe', JPATH_PLUGINS . '/editors/jce/Wfe', false, false, 'psr4');

// Defuse
JLoader::registerNamespace('Defuse\\Crypto', WF_ADMINISTRATOR . '/vendor/Defuse/Crypto', false, false, 'psr4');

// CssMin
JLoader::registerNamespace('tubalmartin\CssMin', WF_EDITOR . '/vendor/cssmin/src', false, false, 'psr4');

JLoader::registerAlias('WFApplication', 'Wfe\\Compat\\WFApplication');
JLoader::registerAlias('WFFileSystem', 'Wfe\\Compat\\WFFileSystem');
JLoader::registerAlias('WFEditorPlugin', 'Wfe\\Compat\\WFEditorPlugin');
JLoader::registerAlias('WFText', 'Wfe\\Language\\Text');
JLoader::registerAlias('WFRequest', 'Wfe\\Http\\Request');
JLoader::registerAlias('WFFileBrowser', 'Wfe\\Plugins\\Editor\\Browser\\Plugin');
JLoader::registerAlias('WFUtility', 'Wfe\\Utility\\Utility');
JLoader::registerAlias('WFFileSystemResult', 'Wfe\\Adapter\\Plugin\\Filesystem\\FilesystemResult');
JLoader::registerAlias('WFJoomlaFileSystem', 'Wfe\\Compat\\WFJoomlaFileSystem');
