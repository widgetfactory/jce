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
    tinymce.PluginManager.add('visualchars', function (ed, url) {

        function toggleVisualChars(state, o) {

            var node, nodeList, i, body = o || ed.getBody(),
                nodeValue, div;
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
                    nodeValue = ed.dom.encode(nodeValue);
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

        var state;

        // get state from cookie
        if (ed.getParam('use_state_cookies', true)) {
            state = Storage.get('wf_visualchars_state');
        }

        state = tinymce.is(state, 'string') ? parseFloat(state) : ed.getParam('visualchars_default_state', 0);

        ed.onInit.add(function () {
            ed.controlManager.setActive('visualchars', state);

            toggleVisualChars(state);
        });

        // Register buttons
        ed.addButton('visualchars', {
            title: 'visualchars.desc',
            cmd: 'mceVisualChars'
        });

        // add trigger for nbsp button
        ed.onExecCommand.add(function (ed, cmd, ui, v, o) {
            if (cmd === "mceNonBreaking") {
                toggleVisualChars(state);
            }
        });

        // Register commands
        ed.addCommand('mceVisualChars', function () {
            state = !state;

            ed.controlManager.setActive('visualchars', state);
            toggleVisualChars(state);

            if (ed.getParam('use_state_cookies', true)) {
                Storage.set('wf_visualchars_state', state ? 1 : 0);
            }
        }, self);

        ed.onKeyUp.add(function (ed, e) {
            if (state) {
                if (e.keyCode == 13) {
                    toggleVisualChars(state);
                }
            }
        });

        ed.onPreProcess.add(function (ed, o) {
            if (o.get) {
                toggleVisualChars(false, o.node);
            }
        });

        ed.onSetContent.add(function (ed, o) {
            toggleVisualChars(state);
        });
    });
})();