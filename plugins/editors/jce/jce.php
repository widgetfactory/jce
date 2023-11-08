<?php

/**
 * @copyright     Copyright (c) 2009 - 2023 Ryan Demmer. All rights reserved
 * @license       GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
// Do not allow direct access
defined('JPATH_PLATFORM') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Editor\Editor;

/**
 * JCE WYSIWYG Editor Plugin.
 *
 * @since 1.5
 */
class plgEditorJCE extends CMSPlugin
{
    protected static $instances = array();
    
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

    protected function getEditorInstance()
    {        
        // pass config to WFEditor
        $config = array(
            'profile_id' => $this->params->get('profile_id', 0),
            'plugin' => $this->params->get('plugin', '')
        );

        $signature = md5(serialize($config));

        if (empty(self::$instances[$signature])) {
            // load base file
            require_once JPATH_ADMINISTRATOR . '/components/com_jce/includes/base.php';

            // create editor
            self::$instances[$signature] = new WFEditor($config);
        }

        return self::$instances[$signature];
    }

    /**
     * Method to handle the onInit event.
     *  - Initializes the JCE WYSIWYG Editor.
     *
     * @param   $toString Return javascript and css as a string
     *
     * @return string JavaScript Initialization string
     *
     * @since   1.5
     */
    public function onInit()
    {
        if (!ComponentHelper::isEnabled('com_jce')) {
            return false;
        }
        
        $language = Factory::getLanguage();
        $document = Factory::getDocument();

        $language->load('plg_editors_jce', JPATH_ADMINISTRATOR);
        $language->load('com_jce', JPATH_ADMINISTRATOR);

        $editor = $this->getEditorInstance();
        $editor->init();

        foreach ($editor->getScripts() as $script => $type) {
            $document->addScript($script, array(), array('type' => $type));
        }

        foreach ($editor->getStyleSheets() as $style) {
            $document->addStylesheet($style);
        }

        $document->addScriptDeclaration(implode("\n", $editor->getScriptDeclaration()));
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

    /**
     * JCE WYSIWYG Editor - Display the editor area.
     *
     * @param   string   $name     The name of the editor area.
     * @param   string   $content  The content of the field.
     * @param   string   $width    The width of the editor area.
     * @param   string   $height   The height of the editor area.
     * @param   int      $col      The number of columns for the editor area.
     * @param   int      $row      The number of rows for the editor area.
     * @param   boolean  $buttons  True and the editor buttons will be displayed.
     * @param   string   $id       An optional ID for the textarea. If not supplied the name is used.
     * @param   string   $asset    The object asset
     * @param   object   $author   The author.
     * @param   array    $params   Associative array of editor parameters.
     *
     * @return  string
     */
    public function onDisplay($name, $content, $width, $height, $col, $row, $buttons = true, $id = null, $asset = null, $author = null, $params = array())
    {
        if (empty($id)) {
            $id = $name;
        }

        // Only add "px" to width and height if they are not given as a percentage
        if (is_numeric($width)) {
            $width .= 'px';
        }

        if (is_numeric($height)) {
            $height .= 'px';
        }

        if (empty($id)) {
            $id = $name;
        }

        // Data object for the layout
        $textarea = new stdClass;
        $textarea->name = $name;
        $textarea->id = $id;
        $textarea->class = 'mce_editable wf-editor';
        $textarea->cols = $col;
        $textarea->rows = $row;
        $textarea->width = $width;
        $textarea->height = $height;
        $textarea->content = $content;

        $classes = version_compare(JVERSION, '4', 'lt') ? 'joomla3' : 'mb-2';

        // Render Editor markup
        $html = '<div class="editor wf-editor-container ' . $classes . '">';
        $html .= '<div class="wf-editor-header"></div>';
        $html .= LayoutHelper::render('editor.textarea', $textarea, __DIR__ . '/layouts');
        $html .= '</div>';

        if (!ComponentHelper::isEnabled('com_jce')) {
            return $html;
        }

        $editor = $this->getEditorInstance();

        // no profile assigned or available
        if (!$editor->hasProfile()) {
            return $html;
        }

        if (!$editor->hasPlugin('joomla')) {            
            if ((bool) $editor->getParam('editor.xtd_buttons', 1)) {                
                $html .= $this->displayButtons($id, $buttons, $asset, $author);
            }
        } else {
            $list = $this->getXtdButtonsList($id, $buttons, $asset, $author);

            if (!empty($list)) {
                $options = array(
                    'joomla_xtd_buttons' => array_values($list)
                );

                Factory::getDocument()->addScriptOptions('plg_editor_jce', $options, true);
            }

            // render empty container for dynamic buttons
            $html .= LayoutHelper::render('joomla.editors.buttons', array());
        }

        return $html;
    }

    public function onGetInsertMethod($name)
    {
    }

    private function getXtdButtonsList($name, $buttons, $asset, $author)
    {
        $list = array();

        $excluded = array('readmore', 'pagebreak', 'image');

        if (!is_array($buttons)) {
            $buttons = !$buttons ? false : $excluded;
        } else {
            $buttons = array_merge($buttons, $excluded);
        }

        // easiest way to get buttons across versions
        $buttons = Editor::getInstance('jce')->getButtons($name, $buttons);

        if (!empty($buttons)) {
            foreach ($buttons as $i => $button) {
                if ($button->get('name')) {
                    // Set some vars
                    $icon = 'none icon-' . $button->get('icon', $button->get('name'));

                    $name = 'button-' . $i . '-' . str_replace(' ', '-', $button->get('text'));
                    $title = $button->get('text');
                    $onclick = $button->get('onclick', '');

                    if ($button->get('link') !== '#') {
                        $href = Uri::base() . $button->get('link');
                    } else {
                        $href = '';
                    }

                    $id = $button->get('name');

                    $list[$id] = array(
                        'name' => $name,
                        'title' => $title,
                        'icon' => $icon,
                        'href' => $href,
                        'onclick' => $onclick,
                        'svg' => $button->get('iconSVG'),
                        'options' => $button->get('options', array())
                    );
                }
            }
        }

        return $list;
    }

    private function displayButtons($name, $buttons, $asset, $author)
    {
        // easiest way to get buttons across versions
        $buttons = Editor::getInstance('jce')->getButtons($name, $buttons);

        if (!empty($buttons)) {
            // fix some legacy buttons
            array_walk($buttons, function ($button) {
                $cls = $button->get('class', '');
                
                if (empty($cls) || strpos($cls, 'btn') === false) {
                    $cls .= ' btn';
                    $button->set('class', trim($cls));
                }
            });

            return LayoutHelper::render('joomla.editors.buttons', $buttons);
        }
    }
}
