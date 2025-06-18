/**
 * @package     JCE
 * @copyright   Copyright (c) 2009       Moxiecode Systems AB. All rights reserved.
 * @copyright   Copyright (c) 1999–2017  Ephox Corp. All rights reserved.
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 * @note        Forked or includes code from TinyMCE 3.x/4.x/5.x (originally LGPL 2.1) and relicensed under GPL 2+ per LGPL 2.1 §3.
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    tinymce.PluginManager.add('nonbreaking', function (ed, url) {
        // Register commands
        ed.addCommand('mceNonBreaking', function () {
            ed.execCommand('mceInsertContent', false, (ed.plugins.visualchars && ed.plugins.visualchars.state) ? '<span data-mce-bogus="1" class="mce-item-hidden mce-item-nbsp">&nbsp;</span>' : '&nbsp;');
        });

        // Register buttons
        ed.addButton('nonbreaking', { title: 'nonbreaking.desc', cmd: 'mceNonBreaking' });

        if (ed.getParam('nonbreaking_force_tab')) {
            ed.onKeyDown.add(function (ed, e) {
                if (e.keyCode == 9) {
                    e.preventDefault();

                    ed.execCommand('mceNonBreaking');
                    ed.execCommand('mceNonBreaking');
                    ed.execCommand('mceNonBreaking');
                }
            });
        }

        ed.addShortcut('ctrl+shift+' + 32, 'nonbreaking.desc', 'mceNonBreaking');
    });
})();