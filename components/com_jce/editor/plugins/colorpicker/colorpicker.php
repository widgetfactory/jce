<?php
/**
 * @package     JCE
 * @subpackage  Editor
 *
 * @copyright   Copyright (c) 2009-2024 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

require_once WF_EDITOR_LIBRARIES . '/classes/plugin.php';

class WFColorpickerPlugin extends WFEditorPlugin
{
    public function __construct()
    {
        parent::__construct(array('colorpicker' => true));
    }

    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();

        $document->addScript(array('colorpicker'), 'plugins');
        $document->addStyleSheet(array('colorpicker'), 'plugins');
    }
}
