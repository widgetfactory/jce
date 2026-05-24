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

import findAndReplaceDOMText from './FindAndReplace.js';
import { openDialog } from './Dialog.js';

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
        var i, nodes, startContainer, endContainer;

        nodes = ibis.toArray(editor.getBody().getElementsByTagName('span'));
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
                var scrollTarget = startContainer.parentNode;
                window.setTimeout(function () {
                    editor.selection.scrollIntoView(scrollTarget);
                }, 0);
            }

            return rng;
        }
    };
});
