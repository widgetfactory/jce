/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function (tinymce) {
    var VK = tinymce.VK;

    tinyMCE.onAddEditor.add(function (mgr, ed) {
        /**
         * Firefox on Mac OS will move the browser back to the previous page if you press CMD+Left arrow.
         * You might then loose all your work so we need to block that behavior and replace it with our own.
         */
        if (tinymce.isMac && tinymce.isGecko && !tinymce.isIE11) {
            ed.onKeyDown.add(function (ed, e) {
                if (VK.metaKeyPressed(e) && !e.shiftKey && (e.keyCode == 37 || e.keyCode == 39)) {
                    ed.selection.getSel().modify('move', e.keyCode == 37 ? 'backward' : 'forward', 'word');
                    e.preventDefault();
                }
            });
        }
    });
})(tinymce);