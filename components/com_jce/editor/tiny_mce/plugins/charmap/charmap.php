<?php
/**
 * @package     JCE
 * @subpackage  Editor
*
 * @copyright   Copyright (c) 2009-2023 Ryan Demmer. All rights reserved
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

require_once WF_EDITOR_LIBRARIES . '/classes/plugin.php';

class WFCharMapPlugin extends WFEditorPlugin
{
    public function display()
    {
        parent::display();

        $document = WFDocument::getInstance();

        $document->addScript(array('charmap'), 'plugins');
        $document->addStyleSheet(array('charmap'), 'plugins');
    }
}
