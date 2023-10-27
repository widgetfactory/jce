/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2023 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global tinymce:true */

(function () {
  var VK = tinymce.VK,
    Node = tinymce.html.Node,
    each = tinymce.each;
  var blocks = [];

  tinymce.create('tinymce.plugins.Figure', {
    init: function (ed, url) {
      this.editor = ed;

      ed.onPreInit.add(function (ed) {
        ed.parser.addNodeFilter('figure', function (nodes, name) {
          var i = nodes.length,
            node;

          while (i--) {
            node = nodes[i];

            if (node.getAll('figcaption').length === 0) {
              var figcaption = new Node('figcaption', 1);
              figcaption.attr('data-mce-empty', ed.getLang('figcaption.default', 'Write a caption...'));
              figcaption.attr('contenteditable', true);

              node.append(figcaption);
            }

            node.attr('data-mce-image', '1');
            node.attr('contenteditable', 'false');

            each(node.getAll('img'), function (img) {
              img.attr('data-mce-contenteditable', 'true');
            });

            if (ed.settings.figure_data_attribute !== false) {
              node.attr('data-wf-figure', '1');
            }
          }
        });

        ed.parser.addNodeFilter('figcaption', function (nodes, name) {
          var i = nodes.length,
            node;

          while (i--) {
            node = nodes[i];
            // Add identifying attribute to create dummy text
            if (!node.firstChild) {
              node.attr('data-mce-empty', ed.getLang('figcaption.default', 'Write a caption...'));
            }
            // make editable
            node.attr('contenteditable', 'true');
          }
        });

        ed.serializer.addNodeFilter('figure', function (nodes, name) {
          var i = nodes.length,
            node;

          while (i--) {
            node = nodes[i];
            node.attr('contenteditable', null);

            each(node.getAll('img'), function (img) {
              img.attr('data-mce-contenteditable', null);
            });
          }
        });

        ed.serializer.addNodeFilter('figcaption', function (nodes, name) {
          var i = nodes.length,
            node;

          while (i--) {
            node = nodes[i];
            // remove empty figcaption
            if (!node.firstChild) {
              node.remove();
            } else {
              node.attr('contenteditable', null);
            }
          }
        });

        ed.serializer.addAttributeFilter('data-mce-image', function (nodes, name) {
          var i = nodes.length,
            node;

          while (i--) {
            node = nodes[i];
            node.attr(name, null);
          }
        });

        each(ed.schema.getBlockElements(), function (v, k) {
          if (/\W/.test(k)) {
            return true;
          }

          blocks.push(k.toLowerCase());
        });

        ed.formatter.register('figure', {
          block: 'figure',
          remove: 'all',
          ceFalseOverride: true,
          deep: false,
          onformat: function (elm, fmt, vars, node) {
            vars = vars || {};

            if (ed.dom.select('img,video,iframe', elm)) {
              ed.dom.setAttribs(elm, {
                'data-mce-image': 1,
                'contenteditable': false
              });

              // set fake contenteditable for img element
              ed.dom.setAttrib(ed.dom.select('img', elm), 'data-mce-contenteditable', 'true');

              ed.dom.add(elm, 'figcaption', {
                'data-mce-empty': ed.getLang('figcaption.default', 'Write a caption...'),
                'contenteditable': true
              }, vars.caption || '');

              if (ed.settings.figure_data_attribute !== false) {
                ed.dom.setAttribs(elm, {
                  'data-wf-figure' : '1'
                });
              }
            }
          },
          onremove: function (node) {
            ed.dom.remove(ed.dom.select('figcaption', node));
            ed.dom.remove(ed.dom.getParent('figure', node), 1);
          }
        });

        ed.onBeforeExecCommand.add(function (ed, cmd, ui, v, o) {
          var se = ed.selection,
            n = se.getNode();

          switch (cmd) {
            case 'JustifyRight':
            case 'JustifyLeft':
            case 'JustifyCenter':
              if (n && ed.dom.is(n, 'img,span[data-mce-object]')) {
                var parent = ed.dom.getParent(n, 'FIGURE');

                if (parent) {
                  se.select(parent);
                  ed.execCommand(cmd, false);
                  o.terminate = true;
                }
              }
              break;
          }
        });

        ed.onKeyDown.add(function (ed, e) {
          var isDelete, rng, container, offset, collapsed;

          isDelete = e.keyCode == VK.DELETE;

          if (!e.isDefaultPrevented() && (isDelete || e.keyCode == VK.BACKSPACE) && !VK.modifierPressed(e)) {
            rng = ed.selection.getRng();
            container = rng.startContainer;
            offset = rng.startOffset;
            collapsed = rng.collapsed;

            container = ed.dom.getParent(container, 'FIGURE');

            // remove figure and children if the img is selected
            if (container) {
              var node = ed.selection.getNode();

              if (node.nodeName === 'IMG') {
                ed.dom.remove(container);
                ed.nodeChanged();
                e.preventDefault();
                return;
              }

              // override delete only if the figcaption is empty, so it is not itself removed
              if (node.nodeName == 'FIGCAPTION' && (!node.nodeValue || node.nodeValue.length === 0) && node.childNodes.length === 0) {
                e.preventDefault();
              }

              if (node.nodeType === 3 && (!collapsed && !offset)) {
                var figcaption = ed.dom.getParent(node, 'FIGCAPTION');

                if (figcaption) {
                  while (figcaption.firstChild) {
                    figcaption.removeChild(figcaption.firstChild);
                  }

                  e.preventDefault();
                }
              }
            }
          }
        });
      });
    }

  });

  // Register plugin
  tinymce.PluginManager.add('figure', tinymce.plugins.Figure);
})();