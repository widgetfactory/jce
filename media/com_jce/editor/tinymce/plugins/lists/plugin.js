(function () {
  'use strict';

  /* eslint-disable */

  /**
   * NodeType.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */

  var isTextNode = function (node) {
    return node && node.nodeType === 3;
  };

  var isListNode = function (node) {
    return node && (/^(OL|UL|DL)$/).test(node.nodeName);
  };

  var isListItemNode = function (node) {
    return node && /^(LI|DT|DD)$/.test(node.nodeName);
  };

  var isBr = function (node) {
    return node && node.nodeName === 'BR';
  };

  var isFirstChild = function (node) {
    return node.parentNode.firstChild === node;
  };

  var isLastChild = function (node) {
    return node.parentNode.lastChild === node;
  };

  var isTextBlock = function (editor, node) {
    return node && !!editor.schema.getTextBlockElements()[node.nodeName];
  };

  var isBlock = function (node, blockElements) {
    return node && node.nodeName in blockElements;
  };

  var isBogusBr = function (dom, node) {
    if (!isBr(node)) {
      return false;
    }

    if (dom.isBlock(node.nextSibling) && !isBr(node.previousSibling)) {
      return true;
    }

    return false;
  };

  var isEmpty = function (dom, elm, keepBookmarks) {
    var empty = dom.isEmpty(elm);

    if (keepBookmarks && dom.select('span[data-mce-type=bookmark]', elm).length > 0) {
      return false;
    }

    return empty;
  };

  var isChildOfBody = function (dom, elm) {
    return dom.isChildOf(elm, dom.getRoot());
  };

  var NodeType = {
    isTextNode: isTextNode,
    isListNode: isListNode,
    isListItemNode: isListItemNode,
    isBr: isBr,
    isFirstChild: isFirstChild,
    isLastChild: isLastChild,
    isTextBlock: isTextBlock,
    isBlock: isBlock,
    isBogusBr: isBogusBr,
    isEmpty: isEmpty,
    isChildOfBody: isChildOfBody
  };

  /**
   * Range.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */

  var RangeUtils$1 = tinymce.dom.RangeUtils;

  var getNormalizedEndPoint = function (container, offset) {
    var node = RangeUtils$1.getNode(container, offset);

    if (NodeType.isListItemNode(container) && NodeType.isTextNode(node)) {
      var textNodeOffset = offset >= container.childNodes.length ? node.data.length : 0;
      return { container: node, offset: textNodeOffset };
    }

    return { container: container, offset: offset };
  };

  var normalizeRange = function (rng) {
    var outRng = rng.cloneRange();

    var rangeStart = getNormalizedEndPoint(rng.startContainer, rng.startOffset);
    outRng.setStart(rangeStart.container, rangeStart.offset);

    var rangeEnd = getNormalizedEndPoint(rng.endContainer, rng.endOffset);
    outRng.setEnd(rangeEnd.container, rangeEnd.offset);

    return outRng;
  };

  var Range = {
    getNormalizedEndPoint: getNormalizedEndPoint,
    normalizeRange: normalizeRange
  };

  /**
   * Bookmark.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */


  var DOM$5 = tinymce.DOM;

  /**
   * Returns a range bookmark. This will convert indexed bookmarks into temporary span elements with
   * index 0 so that they can be restored properly after the DOM has been modified. Text bookmarks will not have spans
   * added to them since they can be restored after a dom operation.
   *
   * So this: <p><b>|</b><b>|</b></p>
   * becomes: <p><b><span data-mce-type="bookmark">|</span></b><b data-mce-type="bookmark">|</span></b></p>
   *
   * @param  {DOMRange} rng DOM Range to get bookmark on.
   * @return {Object} Bookmark object.
   */
  var createBookmark = function (rng) {
    var bookmark = {};

    var setupEndPoint = function (start) {
      var offsetNode, container, offset;

      container = rng[start ? 'startContainer' : 'endContainer'];
      offset = rng[start ? 'startOffset' : 'endOffset'];

      if (container.nodeType === 1) {
        offsetNode = DOM$5.create('span', { 'data-mce-type': 'bookmark' });

        if (container.hasChildNodes()) {
          offset = Math.min(offset, container.childNodes.length - 1);

          if (start) {
            container.insertBefore(offsetNode, container.childNodes[offset]);
          } else {
            DOM$5.insertAfter(offsetNode, container.childNodes[offset]);
          }
        } else {
          container.appendChild(offsetNode);
        }

        container = offsetNode;
        offset = 0;
      }

      bookmark[start ? 'startContainer' : 'endContainer'] = container;
      bookmark[start ? 'startOffset' : 'endOffset'] = offset;
    };

    setupEndPoint(true);

    if (!rng.collapsed) {
      setupEndPoint();
    }

    return bookmark;
  };

  var resolveBookmark = function (bookmark) {
    function restoreEndPoint(start) {
      var container, offset, node;

      var nodeIndex = function (container) {
        var node = container.parentNode.firstChild, idx = 0;

        while (node) {
          if (node === container) {
            return idx;
          }

          // Skip data-mce-type=bookmark nodes
          if (node.nodeType !== 1 || node.getAttribute('data-mce-type') !== 'bookmark') {
            idx++;
          }

          node = node.nextSibling;
        }

        return -1;
      };

      container = node = bookmark[start ? 'startContainer' : 'endContainer'];
      offset = bookmark[start ? 'startOffset' : 'endOffset'];

      if (!container) {
        return;
      }

      if (container.nodeType === 1) {
        offset = nodeIndex(container);
        container = container.parentNode;
        DOM$5.remove(node);
      }

      bookmark[start ? 'startContainer' : 'endContainer'] = container;
      bookmark[start ? 'startOffset' : 'endOffset'] = offset;
    }

    restoreEndPoint(true);
    restoreEndPoint();

    var rng = DOM$5.createRng();

    rng.setStart(bookmark.startContainer, bookmark.startOffset);

    if (bookmark.endContainer) {
      rng.setEnd(bookmark.endContainer, bookmark.endOffset);
    }

    return Range.normalizeRange(rng);
  };

  var Bookmark = {
    createBookmark: createBookmark,
    resolveBookmark: resolveBookmark
  };

  /**
   * Selection.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */

  var getParentList = function (editor) {
    return editor.dom.getParent(editor.selection.getStart(true), 'OL,UL,DL');
  };

  var getSelectedSubLists = function (editor) {
    var parentList = getParentList(editor);
    return tinymce.grep(editor.selection.getSelectedBlocks(), function (elm) {
      return NodeType.isListNode(elm) && parentList !== elm;
    });
  };

  var findParentListItemsNodes = function (editor, elms) {
    var listItemsElms = tinymce.map(elms, function (elm) {
      var parentLi = editor.dom.getParent(elm, 'li,dd,dt', editor.getBody());

      return parentLi ? parentLi : elm;
    });

    return editor.dom.unique(listItemsElms);
  };

  var getSelectedListItems = function (editor) {
    var selectedBlocks = editor.selection.getSelectedBlocks();
    return tinymce.grep(findParentListItemsNodes(editor, selectedBlocks), function (block) {
      return NodeType.isListItemNode(block);
    });
  };

  var Selection = {
    getParentList: getParentList,
    getSelectedSubLists: getSelectedSubLists,
    getSelectedListItems: getSelectedListItems
  };

  /**
   * Indent.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */

  var DOM$4 = tinymce.DOM;

  var mergeLists = function (from, to) {
    var node;

    if (NodeType.isListNode(from)) {
      while ((node = from.firstChild)) {
        to.appendChild(node);
      }

      DOM$4.remove(from);
    }
  };

  var indent = function (li) {
    var sibling, newList, listStyle;

    if (li.nodeName === 'DT') {
      DOM$4.rename(li, 'DD');
      return true;
    }

    sibling = li.previousSibling;

    if (sibling && NodeType.isListNode(sibling)) {
      sibling.appendChild(li);
      return true;
    }

    if (sibling && sibling.nodeName === 'LI' && NodeType.isListNode(sibling.lastChild)) {
      sibling.lastChild.appendChild(li);
      mergeLists(li.lastChild, sibling.lastChild);
      return true;
    }

    sibling = li.nextSibling;

    if (sibling && NodeType.isListNode(sibling)) {
      sibling.insertBefore(li, sibling.firstChild);
      return true;
    }

    /*if (sibling && sibling.nodeName === 'LI' && isListNode(li.lastChild)) {
      return false;
    }*/

    sibling = li.previousSibling;
    if (sibling && sibling.nodeName === 'LI') {
      newList = DOM$4.create(li.parentNode.nodeName);
      listStyle = DOM$4.getStyle(li.parentNode, 'listStyleType');
      if (listStyle) {
        DOM$4.setStyle(newList, 'listStyleType', listStyle);
      }
      sibling.appendChild(newList);
      newList.appendChild(li);
      mergeLists(li.lastChild, newList);
      return true;
    }

    return false;
  };

  var indentSelection = function (editor) {
    var listElements = Selection.getSelectedListItems(editor);

    if (listElements.length) {
      var bookmark = Bookmark.createBookmark(editor.selection.getRng(true));

      for (var i = 0; i < listElements.length; i++) {
        if (!indent(listElements[i]) && i === 0) {
          break;
        }
      }

      editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
      editor.nodeChanged();

      return true;
    }
  };

  var Indent = {
    indentSelection: indentSelection
  };

  /**
   * NormalizeLists.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */


  var DOM$3 = tinymce.DOM;

  var normalizeList = function (dom, ul) {
    var sibling, parentNode = ul.parentNode;

    // Move UL/OL to previous LI if it's the only child of a LI
    if (parentNode.nodeName === 'LI' && parentNode.firstChild === ul) {
      sibling = parentNode.previousSibling;
      if (sibling && sibling.nodeName === 'LI') {
        sibling.appendChild(ul);

        if (NodeType.isEmpty(dom, parentNode)) {
          DOM$3.remove(parentNode);
        }
      } else {
        DOM$3.setStyle(parentNode, 'listStyleType', 'none');
      }
    }

    // Append OL/UL to previous LI if it's in a parent OL/UL i.e. old HTML4
    if (NodeType.isListNode(parentNode)) {
      sibling = parentNode.previousSibling;
      if (sibling && sibling.nodeName === 'LI') {
        sibling.appendChild(ul);
      }
    }
  };

  var normalizeLists = function (dom, element) {
    tinymce.each(tinymce.grep(dom.select('ol,ul', element)), function (ul) {
      normalizeList(dom, ul);
    });
  };

  var NormalizeLists = {
    normalizeList: normalizeList,
    normalizeLists: normalizeLists
  };

  /**
   * TextBlock.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */

  var DOM$2 = tinymce.DOM;

  var createNewTextBlock = function (editor, contentNode, blockName) {
    var node, textBlock, fragment = DOM$2.createFragment(), hasContentNode;
    var blockElements = editor.schema.getBlockElements();

    if (editor.settings.forced_root_block) {
      blockName = blockName || editor.settings.forced_root_block;
    }

    if (blockName) {
      textBlock = DOM$2.create(blockName);

      if (textBlock.tagName === editor.settings.forced_root_block) {
        DOM$2.setAttribs(textBlock, editor.settings.forced_root_block_attrs);
      }

      if (!NodeType.isBlock(contentNode.firstChild, blockElements)) {
        fragment.appendChild(textBlock);
      }
    }

    if (contentNode) {
      while ((node = contentNode.firstChild)) {
        var nodeName = node.nodeName;

        if (!hasContentNode && (nodeName !== 'SPAN' || node.getAttribute('data-mce-type') !== 'bookmark')) {
          hasContentNode = true;
        }

        if (NodeType.isBlock(node, blockElements)) {
          fragment.appendChild(node);
          textBlock = null;
        } else {
          if (blockName) {
            if (!textBlock) {
              textBlock = DOM$2.create(blockName);
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
      fragment.appendChild(DOM$2.create('br'));
    } else {
      // BR is needed in empty blocks
      if (!hasContentNode) {
        textBlock.appendChild(DOM$2.create('br', { 'data-mce-bogus': '1' }));
      }
    }

    return fragment;
  };

  var TextBlock = {
    createNewTextBlock: createNewTextBlock
  };

  /**
   * SplitList.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */

  var DOM$1 = tinymce.DOM;

  var splitList = function (editor, ul, li, newBlock) {
    var tmpRng, fragment, bookmarks, node;

    var removeAndKeepBookmarks = function (targetNode) {
      tinymce.each(bookmarks, function (node) {
        targetNode.parentNode.insertBefore(node, li.parentNode);
      });

      DOM$1.remove(targetNode);
    };

    bookmarks = DOM$1.select('span[data-mce-type="bookmark"]', ul);
    newBlock = newBlock || TextBlock.createNewTextBlock(editor, li);
    tmpRng = DOM$1.createRng();
    tmpRng.setStartAfter(li);
    tmpRng.setEndAfter(ul);
    fragment = tmpRng.extractContents();

    for (node = fragment.firstChild; node; node = node.firstChild) {
      if (node.nodeName === 'LI' && editor.dom.isEmpty(node)) {
        DOM$1.remove(node);
        break;
      }
    }

    if (!editor.dom.isEmpty(fragment)) {
      DOM$1.insertAfter(fragment, ul);
    }

    DOM$1.insertAfter(newBlock, ul);

    if (NodeType.isEmpty(editor.dom, li.parentNode)) {
      removeAndKeepBookmarks(li.parentNode);
    }

    DOM$1.remove(li);

    if (NodeType.isEmpty(editor.dom, ul)) {
      DOM$1.remove(ul);
    }
  };

  var SplitList = {
    splitList: splitList
  };

  /**
   * Outdent.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */

  var DOM = tinymce.DOM;

  var removeEmptyLi = function (dom, li) {
    if (NodeType.isEmpty(dom, li)) {
      DOM.remove(li);
    }
  };

  var outdent = function (editor, li) {
    var ul = li.parentNode, ulParent = ul.parentNode, newBlock;

    if (ul === editor.getBody()) {
      return true;
    }

    if (li.nodeName === 'DD') {
      DOM.rename(li, 'DT');
      return true;
    }

    if (NodeType.isFirstChild(li) && NodeType.isLastChild(li)) {
      if (ulParent.nodeName === "LI") {
        DOM.insertAfter(li, ulParent);
        removeEmptyLi(editor.dom, ulParent);
        DOM.remove(ul);
      } else if (NodeType.isListNode(ulParent)) {
        DOM.remove(ul, true);
      } else {
        ulParent.insertBefore(TextBlock.createNewTextBlock(editor, li), ul);
        DOM.remove(ul);
      }

      return true;
    } else if (NodeType.isFirstChild(li)) {
      if (ulParent.nodeName === "LI") {
        DOM.insertAfter(li, ulParent);
        li.appendChild(ul);
        removeEmptyLi(editor.dom, ulParent);
      } else if (NodeType.isListNode(ulParent)) {
        ulParent.insertBefore(li, ul);
      } else {
        ulParent.insertBefore(TextBlock.createNewTextBlock(editor, li), ul);
        DOM.remove(li);
      }

      return true;
    } else if (NodeType.isLastChild(li)) {
      if (ulParent.nodeName === "LI") {
        DOM.insertAfter(li, ulParent);
      } else if (NodeType.isListNode(ulParent)) {
        DOM.insertAfter(li, ul);
      } else {
        DOM.insertAfter(TextBlock.createNewTextBlock(editor, li), ul);
        DOM.remove(li);
      }

      return true;
    }

    if (ulParent.nodeName === 'LI') {
      ul = ulParent;
      newBlock = TextBlock.createNewTextBlock(editor, li, 'LI');
    } else if (NodeType.isListNode(ulParent)) {
      newBlock = TextBlock.createNewTextBlock(editor, li, 'LI');
    } else {
      newBlock = TextBlock.createNewTextBlock(editor, li);
    }

    SplitList.splitList(editor, ul, li, newBlock);
    NormalizeLists.normalizeLists(editor.dom, ul.parentNode);

    return true;
  };

  var outdentSelection = function (editor) {
    var listElements = Selection.getSelectedListItems(editor);

    if (listElements.length) {
      var bookmark = Bookmark.createBookmark(editor.selection.getRng(true));
      var i, y, root = editor.dom.getRoot();

      i = listElements.length;
      while (i--) {
        var node = listElements[i].parentNode;

        while (node && node !== root) {
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
        if (!outdent(editor, listElements[i]) && i === 0) {
          break;
        }
      }

      editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
      editor.nodeChanged();

      return true;
    }
  };

  var Outdent = {
    outdent: outdent,
    outdentSelection: outdentSelection
  };

  /**
   * ToggleList.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */


  var BookmarkManager = tinymce.dom.BookmarkManager;

  var getRoot = function (editor) {
    return editor.dom.getRoot();
  };

  var updateListStyle = function (dom, el, detail) {
    var type = detail['list-style-type'] ? detail['list-style-type'] : null;
    dom.setStyle(el, 'list-style-type', type);
  };

  var setAttribs = function (elm, attrs) {
    tinymce.each(attrs, function (value, key) {
      elm.setAttribute(key, value);
    });
  };

  var updateListAttrs = function (dom, el, detail) {
    setAttribs(el, detail['list-attributes']);
    tinymce.each(dom.select('li', el), function (li) {
      setAttribs(li, detail['list-item-attributes']);
    });
  };

  var updateListWithDetails = function (dom, el, detail) {
    updateListStyle(dom, el, detail);
    updateListAttrs(dom, el, detail);
  };

  var getEndPointNode = function (editor, rng, start) {
    var container, offset, root = getRoot(editor);

    container = rng[start ? 'startContainer' : 'endContainer'];
    offset = rng[start ? 'startOffset' : 'endOffset'];

    // Resolve node index
    if (container.nodeType === 1) {
      container = container.childNodes[Math.min(offset, container.childNodes.length - 1)] || container;
    }

    while (container.parentNode !== root) {
      if (NodeType.isTextBlock(editor, container)) {
        return container;
      }

      if (/^(TD|TH)$/.test(container.parentNode.nodeName)) {
        return container;
      }

      container = container.parentNode;
    }

    return container;
  };

  var getSelectedTextBlocks = function (editor, rng) {
    var textBlocks = [], root = getRoot(editor), dom = editor.dom;

    var startNode = getEndPointNode(editor, rng, true);
    var endNode = getEndPointNode(editor, rng, false);
    var block, siblings = [];

    for (var node = startNode; node; node = node.nextSibling) {
      siblings.push(node);

      if (node === endNode) {
        break;
      }
    }

    tinymce.each(siblings, function (node) {
      if (NodeType.isTextBlock(editor, node)) {
        textBlocks.push(node);
        block = null;
        return;
      }

      if (dom.isBlock(node) || NodeType.isBr(node)) {
        if (NodeType.isBr(node)) {
          dom.remove(node);
        }

        block = null;
        return;
      }

      var nextSibling = node.nextSibling;
      if (BookmarkManager.isBookmarkNode(node)) {
        if (NodeType.isTextBlock(editor, nextSibling) || (!nextSibling && node.parentNode === root)) {
          block = null;
          return;
        }
      }

      if (!block) {
        block = dom.create('p');
        node.parentNode.insertBefore(block, node);
        textBlocks.push(block);
      }

      block.appendChild(node);
    });

    return textBlocks;
  };

  var applyList = function (editor, listName, detail) {
    var rng = editor.selection.getRng(true), bookmark, listItemName = 'LI';
    var dom = editor.dom;

    detail = detail ? detail : {};

    if (dom.getContentEditable(editor.selection.getNode()) === "false") {
      return;
    }

    listName = listName.toUpperCase();

    if (listName === 'DL') {
      listItemName = 'DT';
    }

    bookmark = Bookmark.createBookmark(rng);

    tinymce.each(getSelectedTextBlocks(editor, rng), function (block, idx) {
      var listBlock, sibling;

      var hasCompatibleStyle = function (sib) {
        var sibStyle = dom.getStyle(sib, 'list-style-type');
        var detailStyle = detail ? detail['list-style-type'] : '';

        detailStyle = detailStyle === null ? '' : detailStyle;

        return sibStyle === detailStyle;
      };

      sibling = block.previousSibling;

      // if a definition list, the first item should be a definition term, with the rest being definition descriptions
      if (listName === 'DL' && idx > 0) {
        listItemName = 'DD';
      }

      if (sibling && NodeType.isListNode(sibling) && sibling.nodeName === listName && hasCompatibleStyle(sibling)) {
        listBlock = sibling;
        block = dom.rename(block, listItemName);
        sibling.appendChild(block);
      } else {
        listBlock = dom.create(listName);
        block.parentNode.insertBefore(listBlock, block);
        listBlock.appendChild(block);
        block = dom.rename(block, listItemName);
      }

      updateListWithDetails(dom, listBlock, detail);
      mergeWithAdjacentLists(editor.dom, listBlock);
    });

    editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
  };

  var removeList = function (editor) {
    var bookmark = Bookmark.createBookmark(editor.selection.getRng(true)), root = getRoot(editor);
    var listItems = Selection.getSelectedListItems(editor);
    var emptyListItems = tinymce.grep(listItems, function (li) {
      return editor.dom.isEmpty(li);
    });

    listItems = tinymce.grep(listItems, function (li) {
      return !editor.dom.isEmpty(li);
    });

    tinymce.each(emptyListItems, function (li) {
      if (NodeType.isEmpty(editor.dom, li)) {
        Outdent.outdent(editor, li);
        return;
      }
    });

    tinymce.each(listItems, function (li) {
      var node, rootList;

      if (li.parentNode === editor.getBody()) {
        return;
      }

      for (node = li; node && node !== root; node = node.parentNode) {
        if (NodeType.isListNode(node)) {
          rootList = node;
        }
      }

      SplitList.splitList(editor, rootList, li);
      NormalizeLists.normalizeLists(editor.dom, rootList.parentNode);
    });

    editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
  };

  var isValidLists = function (list1, list2) {
    return list1 && list2 && NodeType.isListNode(list1) && list1.nodeName === list2.nodeName;
  };

  var hasSameListStyle = function (dom, list1, list2) {
    var targetStyle = dom.getStyle(list1, 'list-style-type', true);
    var style = dom.getStyle(list2, 'list-style-type', true);
    return targetStyle === style;
  };

  var hasSameClasses = function (elm1, elm2) {
    return elm1.className === elm2.className;
  };

  var shouldMerge = function (dom, list1, list2) {
    return isValidLists(list1, list2) && hasSameListStyle(dom, list1, list2) && hasSameClasses(list1, list2);
  };

  var mergeWithAdjacentLists = function (dom, listBlock) {
    var sibling, node;

    sibling = listBlock.nextSibling;
    if (shouldMerge(dom, listBlock, sibling)) {
      while ((node = sibling.firstChild)) {
        listBlock.appendChild(node);
      }

      dom.remove(sibling);
    }

    sibling = listBlock.previousSibling;
    if (shouldMerge(dom, listBlock, sibling)) {
      while ((node = sibling.lastChild)) {
        listBlock.insertBefore(node, listBlock.firstChild);
      }

      dom.remove(sibling);
    }
  };

  var updateList = function (dom, list, listName, detail) {
    if (list.nodeName !== listName) {
      var newList = dom.rename(list, listName);
      updateListWithDetails(dom, newList, detail);
    } else {
      updateListWithDetails(dom, list, detail);
    }
  };

  var toggleMultipleLists = function (editor, parentList, lists, listName, detail) {
    if (parentList.nodeName === listName && !hasListStyleDetail(detail)) {
      removeList(editor);
    } else {
      var bookmark = Bookmark.createBookmark(editor.selection.getRng(true));

      tinymce.each([parentList].concat(lists), function (elm) {
        updateList(editor.dom, elm, listName, detail);
      });

      editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
    }
  };

  var hasListStyleDetail = function (detail) {
    return 'list-style-type' in detail;
  };

  var toggleSingleList = function (editor, parentList, listName, detail) {
    if (parentList === getRoot(editor)) {
      return;
    }

    if (parentList) {
      if (parentList.nodeName === listName && !hasListStyleDetail(detail)) {
        removeList(editor);
      } else {
        var bookmark = Bookmark.createBookmark(editor.selection.getRng(true));
        updateListWithDetails(editor.dom, parentList, detail);
        mergeWithAdjacentLists(editor.dom, editor.dom.rename(parentList, listName));
        editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
      }
    } else {
      applyList(editor, listName, detail);
    }
  };

  var toggleList = function (editor, listName, detail) {
    var parentList = Selection.getParentList(editor);
    var selectedSubLists = Selection.getSelectedSubLists(editor);

    detail = detail ? detail : {};

    if (parentList && selectedSubLists.length > 0) {
      toggleMultipleLists(editor, parentList, selectedSubLists, listName, detail);
    } else {
      toggleSingleList(editor, parentList, listName, detail);
    }
  };

  var ToggleList = {
    toggleList: toggleList,
    removeList: removeList,
    mergeWithAdjacentLists: mergeWithAdjacentLists
  };

  /**
   * Delete.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */

  var RangeUtils = tinymce.dom.RangeUtils, TreeWalker = tinymce.dom.TreeWalker, VK$1 = tinymce.VK;

  var findNextCaretContainer = function (editor, rng, isForward) {
    var node = rng.startContainer, offset = rng.startOffset;
    var nonEmptyBlocks, walker;

    if (node.nodeType === 3 && (isForward ? offset < node.data.length : offset > 0)) {
      return node;
    }

    nonEmptyBlocks = editor.schema.getNonEmptyElements();
    if (node.nodeType === 1) {
      node = RangeUtils.getNode(node, offset);
    }

    walker = new TreeWalker(node, editor.getBody());

    // Delete at <li>|<br></li> then jump over the bogus br
    if (isForward) {
      if (NodeType.isBogusBr(editor.dom, node)) {
        walker.next();
      }
    }

    while ((node = walker[isForward ? 'next' : 'prev2']())) {
      if (node.nodeName === 'LI' && !node.hasChildNodes()) {
        return node;
      }

      if (nonEmptyBlocks[node.nodeName]) {
        return node;
      }

      if (node.nodeType === 3 && node.data.length > 0) {
        return node;
      }
    }
  };

  var hasOnlyOneBlockChild = function (dom, elm) {
    var childNodes = elm.childNodes;
    return childNodes.length === 1 && !NodeType.isListNode(childNodes[0]) && dom.isBlock(childNodes[0]);
  };

  var unwrapSingleBlockChild = function (dom, elm) {
    if (hasOnlyOneBlockChild(dom, elm)) {
      dom.remove(elm.firstChild, true);
    }
  };

  var moveChildren = function (dom, fromElm, toElm) {
    var node, targetElm;

    targetElm = hasOnlyOneBlockChild(dom, toElm) ? toElm.firstChild : toElm;
    unwrapSingleBlockChild(dom, fromElm);

    if (!NodeType.isEmpty(dom, fromElm, true)) {
      while ((node = fromElm.firstChild)) {
        targetElm.appendChild(node);
      }
    }
  };

  var mergeLiElements = function (dom, fromElm, toElm) {
    var node, listNode, ul = fromElm.parentNode;

    if (!NodeType.isChildOfBody(dom, fromElm) || !NodeType.isChildOfBody(dom, toElm)) {
      return;
    }

    if (NodeType.isListNode(toElm.lastChild)) {
      listNode = toElm.lastChild;
    }

    if (ul === toElm.lastChild) {
      if (NodeType.isBr(ul.previousSibling)) {
        dom.remove(ul.previousSibling);
      }
    }

    node = toElm.lastChild;
    if (node && NodeType.isBr(node) && fromElm.hasChildNodes()) {
      dom.remove(node);
    }

    if (NodeType.isEmpty(dom, toElm, true)) {
      dom.empty(toElm);
    }

    moveChildren(dom, fromElm, toElm);

    if (listNode) {
      toElm.appendChild(listNode);
    }

    dom.remove(fromElm);

    if (NodeType.isEmpty(dom, ul) && ul !== dom.getRoot()) {
      dom.remove(ul);
    }
  };

  var mergeIntoEmptyLi = function (editor, fromLi, toLi) {
    editor.dom.empty(toLi);
    mergeLiElements(editor.dom, fromLi, toLi);
    editor.selection.setCursorLocation(toLi);
  };

  var mergeForward = function (editor, rng, fromLi, toLi) {
    var dom = editor.dom;

    if (dom.isEmpty(toLi)) {
      mergeIntoEmptyLi(editor, fromLi, toLi);
    } else {
      var bookmark = Bookmark.createBookmark(rng);
      mergeLiElements(dom, fromLi, toLi);
      editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
    }
  };

  var mergeBackward = function (editor, rng, fromLi, toLi) {
    var bookmark = Bookmark.createBookmark(rng);
    mergeLiElements(editor.dom, fromLi, toLi);
    editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
  };

  var backspaceDeleteFromListToListCaret = function (editor, isForward) {
    var dom = editor.dom, selection = editor.selection;
    var li = dom.getParent(selection.getStart(), 'LI'), ul, rng, otherLi;

    if (li) {
      ul = li.parentNode;
      if (ul === editor.getBody() && NodeType.isEmpty(dom, ul)) {
        return true;
      }

      rng = Range.normalizeRange(selection.getRng(true));
      otherLi = dom.getParent(findNextCaretContainer(editor, rng, isForward), 'LI');

      if (otherLi && otherLi !== li) {
        if (isForward) {
          mergeForward(editor, rng, otherLi, li);
        } else {
          mergeBackward(editor, rng, li, otherLi);
        }

        return true;
      } else if (!otherLi) {
        if (!isForward && ToggleList.removeList(editor, ul.nodeName)) {
          return true;
        }
      }
    }

    return false;
  };

  var removeBlock = function (dom, block) {
    var parentBlock = dom.getParent(block.parentNode, dom.isBlock);

    dom.remove(block);
    if (parentBlock && dom.isEmpty(parentBlock)) {
      dom.remove(parentBlock);
    }
  };

  var backspaceDeleteIntoListCaret = function (editor, isForward) {
    var dom = editor.dom;
    var block = dom.getParent(editor.selection.getStart(), dom.isBlock);

    if (block && dom.isEmpty(block)) {
      var rng = Range.normalizeRange(editor.selection.getRng(true));
      var otherLi = dom.getParent(findNextCaretContainer(editor, rng, isForward), 'LI');

      if (otherLi) {
        editor.undoManager.add();

        removeBlock(dom, block);
        ToggleList.mergeWithAdjacentLists(dom, otherLi.parentNode);
        editor.selection.select(otherLi, true);
        editor.selection.collapse(isForward);

        return true;
      }
    }

    return false;
  };

  var backspaceDeleteCaret = function (editor, isForward) {
    return backspaceDeleteFromListToListCaret(editor, isForward) || backspaceDeleteIntoListCaret(editor, isForward);
  };

  var backspaceDeleteRange = function (editor) {
    var startListParent = editor.dom.getParent(editor.selection.getStart(), 'LI,DT,DD');

    if (startListParent || Selection.getSelectedListItems(editor).length > 0) {
      editor.undoManager.add();

      editor.execCommand('Delete');
      NormalizeLists.normalizeLists(editor.dom, editor.getBody());

      return true;
    }

    return false;
  };

  var backspaceDelete = function (editor, isForward) {
    return editor.selection.isCollapsed() ? backspaceDeleteCaret(editor, isForward) : backspaceDeleteRange(editor);
  };

  var setup = function (editor) {
    editor.onKeyDown.add(function (ed, e) {
      if (e.keyCode === VK$1.BACKSPACE) {
        if (backspaceDelete(editor, false)) {
          e.preventDefault();
        }
      } else if (e.keyCode === VK$1.DELETE) {
        if (backspaceDelete(editor, true)) {
          e.preventDefault();
        }
      }
    });
  };

  var Delete = {
    setup: setup,
    backspaceDelete: backspaceDelete
  };

  /**
   * plugin.js
   *
   * Released under LGPL License.
   * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   *
   * License: http://www.tinymce.com/license
   * Contributing: http://www.tinymce.com/contributing
   */


  var VK = tinymce.VK;

  var queryListCommandState = function (editor, listName) {
    return function () {
      var parentList = editor.dom.getParent(editor.selection.getStart(), 'UL,OL,DL');
      return parentList && parentList.nodeName === listName;
    };
  };

  var setupCommands = function (editor) {
    editor.onBeforeExecCommand.add(function (ed, cmd, ui, v, o) {
      var isHandled;

      if (cmd === "indent") {
        if (Indent.indentSelection(editor)) {
          isHandled = true;
        }
      } else if (cmd === "outdent") {
        if (Outdent.outdentSelection(editor)) {
          isHandled = true;
        }
      }

      if (isHandled) {
        editor.execCommand(cmd);
        o.terminate = true;
        return true;
      }
    });

    editor.addCommand('InsertUnorderedList', function (ui, detail) {
      ToggleList.toggleList(editor, 'UL', detail);
    });

    editor.addCommand('InsertOrderedList', function (ui, detail) {
      ToggleList.toggleList(editor, 'OL', detail);
    });

    editor.addCommand('InsertDefinitionList', function (ui, detail) {
      ToggleList.toggleList(editor, 'DL', detail);
    });
  };

  var setupStateHandlers = function (editor) {
    editor.addQueryStateHandler('InsertUnorderedList', queryListCommandState(editor, 'UL'));
    editor.addQueryStateHandler('InsertOrderedList', queryListCommandState(editor, 'OL'));
    editor.addQueryStateHandler('InsertDefinitionList', queryListCommandState(editor, 'DL'));
  };

  var setupTabKey = function (editor) {
    editor.onKeyDown.add(function (ed, e) {
      // Check for tab but not ctrl/cmd+tab since it switches browser tabs
      if (e.keyCode !== 9 || VK.metaKeyPressed(e)) {
        return;
      }

      if (editor.dom.getParent(editor.selection.getStart(), 'LI,DT,DD')) {
        e.preventDefault();

        if (e.shiftKey) {
          Outdent.outdentSelection(editor);
        } else {
          Indent.indentSelection(editor);
        }
      }
    });
  };

  tinymce.create('tinymce.plugins.Lists', {
    init: function (editor) {
      Delete.setup(editor);

      editor.onInit.add(function () {
        setupCommands(editor);
        setupStateHandlers(editor);
        if (editor.getParam('lists_indent_on_tab', true)) {
          setupTabKey(editor);
        }
      });

      var iconMap = {
        'numlist': 'OL',
        'bullist': 'UL'
      };

      editor.onNodeChange.add(function (ed, cm, n, collapsed, args) {
        var lists = tinymce.grep(args.parents, NodeType.isListNode);

        tinymce.each(iconMap, function (listName, btnName) {
          cm.setActive(btnName, lists.length > 0 && lists[0].nodeName === listName);
        });
      });

      this.backspaceDelete = function (isForward) {
        return Delete.backspaceDelete(editor, isForward);
      };
    },

    backspaceDelete: function (isForward) {
      return this.backspaceDelete(isForward);
    }
  });

  tinymce.PluginManager.add("lists", tinymce.plugins.Lists);

  function Plugin () { }

  return Plugin;

})();
