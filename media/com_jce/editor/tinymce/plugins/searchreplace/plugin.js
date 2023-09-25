/**
 * plugin.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved

 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

/*eslint no-labels:0, no-constant-condition: 0 */

(function () {
    var DOM = tinymce.DOM;

    // Based on work developed by: James Padolsey http://james.padolsey.com
    // released under UNLICENSE that is compatible with LGPL
    // TODO: Handle contentEditable edgecase:
    // <p>text<span contentEditable="false">text<span contentEditable="true">text</span>text</span>text</p>
    function findAndReplaceDOMText(regex, node, replacementNode, captureGroup, schema) {
        var m, matches = [],
            text, count = 0,
            doc;
        var blockElementsMap, hiddenTextElementsMap, shortEndedElementsMap;

        doc = node.ownerDocument;
        blockElementsMap = schema.getBlockElements(); // H1-H6, P, TD etc
        hiddenTextElementsMap = schema.getWhiteSpaceElements(); // TEXTAREA, PRE, STYLE, SCRIPT
        shortEndedElementsMap = schema.getShortEndedElements(); // BR, IMG, INPUT

        function getMatchIndexes(m, captureGroup) {
            captureGroup = captureGroup || 0;

            if (!m[0]) {
                throw 'findAndReplaceDOMText cannot handle zero-length matches';
            }

            var index = m.index;

            if (captureGroup > 0) {
                var cg = m[captureGroup];

                if (!cg) {
                    throw 'Invalid capture group';
                }

                index += m[0].indexOf(cg);
                m[0] = cg;
            }

            return [index, index + m[0].length, [m[0]]];
        }

        function getText(node) {
            var txt;

            if (node.nodeType === 3) {
                return node.data;
            }

            if (hiddenTextElementsMap[node.nodeName] && !blockElementsMap[node.nodeName]) {
                return '';
            }

            txt = '';

            /*if (isContentEditableFalse(node)) {
                return '\n';
            }*/

            if (blockElementsMap[node.nodeName] || shortEndedElementsMap[node.nodeName]) {
                txt += '\n';
            }

            if ((node = node.firstChild)) {
                do {
                    txt += getText(node);
                } while ((node = node.nextSibling));
            }

            return txt;
        }

        function stepThroughMatches(node, matches, replaceFn) {
            var startNode, endNode, startNodeIndex,
                endNodeIndex, innerNodes = [],
                atIndex = 0,
                curNode = node,
                matchLocation = matches.shift(),
                matchIndex = 0;

            out: while (true) {
                //if (blockElementsMap[curNode.nodeName] || shortEndedElementsMap[curNode.nodeName] || isContentEditableFalse(curNode)) {
                if (blockElementsMap[curNode.nodeName] || shortEndedElementsMap[curNode.nodeName]) {
                    atIndex++;
                }

                if (curNode.nodeType === 3) {
                    if (!endNode && curNode.length + atIndex >= matchLocation[1]) {
                        // We've found the ending
                        endNode = curNode;
                        endNodeIndex = matchLocation[1] - atIndex;
                    } else if (startNode) {
                        // Intersecting node
                        innerNodes.push(curNode);
                    }

                    if (!startNode && curNode.length + atIndex > matchLocation[0]) {
                        // We've found the match start
                        startNode = curNode;
                        startNodeIndex = matchLocation[0] - atIndex;
                    }

                    atIndex += curNode.length;
                }

                if (startNode && endNode) {
                    curNode = replaceFn({
                        startNode: startNode,
                        startNodeIndex: startNodeIndex,
                        endNode: endNode,
                        endNodeIndex: endNodeIndex,
                        innerNodes: innerNodes,
                        match: matchLocation[2],
                        matchIndex: matchIndex
                    });

                    // replaceFn has to return the node that replaced the endNode
                    // and then we step back so we can continue from the end of the
                    // match:
                    atIndex -= (endNode.length - endNodeIndex);
                    startNode = null;
                    endNode = null;
                    innerNodes = [];
                    matchLocation = matches.shift();
                    matchIndex++;

                    if (!matchLocation) {
                        break; // no more matches
                    }
                } else if ((!hiddenTextElementsMap[curNode.nodeName] || blockElementsMap[curNode.nodeName]) && curNode.firstChild) {
                    //if (!isContentEditableFalse(curNode)) {
                    // Move down
                    curNode = curNode.firstChild;
                    continue;
                    //}
                } else if (curNode.nextSibling) {
                    // Move forward:
                    curNode = curNode.nextSibling;
                    continue;
                }

                // Move forward or up:
                while (true) {
                    if (curNode.nextSibling) {
                        curNode = curNode.nextSibling;
                        break;
                    } else if (curNode.parentNode !== node) {
                        curNode = curNode.parentNode;
                    } else {
                        break out;
                    }
                }
            }
        }

        /**
         * Generates the actual replaceFn which splits up text nodes
         * and inserts the replacement element.
         */
        function genReplacer(nodeName) {
            var makeReplacementNode;

            if (typeof nodeName != 'function') {
                var stencilNode = nodeName.nodeType ? nodeName : doc.createElement(nodeName);

                makeReplacementNode = function (fill, matchIndex) {
                    var clone = stencilNode.cloneNode(false);

                    clone.setAttribute('data-mce-index', matchIndex);

                    if (fill) {
                        clone.appendChild(doc.createTextNode(fill));
                    }

                    return clone;
                };
            } else {
                makeReplacementNode = nodeName;
            }

            return function (range) {
                var before, after, parentNode, startNode = range.startNode,
                    endNode = range.endNode,
                    matchIndex = range.matchIndex;

                if (startNode === endNode) {
                    var node = startNode;

                    parentNode = node.parentNode;
                    if (range.startNodeIndex > 0) {
                        // Add `before` text node (before the match)
                        before = doc.createTextNode(node.data.substring(0, range.startNodeIndex));
                        parentNode.insertBefore(before, node);
                    }

                    // Create the replacement node:
                    var el = makeReplacementNode(range.match[0], matchIndex);
                    parentNode.insertBefore(el, node);
                    if (range.endNodeIndex < node.length) {
                        // Add `after` text node (after the match)
                        after = doc.createTextNode(node.data.substring(range.endNodeIndex));
                        parentNode.insertBefore(after, node);
                    }

                    node.parentNode.removeChild(node);

                    return el;
                }

                // Replace startNode -> [innerNodes...] -> endNode (in that order)
                before = doc.createTextNode(startNode.data.substring(0, range.startNodeIndex));
                after = doc.createTextNode(endNode.data.substring(range.endNodeIndex));
                var elA = makeReplacementNode(startNode.data.substring(range.startNodeIndex), matchIndex);
                var innerEls = [];

                for (var i = 0, l = range.innerNodes.length; i < l; ++i) {
                    var innerNode = range.innerNodes[i];
                    var innerEl = makeReplacementNode(innerNode.data, matchIndex);
                    innerNode.parentNode.replaceChild(innerEl, innerNode);
                    innerEls.push(innerEl);
                }

                var elB = makeReplacementNode(endNode.data.substring(0, range.endNodeIndex), matchIndex);

                parentNode = startNode.parentNode;
                parentNode.insertBefore(before, startNode);
                parentNode.insertBefore(elA, startNode);
                parentNode.removeChild(startNode);

                parentNode = endNode.parentNode;
                parentNode.insertBefore(elB, endNode);
                parentNode.insertBefore(after, endNode);
                parentNode.removeChild(endNode);

                return elB;
            };
        }

        text = getText(node);

        if (!text) {
            return;
        }

        if (regex.global) {
            while ((m = regex.exec(text))) {
                matches.push(getMatchIndexes(m, captureGroup));
            }
        } else {
            m = text.match(regex);
            matches.push(getMatchIndexes(m, captureGroup));
        }

        if (matches.length) {
            count = matches.length;
            stepThroughMatches(node, matches, genReplacer(replacementNode));
        }

        return count;
    }

    tinymce.create('tinymce.plugins.SearchReplacePlugin', {
        init: function (editor, url) {
            var self = this,
                last, currentIndex = -1;

            function notFoundAlert() {
                editor.windowManager.alert(editor.getLang('searchreplace_dlg.notfound', 'The search has been completed. The search string could not be found.'));
            }

            editor.updateSearchButtonStates = new tinymce.util.Dispatcher(this);

            editor.addCommand('mceSearchReplace', function () {
                last = {};

                var html = '' +
                    '<div class="mceForm">' +
                    '<div class="mceModalRow">' +
                    '   <label for="' + editor.id + '_search_string">' + editor.getLang('searchreplace.findwhat', 'Search') + '</label>' +
                    '   <div class="mceModalControl">' +
                    '       <input type="text" id="' + editor.id + '_search_string" />' +
                    '   </div>' +
                    '   <div class="mceModalControl mceModalFlexNone">' +
                    '       <button class="mceButton" id="' + editor.id + '_search_prev" title="' + editor.getLang('searchreplace.prev', 'Previous') + '" disabled><i class="mceIcon mce_arrow-up"></i></button>' +
                    '       <button class="mceButton" id="' + editor.id + '_search_next" title="' + editor.getLang('searchreplace.next', 'Next') + '" disabled><i class="mceIcon mce_arrow-down"></i></button>' +
                    '   </div>' +
                    '</div>' +
                    '<div class="mceModalRow">' +
                    '   <label for="' + editor.id + '_replace_string">' + editor.getLang('searchreplace.replacewith', 'Replace') + '</label>' +
                    '   <div class="mceModalControl">' +
                    '       <input type="text" id="' + editor.id + '_replace_string" />' +
                    '   </div>' +
                    '</div>' +
                    '<div class="mceModalRow">' +
                    '   <div class="mceModalControl">' +
                    '       <input id="' + editor.id + '_matchcase" type="checkbox" />' +
                    '       <label for="' + editor.id + '_matchcase">' + editor.getLang('searchreplace.mcase', 'Match Case') + '</label>' +
                    '   </div>' +
                    '   <div class="mceModalControl">' +
                    '       <input id="' + editor.id + '_wholewords" type="checkbox" />' +
                    '       <label for="' + editor.id + '_wholewords">' + editor.getLang('searchreplace.wholewords', 'Whole Words') + '</label>' +
                    '   </div>' +
                    '</div>' +
                    '</div>';

                editor.windowManager.open({
                    title: editor.getLang('searchreplace.search_desc', 'Search and Replace'),
                    content: html,
                    size: 'mce-modal-landscape-small',
                    overlay: false,
                    open: function () {
                        var id = this.id;

                        var search = DOM.get(editor.id + '_search_string');

                        search.value = editor.selection.getContent({
                            format: 'text'
                        });

                        DOM.bind(editor.id + '_search_next', 'click', function (e) {
                            e.preventDefault();

                            editor.execCommand('mceSearchNext', false);
                        });

                        DOM.bind(editor.id + '_search_prev', 'click', function (e) {
                            e.preventDefault();

                            editor.execCommand('mceSearchPrev', false);
                        });

                        window.setTimeout(function () {
                            search.focus();
                        }, 10);

                        editor.updateSearchButtonStates.add(function (obj) {
                            tinymce.each(obj, function (val, key) {
                                var elm = DOM.get(editor.id + '_search_' + key) || DOM.get(id + '_search_' + key);

                                if (!elm) {
                                    return;
                                }

                                elm.disabled = !!val;
                            });
                        });
                    },
                    close: function () {
                        DOM.unbind(editor.id + '_search_next', 'click');
                        DOM.unbind(editor.id + '_search_prev', 'click');

                        editor.execCommand('mceSearchDone', false);
                    },
                    buttons: [
                        {
                            title: editor.getLang('searchreplace.find', 'Find'),
                            id: 'find',
                            onclick: function (e) {
                                e.preventDefault();

                                var matchcase = DOM.get(editor.id + '_matchcase');
                                var wholeword = DOM.get(editor.id + '_wholewords');

                                var text = DOM.getValue(editor.id + '_search_string');


                                editor.execCommand('mceSearch', false, {
                                    "textcase": !!matchcase.checked,
                                    "text": text,
                                    "wholeword": !!wholeword.checked
                                });
                            },
                            classes: 'primary'
                        }, {
                            title: editor.getLang('searchreplace.replace', 'Replace'),
                            id: 'search_replace',
                            onclick: function (e) {
                                e.preventDefault();

                                var value = DOM.getValue(editor.id + '_replace_string');
                                editor.execCommand('mceReplace', false, value);
                            }
                        }, {
                            title: editor.getLang('searchreplace.replaceall', 'Replace All'),
                            id: 'search_replaceall',
                            onclick: function (e) {
                                e.preventDefault();

                                var value = DOM.getValue(editor.id + '_replace_string');
                                editor.execCommand('mceReplaceAll', false, value);
                            }
                        }
                    ]
                });
            });

            function updateButtonStates() {
                editor.updateSearchButtonStates.dispatch({
                    "next": !findSpansByIndex(currentIndex + 1).length,
                    "prev": !findSpansByIndex(currentIndex - 1).length
                });
            }

            function resetButtonStates() {
                editor.updateSearchButtonStates.dispatch({
                    "replace": true,
                    "replaceAll": true,
                    "next": true,
                    "prev": true
                });
            }

            editor.addCommand('mceSearch', function (ui, e) {
                var count, text = e.text,
                    caseState = e.textcase,
                    wholeWord = e.wholeword;

                if (!text.length) {
                    self.done(false);

                    // disable all
                    resetButtonStates();

                    return;
                }

                if (last.text == text && last.caseState == caseState && last.wholeWord == wholeWord) {
                    if (findSpansByIndex(currentIndex + 1).length === 0) {
                        notFoundAlert();
                        return;
                    }

                    self.next();

                    updateButtonStates();

                    return;
                }

                count = self.find(text, caseState, wholeWord);

                if (!count) {
                    notFoundAlert();
                }

                updateButtonStates();

                editor.updateSearchButtonStates.dispatch({
                    "replace": !count,
                    "replaceAll": !count
                });

                last = {
                    text: text,
                    caseState: caseState,
                    wholeWord: wholeWord
                };
            });

            editor.addCommand('mceSearchNext', function () {
                self.next();
                updateButtonStates();
            });

            editor.addCommand('mceSearchPrev', function () {
                self.prev();
                updateButtonStates();
            });

            editor.addCommand('mceReplace', function (ui, text) {
                if (!self.replace(text)) {
                    resetButtonStates();

                    currentIndex = -1;
                    last = {};
                }
            });

            editor.addCommand('mceReplaceAll', function (ui, text) {
                if (!self.replace(text, true, true)) {
                    resetButtonStates();

                    last = {};
                }
            });

            editor.addCommand('mceSearchDone', function () {
                self.done();
            });

            // Register buttons
            editor.addButton('search', {
                title: 'searchreplace.search_desc',
                cmd: 'mceSearchReplace'
            });

            editor.addShortcut('meta+f', 'searchreplace.search_desc', function () {
                return editor.execCommand('mceSearchReplace');
            });

            function getElmIndex(elm) {
                var value = elm.getAttribute('data-mce-index');

                if (typeof value == "number") {
                    return "" + value;
                }

                return value;
            }

            function markAllMatches(regex) {
                var node, marker;

                marker = editor.dom.create('span', {
                    "data-mce-bogus": 1
                });

                marker.className = 'mce-match-marker'; // IE 7 adds class="mce-match-marker" and class=mce-match-marker
                node = editor.getBody();

                self.done(false);

                return findAndReplaceDOMText(regex, node, marker, false, editor.schema);
            }

            function unwrap(node) {
                var parentNode = node.parentNode;

                if (node.firstChild) {
                    parentNode.insertBefore(node.firstChild, node);
                }

                node.parentNode.removeChild(node);
            }

            function findSpansByIndex(index) {
                var nodes, spans = [];

                nodes = tinymce.toArray(editor.getBody().getElementsByTagName('span'));
                if (nodes.length) {
                    for (var i = 0; i < nodes.length; i++) {
                        var nodeIndex = getElmIndex(nodes[i]);

                        if (nodeIndex === null || !nodeIndex.length) {
                            continue;
                        }

                        if (nodeIndex === index.toString()) {
                            spans.push(nodes[i]);
                        }
                    }
                }

                return spans;
            }

            function moveSelection(forward) {
                var testIndex = currentIndex,
                    dom = editor.dom;

                forward = forward !== false;

                if (forward) {
                    testIndex++;
                } else {
                    testIndex--;
                }

                dom.removeClass(findSpansByIndex(currentIndex), 'mce-match-marker-selected');

                var spans = findSpansByIndex(testIndex);

                if (spans.length) {
                    dom.addClass(findSpansByIndex(testIndex), 'mce-match-marker-selected');
                    editor.selection.scrollIntoView(spans[0]);
                    return testIndex;
                }

                return -1;
            }

            function removeNode(node) {
                var dom = editor.dom,
                    parent = node.parentNode;

                dom.remove(node);

                if (dom.isEmpty(parent)) {
                    dom.remove(parent);
                }
            }

            function isMatchSpan(node) {
                var matchIndex = getElmIndex(node);

                return matchIndex !== null && matchIndex.length > 0;
            }

            self.find = function (text, matchCase, wholeWord) {
                text = text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                text = wholeWord ? '\\b' + text + '\\b' : text;

                var count = markAllMatches(new RegExp(text, matchCase ? 'g' : 'gi'));

                if (count) {
                    currentIndex = -1;
                    currentIndex = moveSelection(true);
                }

                return count;
            };

            self.next = function () {
                var index = moveSelection(true);

                if (index !== -1) {
                    currentIndex = index;
                }
            };

            self.prev = function () {
                var index = moveSelection(false);

                if (index !== -1) {
                    currentIndex = index;
                }
            };

            function isMatchSpan(node) {
                var matchIndex = getElmIndex(node);

                return matchIndex !== null && matchIndex.length > 0;
            }

            self.replace = function (text, forward, all) {
                var i, nodes, node, matchIndex, currentMatchIndex, nextIndex = currentIndex,
                    hasMore;

                forward = forward !== false;

                node = editor.getBody();
                nodes = tinymce.grep(tinymce.toArray(node.getElementsByTagName('span')), isMatchSpan);

                // filter nodes so that only those that are contenteditable or within a contenteditable parent can be replaced
                nodes = tinymce.grep(nodes, function (node) {
                    var parent = editor.dom.getParent(node, '[contenteditable]');

                    if (parent && parent.contentEditable === 'false') {
                        return false;
                    }

                    return node.contentEditable !== 'false';
                });

                for (i = 0; i < nodes.length; i++) {
                    var nodeIndex = getElmIndex(nodes[i]);

                    matchIndex = currentMatchIndex = parseInt(nodeIndex, 10);
                    if (all || matchIndex === currentIndex) {
                        if (text.length) {
                            nodes[i].firstChild.nodeValue = text;
                            unwrap(nodes[i]);
                        } else {
                            removeNode(nodes[i]);
                        }

                        while (nodes[++i]) {
                            matchIndex = parseInt(getElmIndex(nodes[i]), 10);

                            if (matchIndex === currentMatchIndex) {
                                removeNode(nodes[i]);
                            } else {
                                i--;
                                break;
                            }
                        }

                        if (forward) {
                            nextIndex--;
                        }
                    } else if (currentMatchIndex > currentIndex) {
                        nodes[i].setAttribute('data-mce-index', currentMatchIndex - 1);
                    }
                }

                editor.undoManager.add();
                currentIndex = nextIndex;

                if (forward) {
                    hasMore = findSpansByIndex(nextIndex + 1).length > 0;
                    self.next();
                } else {
                    hasMore = findSpansByIndex(nextIndex - 1).length > 0;
                    self.prev();
                }

                return !all && hasMore;
            };

            self.done = function (keepEditorSelection) {
                var i, nodes, startContainer, endContainer;

                nodes = tinymce.toArray(editor.getBody().getElementsByTagName('span'));
                for (i = 0; i < nodes.length; i++) {
                    var nodeIndex = getElmIndex(nodes[i]);

                    if (nodeIndex !== null && nodeIndex.length) {
                        if (nodeIndex === currentIndex.toString()) {
                            if (!startContainer) {
                                startContainer = nodes[i].firstChild;
                            }

                            endContainer = nodes[i].firstChild;
                        }

                        unwrap(nodes[i]);
                    }
                }

                if (startContainer && endContainer) {
                    var rng = editor.dom.createRng();
                    rng.setStart(startContainer, 0);
                    rng.setEnd(endContainer, endContainer.data.length);

                    if (keepEditorSelection !== false) {
                        editor.selection.setRng(rng);
                    }

                    return rng;
                }
            };
        }
    });

    // Register plugin
    tinymce.PluginManager.add('searchreplace', tinymce.plugins.SearchReplacePlugin);
})();