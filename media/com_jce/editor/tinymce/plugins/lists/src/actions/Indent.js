/**
 * Indent.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */
import Bookmark from '../core/Bookmark.js';
import NodeType from '../core/NodeType.js';
import Selection from '../core/Selection.js';

var DOM = tinymce.DOM;

var mergeLists = function (from, to) {
  var node;

  if (NodeType.isListNode(from)) {
    while ((node = from.firstChild)) {
      to.appendChild(node);
    }

    DOM.remove(from);
  }
};

var indent = function (li) {
  var sibling, newList, listStyle;

  if (li.nodeName === 'DT') {
    DOM.rename(li, 'DD');
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
    newList = DOM.create(li.parentNode.nodeName);
    listStyle = DOM.getStyle(li.parentNode, 'listStyleType');
    if (listStyle) {
      DOM.setStyle(newList, 'listStyleType', listStyle);
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

export default {
  indentSelection: indentSelection
};
