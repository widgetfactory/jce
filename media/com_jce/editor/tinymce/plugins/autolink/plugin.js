/**
 * @package     JCE
 * @copyright   Copyright (c) 2009       Moxiecode Systems AB. All rights reserved.
 * @copyright   Copyright (c) 1999–2015  Ephox Corp. All rights reserved.
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
  var AutoLinkPattern = /^(https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|(?:mailto:)?[A-Z0-9._%+\-]+@)(.+)$/i;

  tinymce.PluginManager.add('autolink', function (ed, url) {
    if (!ed.getParam('autolink_url', true) && !ed.getParam('autolink_email', true)) {
      return;
    }

    if (ed.settings.autolink_pattern) {
      AutoLinkPattern = ed.settings.autolink_pattern;
    }

    ed.onAutoLink = new tinymce.util.Dispatcher(this);

    // Add a key down handler
    ed.onKeyDown.addToTop(function (ed, e) {
      if (e.keyCode == 13) {
        return handleEnter(ed);
      }
    });

    // Internet Explorer has built-in automatic linking for most cases
    if (tinymce.isIE) {
      return;
    }

    ed.onKeyPress.add(function (ed, e) {
      if (e.which == 41) {
        return handleEclipse(ed);
      }
    });

    // Add a key up handler
    ed.onKeyUp.add(function (ed, e) {
      if (e.keyCode == 32) {
        return handleSpacebar(ed);
      }
    });

    function handleEclipse(ed) {
      parseCurrentLine(ed, -1, '(', true);
    }

    function handleSpacebar(ed) {
      parseCurrentLine(ed, 0, '', true);
    }

    function handleEnter(ed) {
      parseCurrentLine(ed, -1, '', false);
    }

    function parseCurrentLine(editor, endOffset, delimiter) {
      var rng, end, start, endContainer, bookmark, text, matches, prev, len, rngText;

      function scopeIndex(container, index) {
        if (index < 0) {
          index = 0;
        }

        if (container.nodeType == 3) {
          var len = container.data.length;

          if (index > len) {
            index = len;
          }
        }

        return index;
      }

      function setStart(container, offset) {
        if (container.nodeType != 1 || container.hasChildNodes()) {
          rng.setStart(container, scopeIndex(container, offset));
        } else {
          rng.setStartBefore(container);
        }
      }

      function setEnd(container, offset) {
        if (container.nodeType != 1 || container.hasChildNodes()) {
          rng.setEnd(container, scopeIndex(container, offset));
        } else {
          rng.setEndAfter(container);
        }
      }

      // Never create a link when we are inside a link
      if (editor.selection.getNode().tagName == 'A') {
        return;
      }

      // We need at least five characters to form a URL,
      // hence, at minimum, five characters from the beginning of the line.
      rng = editor.selection.getRng(true).cloneRange();
      if (rng.startOffset < 5) {
        // During testing, the caret is placed between two text nodes.
        // The previous text node contains the URL.
        prev = rng.endContainer.previousSibling;
        if (!prev) {
          if (!rng.endContainer.firstChild || !rng.endContainer.firstChild.nextSibling) {
            return;
          }

          prev = rng.endContainer.firstChild.nextSibling;
        }

        len = prev.length;
        setStart(prev, len);
        setEnd(prev, len);

        if (rng.endOffset < 5) {
          return;
        }

        end = rng.endOffset;
        endContainer = prev;
      } else {
        endContainer = rng.endContainer;

        // Get a text node
        if (endContainer.nodeType != 3 && endContainer.firstChild) {
          while (endContainer.nodeType != 3 && endContainer.firstChild) {
            endContainer = endContainer.firstChild;
          }

          // Move range to text node
          if (endContainer.nodeType == 3) {
            setStart(endContainer, 0);
            setEnd(endContainer, endContainer.nodeValue.length);
          }
        }

        if (rng.endOffset == 1) {
          end = 2;
        } else {
          end = rng.endOffset - 1 - endOffset;
        }
      }

      start = end;

      do {
        // Move the selection one character backwards.
        setStart(endContainer, end >= 2 ? end - 2 : 0);
        setEnd(endContainer, end >= 1 ? end - 1 : 0);
        end -= 1;
        rngText = rng.toString();

        // Loop until one of the following is found: a blank space, &nbsp;, delimiter, (end-2) >= 0
      } while (rngText != ' ' && rngText !== '' && rngText.charCodeAt(0) != 160 && (end - 2) >= 0 && rngText != delimiter);

      if (rng.toString() == delimiter || rng.toString().charCodeAt(0) == 160) {
        setStart(endContainer, end);
        setEnd(endContainer, start);
        end += 1;
      } else if (rng.startOffset === 0) {
        setStart(endContainer, 0);
        setEnd(endContainer, start);
      } else {
        setStart(endContainer, end);
        setEnd(endContainer, start);
      }

      // Exclude last . from word like "www.site.com."
      text = rng.toString();
      if (text.charAt(text.length - 1) == '.') {
        setEnd(endContainer, start - 1);
      }

      text = rng.toString();
      matches = text.match(AutoLinkPattern);

      if (matches) {
        if (matches[1] == 'www.') {
          matches[1] = 'https://www.';
        } else if (/@$/.test(matches[1]) && !/^mailto:/.test(matches[1])) {
          matches[1] = 'mailto:' + matches[1];
        }

        if (matches[1].indexOf('http') !== -1) {
          if (!editor.getParam('autolink_url', true)) {
            return;
          }
        }

        if (matches[1].indexOf('mailto:') !== -1) {
          if (!editor.getParam('autolink_email', true)) {
            return;
          }
        }

        bookmark = editor.selection.getBookmark();

        editor.selection.setRng(rng);
        editor.execCommand('createlink', false, matches[1] + matches[2]);

        var node = editor.selection.getNode();

        if (editor.settings.default_link_target) {
          editor.dom.setAttrib(node, 'target', editor.settings.default_link_target);
        }

        editor.onAutoLink.dispatch(editor, { node: node });

        editor.selection.moveToBookmark(bookmark);
        editor.nodeChanged();
      }
    }
  });
})();