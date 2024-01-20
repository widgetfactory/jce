<?php
/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

// Do not allow direct access
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Editor\Editor;
use Joomla\CMS\Plugin\CMSPlugin;

use Joomla\Plugin\Editors\Jce\PluginTraits\XTDButtonsTrait;
use Joomla\Plugin\Editors\Jce\PluginTraits\DisplayTrait;

/**
 * JCE WYSIWYG Editor Plugin.
 *
 * @since 1.5
 */
class plgEditorJCE extends CMSPlugin
{
    use DisplayTrait;
    use XTDButtonsTrait;

    /**
     * Affects constructor behavior. If true, language files will be loaded automatically.
     *
     * @var    boolean
     */
    protected $autoloadLanguage = true;

    /**
     * Constructor.
     *
     * @param object $subject The object to observe
     * @param array  $config  An array that holds the plugin configuration
     *
     * @since       1.5
     */
    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);
    }

    /**
     * JCE WYSIWYG Editor - get the editor content.
     *
     * @vars string   The name of the editor
     */
    public function onGetContent($editor)
    {
        return $this->onSave($editor);
    }

    /**
     * JCE WYSIWYG Editor - set the editor content.
     *
     * @vars string   The name of the editor
     */
    public function onSetContent($editor, $html)
    {
        return "WFEditor.setContent('" . $editor . "','" . $html . "');";
    }

    /**
     * JCE WYSIWYG Editor - copy editor content to form field.
     *
     * @vars string   The name of the editor
     */
    public function onSave($editor)
    {
        return "WFEditor.getContent('" . $editor . "');";
    }

    public function onGetInsertMethod($name)
    {
    }
}
