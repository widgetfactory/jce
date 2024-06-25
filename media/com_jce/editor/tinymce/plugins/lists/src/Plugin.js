/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */


import Indent from './actions/Indent.js';
import Outdent from './actions/Outdent.js';
import ToggleList from './actions/ToggleList.js';
import Delete from './core/Delete.js';
import NodeType from './core/NodeType.js';

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

tinymce.PluginManager.add("lists", function (editor) {
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
});

export default function () { }