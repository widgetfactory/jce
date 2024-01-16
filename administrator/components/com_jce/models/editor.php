<?php
/**
 * @package     JCE
 * @subpackage  Admin
 *
 * @copyright   Copyright (C) 2005 - 2020 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;

class WFModelEditor
{
    private static $editor;

    public function buildEditor()
    {
        if (!isset(self::$editor)) {
            self::$editor = new WFEditor();
        }

        $settings = self::$editor->getEditorSettings();

        return self::$editor->render($settings);
    }

    public function getEditorSettings()
    {
        if (!isset(self::$editor)) {
            self::$editor = new WFEditor();
        }

        return self::$editor->getEditorSettings();
    }

    public function render($settings = array())
    {
        if (!isset(self::$editor)) {
            self::$editor = new WFEditor();
        }

        if (empty($settings)) {
            $settings = self::$editor->getEditorSettings();
        }

        self::$editor->render($settings);

        $document = Factory::getDocument();

        foreach (self::$editor->getScripts() as $script => $type) {
            $document->addScript($script, array('version' => 'auto'), array('type' => $type, 'defer' => 'defer'));
        }

        foreach (self::$editor->getStyleSheets() as $style) {
            $document->addStylesheet($style, array('version' => 'auto'));
        }

        $script = "document.addEventListener('DOMContentLoaded',function handler(){" . implode("", self::$editor->getScriptDeclaration()) . ";this.removeEventListener('DOMContentLoaded',handler);});";

        $document->addScriptDeclaration($script);
    }
}
