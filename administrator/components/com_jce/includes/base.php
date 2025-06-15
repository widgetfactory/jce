<?php

/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
defined('JPATH_PLATFORM') or die;

// load constants
require_once __DIR__ . '/constants.php';
require_once __DIR__ . '/loader.php';

// register classes
WFLoader::register('WFObject', WF_EDITOR_CLASSES . '/object.php');
WFLoader::register('WFApplication', WF_EDITOR_CLASSES . '/application.php');
WFLoader::register('WFEditor', WF_EDITOR_CLASSES . '/editor.php');
WFLoader::register('WFEditorPlugin', WF_EDITOR_CLASSES . '/plugin.php');

WFLoader::register('WFLanguage', WF_EDITOR_CLASSES . '/language.php');
WFLoader::register('WFUtility', WF_EDITOR_CLASSES . '/utility.php');
WFLoader::register('WFMimeType', WF_EDITOR_CLASSES . '/mime.php');

WFLoader::register('WFDocument', WF_EDITOR_CLASSES . '/document.php');
WFLoader::register('WFTabs', WF_EDITOR_CLASSES . '/tabs.php');
WFLoader::register('WFView', WF_EDITOR_CLASSES . '/view.php');

WFLoader::register('WFRequest', WF_EDITOR_CLASSES . '/request.php');
WFLoader::register('WFResponse', WF_EDITOR_CLASSES . '/response.php');

WFLoader::register('WFLanguageParser', WF_EDITOR_CLASSES . '/languageparser.php');
WFLoader::register('WFPacker', WF_EDITOR_CLASSES . '/packer.php');

WFLoader::register('WFExtension', WF_EDITOR_CLASSES . '/extensions.php');
WFLoader::register('WFFileSystem', WF_EDITOR_CLASSES . '/extensions/filesystem.php');
WFLoader::register('WFLinkExtension', WF_EDITOR_CLASSES . '/extensions/link.php');
WFLoader::register('WFAggregatorExtension', WF_EDITOR_CLASSES . '/extensions/aggregator.php');
WFLoader::register('WFMediaPlayerExtension', WF_EDITOR_CLASSES . '/extensions/mediaplayer.php');
WFLoader::register('WFPopupsExtension', WF_EDITOR_CLASSES . '/extensions/popups.php');
WFLoader::register('WFSearchExtension', WF_EDITOR_CLASSES . '/extensions/search.php');

WFLoader::register('WFMediaManagerBase', WF_EDITOR_CLASSES . '/manager/base.php');
WFLoader::register('WFMediaManager', WF_EDITOR_CLASSES . '/manager.php');
WFLoader::register('WFFileBrowser', WF_EDITOR_CLASSES . '/browser.php');
//WFLoader::register('Wf_Mobile_Detect', WF_EDITOR_CLASSES . '/mobile.php');

WFLoader::register('JcePluginsHelper', WF_ADMINISTRATOR . '/helpers/plugins.php');
WFLoader::register('JceEncryptHelper', WF_ADMINISTRATOR . '/helpers/encrypt.php');

WFLoader::register('WFLinkHelper', WF_EDITOR_CLASSES . '/linkhelper.php');

// Defuse
JLoader::registerNamespace('Defuse\\Crypto', WF_ADMINISTRATOR . '/vendor/Defuse/Crypto', false, false, 'psr4');

// Mobile Detect
JLoader::registerNamespace('Wf\\Detection', WF_EDITOR_CLASSES . '/vendor/MobileDetect/src', false, false, 'psr4');

// CssMin
JLoader::registerNamespace('tubalmartin\CssMin', WF_EDITOR_CLASSES . '/vendor/cssmin/src', false, false, 'psr4');

// legacy class for backwards compatability
WFLoader::register('WFText', WF_EDITOR_CLASSES . '/text.php');

// legacy class for backwards compatability
WFLoader::register('WFModelEditor', WF_ADMINISTRATOR . '/models/editor.php');

// legacy function prevent fatal errors in 3rd party extensions
function wfimport($path = "")
{
    return true;
}
