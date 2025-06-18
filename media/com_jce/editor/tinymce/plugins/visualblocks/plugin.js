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
    var Storage = tinymce.util.Storage;

    // Register plugin
    tinymce.PluginManager.add('visualblocks', function (ed, url) {
        var state = false;

        // get state from cookie
        if (ed.getParam('use_state_cookies', true)) {
            state = Storage.get('wf_visualblocks_state');
        }

        if (tinymce.is(state, "string")) {
            if (state === "null" || state === "false") {
                state = false;
            }

            state = !!state;
        }

        // get state from parameter (may be integer)
        state = ed.getParam('visualblocks_default_state', state);

        function toggleVisualBlocks() {
            ed.controlManager.setActive('visualblocks', state);

            if (ed.getParam('use_state_cookies', true)) {
                Storage.set('wf_visualblocks_state', state);
            }

            if (!state) {
                ed.dom.removeClass(ed.getBody(), 'mceVisualBlocks');
            } else {
                ed.dom.addClass(ed.getBody(), 'mceVisualBlocks');
            }
        }

        ed.addCommand('mceVisualBlocks', function () {
            state = !state;
            toggleVisualBlocks();
        });

        ed.onSetContent.add(function () {
            ed.controlManager.setActive('visualblocks', state);
        });

        ed.addButton('visualblocks', {
            title: 'visualblocks.desc',
            cmd: 'mceVisualBlocks'
        });

        ed.onInit.add(function () {
            if (state) {
                toggleVisualBlocks();
            }
        });
    });
})();