/**
 * editor_plugin_src.js
 *
 * Copyright 2012, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function() {
    var cookie = tinymce.util.Cookie;

    tinymce.create('tinymce.plugins.VisualBlocks', {
        init : function(ed, url) {
            var cssId;

            // We don't support older browsers like IE6/7 and they don't provide prototypes for DOM objects
            if (!window.NodeList) {
                return;
            }

            // get state from cookie
            var state = cookie.get('wf_visualblocks_state');

            if (state && tinymce.is(state, 'string')) {
                if (state == 'null') {
                    state = 0;
                }

                state = parseFloat(state);
            }

            state = ed.getParam('visualblocks_default_state', state);

            ed.addCommand('mceVisualBlocks', function() {
                var dom = ed.dom, linkElm;

                if (!cssId) {
                    cssId = dom.uniqueId();
                    linkElm = dom.create('link', {
                        id: cssId,
                        rel : 'stylesheet',
                        href : url + '/css/visualblocks.css'
                    });

                    ed.getDoc().getElementsByTagName('head')[0].appendChild(linkElm);
                } else {
                    linkElm = dom.get(cssId);
                    linkElm.disabled = !linkElm.disabled;
                }

                ed.controlManager.setActive('visualblocks', !linkElm.disabled);

                if (linkElm.disabled) {
                    cookie.set('wf_visualblocks_state', 0);
                } else {
                    cookie.set('wf_visualblocks_state', 1);
                }
            });

            ed.onSetContent.add(function() {
                var dom = ed.dom, linkElm;

                if (cssId) {
                    linkElm = dom.get(cssId);
                    ed.controlManager.setActive('visualblocks', !linkElm.disabled);
                }

            });

            ed.addButton('visualblocks', {
                title : 'visualblocks.desc',
                cmd : 'mceVisualBlocks'
            });

            ed.onInit.add(function() {
                if (state) {
                    ed.execCommand('mceVisualBlocks', false, null);
                }
            });
        },

        getInfo : function() {
            return {
                longname : 'Visual blocks',
                author : 'Moxiecode Systems AB',
                authorurl : 'http://tinymce.moxiecode.com',
                infourl : 'http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/visualblocks',
                version : tinymce.majorVersion + "." + tinymce.minorVersion
            };
        }
    });

    // Register plugin
    tinymce.PluginManager.add('visualblocks', tinymce.plugins.VisualBlocks);
})();
