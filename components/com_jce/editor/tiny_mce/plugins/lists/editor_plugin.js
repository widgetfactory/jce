/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */
/*eslint consistent-this:0 */


(function () {
    function isListNode(node) {
        return node && (/^(OL|UL|DL)$/).test(node.nodeName);
    }

    function isFirstChild(node) {
        return node.parentNode.firstChild == node;
    }

    function isLastChild(node) {
        return node.parentNode.lastChild == node;
    }

    tinymce.create('tinymce.plugins.Lists', {
        init: function (editor) {
            var self = this;

            function isTextBlock(node) {
                return node && !!editor.schema.getTextBlockElements()[node.nodeName];
            }

            function isEmpty(elm, keepBookmarks) {
                var empty = editor.dom.isEmpty(elm);

                if (keepBookmarks && editor.dom.select('span[data-mce-type=bookmark]').length > 0) {
                    return false;
                }

                return empty;
            }

            /**
             * Returns a range bookmark. This will convert indexed bookmarks into temporary span elements with
             * index 0 so that they can be restored properly after the editor.dom.has been modified. Text bookmarks will not have spans
             * added to them since they can be restored after a editor.dom.operation.
             *
             * So this: <p><b>|</b><b>|</b></p>
             * becomes: <p><b><span data-mce-type="bookmark">|</span></b><b data-mce-type="bookmark">|</span></b></p>
             *
             * @param  {DOMRange} rng editor.dom.Range to get bookmark on.
             * @return {Object} Bookmark object.
             */
            function createBookmark(rng) {
                var bookmark = {};

                function setupEndPoint(start) {
                    var offsetNode, container, offset;

                    container = rng[start ? 'startContainer' : 'endContainer'];
                    offset = rng[start ? 'startOffset' : 'endOffset'];

                    if (container.nodeType == 1) {
                        offsetNode = editor.dom.create('span', {'data-mce-type': 'bookmark'});

                        if (container.hasChildNodes()) {
                            offset = Math.min(offset, container.childNodes.length - 1);

                            if (start) {
                                container.insertBefore(offsetNode, container.childNodes[offset]);
                            } else {
                                editor.dom.insertAfter(offsetNode, container.childNodes[offset]);
                            }
                        } else {
                            container.appendChild(offsetNode);
                        }

                        container = offsetNode;
                        offset = 0;
                    }

                    bookmark[start ? 'startContainer' : 'endContainer'] = container;
                    bookmark[start ? 'startOffset' : 'endOffset'] = offset;
                }

                setupEndPoint(true);

                if (!rng.collapsed) {
                    setupEndPoint();
                }

                return bookmark;
            }

            /**
             * Moves the editor.selection.to the current bookmark and removes any editor.selection.container wrappers.
             *
             * @param {Object} bookmark Bookmark object to move editor.selection.to.
             */
            function moveToBookmark(bookmark) {
                function restoreEndPoint(start) {
                    var container, offset, node;

                    function nodeIndex(container) {
                        var node = container.parentNode.firstChild, idx = 0;

                        while (node) {
                            if (node == container) {
                                return idx;
                            }

                            // Skip data-mce-type=bookmark nodes
                            if (node.nodeType != 1 || node.getAttribute('data-mce-type') != 'bookmark') {
                                idx++;
                            }

                            node = node.nextSibling;
                        }

                        return -1;
                    }

                    container = node = bookmark[start ? 'startContainer' : 'endContainer'];
                    offset = bookmark[start ? 'startOffset' : 'endOffset'];

                    if (!container) {
                        return;
                    }

                    if (container.nodeType == 1) {
                        offset = nodeIndex(container);
                        container = container.parentNode;
                        editor.dom.remove(node);
                    }

                    bookmark[start ? 'startContainer' : 'endContainer'] = container;
                    bookmark[start ? 'startOffset' : 'endOffset'] = offset;
                }

                restoreEndPoint(true);
                restoreEndPoint();

                var rng = editor.dom.createRng();

                rng.setStart(bookmark.startContainer, bookmark.startOffset);

                if (bookmark.endContainer) {
                    rng.setEnd(bookmark.endContainer, bookmark.endOffset);
                }

                editor.selection.setRng(rng);
            }

            function createNewTextBlock(contentNode, blockName) {
                var node, textBlock, fragment = editor.dom.createFragment(), hasContentNode;
                var blockElements = editor.schema.getBlockElements();

                if (editor.settings.forced_root_block) {
                    blockName = blockName || editor.settings.forced_root_block;
                }

                if (blockName) {
                    textBlock = editor.dom.create(blockName);

                    if (textBlock.tagName === editor.settings.forced_root_block) {
                        editor.dom.setAttribs(textBlock, editor.settings.forced_root_block_attrs);
                    }

                    fragment.appendChild(textBlock);
                }

                if (contentNode) {
                    while ((node = contentNode.firstChild)) {
                        var nodeName = node.nodeName;

                        if (!hasContentNode && (nodeName != 'SPAN' || node.getAttribute('data-mce-type') != 'bookmark')) {
                            hasContentNode = true;
                        }

                        if (blockElements[nodeName]) {
                            fragment.appendChild(node);
                            textBlock = null;
                        } else {
                            if (blockName) {
                                if (!textBlock) {
                                    textBlock = editor.dom.create(blockName);
                                    fragment.appendChild(textBlock);
                                }

                                textBlock.appendChild(node);
                            } else {
                                fragment.appendChild(node);
                            }
                        }
                    }
                }

                if (!editor.settings.forced_root_block) {
                    fragment.appendChild(editor.dom.create('br'));
                } else {
                    // BR is needed in empty blocks on non IE browsers
                    if (!hasContentNode && (!tinymce.isIE || (tinymce.isIE10 || tinymce.isIE11 || tinymce.isIE12))) {
                        textBlock.appendChild(editor.dom.create('br', {'data-mce-bogus': '1'}));
                    }
                }

                return fragment;
            }

            function getSelectedListItems() {
                return tinymce.grep(editor.selection.getSelectedBlocks(), function (block) {
                    return /^(LI|DT|DD)$/.test(block.nodeName);
                });
            }

            function splitList(ul, li, newBlock) {
                var tmpRng, fragment, bookmarks, node;

                function removeAndKeepBookmarks(targetNode) {
                    tinymce.each(bookmarks, function (node) {
                        targetNode.parentNode.insertBefore(node, li.parentNode);
                    });

                    editor.dom.remove(targetNode);
                }

                bookmarks = editor.dom.select('span[data-mce-type="bookmark"]', ul);
                newBlock = newBlock || createNewTextBlock(li);
                tmpRng = editor.dom.createRng();
                tmpRng.setStartAfter(li);
                tmpRng.setEndAfter(ul);
                fragment = tmpRng.extractContents();

                for (node = fragment.firstChild; node; node = node.firstChild) {
                    if (node.nodeName == 'LI' && editor.dom.isEmpty(node)) {
                        editor.dom.remove(node);
                        break;
                    }
                }

                if (!editor.dom.isEmpty(fragment)) {
                    editor.dom.insertAfter(fragment, ul);
                }

                editor.dom.insertAfter(newBlock, ul);

                if (isEmpty(li.parentNode)) {
                    removeAndKeepBookmarks(li.parentNode);
                }

                editor.dom.remove(li);

                if (isEmpty(ul)) {
                    editor.dom.remove(ul);
                }
            }

            function mergeWithAdjacentLists(listBlock) {
                var sibling, node;

                sibling = listBlock.nextSibling;
                if (sibling && isListNode(sibling) && sibling.nodeName == listBlock.nodeName) {
                    while ((node = sibling.firstChild)) {
                        listBlock.appendChild(node);
                    }

                    editor.dom.remove(sibling);
                }

                sibling = listBlock.previousSibling;
                if (sibling && isListNode(sibling) && sibling.nodeName == listBlock.nodeName) {
                    while ((node = sibling.firstChild)) {
                        listBlock.insertBefore(node, listBlock.firstChild);
                    }

                    editor.dom.remove(sibling);
                }
            }

            /**
             * Normalizes the all lists in the specified element.
             */
            function normalizeList(element) {
                tinymce.each(tinymce.grep(editor.dom.select('ol,ul', element)), function (ul) {
                    var sibling, parentNode = ul.parentNode;

                    // Move UL/OL to previous LI if it's the only child of a LI
                    if (parentNode.nodeName == 'LI' && parentNode.firstChild == ul) {
                        sibling = parentNode.previousSibling;
                        if (sibling && sibling.nodeName == 'LI') {
                            sibling.appendChild(ul);

                            if (isEmpty(parentNode)) {
                                editor.dom.remove(parentNode);
                            }
                        }
                    }

                    // Append OL/UL to previous LI if it's in a parent OL/UL i.e. old HTML4
                    if (isListNode(parentNode)) {
                        sibling = parentNode.previousSibling;
                        if (sibling && sibling.nodeName == 'LI') {
                            sibling.appendChild(ul);
                        }
                    }
                });
            }

            function outdent(li) {
                var ul = li.parentNode, ulParent = ul.parentNode, newBlock;

                function removeEmptyLi(li) {
                    if (isEmpty(li)) {
                        editor.dom.remove(li);
                    }
                }

                if (li.nodeName == 'DD') {
                    editor.dom.rename(li, 'DT');
                    return true;
                }

                if (isFirstChild(li) && isLastChild(li)) {
                    if (ulParent.nodeName == "LI") {
                        editor.dom.insertAfter(li, ulParent);
                        removeEmptyLi(ulParent);
                        editor.dom.remove(ul);
                    } else if (isListNode(ulParent)) {
                        editor.dom.remove(ul, true);
                    } else {
                        ulParent.insertBefore(createNewTextBlock(li), ul);
                        editor.dom.remove(ul);
                    }

                    return true;
                } else if (isFirstChild(li)) {
                    if (ulParent.nodeName == "LI") {
                        editor.dom.insertAfter(li, ulParent);
                        li.appendChild(ul);
                        removeEmptyLi(ulParent);
                    } else if (isListNode(ulParent)) {
                        ulParent.insertBefore(li, ul);
                    } else {
                        ulParent.insertBefore(createNewTextBlock(li), ul);
                        editor.dom.remove(li);
                    }

                    return true;
                } else if (isLastChild(li)) {
                    if (ulParent.nodeName == "LI") {
                        editor.dom.insertAfter(li, ulParent);
                    } else if (isListNode(ulParent)) {
                        editor.dom.insertAfter(li, ul);
                    } else {
                        editor.dom.insertAfter(createNewTextBlock(li), ul);
                        editor.dom.remove(li);
                    }

                    return true;
                }

                if (ulParent.nodeName == 'LI') {
                    ul = ulParent;
                    newBlock = createNewTextBlock(li, 'LI');
                } else if (isListNode(ulParent)) {
                    newBlock = createNewTextBlock(li, 'LI');
                } else {
                    newBlock = createNewTextBlock(li);
                }

                splitList(ul, li, newBlock);
                normalizeList(ul.parentNode);

                return true;
            }

            function indent(li) {
                var sibling, newList;

                function mergeLists(from, to) {
                    var node;

                    if (isListNode(from)) {
                        while ((node = li.lastChild.firstChild)) {
                            to.appendChild(node);
                        }

                        editor.dom.remove(from);
                    }
                }

                if (li.nodeName == 'DT') {
                    editor.dom.rename(li, 'DD');
                    return true;
                }

                sibling = li.previousSibling;

                if (sibling && isListNode(sibling)) {
                    sibling.appendChild(li);
                    return true;
                }

                if (sibling && sibling.nodeName == 'LI' && isListNode(sibling.lastChild)) {
                    sibling.lastChild.appendChild(li);
                    mergeLists(li.lastChild, sibling.lastChild);
                    return true;
                }

                sibling = li.nextSibling;

                if (sibling && isListNode(sibling)) {
                    sibling.insertBefore(li, sibling.firstChild);
                    return true;
                }

                /*if (sibling && sibling.nodeName == 'LI' && isListNode(li.lastChild)) {
                    return false;
                }*/

                sibling = li.previousSibling;
                if (sibling && sibling.nodeName == 'LI') {
                    newList = editor.dom.create(li.parentNode.nodeName);
                    sibling.appendChild(newList);
                    newList.appendChild(li);
                    mergeLists(li.lastChild, newList);
                    return true;
                }

                return false;
            }

            function indentSelection() {
                var listElements = getSelectedListItems();

                if (listElements.length) {
                    var bookmark = createBookmark(editor.selection.getRng(true));

                    for (var i = 0; i < listElements.length; i++) {
                        if (!indent(listElements[i]) && i === 0) {
                            break;
                        }
                    }

                    moveToBookmark(bookmark);
                    editor.nodeChanged();

                    return true;
                }
            }

            function outdentSelection() {
                var listElements = getSelectedListItems();

                if (listElements.length) {
                    var bookmark = createBookmark(editor.selection.getRng(true));
                    var i, y, root = editor.getBody();

                    i = listElements.length;
                    while (i--) {
                        var node = listElements[i].parentNode;

                        while (node && node != root) {
                            y = listElements.length;
                            while (y--) {
                                if (listElements[y] === node) {
                                    listElements.splice(i, 1);
                                    break;
                                }
                            }

                            node = node.parentNode;
                        }
                    }

                    for (i = 0; i < listElements.length; i++) {
                        if (!outdent(listElements[i]) && i === 0) {
                            break;
                        }
                    }

                    moveToBookmark(bookmark);
                    editor.nodeChanged();

                    return true;
                }
            }

            function applyList(listName) {
                var rng = editor.selection.getRng(true), bookmark = createBookmark(rng), listItemName = 'LI';

                listName = listName.toUpperCase();

                if (listName == 'DL') {
                    listItemName = 'DT';
                }

                function getSelectedTextBlocks() {
                    var textBlocks = [], root = editor.getBody();

                    function isBookmarkNode(node) {
                        return node && node.tagName === 'SPAN' && node.getAttribute('data-mce-type') === 'bookmark';
                    }

                    function getEndPointNode(start) {
                        var container, offset;

                        container = rng[start ? 'startContainer' : 'endContainer'];
                        offset = rng[start ? 'startOffset' : 'endOffset'];

                        // Resolve node index
                        if (container.nodeType == 1) {
                            container = container.childNodes[Math.min(offset, container.childNodes.length - 1)] || container;
                        }

                        while (container.parentNode != root) {
                            if (isTextBlock(container)) {
                                return container;
                            }

                            if (/^(TD|TH)$/.test(container.parentNode.nodeName)) {
                                return container;
                            }

                            container = container.parentNode;
                        }

                        return container;
                    }

                    var startNode = getEndPointNode(true);
                    var endNode = getEndPointNode();
                    var block, siblings = [];

                    for (var node = startNode; node; node = node.nextSibling) {
                        siblings.push(node);

                        if (node == endNode) {
                            break;
                        }
                    }

                    tinymce.each(siblings, function (node) {
                        if (isTextBlock(node)) {
                            textBlocks.push(node);
                            block = null;
                            return;
                        }

                        if (editor.dom.isBlock(node) || node.nodeName == 'BR') {
                            if (node.nodeName == 'BR') {
                                editor.dom.remove(node);
                            }

                            block = null;
                            return;
                        }

                        var nextSibling = node.nextSibling;
                        if (isBookmarkNode(node)) {
                            if (isTextBlock(nextSibling) || (!nextSibling && node.parentNode == root)) {
                                block = null;
                                return;
                            }
                        }

                        if (!block) {
                            block = editor.dom.create('p');
                            node.parentNode.insertBefore(block, node);
                            textBlocks.push(block);
                        }

                        block.appendChild(node);
                    });

                    return textBlocks;
                }

                tinymce.each(getSelectedTextBlocks(), function (block) {
                    var listBlock, sibling;

                    sibling = block.previousSibling;
                    if (sibling && isListNode(sibling) && sibling.nodeName == listName) {
                        listBlock = sibling;
                        block = editor.dom.rename(block, listItemName);
                        sibling.appendChild(block);
                    } else {
                        listBlock = editor.dom.create(listName);
                        block.parentNode.insertBefore(listBlock, block);
                        listBlock.appendChild(block);
                        block = editor.dom.rename(block, listItemName);
                    }

                    mergeWithAdjacentLists(listBlock);
                });

                moveToBookmark(bookmark);
            }

            function removeList() {
                var bookmark = createBookmark(editor.selection.getRng(true)), root = editor.getBody();

                tinymce.each(getSelectedListItems(), function (li) {
                    var node, rootList;

                    if (isEmpty(li)) {
                        outdent(li);
                        return;
                    }

                    for (node = li; node && node != root; node = node.parentNode) {
                        if (isListNode(node)) {
                            rootList = node;
                        }
                    }

                    splitList(rootList, li);
                });

                moveToBookmark(bookmark);
            }

            function toggleList(listName) {
                var parentList = editor.dom.getParent(editor.selection.getStart(), 'OL,UL,DL');

                if (parentList) {
                    if (parentList.nodeName == listName) {
                        removeList(listName);
                    } else {
                        var bookmark = createBookmark(editor.selection.getRng(true));
                        mergeWithAdjacentLists(editor.dom.rename(parentList, listName));
                        moveToBookmark(bookmark);
                    }
                } else {
                    applyList(listName);
                }
            }

            function queryListCommandState(listName) {
                return function () {
                    var parentList = editor.dom.getParent(editor.selection.getStart(), 'UL,OL,DL');

                    return parentList && parentList.nodeName == listName;
                };
            }

            self.backspaceDelete = function (isForward) {
                var dom = editor.dom, selection = editor.seletion;

                function findNextCaretContainer(rng, isForward) {
                    var node = rng.startContainer, offset = rng.startOffset;
                    var nonEmptyBlocks, walker;

                    if (node.nodeType == 3 && (isForward ? offset < node.data.length : offset > 0)) {
                        return node;
                    }

                    nonEmptyBlocks = editor.schema.getNonEmptyElements();
                    if (node.nodeType == 1) {
						            node = tinymce.dom.RangeUtils.getNode(node, offset);
					          }
                    walker = new tinymce.dom.TreeWalker(rng.startContainer);

                    // Delete at <li>|<br></li> then jump over the bogus br
            				if (isForward) {
            					if (isBogusBr(node)) {
            						walker.next();
            					}
            				}

                    while ((node = walker[isForward ? 'next' : 'prev']())) {
                        if (node.nodeName == 'LI' && !node.hasChildNodes()) {
                            return node;
                        }

                        if (nonEmptyBlocks[node.nodeName]) {
                            return node;
                        }

                        if (node.nodeType == 3 && node.data.length > 0) {
                            return node;
                        }
                    }
                }

                function mergeLiElements(fromElm, toElm) {
                    var node, listNode, ul = fromElm.parentNode;

                    if (isListNode(toElm.lastChild)) {
                        listNode = toElm.lastChild;
                    }

                    node = toElm.lastChild;
                    if (node && node.nodeName == 'BR' && fromElm.hasChildNodes()) {
                        editor.dom.remove(node);
                    }

                    if (isEmpty(toElm, true)) {
                        editor.dom.empty(editor.dom.select(toElm));
                    }

                    if (!isEmpty(fromElm, true)) {
                        while ((node = fromElm.firstChild)) {
                            toElm.appendChild(node);
                        }
                    }

                    if (listNode) {
                        toElm.appendChild(listNode);
                    }

                    editor.dom.remove(fromElm);

                    if (isEmpty(ul)) {
                        editor.dom.remove(ul);
                    }
                }

                if (editor.selection.isCollapsed()) {
                    var li = editor.dom.getParent(editor.selection.getStart(), 'LI');

                    if (li) {
                        var rng = editor.selection.getRng(true);
                        var otherLi = editor.dom.getParent(findNextCaretContainer(rng, isForward), 'LI');

                        if (otherLi && otherLi != li) {
                            var bookmark = createBookmark(rng);

                            if (isForward) {
                                mergeLiElements(otherLi, li);
                            } else {
                                mergeLiElements(li, otherLi);
                            }

                            moveToBookmark(bookmark);

                            return true;
                        } else if (!otherLi) {
                            if (!isForward && removeList(li.parentNode.nodeName)) {
                                return true;
                            }
                        }
                    }
                }
            }

            editor.onBeforeExecCommand.add(function(ed, cmd, ui, v, o) {
                var isHandled;

                if (cmd.toLowerCase() == "indent") {
                    if (indentSelection()) {
                        o.terminate = true;
                        return true;
                    }
                } else if (cmd.toLowerCase() == "outdent") {
                    if (outdentSelection()) {
                        o.terminate = true;
                        return true;
                    }
                }
            });

            editor.addCommand('InsertUnorderedList', function () {
                toggleList('UL');
            });

            editor.addCommand('InsertOrderedList', function () {
                toggleList('OL');
            });

            editor.addCommand('InsertDefinitionList', function () {
                toggleList('DL');
            });

            editor.addQueryStateHandler('InsertUnorderedList', queryListCommandState('UL'));
            editor.addQueryStateHandler('InsertOrderedList', queryListCommandState('OL'));
            editor.addQueryStateHandler('InsertDefinitionList', queryListCommandState('DL'));

            editor.onKeyDown.add(function (e) {
                // Check for tab but not ctrl/cmd+tab since it switches browser tabs
                if (e.keyCode != 9 || tinymce.util.VK.metaKeyPressed(e)) {
                    return;
                }

                if (editor.dom.getParent(editor.selection.getStart(), 'LI,DT,DD')) {
                    e.preventDefault();

                    if (e.shiftKey) {
                        outdentSelection();
                    } else {
                        indentSelection();
                    }
                }

                if (e.keyCode == tinymce.util.VK.BACKSPACE) {
                    if (self.backspaceDelete()) {
                        e.preventDefault();
                    }
                } else if (e.keyCode == tinymce.util.VK.DELETE) {
                    if (self.backspaceDelete(true)) {
                        e.preventDefault();
                    }
                }
            });
        },
        backspaceDelete: function(isForward) {
            return this.backspaceDelete(isForward);
        }
    });

    tinymce.PluginManager.add("lists", tinymce.plugins.Lists);
})();
