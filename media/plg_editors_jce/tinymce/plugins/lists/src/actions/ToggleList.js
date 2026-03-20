/**
 * ToggleList.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import Outdent from './Outdent.js';
import Bookmark from '../core/Bookmark.js';
import NodeType from '../core/NodeType.js';
import NormalizeLists from '../core/NormalizeLists.js';
import Selection from '../core/Selection.js';
import SplitList from '../core/SplitList.js';

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
    removeList(editor, listName);
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
      removeList(editor, listName);
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

export default {
  toggleList: toggleList,
  removeList: removeList,
  mergeWithAdjacentLists: mergeWithAdjacentLists
};