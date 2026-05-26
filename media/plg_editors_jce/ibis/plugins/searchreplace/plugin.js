(function () {
    'use strict';

    /* eslint-disable */

    /**
     * @package   	JCE
     * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
     * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
     *
     * Based on work developed by: James Padolsey http://james.padolsey.com
     * released under UNLICENSE that is compatible with LGPL
     *
     * TODO: Handle contentEditable edgecase:
     * <p>text<span contentEditable="false">text<span contentEditable="true">text</span>text</span>text</p>
     */

    /*eslint no-labels:0, no-constant-condition: 0 */

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
                if (blockElementsMap[curNode.nodeName] || shortEndedElementsMap[curNode.nodeName]) {
                    atIndex++;
                }

                if (curNode.nodeType === 3) {
                    if (!endNode && curNode.length + atIndex >= matchLocation[1]) {
                        endNode = curNode;
                        endNodeIndex = matchLocation[1] - atIndex;
                    } else if (startNode) {
                        innerNodes.push(curNode);
                    }

                    if (!startNode && curNode.length + atIndex > matchLocation[0]) {
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

                    atIndex -= (endNode.length - endNodeIndex);
                    startNode = null;
                    endNode = null;
                    innerNodes = [];
                    matchLocation = matches.shift();
                    matchIndex++;

                    if (!matchLocation) {
                        break;
                    }
                } else if ((!hiddenTextElementsMap[curNode.nodeName] || blockElementsMap[curNode.nodeName]) && curNode.firstChild) {
                    curNode = curNode.firstChild;
                    continue;
                } else if (curNode.nextSibling) {
                    curNode = curNode.nextSibling;
                    continue;
                }

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
                        before = doc.createTextNode(node.data.substring(0, range.startNodeIndex));
                        parentNode.insertBefore(before, node);
                    }

                    var el = makeReplacementNode(range.match[0], matchIndex);
                    parentNode.insertBefore(el, node);
                    if (range.endNodeIndex < node.length) {
                        after = doc.createTextNode(node.data.substring(range.endNodeIndex));
                        parentNode.insertBefore(after, node);
                    }

                    node.parentNode.removeChild(node);

                    return el;
                }

                before = doc.createTextNode(startNode.data.substring(0, range.startNodeIndex));
                after = doc.createTextNode(endNode.data.substring(range.endNodeIndex));
                var elA = makeReplacementNode(startNode.data.substring(range.startNodeIndex), matchIndex);

                for (var i = 0, l = range.innerNodes.length; i < l; ++i) {
                    var innerNode = range.innerNodes[i];
                    var innerEl = makeReplacementNode(innerNode.data, matchIndex);
                    innerNode.parentNode.replaceChild(innerEl, innerNode);
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

    /**
     * @package   	JCE
     * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
     * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
     */

    function openDialog(editor, DOM) {
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
            '       <span id="' + editor.id + '_search_count" class="mceSearchCount mceText"></span>' +
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
            '<div class="mceModalRow">' +
            '   <div class="mceModalControl">' +
            '       <input id="' + editor.id + '_startattop" type="radio" name="' + editor.id + '_startpos" value="top" checked />' +
            '       <label for="' + editor.id + '_startattop">' + editor.getLang('searchreplace.startattop', 'Start at Top') + '</label>' +
            '   </div>' +
            '   <div class="mceModalControl">' +
            '       <input id="' + editor.id + '_startatcursor" type="radio" name="' + editor.id + '_startpos" value="cursor" />' +
            '       <label for="' + editor.id + '_startatcursor">' + editor.getLang('searchreplace.startatcursor', 'Start at Cursor') + '</label>' +
            '   </div>' +
            '</div>' +
            '</div>';

        editor.windowManager.open({
            title: editor.getLang('searchreplace.search_desc', 'Search and Replace'),
            content: html,
            size: 'mce-modal-landscape-medium',
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
                    ibis.each(obj, function (val, key) {
                        var elm = DOM.get(editor.id + '_search_' + key) || DOM.get(id + '_search_' + key);

                        if (!elm) {
                            return;
                        }

                        if (key === 'count') {
                            elm.textContent = val;
                        } else {
                            elm.disabled = !!val;
                        }
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
                        var startatcursor = DOM.get(editor.id + '_startatcursor');
                        var text = DOM.getValue(editor.id + '_search_string');

                        editor.execCommand('mceSearch', false, {
                            "textcase": !!matchcase.checked,
                            "text": text,
                            "wholeword": !!wholeword.checked,
                            "startatcursor": !!startatcursor.checked
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
    }

    /**
     * @package   	JCE
     * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
     * @copyright   Copyright 2009, Moxiecode Systems AB
     * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
     * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
     * JCE is free software. This version may have been modified pursuant
     * to the GNU General Public License, and as distributed it includes or
     * is derivative of works licensed under the GNU General Public License or
     * other free or open source software licenses.
     */


    var DOM = ibis.DOM;

    ibis.PluginManager.add('searchreplace', function (editor, url) {
        var self = this,
            last, currentIndex = -1, totalCount = 0, savedRange = null;

        function notFoundAlert() {
            editor.windowManager.alert(editor.getLang('searchreplace.notfound', 'The search has been completed. The search string could not be found.'));
        }

        editor.updateSearchButtonStates = new ibis.util.Dispatcher(this);

        editor.addCommand('mceSearchReplace', function () {
            last = {};
            savedRange = editor.selection.getRng();
            openDialog(editor, DOM);
        });

        function updateButtonStates() {
            editor.updateSearchButtonStates.dispatch({
                "next": !findSpansByIndex(currentIndex + 1).length,
                "prev": !findSpansByIndex(currentIndex - 1).length,
                "count": totalCount > 0 ? (currentIndex + 1) + ' / ' + totalCount : ''
            });
        }

        function resetButtonStates() {
            totalCount = 0;
            editor.updateSearchButtonStates.dispatch({
                "replace": true,
                "replaceAll": true,
                "next": true,
                "prev": true,
                "count": ''
            });
        }

        editor.addCommand('mceSearch', function (ui, e) {
            var count, text = e.text,
                caseState = e.textcase,
                wholeWord = e.wholeword,
                startAtCursor = e.startatcursor;

            if (!text.length) {
                self.done(false);

                // disable all
                resetButtonStates();

                return;
            }

            if (last.text == text && last.caseState == caseState && last.wholeWord == wholeWord && last.startAtCursor == startAtCursor) {
                if (findSpansByIndex(currentIndex + 1).length === 0) {
                    notFoundAlert();
                    return;
                }

                self.next();

                updateButtonStates();

                return;
            }

            count = self.find(text, caseState, wholeWord, startAtCursor);
            totalCount = count;

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
                wholeWord: wholeWord,
                startAtCursor: startAtCursor
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

            marker.className = 'mce-match-marker';
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

            nodes = ibis.toArray(editor.getBody().getElementsByTagName('span'));
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

        // Returns the character offset of (targetNode, targetOffset) within body,
        // counting text-node characters only (same units as findFirstIndexAfterOffset).
        function getNodeTextOffset(body, targetNode, targetOffset) {
            var offset = 0;

            function countChildren(node, upToIndex) {
                for (var i = 0; i < upToIndex && i < node.childNodes.length; i++) {
                    countAll(node.childNodes[i]);
                }
            }

            function countAll(node) {
                if (node.nodeType === 3) {
                    offset += node.nodeValue.length;
                    return;
                }
                for (var i = 0; i < node.childNodes.length; i++) {
                    countAll(node.childNodes[i]);
                }
            }

            function walk(node) {
                if (node === targetNode) {
                    if (node.nodeType === 3) {
                        offset += targetOffset;
                    } else {
                        countChildren(node, targetOffset);
                    }
                    return true;
                }
                if (node.nodeType === 3) {
                    offset += node.nodeValue.length;
                    return false;
                }
                for (var i = 0; i < node.childNodes.length; i++) {
                    if (walk(node.childNodes[i])) {
                        return true;
                    }
                }
                return false;
            }

            walk(body);
            return offset;
        }

        // After markAllMatches, find the first match index whose span starts at or
        // after cursorOffset characters into the body text. Wraps to first if none found.
        function findFirstIndexAfterOffset(cursorOffset) {
            var dom = editor.dom;
            var body = editor.getBody();
            var offset = 0;
            var seenIndices = {};
            var result = { index: -1, span: null };

            function walk(node) {
                if (result.index !== -1) {
                    return;
                }

                if (node.nodeType === 3) {
                    offset += node.nodeValue.length;
                    return;
                }

                var matchIndex = getElmIndex(node);
                if (matchIndex !== null && matchIndex.length) {
                    var idx = parseInt(matchIndex, 10);
                    if (!seenIndices[idx]) {
                        seenIndices[idx] = true;
                        if (offset >= cursorOffset) {
                            result.index = idx;
                            result.span = node;
                            return;
                        }
                    }
                    // Count text inside this span and continue
                    var inner = node.textContent !== undefined ? node.textContent : (node.innerText || '');
                    offset += inner.length;
                    return;
                }

                for (var i = 0; i < node.childNodes.length; i++) {
                    walk(node.childNodes[i]);
                }
            }

            walk(body);

            if (result.index !== -1) {
                dom.addClass(findSpansByIndex(result.index), 'mce-match-marker-selected');
                editor.selection.scrollIntoView(result.span);
                return result.index;
            }

            // No match at or after cursor — wrap to first
            return moveSelection(true);
        }

        self.find = function (text, matchCase, wholeWord, startAtCursor) {
            text = text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            text = wholeWord ? '\\b' + text + '\\b' : text;

            var cursorOffset = -1;
            if (startAtCursor && savedRange) {
                cursorOffset = getNodeTextOffset(editor.getBody(), savedRange.startContainer, savedRange.startOffset);
            }

            var count = markAllMatches(new RegExp(text, matchCase ? 'g' : 'gi'));

            if (count) {
                currentIndex = -1;
                currentIndex = cursorOffset >= 0 ? findFirstIndexAfterOffset(cursorOffset) : moveSelection(true);
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

        self.replace = function (text, forward, all) {
            var i, nodes, node, matchIndex, currentMatchIndex, nextIndex = currentIndex,
                hasMore;

            forward = forward !== false;

            node = editor.getBody();
            nodes = ibis.grep(ibis.toArray(node.getElementsByTagName('span')), isMatchSpan);

            // filter nodes so that only those that are contenteditable or within a contenteditable parent can be replaced
            nodes = ibis.grep(nodes, function (node) {
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
            var i, nodes, startContainer, endContainer, scrollBookmark;

            nodes = ibis.toArray(editor.getBody().getElementsByTagName('span'));

            // Insert a temporary bookmark element before the first match span so we
            // have a stable element to scroll to after all match spans are unwrapped.
            // Using an element (rather than startContainer.parentNode) handles the edge
            // case where text sits directly in the body.
            if (keepEditorSelection !== false && currentIndex >= 0) {
                for (i = 0; i < nodes.length; i++) {
                    if (getElmIndex(nodes[i]) === currentIndex.toString()) {
                        scrollBookmark = editor.dom.create('span', { 'data-mce-type': 'bookmark', 'data-mce-bogus': '1' });
                        nodes[i].parentNode.insertBefore(scrollBookmark, nodes[i]);
                        break;
                    }
                }
            }

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

                    if (scrollBookmark) {
                        window.setTimeout(function () {
                            editor.selection.scrollIntoView(scrollBookmark);
                            editor.dom.remove(scrollBookmark);
                        }, 0);
                    }
                }

                return rng;
            }

            if (scrollBookmark) {
                editor.dom.remove(scrollBookmark);
            }
        };
    });

})();
