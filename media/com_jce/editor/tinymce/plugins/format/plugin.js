/**
 * @package     JCE
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 *
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

  tinymce.PluginManager.add('format', function (ed, url) {

    // Register buttons
    ed.addButton('italic', {
      title: 'advanced.italic_desc',
      onclick: function (e) {
        e.preventDefault();

        // restore focus
        ed.focus();

        e.shiftKey ? ed.formatter.toggle('italic-i') : ed.formatter.toggle('italic');

        ed.undoManager.add();
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

      var custom_css = ed.getParam('custom_css', '');

      // load custom css if any
      if (custom_css) {
        var doc = ed.getDoc(), head = doc.getElementsByTagName('head')[0];

        var style = ed.dom.create('style', { type: 'text/css', id: 'mceCustomStyles' });

        var values = [];

        each(custom_css.split(';'), function (value) {
          values.push('.mceContentBody ' + value);
        });

        style.appendChild(doc.createTextNode(values.join(';')));

        head.appendChild(style);
      }

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

      // select parent element with SHIFT + UP
      /*if (e.keyCode == VK.UP && e.shiftKey) {
        var p, n = ed.selection.getNode();

        // Find parent element just before the document body
        p = ed.dom.getParents(n, blocks.join(','));

        // get the first block in the collection
        var block = p[p.length - 1];

        if (block === ed.getBody() || block === n) {
          return;
        }

        // prevent default action
        e.preventDefault();

        ed.selection.select(block);
      }*/

      if ((e.keyCode === VK.ENTER || e.keyCode === VK.UP || e.keyCode === VK.DOWN) && e.altKey) {
        // clear blocks
        clearBlocks(e);
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
          if (v === 'dl') {
            ed.execCommand('InsertDefinitionList');
            o.terminate = true;
          }

          // Definition List - DT or DD
          if (v === 'dt' || v === 'dd') {
            // not yet in a Definition List
            if (n && !ed.dom.getParent(n, 'dl')) {
              ed.execCommand('InsertDefinitionList');
            }

            // rename DT to DD
            if (v === 'dt' && n.nodeName === 'DD') {
              ed.dom.rename(n, 'DT');
            }

            // rename DD to DT
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

    function clearBlocks(e) {
      var p, n = ed.selection.getNode();

      // set defualt content and get the element to use
      var tag = ed.getParam('forced_root_block', 'p');

      if (!tag) {
        tag = ed.getParam('force_block_newlines') ? 'p' : 'br';
      }

      // Find parent element just before the document body
      p = ed.dom.getParents(n, blocks.join(','));

      // inside a table
      if (ed.dom.getParent(n, 'td,th')) {
        p = ed.dom.getParents(n, 'td,th,tr,tfoot,thead,table');
      }

      if (p && p.length > 1) {
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
          ed.dom.insertBefore(el, block);
        }

        // select and collapse
        ed.selection.select(el);
        ed.selection.collapse(1);
      }

      // execute normal enter/up behaviour
    }
  });

})();