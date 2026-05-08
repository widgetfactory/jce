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
\defined('_JEXEC') or die;

use Joomla\CMS\Editor\Editor;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Uri\Uri;
use Joomla\Plugin\Editors\Jce\PluginTraits\DisplayTrait;

/**
 * JCE WYSIWYG Editor Plugin.
 *
 * @since 1.5
 */
class plgEditorJCE extends CMSPlugin
{
    use DisplayTrait;

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

    /**
     * Get the XTD buttons as a list to render in the Joomla button menu
     *
     * @param   string  $editorId  The editor ID
     * @param   array   $options   Associative array with additional parameters
     *
     * @return array
     *
     * @since 2.9.99.3
     */
    private function getXtdButtonsList($editorId, $options = [])
    {
        $list = [];

        $excluded = ['readmore', 'pagebreak'];

        $buttons = $options['buttons'] ?? [];

        if (!is_array($buttons)) {
            $buttons = !$buttons ? false : $excluded;
        } else {
            $buttons = array_merge($buttons, $excluded);
        }

        $buttons = Editor::getInstance('jce')->getButtons($editorId, $buttons);

        if (!empty($buttons)) {
            $list[$editorId] = [];

            foreach ($buttons as $button) {
                if (!$button->get('name')) {
                    continue;
                }

                $id         = $editorId . '_' . $button->get('name');
                $icon       = 'none icon-' . $button->get('icon', $button->get('name'));
                $btnOptions = (array) $button->get('options', []);

                $link = $button->get('link', '#');

                if ($link === '#') {
                    $link = $btnOptions['src'] ?? '';
                } else {
                    $link = Uri::base() . $link;
                }

                $list[$editorId][] = [
                    'name'    => $button->get('text'),
                    'id'      => $id,
                    'title'   => $button->get('text'),
                    'icon'    => $icon,
                    'href'    => $link,
                    'onclick' => $button->get('onclick', ''),
                    'svg'     => $button->get('iconSVG'),
                    'options' => $btnOptions,
                    'action'  => $button->get('action', ''),
                ];
            }
        }

        return $list;
    }

    /**
     * Display the extended buttons for the editor.
     *
     * @param   string  $editorId  The editor ID
     * @param   array   $options   Associative array with additional parameters
     *
     * @return  string
     */
    protected function displayXtdButtons($editorId, $options)
    {
        $buttons = Editor::getInstance('jce')->getButtons($editorId, $options['buttons'] ?? []);

        if (!empty($buttons)) {
            foreach ($buttons as $button) {
                $cls = $button->get('class', '');

                if (empty($cls) || strpos($cls, 'btn') === false) {
                    $button->set('class', trim($cls . ' btn'));
                }

                if ($options['hidden'] ?? false) {
                    $button->set('class', 'd-none hidden');
                }
            }

            return LayoutHelper::render('joomla.editors.buttons', $buttons);
        }
    }
}
