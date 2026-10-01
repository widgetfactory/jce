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
    ibis.PluginManager.add('visualchars', function (ed, url) {

        function toggleVisualChars(state, o) {

            var nodeList, i, body = o || ed.getBody(),
                rng, caretNode, caretOffset, caret;
            var charMap, visualCharsRegExp;

            charMap = {
                '\u00a0': 'nbsp',
                '\u00ad': 'shy'
            };

            function wrapTextNode(textNode, offset) {
                var value = textNode.nodeValue, doc = textNode.ownerDocument, frag = doc.createDocumentFragment();
                var last = 0, wrapped = false, pos = null, match, span;

                function addText(start, end) {
                    var text = doc.createTextNode(value.substring(start, end));

                    frag.appendChild(text);

                    if (offset >= start && offset <= end && !pos) {
                        pos = { node: text, offset: offset - start };
                    }
                }

                visualCharsRegExp.lastIndex = 0;

                while ((match = visualCharsRegExp.exec(value))) {
                    // skip the char directly before the caret, the browser may still normalize it to a space
                    if (match.index === offset - 1) {
                        continue;
                    }

                    if (match.index > last) {
                        addText(last, match.index);
                    }

                    span = ed.dom.create('span', { 'data-mce-bogus': '1', 'class': 'mce-item-' + charMap[match[0]] }, match[0]);
                    frag.appendChild(span);

                    // caret at the start of a node that begins with a wrapped char
                    if (offset === 0 && !pos) {
                        pos = { before: span };
                    }

                    last = match.index + 1;
                    wrapped = true;
                }

                if (!wrapped) {
                    return null;
                }

                if (last < value.length) {
                    addText(last, value.length);
                }

                textNode.parentNode.replaceChild(frag, textNode);

                return pos;
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
                ibis.walk(body, function (n) {
                    visualCharsRegExp.lastIndex = 0;

                    if (isNode(n) && n.nodeValue && visualCharsRegExp.test(n.nodeValue)) {
                        nodeList.push(n);
                    }
                }, 'childNodes');

                // only track the caret when working on the live editor body
                if (!o && ed.selection) {
                    rng = ed.selection.getRng(true);

                    if (rng && rng.collapsed && rng.startContainer.nodeType === 3) {
                        caretNode = rng.startContainer;
                        caretOffset = rng.startOffset;
                    }
                }

                for (i = 0; i < nodeList.length; i++) {
                    if (nodeList[i] === caretNode) {
                        caret = wrapTextNode(nodeList[i], caretOffset);
                    } else {
                        wrapTextNode(nodeList[i], -1);
                    }
                }

                if (caret) {
                    rng = ed.dom.createRng();

                    if (caret.before) {
                        rng.setStartBefore(caret.before);
                    } else {
                        rng.setStart(caret.node, caret.offset);
                    }

                    rng.collapse(true);
                    ed.selection.setRng(rng);
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

        state = ibis.is(state, 'string') ? parseFloat(state) : ed.getParam('visualchars_default_state', 0);

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
                // on enter or space
                if (e.keyCode == 13 || e.keyCode == 32) {
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