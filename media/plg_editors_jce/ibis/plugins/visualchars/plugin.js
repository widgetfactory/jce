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
                if (ed.selection && ed.getBody().contains(body)) {
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

        // unwrap nbsp spans in the current block so the browser can normalize whitespace
        function unwrapNbsp() {
            var rng = ed.selection.getRng(true), start = rng.startContainer, caret = null, parents = [], span;
            var block = ed.dom.getParent(start, ed.dom.isBlock) || ed.getBody();
            var spans = ed.dom.select('span.mce-item-nbsp', block);

            if (!spans.length) {
                return;
            }

            // caret inside a span, track its text node as it is moved out
            span = ed.dom.getParent(start, 'span.mce-item-nbsp');

            if (span && rng.collapsed && span.firstChild) {
                if (start === span) {
                    caret = { node: span.firstChild, offset: rng.startOffset ? span.firstChild.nodeValue.length : 0 };
                } else {
                    caret = { node: start, offset: rng.startOffset };
                }
            }

            ibis.each(spans, function (span) {
                var parent = span.parentNode;

                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }

                parent.removeChild(span);

                if (ibis.inArray(parents, parent) === -1) {
                    parents.push(parent);
                }
            });

            if (caret) {
                rng = ed.dom.createRng();
                rng.setStart(caret.node, caret.offset);
                rng.collapse(true);
                ed.selection.setRng(rng);
            }

            // merging text nodes updates the live selection range
            ibis.each(parents, function (parent) {
                parent.normalize();
            });
        }

        ed.onKeyDown.add(function (ed, e) {
            // space, backspace or delete
            if (state && (e.keyCode == 32 || e.keyCode == 8 || e.keyCode == 46)) {
                unwrapNbsp();
            }
        });

        ed.onKeyUp.add(function (ed, e) {
            if (!state) {
                return;
            }

            // enter, the previous block may still have an unwrapped char
            if (e.keyCode == 13) {
                toggleVisualChars(state);
            }

            // space, backspace or delete only change the current block
            if (e.keyCode == 32 || e.keyCode == 8 || e.keyCode == 46) {
                toggleVisualChars(state, ed.dom.getParent(ed.selection.getNode(), ed.dom.isBlock) || ed.getBody());
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