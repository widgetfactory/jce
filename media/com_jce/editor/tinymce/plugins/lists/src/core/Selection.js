/**
 * Selection.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
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