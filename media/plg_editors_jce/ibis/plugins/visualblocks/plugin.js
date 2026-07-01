/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    var Storage = ibis.util.Storage;

    // Register plugin
    ibis.PluginManager.add('visualblocks', function (ed, url) {
        var state = false;

        // get state from cookie
        if (ed.getParam('use_state_cookies', true)) {
            state = Storage.get('wf_visualblocks_state');
        }

        if (ibis.is(state, "string")) {
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