/**
 * @package     JCE
 * @copyright   Copyright (c) 2009       Moxiecode Systems AB. All rights reserved.
 * @copyright   Copyright (c) 1999–2017  Ephox Corp. All rights reserved.
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 * @note        Forked or includes code from TinyMCE 3.x/4.x/5.x (originally LGPL 2.1) and relicensed under GPL 2+ per LGPL 2.1 §3.
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
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