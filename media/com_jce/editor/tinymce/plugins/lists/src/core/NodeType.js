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

export default {
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