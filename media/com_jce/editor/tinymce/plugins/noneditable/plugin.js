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

/*global tinymce:true */

(function () {
  var DOM = tinymce.DOM;

  tinymce.PluginManager.add('noneditable', function (editor) {
    var nonEditableRegExps, contentEditableAttrName = 'contenteditable';

    var editClass = tinymce.trim(editor.getParam("noneditable_editable_class", "mceEditable"));
    var nonEditClass = tinymce.trim(editor.getParam("noneditable_noneditable_class", "mceNonEditable"));

    function hasClass(checkClassName) {
      return function (node) {
        return (" " + node.attr("class") + " ").indexOf(checkClassName) !== -1;
      };
    }

    function isNonEditable(node) {
      if (node.attr) {
        return node.hasClass(nonEditClass);
      }

      return DOM.hasClass(node, nonEditClass);
    }

    function isEditable(node) {
      if (node.attr) {
        return node.hasClass(editClass);
      }

      return DOM.hasClass(node, editClass);
    }

    function convertRegExpsToNonEditable(e) {
      var i = nonEditableRegExps.length, content = e.content, cls = tinymce.trim(nonEditClass);

      function replaceMatchWithSpan(match) {
        var args = arguments, index = args[args.length - 2];
        var prevChar = index > 0 ? content.charAt(index - 1) : '';

        // Is value inside an attribute then don't replace
        if (prevChar === '"') {
          return match;
        }

        // Is value inside a contentEditable="false" tag
        if (prevChar === '>') {
          var findStartTagIndex = content.lastIndexOf('<', index);
          if (findStartTagIndex !== -1) {
            var tagHtml = content.substring(findStartTagIndex, index);
            if (tagHtml.indexOf('contenteditable="false"') !== -1) {
              return match;
            }
          }
        }

        return (
          '<span class="' + cls + '" data-mce-content="' + editor.dom.encode(args[0]) + '">' +
          editor.dom.encode(typeof args[1] === "string" ? args[1] : args[0]) + '</span>'
        );
      }

      // Don't replace the variables when raw is used for example on undo/redo
      if (e.format == "raw") {
        return;
      }

      while (i--) {
        content = content.replace(nonEditableRegExps[i], replaceMatchWithSpan);
      }

      e.content = content;
    }

    var hasEditClass = hasClass(editClass);
    var hasNonEditClass = hasClass(nonEditClass);

    nonEditableRegExps = editor.getParam("noneditable_regexp");

    if (nonEditableRegExps && !nonEditableRegExps.length) {
      nonEditableRegExps = [nonEditableRegExps];
    }

    editor.onPreInit.add(function () {
      editor.formatter.register('noneditable', {
        block: 'div',
        wrapper: true,
        onformat: function (elm, fmt, vars) {
          tinymce.each(vars, function (value, key) {
            editor.dom.setAttrib(elm, key, value);
          });
        }
      });

      if (nonEditableRegExps) {
        editor.onBeforeSetContent.add(function (ed, e) {
          convertRegExpsToNonEditable(e);
        });
      }

      editor.parser.addAttributeFilter('class', function (nodes) {
        var i = nodes.length, node;

        while (i--) {
          node = nodes[i];

          if (hasEditClass(node)) {
            node.attr(contentEditableAttrName, "true");
          } else if (hasNonEditClass(node)) {
            node.attr(contentEditableAttrName, "false");
          }
        }
      });

      editor.serializer.addAttributeFilter(contentEditableAttrName, function (nodes) {
        var i = nodes.length, node;

        while (i--) {
          node = nodes[i];
          if (!hasEditClass(node) && !hasNonEditClass(node)) {
            continue;
          }

          if (nonEditableRegExps && node.attr('data-mce-content')) {
            node.name = "#text";
            node.type = 3;
            node.raw = true;
            node.value = node.attr('data-mce-content');
          } else {
            node.attr(contentEditableAttrName, null);
          }
        }
      });
    });

    /*editor.onInit.add(function () {
      // disable all controls if a non-editable is selected
      editor.onNodeChange.add(function (ed, cm, n, collapsed) {
        var state = !collapsed && isNonEditable(n);

        tinymce.each(cm.controls, function (c) {
          if (c && c.isRendered()) {
            c.setDisabled(state);
          }
        });
      });
    });*/

    this.isEditable = isEditable;
    this.isNonEditable = isNonEditable;
  });
})();