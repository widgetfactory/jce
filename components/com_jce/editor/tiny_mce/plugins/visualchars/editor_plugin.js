/**
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 */
(function () {
    var Cookie = tinymce.util.Cookie;
    
    tinymce.create('tinymce.plugins.VisualChars', {
        init: function (ed, url) {
            var self = this, state;

            self.editor = ed;

            // get state from cookie
            if (ed.getParam('use_state_cookies', true)) {
                state = Cookie.get('wf_visualchars_state');
            }

            state = tinymce.is(state, 'string') ? parseFloat(state) : ed.getParam('visualchars_default_state', 0);

            ed.onInit.add(function () {
                ed.controlManager.setActive('visualchars', state);

                self._toggleVisualChars(state);
            });

            // Register buttons
            ed.addButton('visualchars', {
                title: 'visualchars.desc',
                cmd: 'mceVisualChars'
            });

            // add trigger for nbsp button
            ed.onExecCommand.add(function (ed, cmd, ui, v, o) {
                if (cmd === "mceNonBreaking") {
                    self._toggleVisualChars(state);
                }
            });

            // Register commands
            ed.addCommand('mceVisualChars', function () {
                state = !state;

                ed.controlManager.setActive('visualchars', state);
                self._toggleVisualChars(state);

                if (ed.getParam('use_state_cookies', true)) {
                    Cookie.set('wf_visualchars_state', state ? 1 : 0);
                }
            }, self);

            ed.onKeyUp.add(function (ed, e) {
                if (state) {
                    if (e.keyCode == 13) {
                        self._toggleVisualChars(state);
                    }
                }
            });

            ed.onPreProcess.add(function (ed, o) {
                if (o.get) {
                    self._toggleVisualChars(false, o.node);
                }
            });

            ed.onSetContent.add(function (ed, o) {
                self._toggleVisualChars(state);
            });
        },

        _toggleVisualChars: function (state, o) {
            var self = this;
            
            var ed = this.editor, node, nodeList, i, body = o || ed.getBody(),
                nodeValue, selection = ed.selection,
                div, bookmark;
            var charMap, visualCharsRegExp;

            charMap = {
                '\u00a0': 'nbsp',
                '\u00ad': 'shy'
            };

            function wrapCharWithSpan(value) {
                return '<span data-mce-bogus="1" class="mce-item-' + charMap[value] + '">' + value + '</span>';
            }

            function compileCharMapToRegExp() {
                var key, regExp = '';

                for (key in charMap) {
                    regExp += key;
                }

                return new RegExp('[' + regExp + ']', 'g');
            }

            function compileCharMapToCssSelector() {
                var key, selector = '';

                for (key in charMap) {
                    if (selector) {
                        selector += ',';
                    }

                    selector += 'span.mce-item-' + charMap[key];
                }

                return selector;
            }

            function isNode(n) {
                return n.nodeType === 3 && !ed.dom.getParent(n, '.mce-item-nbsp, .mce-item-shy');
            }

            visualCharsRegExp = compileCharMapToRegExp();

            if (state) {
                nodeList = [];
                tinymce.walk(body, function (n) {
                    if (isNode(n) && n.nodeValue && visualCharsRegExp.test(n.nodeValue)) {
                        nodeList.push(n);
                    }
                }, 'childNodes');

                for (i = 0; i < nodeList.length; i++) {
                    nodeValue = nodeList[i].nodeValue;
                    nodeValue = nodeValue.replace(visualCharsRegExp, wrapCharWithSpan);

                    div = ed.dom.create('div', null, nodeValue);

                    while ((node = div.lastChild)) {
                        ed.dom.insertAfter(node, nodeList[i]);
                    }

                    ed.dom.remove(nodeList[i]);
                }
            } else {
                nodeList = ed.dom.select(compileCharMapToCssSelector(), body);

                for (i = nodeList.length - 1; i >= 0; i--) {
                    ed.dom.remove(nodeList[i], 1);
                }
            }
        }
    });

    // Register plugin
    tinymce.PluginManager.add('visualchars', tinymce.plugins.VisualChars);
})();