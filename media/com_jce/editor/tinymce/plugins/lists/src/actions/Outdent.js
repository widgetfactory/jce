/**
 * Outdent.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */
import Bookmark from '../core/Bookmark.js';
import NodeType from '../core/NodeType.js';
import NormalizeLists from '../core/NormalizeLists.js';
import Selection from '../core/Selection.js';
import SplitList from '../core/SplitList.js';
import TextBlock from '../core/TextBlock.js';

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

export default {
  outdent: outdent,
  outdentSelection: outdentSelection
};
