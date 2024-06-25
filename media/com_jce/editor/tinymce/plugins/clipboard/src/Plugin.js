/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @copyright   Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

import * as Dialog from './Dialog.js';

var each = tinymce.each;

tinymce.PluginManager.add('clipboard', function (ed, url) {
    var pasteText = ed.getParam('clipboard_paste_text', 1);
    var pasteHtml = ed.getParam('clipboard_paste_html', 1);

    ed.onInit.add(function () {
        if (ed.plugins.contextmenu) {
            ed.plugins.contextmenu.onContextMenu.add(function (th, m, e) {
                var c = ed.selection.isCollapsed();

                if (ed.getParam('clipboard_cut', 1)) {
                    m.add({
                        title: 'advanced.cut_desc',
                        /* TODO - Change to clipboard.cut_desc */
                        icon: 'cut',
                        cmd: 'Cut'
                    }).setDisabled(c);
                }

                if (ed.getParam('clipboard_copy', 1)) {
                    m.add({
                        title: 'advanced.copy_desc',
                        /* TODO - Change to clipboard.copy_desc */
                        icon: 'copy',
                        cmd: 'Copy'
                    }).setDisabled(c);
                }

                if (pasteHtml) {
                    m.add({
                        title: 'clipboard.paste_desc',
                        /* TODO - Change to clipboard.paste_desc */
                        icon: 'paste',
                        cmd: 'mcePaste'
                    });
                }
                if (pasteText) {
                    m.add({
                        title: 'clipboard.paste_text_desc',
                        /* TODO - Change to clipboard.paste_text_desc */
                        icon: 'pastetext',
                        cmd: 'mcePasteText'
                    });
                }
            });

        }
    });

    // Add commands
    each(['mcePasteText', 'mcePaste'], function (cmd) {
        ed.addCommand(cmd, function () {
            var doc = ed.getDoc(),
                failed = false;

            // just open the window
            if (ed.getParam('clipboard_paste_use_dialog')) {
                return Dialog.openWin(ed, cmd);
            } else {
                try {
                    doc.execCommand('Paste', false, null);
                } catch (e) {
                    failed = true;
                }

                // Chrome reports the paste command as supported however older IE:s will return false for cut/paste
                if (!doc.queryCommandEnabled('Paste')) {
                    failed = true;
                }

                if (failed) {
                    return Dialog.openWin(ed, cmd);
                }
            }
        });
    });

    // Add buttons
    if (pasteHtml) {
        ed.addButton('paste', {
            title: 'clipboard.paste_desc',
            cmd: 'mcePaste',
            ui: true
        });
    }

    if (pasteText) {
        ed.addButton('pastetext', {
            title: 'clipboard.paste_text_desc',
            cmd: 'mcePasteText',
            ui: true
        });
    }

    if (ed.getParam('clipboard_cut', 1)) {
        ed.addButton('cut', {
            title: 'advanced.cut_desc',
            cmd: 'Cut',
            icon: 'cut'
        });
    }

    if (ed.getParam('clipboard_copy', 1)) {
        ed.addButton('copy', {
            title: 'advanced.copy_desc',
            cmd: 'Copy',
            icon: 'copy'
        });
    }
});