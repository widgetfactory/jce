/**
 * SplitList.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */
import NodeType from './NodeType.js';
import TextBlock from './TextBlock.js';

var DOM = tinymce.DOM;

var splitList = function (editor, ul, li, newBlock) {
  var tmpRng, fragment, bookmarks, node;

  var removeAndKeepBookmarks = function (targetNode) {
    tinymce.each(bookmarks, function (node) {
      targetNode.parentNode.insertBefore(node, li.parentNode);
    });

    DOM.remove(targetNode);
  };

  bookmarks = DOM.select('span[data-mce-type="bookmark"]', ul);
  newBlock = newBlock || TextBlock.createNewTextBlock(editor, li);
  tmpRng = DOM.createRng();
  tmpRng.setStartAfter(li);
  tmpRng.setEndAfter(ul);
  fragment = tmpRng.extractContents();

  for (node = fragment.firstChild; node; node = node.firstChild) {
    if (node.nodeName === 'LI' && editor.dom.isEmpty(node)) {
      DOM.remove(node);
      break;
    }
  }

  if (!editor.dom.isEmpty(fragment)) {
    DOM.insertAfter(fragment, ul);
  }

  DOM.insertAfter(newBlock, ul);

  if (NodeType.isEmpty(editor.dom, li.parentNode)) {
    removeAndKeepBookmarks(li.parentNode);
  }

  DOM.remove(li);

  if (NodeType.isEmpty(editor.dom, ul)) {
    DOM.remove(ul);
  }
};

export default {
  splitList: splitList
};