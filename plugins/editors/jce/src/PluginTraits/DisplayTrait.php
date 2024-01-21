<?php
/**
 * @package     JCE
 * @subpackage  Editors.Jce
 *
 * @copyright   Copyright (C) 2005 - 2023 Open Source Matters, Inc. All rights reserved.
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

namespace Joomla\Plugin\Editors\Jce\PluginTraits;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Editor\Editor;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;

// phpcs:disable PSR1.Files.SideEffects
\defined('_JEXEC') or die;
// phpcs:enable PSR1.Files.SideEffects

/**
 * Handles the onDisplay event for the JCE editor.
 *
 * @since  3.9.59
 */
trait DisplayTrait
{
    protected static $instances = array();
    
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
            self::$instances[$signature] = new \WFEditor($config);
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

        $editor = $this->getEditorInstance();

        // Remove any non-alphanumeric characters from the id
        $id = preg_replace('/(\s|[^A-Za-z0-9_])+/', '_', $id);

        $buttonsStr = '';

        if ($editor->hasProfile()) {
            if (!$editor->hasPlugin('joomla')) {
                if ((bool) $editor->getParam('editor.xtd_buttons', 1)) {
                    $buttonsStr = $this->displayXtdButtons($id, $buttons, $asset, $author);
                }
            } else {
                $list = $this->getXtdButtonsList($id, $buttons, $asset, $author);
    
                if (!empty($list)) {
                    $options = array(
                        'joomla_xtd_buttons' => $list,
                    );
    
                    Factory::getDocument()->addScriptOptions('plg_editor_jce', $options, true);
                }
    
                // render empty container for dynamic buttons
                $buttonsStr = LayoutHelper::render('joomla.editors.buttons', array());
            }
        }

        $displayData = [
            'name'    => $name,
            'id'      => $id,
            'class'   => 'mce_editable wf-editor',
            'cols'    => $col,
            'rows'    => $row,
            'width'   => $width,
            'height'  => $height,
            'content' => $content,
            'buttons' => $buttonsStr,
        ];

        // Render Editor markup
        return LayoutHelper::render('editor.jce', $displayData, JPATH_PLUGINS . '/editors/jce/layouts');
    }
}
