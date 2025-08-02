<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
\defined('_JEXEC') or die;

// load constants
require_once __DIR__ . '/constants.php';

// register classes
JLoader::register('WFApplication', WF_EDITOR_CLASSES . '/application.php');
JLoader::register('WFEditor', WF_EDITOR_CLASSES . '/editor.php');
JLoader::register('WFEditorPlugin', WF_EDITOR_CLASSES . '/plugin.php');

JLoader::register('WFLanguage', WF_EDITOR_CLASSES . '/language.php');
JLoader::register('WFUtility', WF_EDITOR_CLASSES . '/utility.php');
JLoader::register('WFMimeType', WF_EDITOR_CLASSES . '/mime.php');

JLoader::register('WFDocument', WF_EDITOR_CLASSES . '/document.php');
JLoader::register('WFTabs', WF_EDITOR_CLASSES . '/tabs.php');
JLoader::register('WFView', WF_EDITOR_CLASSES . '/view.php');

JLoader::register('WFRequest', WF_EDITOR_CLASSES . '/request.php');
JLoader::register('WFResponse', WF_EDITOR_CLASSES . '/response.php');

JLoader::register('WFLanguageParser', WF_EDITOR_CLASSES . '/languageparser.php');
JLoader::register('WFPacker', WF_EDITOR_CLASSES . '/packer.php');

JLoader::register('WFExtension', WF_EDITOR_CLASSES . '/extensions.php');
JLoader::register('WFFileSystem', WF_EDITOR_CLASSES . '/extensions/filesystem.php');
JLoader::register('WFLinkExtension', WF_EDITOR_CLASSES . '/extensions/link.php');
JLoader::register('WFAggregatorExtension', WF_EDITOR_CLASSES . '/extensions/aggregator.php');
JLoader::register('WFMediaPlayerExtension', WF_EDITOR_CLASSES . '/extensions/mediaplayer.php');
JLoader::register('WFPopupsExtension', WF_EDITOR_CLASSES . '/extensions/popups.php');
JLoader::register('WFSearchExtension', WF_EDITOR_CLASSES . '/extensions/search.php');

JLoader::register('WFMediaManagerBase', WF_EDITOR_CLASSES . '/manager/base.php');
JLoader::register('WFMediaManager', WF_EDITOR_CLASSES . '/manager.php');
JLoader::register('WFFileBrowser', WF_EDITOR_CLASSES . '/browser.php');
//JLoader::register('Wf_Mobile_Detect', WF_EDITOR_CLASSES . '/mobile.php');

JLoader::register('JcePluginsHelper', WF_ADMINISTRATOR . '/helpers/plugins.php');
JLoader::register('JceEncryptHelper', WF_ADMINISTRATOR . '/helpers/encrypt.php');

JLoader::register('WFLinkHelper', WF_EDITOR_CLASSES . '/linkhelper.php');

// Defuse
JLoader::registerNamespace('Defuse\\Crypto', WF_ADMINISTRATOR . '/vendor/Defuse/Crypto', false, false, 'psr4');

// Mobile Detect
JLoader::registerNamespace('Wf\\Detection', WF_EDITOR_CLASSES . '/vendor/MobileDetect/src', false, false, 'psr4');

// CssMin
JLoader::registerNamespace('tubalmartin\CssMin', WF_EDITOR_CLASSES . '/vendor/cssmin/src', false, false, 'psr4');

// legacy class for backwards compatability
JLoader::register('WFText', WF_EDITOR_CLASSES . '/text.php');

// legacy class for backwards compatability
JLoader::register('WFModelEditor', WF_ADMINISTRATOR . '/models/editor.php');

// legacy function prevent fatal errors in 3rd party extensions
function wfimport($path = ""){
    return true;
}