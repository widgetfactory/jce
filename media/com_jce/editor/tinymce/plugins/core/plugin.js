/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global tinymce:true */

(function () {
  var Entities = tinymce.html.Entities, each = tinymce.each,
    extend = tinymce.extend,
    DomParser = tinymce.html.DomParser,
    HtmlSerializer = tinymce.html.Serializer,
    Dispatcher = tinymce.util.Dispatcher,
    DOM = tinymce.DOM;

  function validateContent(ed, content) {
    var args = {
      "no_events": true,
      "format": "raw"
    };

    // create new settings object
    var settings = {};

    // extend with editor settings
    extend(settings, ed.settings);

    // set content    
    args.content = content;

    if (ed.settings.validate) {
      // trigger cleanup etc in editor
      args.format = "html";

      // set a load flag so code is processed as code blocks
      args.load = true;

      // onBeforeGetContent
      ed.onBeforeGetContent.dispatch(ed, args);

      // allow all tags
      settings.verify_html = false;

      // no root blocks
      settings.forced_root_block = false;

      // must validate
      settings.validate = true;

      // create dom parser
      var parser = new DomParser(settings, ed.schema);

      // create html serializer
      var serializer = new HtmlSerializer(settings, ed.schema);

      // clean content
      args.content = serializer.serialize(parser.parse(args.content), args);

      args.get = true;

      // onPostProcess
      ed.onPostProcess.dispatch(ed, args);

      // pass content
      content = args.content;
    }

    return content;
  }

  tinymce.PluginManager.add('core', function (ed, url) {
    // command store
    var store;

    // media update event
    ed.onUpdateMedia = new Dispatcher();
    ed.onWfEditorSave = new Dispatcher();

    // is the editor in SPPageBuilder
    function isSpPageBuilder() {
      var pb = DOM.get('sp-inline-popover');

      return pb && DOM.isChildOf(ed.getElement(), pb) || false;
    }

    var contentLoaded = false, elm = ed.getElement();

    function isEmpty() {
      if (elm.nodeName === 'TEXTAREA') {
        return elm.value == '';
      } else {
        return elm.innerHTML == '';
      }
    }

    function insertContent(value) {
      value = Entities.decode(value);

      if (value) {
        if (elm.nodeName === 'TEXTAREA') {
          elm.value = value;
        } else {
          elm.innerHTML = value;
        }
      }

      return true;
    }

    function isFakeRoot(node) {
      return node && node.nodeType == 1 && node.hasAttribute('data-mce-root');
    }

    var startup_content_html = ed.settings.startup_content_html || '';

    ed.onBeforeRenderUI.add(function () {
      // load content on first startup
      if (startup_content_html && elm) {
        if (!contentLoaded && isEmpty()) {
          contentLoaded = true;
          return insertContent(startup_content_html);
        }
      }
    });

    var quoteMap = {
      en: {
        '\u0022': '&ldquo;{$selection}&rdquo;',
        '\u0027': '&lsquo;{$selection}&rsquo;'
      },

      de: {
        '\u0022': '&bdquo;{$selection}&ldquo;',
        '\u0027': '&sbquo;{$selection}&rsquo;'
      }
    };

    // special quotes shortcute
    ed.onKeyUp.add(function (ed, e) {
      // eslint-disable-next-line dot-notation
      var map = quoteMap[ed.settings.language] || quoteMap['en'];

      if ((e.key == '\u0022' || e.key == '\u0027') && e.shiftKey && e.ctrlKey) {
        var value = map[e.key];

        ed.undoManager.add();
        ed.execCommand('mceReplaceContent', false, value);
      }
    });

    ed.onExecCommand.add(function (ed, cmd, ui, val, args) {
      if (cmd == 'Undo' || cmd == 'Redo' || cmd == 'mceReApply' || cmd == 'mceRepaint') {
        return;
      }

      store = { cmd: cmd, ui: ui, value: val, args: args };
    });

    ed.addShortcut('ctrl+alt+z', '', 'mceReApply');

    ed.addCommand('mceReApply', function () {
      if (!store || !store.cmd) {
        return;
      }

      return ed.execCommand(store.cmd, store.ui, store.value, store.args);
    });

    function fakeRootBlock() {
      ed.settings.editable_root = 'rootblock';

      ed.onPreInit.addToTop(function () {
        var selection = ed.selection, dom = ed.dom;

        // set dom root element for getRoot method
        dom.settings.root_element = ed.settings.editable_root;

        ed.schema.addValidElements('#mce:root[id|data-mce-root]');

        // add children from body element
        ed.schema.children['mce:root'] = ed.schema.children.body;
        // set "mce:root" as a valid child of body
        ed.schema.children.body['mce:root'] = {};

        // remove fake root when serializing
        ed.serializer.addAttributeFilter('data-mce-root', function (nodes) {
          var i = nodes.length;

          while (i--) {
            nodes[i].unwrap();
          }
        });

        // remove <br data-mce-bogus="1">
        ed.serializer.addAttributeFilter('data-mce-bogus', function (nodes) {
          var i = nodes.length;

          while (i--) {
            nodes[i].remove();
          }
        });

        // wrap content in fake root
        ed.onBeforeSetContent.add(function (editor, o) {
          if (!o.content) {
            o.content = '<br data-mce-bogus="1">';
          }

          o.content = '<mce:root id="' + ed.settings.editable_root + '" data-mce-root="1">' + o.content + '</mce:root>';
        });

        function isEmptyRoot(node) {
          return /^(&nbsp;|&#160;|\s|\u00a0|)$/.test(node.innerHTML);
        }

        // reset selection to fake root
        ed.onSetContent.addToTop(function (ed, o) {
          var root = dom.get(ed.settings.editable_root), rng;

          if (root) {

            if (isEmptyRoot(root)) {
              root.innerHTML = '<br data-mce-bogus="1">';
            }

            // Move the caret to the end of the marker
            rng = dom.createRng();
            rng.setStart(root, 0);
            rng.setEnd(root, 0);
            selection.setRng(rng);
          }
        });

        // clear non-breaking space
        ed.onSaveContent.add(function (ed, o) {
          if (o.content === '&nbsp;') {
            o.content = '';
          }
        });

        // UndoManager gets content without event processing, so extract manually
        ed.undoManager.onBeforeAdd.add(function (um, level) {
          var container = ed.dom.create('div', {}, level.content);

          if (isFakeRoot(container.firstChild)) {
            level.content = container.firstChild.innerHTML;
          }

        });
      });
    }

    ed.onPreInit.add(function () {
      ed.onUpdateMedia.add(function (ed, o) {

        if (!o.before || !o.after) {
          return;
        }

        function updateSrcSet(elm, o) {
          // srcset
          var srcset = elm.getAttribute('srcset');

          if (srcset) {
            var sets = srcset.split(',');

            for (var i = 0; i < sets.length; i++) {
              var values = sets[i].trim().split(' ');

              if (o.before == values[0]) {
                values[0] = o.after;
              }

              sets[i] = values.join(' ');
            }

            elm.setAttribute('srcset', sets.join(','));
          }
        }

        each(ed.dom.select('img,poster'), function (elm) {
          var src = elm.getAttribute('src');

          if (src && src.indexOf('?') !== -1) {
            src = src.substring(0, src.indexOf('?'));
          }

          if (src == o.before) {
            var after = o.after;
            var stamp = '?' + new Date().getTime();

            if (src.indexOf('?') !== -1 && after.indexOf('?') === -1) {
              after += stamp;
            }

            ed.dom.setAttribs(elm, { 'src': after, 'data-mce-src': o.after });
          }

          if (elm.getAttribute('srcset')) {
            updateSrcSet(elm, o);
          }
        });

        each(ed.dom.select('a[href]'), function (elm) {
          var href = ed.dom.getAttrib(elm, 'href');

          if (href == o.before) {
            ed.dom.setAttribs(elm, { 'href': o.after, 'data-mce-href': o.after });
          }
        });
      });

      ed.onWfEditorSave.add(function (ed, o) {
        o.content = validateContent(ed, o.content);
      });

      if (isSpPageBuilder()) {
        // run cleanup on sppagebuilder code
        ed.onGetContent.addToTop(function (ed, o) {
          // double-check for sppagebuilder
          if (ed.id.indexOf('sppbeditor-') == -1) {
            return;
          }

          // only for "raw" format
          if (o.format != "raw") {
            return;
          }

          var args = tinymce.extend(o, { format: 'html' });
          o.content = ed.serializer.serialize(ed.getBody(), args);
        });
      }
    });

    if (ed.settings.forced_root_block == false && ed.settings.editable_root != false) {
      fakeRootBlock();
    }
  });
})();