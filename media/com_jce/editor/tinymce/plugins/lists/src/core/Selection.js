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

export default {
  getParentList: getParentList,
  getSelectedSubLists: getSelectedSubLists,
  getSelectedListItems: getSelectedListItems
};