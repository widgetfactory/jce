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

var DOM = tinymce.DOM;

var createNewTextBlock = function (editor, contentNode, blockName) {
  var node, textBlock, fragment = DOM.createFragment(), hasContentNode;
  var blockElements = editor.schema.getBlockElements();

  if (editor.settings.forced_root_block) {
    blockName = blockName || editor.settings.forced_root_block;
  }

  if (blockName) {
    textBlock = DOM.create(blockName);

    if (textBlock.tagName === editor.settings.forced_root_block) {
      DOM.setAttribs(textBlock, editor.settings.forced_root_block_attrs);
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
            textBlock = DOM.create(blockName);
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
    fragment.appendChild(DOM.create('br'));
  } else {
    // BR is needed in empty blocks
    if (!hasContentNode) {
      textBlock.appendChild(DOM.create('br', { 'data-mce-bogus': '1' }));
    }
  }

  return fragment;
};

export default {
  createNewTextBlock: createNewTextBlock
};