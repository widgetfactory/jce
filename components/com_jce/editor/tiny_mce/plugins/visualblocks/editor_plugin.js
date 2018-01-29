/**
 * editor_plugin_src.js
 *
 * Copyright 2012, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function () {
    var cookie = tinymce.util.Cookie;

    tinymce.create('tinymce.plugins.VisualBlocks', {
        init: function (ed, url) {
            // get state from cookie
            var state = cookie.get('wf_visualblocks_state');

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
                cookie.set('wf_visualblocks_state', state);

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
                if (!ed.settings.compress.css) {
                    ed.dom.loadCSS(url + "/css/visualblocks.css");
                }

                if (state) {
                    toggleVisualBlocks();
                }
            });
        }
    });

    // Register plugin
    tinymce.PluginManager.add('visualblocks', tinymce.plugins.VisualBlocks);
})();