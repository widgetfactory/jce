<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
// Do not allow direct access
defined('_JEXEC') or die('RESTRICTED');

jimport('joomla.plugin.plugin');

/**
 * JCE WYSIWYG Editor Plugin.
 *
 * @since 1.5
 */
class plgEditorJCE extends JPlugin
{
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
        $app = JFactory::getApplication();
        $language = JFactory::getLanguage();

        $document = JFactory::getDocument();
        // set IE mode
        //$document->setMetaData('X-UA-Compatible', 'IE=Edge', true);
        // Check for existence of Admin Component
        if (!is_dir(JPATH_SITE.'/components/com_jce') || !is_dir(JPATH_ADMINISTRATOR.'/components/com_jce')) {
            JError::raiseWarning('SOME_ERROR_CODE', 'WF_COMPONENT_MISSING');
        }

        $language->load('plg_editors_jce', JPATH_ADMINISTRATOR);
        $language->load('com_jce', JPATH_ADMINISTRATOR);

        // load constants and loader
        require_once JPATH_ADMINISTRATOR.'/components/com_jce/includes/base.php';

        wfimport('admin.models.editor');

        $model = new WFModelEditor();

        return $model->buildEditor();
    }

    /**
     * JCE WYSIWYG Editor - get the editor content.
     *
     * @vars string   The name of the editor
     */
    public function onGetContent($editor)
    {
        //return "WFEditor.getContent('" . $editor . "');";
        return $this->onSave($editor);
    }

    /**
     * JCE WYSIWYG Editor - set the editor content.
     *
     * @vars string   The name of the editor
     */
    public function onSetContent($editor, $html)
    {
        return "WFEditor.setContent('".$editor."','".$html."');";
    }

    /**
     * JCE WYSIWYG Editor - copy editor content to form field.
     *
     * @vars string   The name of the editor
     */
    public function onSave($editor)
    {
        return "WFEditor.getContent('".$editor."');";
    }

    /**
     * JCE WYSIWYG Editor - display the editor.
     *
     * @vars string The name of the editor area
     * @vars string The content of the field
     * @vars string The width of the editor area
     * @vars string The height of the editor area
     * @vars int The number of columns for the editor area
     * @vars int The number of rows for the editor area
     * @vars mixed Can be boolean or array.
     */
    public function onDisplay($name, $content, $width, $height, $col, $row, $buttons = true, $id = null, $asset = null, $author = null)
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
        $editor = '<div class="editor wf-editor-container">';
        $editor .= '  <div class="wf-editor-header"></div>';
        $editor .= '  <textarea spellcheck="false" id="'.$id.'" name="'.$name.'" cols="'.$col.'" rows="'.$row.'" style="width:'.$width.';height:'.$height.';" class="wf-editor mce_editable" wrap="off">'.$content.'</textarea>';
        $editor .= '</div>';
        $editor .= $this->displayButtons($id, $buttons, $asset, $author);

        return $editor;
    }

    public function onGetInsertMethod($name)
    {
    }

    private function displayButtons($name, $buttons, $asset, $author)
    {
        $return = '';

        $args = array(
            'name' => $name,
            'event' => 'onGetInsertMethod',
        );

        $results = (array) $this->update($args);

        foreach ($results as $result) {
            if (is_string($result) && trim($result)) {
                $return .= $result;
            }
        }

        if (is_array($buttons) || (is_bool($buttons) && $buttons)) {
            $buttons = $this->_subject->getButtons($name, $buttons, $asset, $author);

            $version = new JVersion();
            // only available in Joomla 3.2+
            if ($version->isCompatible('3.2')) {
                // fix for some buttons that do not include the class
                foreach ($buttons as $button) {
                    if (is_object($button)) {
                        if (isset($button->class)) {
                            if (preg_match('#\bbtn\b#', $button->class) === false) {
                                $button->class .= ' btn';
                            }
                        } else {
                            $button->class = 'btn';
                        }
                    }
                }

                $return .= JLayoutHelper::render('joomla.editors.buttons', $buttons);

            // Joomla 3.0 to 3.4
            } elseif ($version->isCompatible('3.0')) {
                /*
                 * This will allow plugins to attach buttons or change the behavior on the fly using AJAX
                 */
                $return .= "\n<div id=\"editor-xtd-buttons\" class=\"btn-toolbar pull-left\">\n";
                $return .= "\n<div class=\"btn-toolbar\">\n";

                foreach ($results as $button) {
                    /*
                     * Results should be an object
                     */
                    if ($button->get('name')) {
                        $modal = ($button->get('modal')) ? ' class="modal-button btn"' : null;
                        $href = ($button->get('link')) ? ' class="btn" href="'.JURI::base().$button->get('link').'"' : null;
                        $onclick = ($button->get('onclick')) ? ' onclick="'.$button->get('onclick').'"' : 'onclick="IeCursorFix(); return false;"';
                        $title = ($button->get('title')) ? $button->get('title') : $button->get('text');
                        $return .= '<a'.$modal.' title="'.$title.'"'.$href.$onclick.' rel="'.$button->get('options')
                                .'"><i class="icon-'.$button->get('name').'"></i> '.$button->get('text')."</a>\n";
                    }
                }

                $return .= "</div>\n";
                $return .= "</div>\n";
            } else {
                // Load modal popup behavior
                JHTML::_('behavior.modal', 'a.modal-button');

                /*
                 * This will allow plugins to attach buttons or change the behavior on the fly using AJAX
                 */
                $return .= "\n<div id=\"editor-xtd-buttons\"";

                if ($version->isCompatible('3.0')) {
                    $return .= " class=\"btn-toolbar pull-left\">\n";
                    $return .= "\n<div class=\"btn-toolbar\">\n";
                } else {
                    $return .= ">\n";
                }

                foreach ($buttons as $button) {
                    /*
                     * Results should be an object
                     */
                    if ($button->get('name')) {
                        $modal = ($button->get('modal')) ? ' class="btn modal-button"' : '';
                        $href = ($button->get('link')) ? ' class="btn" href="'.JURI::base().$button->get('link').'"' : '';

                        $onclick = ($button->get('onclick')) ? ' onclick="'.$button->get('onclick').'"' : ' onclick="IeCursorFix(); return false;"';
                        $title = ($button->get('title')) ? $button->get('title') : $button->get('text');

                        if (!$version->isCompatible('3.0')) {
                            $return .= '<div class="button2-left"><div class="'.$button->get('name').'">';
                        }

                        $return .= '<a'.$modal.' title="'.$title.'"'.$href.$onclick.' rel="'.$button->get('options').'">';

                        // add icon-font class
                        if ($version->isCompatible('3.0')) {
                            $return .= '<i class="icon-'.$button->get('name').'"></i> ';
                        }

                        $return .= $button->get('text').'</a>';

                        if (!$version->isCompatible('3.0')) {
                            $return .= '</div></div>';
                        }
                    }
                }

                if ($version->isCompatible('3.0')) {
                    $return .= "</div>\n";
                }

                $return .= "</div>\n";
            }
        }

        return $return;
    }
}
