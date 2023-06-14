(function () {
  'use strict';

  /* eslint-disable */

  var each$1 = tinymce.each, DOM$1 = tinymce.DOM;

  var mceInternalUrlPrefix = 'data:text/mce-internal,';

  var parseCssToRules = function (content) {
    var doc = document.implementation.createHTMLDocument(""),
      styleElement = document.createElement("style");

    styleElement.textContent = content;

    doc.body.appendChild(styleElement);

    return styleElement.sheet.cssRules;
  };

  function parseCSS(content) {
    var rules, classes = {};

    rules = parseCssToRules(content);

    function isValue(val) {
      return val !== "" && val !== "normal" && val !== "inherit" && val !== "none" && val !== "initial";
    }

    function isValidStyle(value) {
      return Object.values(value).length;
    }

    each$1(rules, function (r) {

      if (r.selectorText) {
        var styles = {};

        each$1(r.style, function (name) {
          var value = r.style.getPropertyValue(name);

          if (isValue(value)) {
            styles[name] = value;
          }

        });

        each$1(r.selectorText.split(','), function (selector) {
          selector = selector.trim();

          if (selector.indexOf('.mce') == 0 || selector.indexOf('.mce-') !== -1 || selector.indexOf('.mso-') !== -1) {
            return;
          }

          if (isValidStyle(styles)) {
            classes[selector] = {
              styles: styles,
              text: r.cssText
            };
          }
        });
      }
    });

    return classes;
  }

  function processStylesheets(content, embed_stylesheet) {
    var div = DOM$1.create('div', {}, content), styles = {}, css = '';

    styles = tinymce.extend(styles, parseCSS(content));

    each$1(styles, function (value, selector) {
      // skip Word stuff
      if (selector.indexOf('Mso') !== -1) {
        return true;
      }
      
      if (!embed_stylesheet) {
        DOM$1.setStyles(DOM$1.select(selector, div), value.styles);
      } else {
        css += value.text;
      }
    });

    if (css) {
      div.prepend(DOM$1.create('style', { type: 'text/css' }, css));
    }

    content = div.innerHTML;

    return content;
  }

  function hasContentType(clipboardContent, mimeType) {
    return mimeType in clipboardContent && clipboardContent[mimeType].length > 0;
  }

  /**
   * Gets various content types out of a datatransfer object.
   *
   * @param {DataTransfer} dataTransfer Event fired on paste.
   * @return {Object} Object with mime types and data for those mime types.
   */
  function getDataTransferItems(dataTransfer) {
    var items = {};

    if (dataTransfer) {
      // Use old WebKit/IE API
      if (dataTransfer.getData) {
        var legacyText = dataTransfer.getData('Text');
        if (legacyText && legacyText.length > 0) {
          if (legacyText.indexOf(mceInternalUrlPrefix) === -1) {
            items['text/plain'] = legacyText;
          }
        }
      }

      if (dataTransfer.types) {
        for (var i = 0; i < dataTransfer.types.length; i++) {
          var contentType = dataTransfer.types[i];
          try { // IE11 throws exception when contentType is Files (type is present but data cannot be retrieved via getData())
            items[contentType] = dataTransfer.getData(contentType);
          } catch (ex) {
            items[contentType] = ""; // useless in general, but for consistency across browsers
          }
        }
      }
    }

    return items;
  }

  function filter(content, items) {
    tinymce.each(items, function (v) {
      if (v.constructor == RegExp) {
        content = content.replace(v, '');
      } else {
        content = content.replace(v[0], v[1]);
      }
    });

    return content;
  }

  /**
   * Trims the specified HTML by removing all WebKit fragments, all elements wrapping the body trailing BR elements etc.
   *
   * @param {String} html Html string to trim contents on.
   * @return {String} Html contents that got trimmed.
   */
  function trimHtml(html) {
    function trimSpaces(all, s1, s2) {

      // WebKit &nbsp; meant to preserve multiple spaces but instead inserted around all inline tags,
      // including the spans with inline styles created on paste
      if (!s1 && !s2) {
        return ' ';
      }

      return '\u00a0';
    }

    function getInnerFragment(html) {
      var startFragment = '<!--StartFragment-->';
      var endFragment = '<!--EndFragment-->';
      var startPos = html.indexOf(startFragment);
      if (startPos !== -1) {
        var fragmentHtml = html.substr(startPos + startFragment.length);
        var endPos = fragmentHtml.indexOf(endFragment);
        if (endPos !== -1 && /^<\/(p|h[1-6]|li)>/i.test(fragmentHtml.substr(endPos + endFragment.length, 5))) {
          return fragmentHtml.substr(0, endPos);
        }
      }

      return html;
    }

    html = filter(getInnerFragment(html), [
      /^[\s\S]*<body[^>]*>\s*|\s*<\/body[^>]*>[\s\S]*$/gi, // Remove anything but the contents within the BODY element
      /<!--StartFragment-->|<!--EndFragment-->/g, // Inner fragments (tables from excel on mac)
      [/( ?)<span class="Apple-converted-space">(\u00a0|&nbsp;)<\/span>( ?)/g, trimSpaces],
      /<br class="Apple-interchange-newline">/g,
      /^<meta[^>]+>/g, // Chrome weirdness
      /<br>$/i, // Trailing BR elements,
      /&nbsp;$/ // trailing non-breaking space
    ]);

    return html;
  }

  var DOM = tinymce.DOM;

  function openWin(ed, cmd) {
      var title = '', ctrl;

      var msg = ed.getLang('clipboard.paste_dlg_title', 'Use %s+V on your keyboard to paste text into the window.');
      msg = msg.replace(/%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

      if (cmd === "mcePaste") {
          title = ed.getLang('clipboard.paste_desc');
          ctrl = '<textarea id="' + ed.id + '_paste_content" dir="ltr" wrap="soft" rows="7" autofocus></textarea>';

      } else {
          title = ed.getLang('clipboard.paste_text_desc');
          ctrl = '<textarea id="' + ed.id + '_paste_content" dir="ltr" wrap="soft" rows="7" autofocus></textarea>';
      }

      var html = '' +
          '<div class="mceModalRow mceModalStack">' +
          '   <label for="' + ed.id + '_paste_content">' + msg + '</label>' +
          '</div>' +
          '<div class="mceModalRow">' +
          '   <div class="mceModalControl">' + ctrl + '</div>' +
          '</div>';

      var isInternalContent = false;

      function createEditor(elm) {
          var pasteEd = new tinymce.Editor(elm.id, {
              plugins: '',
              language_load: false,
              forced_root_block: false,
              verify_html: false,
              invalid_elements: ed.settings.invalid_elements,
              base_url: ed.settings.base_url,
              document_base_url: ed.settings.document_base_url,
              directionality: ed.settings.directionality,
              content_css: ed.settings.content_css,
              allow_event_attributes: ed.settings.allow_event_attributes,
              object_resizing: false,
              schema: 'mixed',
              theme: function () {
                  var parent = DOM.create('div', {
                      role: 'application',
                      id: elm.id + '_parent',
                      style: 'width:100%'
                  });

                  var container = DOM.add(parent, 'div', { style: 'width:100%' });
                  DOM.insertAfter(parent, elm);

                  return {
                      iframeContainer: container,
                      editorContainer: parent
                  };
              }
          });

          pasteEd.contentCSS = ed.contentCSS;

          pasteEd.onPreInit.add(function () {
              var doc = this.getDoc();

              this.onPaste.add(function (el, e) {
                  var clipboardContent = getDataTransferItems(e.clipboardData || e.dataTransfer || doc.dataTransfer);

                  if (clipboardContent) {
                      isInternalContent = hasContentType(clipboardContent, 'x-tinymce/html');
                      var content = clipboardContent['x-tinymce/html'] || clipboardContent['text/html'] || clipboardContent['text/plain'] || '';

                      if (ed.settings.clipboard_process_stylesheets !== false) {
                          content = processStylesheets(content);
                      }

                      content = trimHtml(content);

                      var sel = doc.getSelection();

                      if (sel != null) {
                          var rng = sel.getRangeAt(0);

                          if (rng != null) {
                              // Make caret marker since insertNode places the caret in the beginning of text after insert
                              content += '<span id="__mce_caret">_</span>';

                              // Delete and insert new node
                              if (rng.startContainer == doc && rng.endContainer == doc) {
                                  // WebKit will fail if the body is empty since the range is then invalid and it can't insert contents
                                  doc.body.innerHTML = content;
                              } else {
                                  rng.deleteContents();

                                  if (doc.body.childNodes.length === 0) {
                                      doc.body.innerHTML = content;
                                  } else {
                                      rng.insertNode(rng.createContextualFragment(content));
                                  }
                              }

                              // Move to caret marker
                              var caretNode = doc.getElementById('__mce_caret');

                              rng = doc.createRange();
                              rng.setStartBefore(caretNode);
                              rng.setEndBefore(caretNode);
                              sel.removeAllRanges();
                              sel.addRange(rng);

                              // Remove the caret position
                              if (caretNode.parentNode) {
                                  caretNode.parentNode.removeChild(caretNode);
                              }
                          }
                      }

                      e.preventDefault();
                  }
              });

              // remove fragment attribute (from InsertContent)
              this.serializer.addAttributeFilter('data-mce-fragment', function (nodes, name) {
                  var i = nodes.length;

                  while (i--) {
                      nodes[i].attr('data-mce-fragment', null);
                  }
              });
          });

          pasteEd.render();
      }

      ed.windowManager.open({
          title: title,
          content: html,
          size: 'mce-modal-landscape-medium',
          open: function () {
              var inp = DOM.get(ed.id + '_paste_content');

              // create simple editor if pasteHTML
              if (cmd == "mcePaste") {
                  createEditor(inp);
              }
          },
          close: function () {
          },
          buttons: [
              {
                  title: ed.getLang('cancel', 'Cancel'),
                  id: 'cancel'
              },
              {
                  title: ed.getLang('insert', 'Insert'),
                  id: 'insert',
                  onsubmit: function (e) {
                      var inp = DOM.get(ed.id + '_paste_content'), data = {};

                      // cleanup for pasteHTML
                      if (cmd == "mcePaste") {
                          var content = tinymce.get(inp.id).getContent();
                          // Remove styles
                          if (ed.settings.code_allow_style !== true) {
                              content = content.replace(/<style[^>]*>[\s\S]+?<\/style>/gi, '');
                          }
                          // Remove meta (Chrome)
                          content = content.replace(/<meta([^>]+)>/, '');
                          // trim and assign
                          data.content = tinymce.trim(content);
                          // set internal flag
                          data.internal = isInternalContent;
                      } else {
                          data.text = inp.value;
                      }

                      ed.execCommand('mceInsertClipboardContent', false, data);
                  },
                  classes: 'primary',
                  autofocus: true
              }
          ]
      });
  }

  /**
   * @package   	JCE
   * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved.
   * @copyright   Copyright (c) 1999-2017 Ephox Corp. All rights reserved
   * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
   * JCE is free software. This version may have been modified pursuant
   * to the GNU General Public License, and as distributed it includes or
   * is derivative of works licensed under the GNU General Public License or
   * other free or open source software licenses.
   */

  var each = tinymce.each;

  tinymce.create('tinymce.plugins.ClipboardPlugin', {
      init: function (ed, url) {
          var pasteText = ed.getParam('clipboard_paste_text', 1);
          var pasteHtml = ed.getParam('clipboard_paste_html', 1);

          ed.onInit.add(function () {
              if (ed.plugins.contextmenu) {
                  ed.plugins.contextmenu.onContextMenu.add(function (th, m, e) {
                      var c = ed.selection.isCollapsed();

                      if (ed.getParam('clipboard_cut', 1)) {
                          m.add({
                              title: 'advanced.cut_desc',
                              /* TODO - Change to clipboard.cut_desc */
                              icon: 'cut',
                              cmd: 'Cut'
                          }).setDisabled(c);
                      }

                      if (ed.getParam('clipboard_copy', 1)) {
                          m.add({
                              title: 'advanced.copy_desc',
                              /* TODO - Change to clipboard.copy_desc */
                              icon: 'copy',
                              cmd: 'Copy'
                          }).setDisabled(c);
                      }

                      if (pasteHtml) {
                          m.add({
                              title: 'clipboard.paste_desc',
                              /* TODO - Change to clipboard.paste_desc */
                              icon: 'paste',
                              cmd: 'mcePaste'
                          });
                      }
                      if (pasteText) {
                          m.add({
                              title: 'clipboard.paste_text_desc',
                              /* TODO - Change to clipboard.paste_text_desc */
                              icon: 'pastetext',
                              cmd: 'mcePasteText'
                          });
                      }
                  });

              }
          });

          // Add commands
          each(['mcePasteText', 'mcePaste'], function (cmd) {
              ed.addCommand(cmd, function () {
                  var doc = ed.getDoc(),
                      failed = false;

                  // just open the window
                  if (ed.getParam('clipboard_paste_use_dialog')) {
                      return openWin(ed, cmd);
                  } else {
                      try {
                          doc.execCommand('Paste', false, null);
                      } catch (e) {
                          failed = true;
                      }

                      // Chrome reports the paste command as supported however older IE:s will return false for cut/paste
                      if (!doc.queryCommandEnabled('Paste')) {
                          failed = true;
                      }

                      if (failed) {
                          return openWin(ed, cmd);
                      }
                  }
              });
          });

          // Add buttons
          if (pasteHtml) {
              ed.addButton('paste', {
                  title: 'clipboard.paste_desc',
                  cmd: 'mcePaste',
                  ui: true
              });
          }

          if (pasteText) {
              ed.addButton('pastetext', {
                  title: 'clipboard.paste_text_desc',
                  cmd: 'mcePasteText',
                  ui: true
              });
          }

          if (ed.getParam('clipboard_cut', 1)) {
              ed.addButton('cut', {
                  title: 'advanced.cut_desc',
                  cmd: 'Cut',
                  icon: 'cut'
              });
          }

          if (ed.getParam('clipboard_copy', 1)) {
              ed.addButton('copy', {
                  title: 'advanced.copy_desc',
                  cmd: 'Copy',
                  icon: 'copy'
              });
          }
      }
  });
  // Register plugin
  tinymce.PluginManager.add('clipboard', tinymce.plugins.ClipboardPlugin);

})();
