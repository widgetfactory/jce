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
  var Entities = tinymce.html.Entities, each = tinymce.each;

  tinymce.PluginManager.add('core', function (ed, url) {
    // command store
    var store;

    // media update event
    ed.onUpdateMedia = new tinymce.util.Dispatcher();

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

    // special quotes shortcute
    ed.onKeyUp.add(function (ed, e) {
      // default is CTRL + SHIFT + ' and “text”
      var quoted = '&ldquo;{$selection}&rdquo;';

      // use different keyCode for German quotes, eg: „text“
      if (ed.settings.language == 'de') {
        quoted = '&bdquo;{$selection}&ldquo;';
      }

      if ((e.key === '\u0027' || e.key == '\u0022') && e.shiftKey && e.ctrlKey) {
        ed.undoManager.add();
        ed.execCommand('mceReplaceContent', false, quoted);
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

    ed.onPreInit.add(function () {
      ed.onUpdateMedia.add(function (ed, o) {

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
          var val = src.substring(0, src.indexOf('?'));

          if (val == o.before) {
            var after = o.after, stamp = '?' + new Date().getTime();

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
    });
  });
})();