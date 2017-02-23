<?php

/**
 * @copyright 	Copyright (c) 2009-2017 Ryan Demmer. All rights reserved
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses
 */
class WFInlinepopupsPluginConfig
{
    public static function getStyles()
    {
        $wf = WFEditor::getInstance();
        // only required if we're packing css
        if ($wf->getParam('editor.compress_css', 1)) {
            // add ui theme css file
            return array(
                dirname(dirname(__FILE__)).'/css/dialog.css',
            );
        }
    }
}
