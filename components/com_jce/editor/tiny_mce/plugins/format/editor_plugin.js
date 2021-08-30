/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global tinymce:true */

(function () {
  var VK = tinymce.VK,
    each = tinymce.each;
  var blocks = [];

  tinymce.create('tinymce.plugins.FormatPlugin', {
    init: function (ed, url) {
      var self = this;
      this.editor = ed;

      // Register buttons
      ed.addButton('italic', {
        title : 'advanced.italic_desc',
        onclick : function (e) {
          e.preventDefault();

          if (e.shiftKey) {
            ed.formatter.toggle('italic-i');
            return;
          }

          ed.formatter.toggle('italic');
        }
      });

      ed.addShortcut('meta+shift+i', 'italic.desc', function () {
        ed.formatter.apply('italic-i');
      });

      function addSoftHyphenShortcut() {
        ed.addCommand('mceSoftHyphen', function () {
          ed.execCommand('mceInsertContent', false, (ed.plugins.visualchars && ed.plugins.visualchars.state) ? '<span data-mce-bogus="1" class="mce-item-hidden mce-item-shy">&shy;</span>' : '&shy;');
        });

        var keyCode = 189;

        // Firefox seems to use a different keyCode, - instead of _
        if (tinymce.isGecko) {
          keyCode = 173;
        }

        ed.addShortcut('ctrl+shift+' + keyCode, 'softhyphen.desc', 'mceSoftHyphen');

      }

      // add shoft hyphen keyboard shortcut
      addSoftHyphenShortcut();

      ed.onPreInit.add(function (ed) {
        each(ed.schema.getBlockElements(), function (v, k) {
          if (/\W/.test(k)) {
            return true;
          }

          blocks.push(k.toLowerCase());
        });

        // Register default block formats
        ed.formatter.register('aside', {
          block: 'aside',
          remove: 'all',
          wrapper: true
        });

        // paragraph
        ed.formatter.register('p', {
          block: 'p',
          remove: 'all'
        });

        // div
        ed.formatter.register('div', {
          block: 'div',
          onmatch: ed.settings.forced_root_block ? function () {
            return false;
          } : false
        });

        // div container
        ed.formatter.register('div_container', {
          block: 'div',
          wrapper: true,
          onmatch: ed.settings.forced_root_block ? function () {
            return false;
          } : false
        });

        // span
        ed.formatter.register('span', {
          inline: 'span',
          remove: 'all',
          onmatch: function () {
            return false;
          }
        });

        // section
        ed.formatter.register('section', {
          block: 'section',
          remove: 'all',
          wrapper: true,
          merge_siblings: false
        });

        // article
        ed.formatter.register('article', {
          block: 'article',
          remove: 'all',
          wrapper: true,
          merge_siblings: false
        });

        // footer
        ed.formatter.register('footer', {
          block: 'footer',
          remove: 'all',
          wrapper: true,
          merge_siblings: false
        });

        // header
        ed.formatter.register('header', {
          block: 'header',
          remove: 'all',
          wrapper: true,
          merge_siblings: false
        });

        // nav
        ed.formatter.register('nav', {
          block: 'nav',
          remove: 'all',
          wrapper: true,
          merge_siblings: false
        });

        // code
        ed.formatter.register('code', {
          inline: 'code',
          remove: 'all'
        });

        // samp
        ed.formatter.register('samp', {
          inline: 'samp',
          remove: 'all'
        });

        // blockquote - remove wrapper?
        ed.formatter.register('blockquote', {
          block: 'blockquote',
          wrapper: 1,
          remove: 'all',
          merge_siblings: false
        });

        // Italic - <i>
        ed.formatter.register('italic-i', {
          inline: 'i',
          remove: 'all'
        });
      });

      // update with HMTL5 tags
      ed.settings.removeformat = [{
        selector: 'b,strong,em,i,font,u,strike,sub,sup,dfn,code,samp,kbd,var,cite,mark,q,footer',
        remove: 'all',
        split: true,
        expand: false,
        block_expand: true,
        deep: true
      }];

      ed.onKeyDown.add(function (ed, e) {
        if ((e.keyCode === VK.ENTER || e.keyCode === VK.UP || e.keyCode === VK.DOWN) && e.altKey) {
          // clear blocks
          self._clearBlocks(ed, e);
        }
      });

      ed.onKeyUp.addToTop(function (ed, e) {
        if (e.keyCode === VK.ENTER) {
          var n = ed.selection.getNode();
          if (n.nodeName === 'DIV' && ed.settings.force_block_newlines) {
            // remove all attributes
            if (ed.settings.keep_styles === false) {
              ed.dom.removeAllAttribs(n);
            }
            ed.formatter.apply('p');
          }
        }
      });

      // Format Block fix
      ed.onBeforeExecCommand.add(function (ed, cmd, ui, v, o) {
        var se = ed.selection,
          n = se.getNode(),
          p;

        switch (cmd) {
          case 'FormatBlock':
            // remove format
            if (!v) {
              o.terminate = true;

              if (n === ed.getBody()) {
                return;
              }

              ed.undoManager.add();

              p = ed.dom.getParent(n, blocks.join(',')) || '';

              if (p) {
                var name = p.nodeName.toLowerCase();

                if (ed.formatter.get(name)) {
                  ed.formatter.remove(name);
                }
              }

              var cm = ed.controlManager.get('formatselect');

              if (cm) {
                cm.select(p);
              }
            }
            // Definition List
            if (v === 'dt' || v === 'dd') {
              if (n && !ed.dom.getParent(n, 'dl')) {
                ed.execCommand('InsertDefinitionList');
              }

              if (v === 'dt' && n.nodeName === 'DD') {
                ed.dom.rename(n, 'DT');
              }

              if (v === 'dd' && n.nodeName === 'DT') {
                ed.dom.rename(n, 'DD');
              }

              o.terminate = true;
            }

            break;
          case 'RemoveFormat':
            if (!v && !ed.dom.isBlock(n)) {
              cm = ed.controlManager.get('styleselect');
              // get select Styles value if any
              if (cm && cm.selectedValue) {
                // remove style
                ed.execCommand('mceToggleFormat', false, cm.selectedValue);
              }
            }

            break;
        }
      });

      ed.onExecCommand.add(function (ed, cmd, ui, v, o) {
        var se = ed.selection,
          n = se.getNode();
        // remove empty Definition List
        switch (cmd) {
          case 'mceToggleFormat':
            if (v === "dt" || v === "dd") {
              if (n.nodeName === "DL" && ed.dom.select('dt,dd', n).length === 0) {
                ed.formatter.remove('dl');
              }
            }
            break;
        }
      });

      /*ed.onPreInit.add(function() {

                function wrapList(node) {
                    var sibling = node.prev;

                    if (node.parent && node.parent.name === 'dl') {
                        return;
                    }

                    if (sibling && (sibling.name === 'dl' || sibling.name === 'dl')) {
                        sibling.append(node);
                        return;
                    }

                    sibling = node.next;

                    if (sibling && (sibling.name === 'dl' || sibling.name === 'dl')) {
                        sibling.insert(node, sibling.firstChild, true);
                        return;
                    }

                    node.wrap(ed.parser.filterNode(new tinymce.html.Node('dl', 1)));
                }

                ed.parser.addNodeFilter('dt,dd', function(nodes) {
                    for (var i = 0, len = nodes.length; i < len; i++) {
                        wrapList(nodes[i]);
                    }
                });

                ed.serializer.addNodeFilter('dt,dd', function(nodes) {
                    for (var i = 0, len = nodes.length; i < len; i++) {
                        wrapList(nodes[i]);
                    }
                });
            });*/
    },
    _clearBlocks: function (ed, e) {
      var p, n = ed.selection.getNode();

      // Find parent element just before the document body
      p = ed.dom.getParents(n, blocks.join(','));

      if (p && p.length > 1) {
        // set defualt content and get the element to use
        var tag = ed.getParam('forced_root_block', 'p');

        if (!tag) {
          tag = ed.getParam('force_block_newlines') ? 'p' : 'br';
        }

        // prevent default action
        e.preventDefault();

        // get the first block in the collection
        var block = p[p.length - 1];

        // skip if it is the body
        if (block === ed.getBody()) {
          return;
        }

        // create element
        var el = ed.dom.create(tag, {}, '\u00a0');

        if (e.keyCode === VK.ENTER || e.keyCode === VK.DOWN) {
          // insert after parent element
          ed.dom.insertAfter(el, block);
        } else {
          // insert after parent element
          block.parentNode.insertBefore(el, block);
        }

        // select and collapse
        ed.selection.select(el);
        ed.selection.collapse(1);
      }

      // execute normal enter/up behaviour
    }
  });

  // Register plugin
  tinymce.PluginManager.add('format', tinymce.plugins.FormatPlugin);
})();