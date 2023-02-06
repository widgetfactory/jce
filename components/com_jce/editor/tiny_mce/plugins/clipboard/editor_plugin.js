(function () {
  'use strict';

  /* eslint-disable */

  var internalMimeType = 'x-tinymce/html';
  var internalMark = '<!-- ' + internalMimeType + ' -->';

  var mark = function (html) {
    return internalMark + html;
  };

  var unmark = function (html) {
    return html.replace(internalMark, '');
  };

  var isMarked = function (html) {
    return html.indexOf(internalMark) !== -1;
  };

  var internalHtmlMime = function () {
    return internalMimeType;
  };

  var noop = function () { };

  var hasWorkingClipboardApi = function (clipboardData) {
      // iOS supports the clipboardData API but it doesn't do anything for cut operations
      return tinymce.isIOS === false && clipboardData !== undefined && typeof clipboardData.setData === 'function';
  };

  var setHtml5Clipboard = function (clipboardData, html, text) {
      if (hasWorkingClipboardApi(clipboardData)) {
          try {
              clipboardData.clearData();
              clipboardData.setData('text/html', html);
              clipboardData.setData('text/plain', text);
              clipboardData.setData(internalHtmlMime(), html);
              return true;
          } catch (e) {
              return false;
          }
      } else {
          return false;
      }
  };

  var setClipboardData = function (evt, data, fallback, done) {
      if (setHtml5Clipboard(evt.clipboardData, data.html, data.text)) {
          evt.preventDefault();
          done();
      } else {
          fallback(data.html, done);
      }
  };

  var fallback = function (editor) {
      return function (html, done) {
          var markedHtml = mark(html);
          var outer = editor.dom.create('div', {
              contenteditable: "false",
              "data-mce-bogus": "all"
          });

          var inner = editor.dom.create('div', {
              contenteditable: "true",
              "data-mce-bogus": "all"
          }, markedHtml);

          editor.dom.setStyles(outer, {
              position: 'fixed',
              left: '-3000px',
              width: '1000px',
              overflow: 'hidden'
          });

          outer.appendChild(inner);
          editor.dom.add(editor.getBody(), outer);

          var range = editor.selection.getRng();
          inner.focus();

          var offscreenRange = editor.dom.createRng();
          offscreenRange.selectNodeContents(inner);
          editor.selection.setRng(offscreenRange);

          setTimeout(function () {
              outer.parentNode.removeChild(outer);
              editor.selection.setRng(range);
              done();
          }, 0);
      };
  };

  var getData = function (editor) {
      return {
          html: editor.selection.getContent({
              contextual: true
          }),
          text: editor.selection.getContent({
              format: 'text'
          })
      };
  };

  var cut = function (editor, evt) {
      if (editor.selection.isCollapsed() === false) {
          setClipboardData(evt, getData(editor), fallback(editor), function () {
              // Chrome fails to execCommand from another execCommand with this message:
              // "We don't execute document.execCommand() this time, because it is called recursively.""
              setTimeout(function () { // detach
                  editor.execCommand('Delete');
              }, 0);
          });
      }
  };

  var copy = function (editor, evt) {
      if (editor.selection.isCollapsed() === false) {
          setClipboardData(evt, getData(editor), fallback(editor), noop);
      }
  };

  var register = function (editor) {
      editor.onCut.add(cut);
      editor.onCopy.add(copy);
  };

  var DomParser$2 = tinymce.html.DomParser, Schema$1 = tinymce.html.Schema;

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
   * Gets the innerText of the specified element. It will handle edge cases
   * and works better than textContent on Gecko.
   *
   * @param {String} html HTML string to get text from.
   * @return {String} String of text with line feeds.
   */
  function innerText(html) {
    var schema = new Schema$1(),
      domParser = new DomParser$2({}, schema),
      text = '';
    var shortEndedElements = schema.getShortEndedElements();
    var ignoreElements = tinymce.makeMap('script noscript style textarea video audio iframe object', ' ');
    var blockElements = schema.getBlockElements();

    function walk(node) {
      var name = node.name,
        currentNode = node;

      if (name === 'br') {
        text += '\n';
        return;
      }

      // img/input/hr
      if (shortEndedElements[name]) {
        text += ' ';
      }

      // Ingore script, video contents
      if (ignoreElements[name]) {
        text += ' ';
        return;
      }

      if (node.type == 3) {
        text += node.value;
      }

      // Walk all children
      if (!node.shortEnded) {
        if ((node = node.firstChild)) {
          do {
            walk(node);
          } while ((node = node.next));
        }
      }

      // Add \n or \n\n for blocks or P
      if (blockElements[name] && currentNode.next) {
        text += '\n';

        if (name == 'p') {
          text += '\n';
        }
      }
    }

    html = filter(html, [
      /<!\[[^\]]+\]>/g // Conditional comments
    ]);

    walk(domParser.parse(html));

    return text;
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
      /^[\s\S]*<body[^>]*>\s*|\s*<\/body[^>]*>[\s\S]*$/g, // Remove anything but the contents within the BODY element
      /<!--StartFragment-->|<!--EndFragment-->/g, // Inner fragments (tables from excel on mac)
      [/( ?)<span class="Apple-converted-space">(\u00a0|&nbsp;)<\/span>( ?)/g, trimSpaces],
      /<br class="Apple-interchange-newline">/g,
      /^<meta[^>]+>/g, // Chrome weirdness
      /<br>$/i // Trailing BR elements
    ]);

    return html;
  }

  function convertToPixels(v) {
    // retun integer 0 for 0 values, eg: 0cm, 0pt etc. 
    if (parseInt(v, 10) === 0) {
        return 0;
    }

    // convert pt to px
    if (v.indexOf('pt') !== -1) {
        // convert to integer
        v = parseInt(v, 10);
        // convert to pixel value (round up to 1)
        v = Math.ceil(v / 1.33333);
        // convert to absolute integer
        v = Math.abs(v);
    }

    if (v) {
        v += 'px';
    }

    return v;
  }

  var pixelStyles = [
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'
  ];

  var styleProps = [
    'background', 'background-attachment', 'background-color', 'background-image', 'background-position', 'background-repeat',
    'border', 'border-bottom', 'border-bottom-color', 'border-bottom-style', 'border-bottom-width', 'border-color', 'border-left', 'border-left-color', 'border-left-style', 'border-left-width', 'border-right', 'border-right-color', 'border-right-style', 'border-right-width', 'border-style', 'border-top', 'border-top-color', 'border-top-style', 'border-top-width', 'border-width', 'outline', 'outline-color', 'outline-style', 'outline-width',
    'height', 'max-height', 'max-width', 'min-height', 'min-width', 'width',
    'font', 'font-family', 'font-size', 'font-style', 'font-variant', 'font-weight',
    'content', 'counter-increment', 'counter-reset', 'quotes',
    'list-style', 'list-style-image', 'list-style-position', 'list-style-type',
    'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top',
    'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top',
    'bottom', 'clear', 'clip', 'cursor', 'display', 'float', 'left', 'overflow', 'position', 'right', 'top', 'visibility', 'z-index',
    'orphans', 'page-break-after', 'page-break-before', 'page-break-inside', 'widows',
    'border-collapse', 'border-spacing', 'caption-side', 'empty-cells', 'table-layout',
    'color', 'direction', 'letter-spacing', 'line-height', 'text-align', 'text-decoration', 'text-indent', 'text-shadow', 'text-transform', 'unicode-bidi', 'vertical-align', 'white-space', 'word-spacing'
  ];

  var borderStyles = [
    'border', 'border-width', 'border-style', 'border-color',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'
  ];

  var backgroundStyles = {
    'background-image': 'none',
    'background-position': '0% 0%',
    'background-size': 'auto auto',
    'background-repeat': 'repeat',
    'background-origin': 'padding-box',
    'background-clip': 'border-box',
    'background-attachment': 'scroll',
    'background-color': 'transparent'
  };

  var namedColors = {
    '#F0F8FF': 'AliceBlue',
    '#FAEBD7': 'AntiqueWhite',
    '#7FFFD4': 'Aquamarine',
    '#F0FFFF': 'Azure',
    '#F5F5DC': 'Beige',
    '#FFE4C4': 'Bisque',
    '#000000': 'Black',
    '#FFEBCD': 'BlanchedAlmond',
    '#0000FF': 'Blue',
    '#8A2BE2': 'BlueViolet',
    '#A52A2A': 'Brown',
    '#DEB887': 'BurlyWood',
    '#5F9EA0': 'CadetBlue',
    '#7FFF00': 'Chartreuse',
    '#D2691E': 'Chocolate',
    '#FF7F50': 'Coral',
    '#6495ED': 'CornflowerBlue',
    '#FFF8DC': 'Cornsilk',
    '#DC143C': 'Crimson',
    '#00008B': 'DarkBlue',
    '#008B8B': 'DarkCyan',
    '#B8860B': 'DarkGoldenRod',
    '#A9A9A9': 'DarkGray',
    '#006400': 'DarkGreen',
    '#BDB76B': 'DarkKhaki',
    '#8B008B': 'DarkMagenta',
    '#556B2F': 'DarkOliveGreen',
    '#FF8C00': 'Darkorange',
    '#9932CC': 'DarkOrchid',
    '#8B0000': 'DarkRed',
    '#E9967A': 'DarkSalmon',
    '#8FBC8F': 'DarkSeaGreen',
    '#483D8B': 'DarkSlateBlue',
    '#2F4F4F': 'DarkSlateGrey',
    '#00CED1': 'DarkTurquoise',
    '#9400D3': 'DarkViolet',
    '#FF1493': 'DeepPink',
    '#00BFFF': 'DeepSkyBlue',
    '#696969': 'DimGrey',
    '#1E90FF': 'DodgerBlue',
    '#B22222': 'FireBrick',
    '#FFFAF0': 'FloralWhite',
    '#228B22': 'ForestGreen',
    '#DCDCDC': 'Gainsboro',
    '#F8F8FF': 'GhostWhite',
    '#FFD700': 'Gold',
    '#DAA520': 'GoldenRod',
    '#808080': 'Grey',
    '#008000': 'Green',
    '#ADFF2F': 'GreenYellow',
    '#F0FFF0': 'HoneyDew',
    '#FF69B4': 'HotPink',
    '#CD5C5C': 'IndianRed',
    '#4B0082': 'Indigo',
    '#FFFFF0': 'Ivory',
    '#F0E68C': 'Khaki',
    '#E6E6FA': 'Lavender',
    '#FFF0F5': 'LavenderBlush',
    '#7CFC00': 'LawnGreen',
    '#FFFACD': 'LemonChiffon',
    '#ADD8E6': 'LightBlue',
    '#F08080': 'LightCoral',
    '#E0FFFF': 'LightCyan',
    '#FAFAD2': 'LightGoldenRodYellow',
    '#D3D3D3': 'LightGrey',
    '#90EE90': 'LightGreen',
    '#FFB6C1': 'LightPink',
    '#FFA07A': 'LightSalmon',
    '#20B2AA': 'LightSeaGreen',
    '#87CEFA': 'LightSkyBlue',
    '#778899': 'LightSlateGrey',
    '#B0C4DE': 'LightSteelBlue',
    '#FFFFE0': 'LightYellow',
    '#00FF00': 'Lime',
    '#32CD32': 'LimeGreen',
    '#FAF0E6': 'Linen',
    '#FF00FF': 'Magenta',
    '#800000': 'Maroon',
    '#66CDAA': 'MediumAquaMarine',
    '#0000CD': 'MediumBlue',
    '#BA55D3': 'MediumOrchid',
    '#9370D8': 'MediumPurple',
    '#3CB371': 'MediumSeaGreen',
    '#7B68EE': 'MediumSlateBlue',
    '#00FA9A': 'MediumSpringGreen',
    '#48D1CC': 'MediumTurquoise',
    '#C71585': 'MediumVioletRed',
    '#191970': 'MidnightBlue',
    '#F5FFFA': 'MintCream',
    '#FFE4E1': 'MistyRose',
    '#FFE4B5': 'Moccasin',
    '#FFDEAD': 'NavajoWhite',
    '#000080': 'Navy',
    '#FDF5E6': 'OldLace',
    '#808000': 'Olive',
    '#6B8E23': 'OliveDrab',
    '#FFA500': 'Orange',
    '#FF4500': 'OrangeRed',
    '#DA70D6': 'Orchid',
    '#EEE8AA': 'PaleGoldenRod',
    '#98FB98': 'PaleGreen',
    '#AFEEEE': 'PaleTurquoise',
    '#D87093': 'PaleVioletRed',
    '#FFEFD5': 'PapayaWhip',
    '#FFDAB9': 'PeachPuff',
    '#CD853F': 'Peru',
    '#FFC0CB': 'Pink',
    '#DDA0DD': 'Plum',
    '#B0E0E6': 'PowderBlue',
    '#800080': 'Purple',
    '#FF0000': 'Red',
    '#BC8F8F': 'RosyBrown',
    '#4169E1': 'RoyalBlue',
    '#8B4513': 'SaddleBrown',
    '#FA8072': 'Salmon',
    '#F4A460': 'SandyBrown',
    '#2E8B57': 'SeaGreen',
    '#FFF5EE': 'SeaShell',
    '#A0522D': 'Sienna',
    '#C0C0C0': 'Silver',
    '#87CEEB': 'SkyBlue',
    '#6A5ACD': 'SlateBlue',
    '#708090': 'SlateGrey',
    '#FFFAFA': 'Snow',
    '#00FF7F': 'SpringGreen',
    '#4682B4': 'SteelBlue',
    '#D2B48C': 'Tan',
    '#008080': 'Teal',
    '#D8BFD8': 'Thistle',
    '#FF6347': 'Tomato',
    '#40E0D0': 'Turquoise',
    '#EE82EE': 'Violet',
    '#F5DEB3': 'Wheat',
    '#FFFFFF': 'White',
    '#F5F5F5': 'WhiteSmoke',
    '#FFFF00': 'Yellow',
    '#9ACD32': 'YellowGreen'
  };

  function namedColorToHex(value) {
    tinymce.each(namedColors, function (name, hex) {
        if (value.toLowerCase() === name.toLowerCase()) {
            value = hex;
            return false;
        }
    });

    return value.toLowerCase();
  }

  var each$2 = tinymce.each,
      Schema = tinymce.html.Schema,
      DomParser$1 = tinymce.html.DomParser,
      Serializer$1 = tinymce.html.Serializer,
      Node = tinymce.html.Node;

  // Open Office
  var ooRe = /(Version:[\d\.]+)\s*?((Start|End)(HTML|Fragment):[\d]+\s*?){4}/;

  var parseCssToRules = function (content) {
      var doc = document.implementation.createHTMLDocument(""),
          styleElement = document.createElement("style");

      styleElement.textContent = content;

      doc.body.appendChild(styleElement);

      return styleElement.sheet.cssRules;
  };

  function cleanCssContent(content) {
      var classes = [],
          rules = parseCssToRules(content);

      each$2(rules, function (r) {
          if (r.selectorText) {
              each$2(r.selectorText.split(','), function (v) {
                  v = v.replace(/^\s*|\s*$|^\s\./g, "");

                  // Is internal or it doesn't contain a class
                  if (/\.mso/i.test(v) || !/\.[\w\-]+$/.test(v)) {
                      return;
                  }

                  var text = r.cssText || "";

                  if (!text) {
                      return;
                  }

                  if (tinymce.inArray(classes, text) === -1) {
                      classes.push(text);
                  }
              });
          }
      });

      return classes.join("");
  }

  function isWordContent(editor, content) {
      // force word cleanup
      if (editor.settings.clipboard_paste_force_cleanup) {
          return true;
      }

      // Open / Libre Office
      if (/(content=\"OpenOffice.org[^\"]+\")/i.test(content) || ooRe.test(content) || /@page {/.test(content)) {
          return true; // Mark the pasted contents as word specific content
      }

      // Word / Google Docs
      return (
          (/<font face="Times New Roman"|class="?Mso|style="[^"]*\bmso-|style='[^'']*\bmso-|w:WordDocument/i).test(content) ||
          (/class="OutlineElement/).test(content) ||
          (/id="?docs\-internal\-guid\-/.test(content))
      );
  }

  /**
   * Checks if the specified text starts with "1. " or "a. " etc.
   */
  function isNumericList(text) {
      var found = "",
          patterns;

      patterns = {
          'uppper-roman': /^[IVXLMCD]{1,2}\.[ \u00a0]/,
          'lower-roman': /^[ivxlmcd]{1,2}\.[ \u00a0]/,
          'upper-alpha': /^[A-Z]{1,2}[\.\)][ \u00a0]/,
          'lower-alpha': /^[a-z]{1,2}[\.\)][ \u00a0]/,
          'numeric': /^[0-9]+\.[ \u00a0]/,
          'japanese': /^[\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d]+\.[ \u00a0]/,
          'chinese': /^[\u58f1\u5f10\u53c2\u56db\u4f0d\u516d\u4e03\u516b\u4e5d\u62fe]+\.[ \u00a0]/
      };

      /*patterns = [
          /^[IVXLMCD]{1,2}\.[ \u00a0]/, // Roman upper case
          /^[ivxlmcd]{1,2}\.[ \u00a0]/, // Roman lower case
          /^[a-z]{1,2}[\.\)][ \u00a0]/, // Alphabetical a-z
          /^[A-Z]{1,2}[\.\)][ \u00a0]/, // Alphabetical A-Z
          /^[0-9]+\.[ \u00a0]/, // Numeric lists
          /^[\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d]+\.[ \u00a0]/, // Japanese
          /^[\u58f1\u5f10\u53c2\u56db\u4f0d\u516d\u4e03\u516b\u4e5d\u62fe]+\.[ \u00a0]/ // Chinese
      ];*/

      text = text.replace(/^[\u00a0 ]+/, '');

      each$2(patterns, function (pattern, type) {
          if (pattern.test(text)) {
              found = type;
              return false;
          }
      });

      return found;
  }

  function isBulletList(text) {
      return /^[\s\u00a0]*[\u2022\u00b7\u00a7\u25CF]\s*/.test(text);
  }

  function WordFilter(editor, content) {
      var settings = editor.settings;

      var keepStyles, removeStyles, validStyles = {}, styleProps$1 = styleProps;

      // Chrome...
      content = content.replace(/<meta([^>]+)>/, '');

      // remove styles
      content = content.replace(/<style([^>]*)>([\w\W]*?)<\/style>/gi, function (match, attr, value) {
          // remove style tag
          if (settings.clipboard_paste_keep_word_styles !== true) {
              return "";
          }

          // process to remove mso junk
          value = cleanCssContent(value);

          return '<style' + attr + '>' + value + '</style>';
      });
      // Copy paste from Java like Open Office will produce this junk on FF
      content = content.replace(/Version:[\d.]+\nStartHTML:\d+\nEndHTML:\d+\nStartFragment:\d+\nEndFragment:\d+/gi, '');

      // Open Office
      //content = content.replace(ooRe, '', 'g');

      // Remove google docs internal guid markers
      content = content.replace(/<b[^>]+id="?docs-internal-[^>]*>/gi, '');
      content = content.replace(/<br class="?Apple-interchange-newline"?>/gi, '');

      // styles to keep
      keepStyles = settings.clipboard_paste_retain_style_properties;
      // styles to remove
      removeStyles = settings.clipboard_paste_remove_style_properties;

      // remove valid styles if we are removing all styles
      if (editor.getParam('clipboard_paste_remove_styles', 1)) {
          validStyles = {
              'font-weight': {},
              'font-style': {}
          };

          // split to array if string
          if (keepStyles && tinymce.is(keepStyles, 'string')) {
              var styleProps$1 = tinymce.explode(keepStyles);

              each$2(styleProps$1, function (style, i) {
                  if (style === "border") {
                      // add expanded border styles
                      styleProps$1 = styleProps$1.concat(borderStyles);
                      return true;
                  }
              });
          }
      } else {
          // split to array if string
          if (removeStyles && tinymce.is(removeStyles, 'string')) {
              var removeProps = tinymce.explode(removeStyles);

              each$2(removeProps, function (style, i) {
                  if (style === "border") {
                      // add expanded border styles
                      removeProps = removeProps.concat(borderStyles);
                      return true;
                  }
              });

              // remove from core styleProps array
              styleProps$1 = tinymce.grep(styleProps$1, function (prop) {
                  return tinymce.inArray(removeProps, prop) === -1;
              });
          }
      }

      each$2(styleProps$1, function (style) {
          // add all border styles if "border" is set
          if (style === "border") {
              each$2(borderStyles, function (name) {
                  validStyles[name] = {};
              });

              return true;
          }

          validStyles[style] = {};
      });

      /**
       * Converts fake bullet and numbered lists to real semantic OL/UL.
       *
       * @param {tinymce.html.Node} node Root node to convert children of.
       */
      function convertFakeListsToProperLists(node) {
          var currentListNode, prevListNode, lastLevel = 1;

          function getText(node) {
              var txt = '';

              if (node.type === 3) {
                  return node.value;
              }

              if ((node = node.firstChild)) {
                  do {
                      txt += getText(node);
                  } while ((node = node.next));
              }

              return txt;
          }

          function trimListStart(node, regExp) {
              if (node.type === 3) {
                  if (regExp.test(node.value)) {
                      node.value = node.value.replace(regExp, '');
                      return false;
                  }
              }

              if ((node = node.firstChild)) {
                  do {
                      if (!trimListStart(node, regExp)) {
                          return false;
                      }
                  } while ((node = node.next));
              }

              return true;
          }

          function removeIgnoredNodes(node) {
              if (node._listIgnore) {
                  node.remove();
                  return;
              }

              if ((node = node.firstChild)) {
                  do {
                      removeIgnoredNodes(node);
                  } while ((node = node.next));
              }
          }

          function convertParagraphToLi(paragraphNode, listName, start, type) {
              var level = paragraphNode._listLevel || lastLevel;

              // Handle list nesting
              if (level != lastLevel) {
                  if (level < lastLevel) {
                      // Move to parent list
                      if (currentListNode) {
                          currentListNode = currentListNode.parent.parent;
                      }
                  } else {
                      // Create new list
                      prevListNode = currentListNode;
                      currentListNode = null;
                  }
              }

              if (!currentListNode || currentListNode.name != listName) {
                  prevListNode = prevListNode || currentListNode;
                  currentListNode = new Node(listName, 1);

                  // add list style if any
                  if (type && /roman|alpha/.test(type)) {
                      var style = 'list-style-type:' + type;
                      currentListNode.attr({
                          'style': style,
                          'data-mce-style': style
                      });
                  }

                  if (start > 1) {
                      currentListNode.attr('start', '' + start);
                  }

                  paragraphNode.wrap(currentListNode);
              } else {
                  currentListNode.append(paragraphNode);
              }

              paragraphNode.name = 'li';

              // Append list to previous list if it exists
              if (level > lastLevel && prevListNode) {
                  prevListNode.lastChild.append(currentListNode);
              }

              lastLevel = level;

              // Remove start of list item "1. " or "&middot; " etc
              removeIgnoredNodes(paragraphNode);
              trimListStart(paragraphNode, /^\u00a0+/);

              if (currentListNode.name === "ol") {
                  trimListStart(paragraphNode, /^\s*([\u2022\u00b7\u00a7\u25CF]|\w+\.)/);
              }

              if (currentListNode.name === "ul") {
                  trimListStart(paragraphNode, /^\s*([\u2022\u00b7\u00a7\u25CF]|\w+\.)/);
              }

              trimListStart(paragraphNode, /^\u00a0+/);
          }

          // Build a list of all root level elements before we start
          // altering them in the loop below.
          var elements = [],
              child = node.firstChild;

          while (typeof child !== 'undefined' && child !== null) {
              elements.push(child);

              child = child.walk();

              if (child !== null) {
                  while (typeof child !== 'undefined' && child.parent !== node) {
                      child = child.walk();
                  }
              }
          }

          for (var i = 0; i < elements.length; i++) {
              node = elements[i];

              if (node.name == 'p' && node.firstChild) {
                  // Find first text node in paragraph
                  var nodeText = getText(node),
                      type;

                  // Detect unordered lists look for bullets
                  if (isBulletList(nodeText)) {
                      convertParagraphToLi(node, 'ul');
                      continue;
                  }

                  // Detect ordered lists 1., a. or ixv.
                  if (node.attr('data-mce-word-list')) {

                      // remove marker
                      node.attr('data-mce-word-list', null);

                      if ((type = isNumericList(nodeText))) {
                          // Parse OL start number
                          var matches = /([0-9]+)\./.exec(nodeText);
                          var start = 1;
                          if (matches) {
                              start = parseInt(matches[1], 10);
                          }

                          convertParagraphToLi(node, 'ol', start, type);
                          continue;
                      }
                  }

                  // Convert paragraphs marked as lists but doesn't look like anything
                  if (node._listLevel) {
                      convertParagraphToLi(node, 'ul', 1);
                      continue;
                  }

                  currentListNode = null;
              } else {
                  // If the root level element isn't a p tag which can be
                  // processed by convertParagraphToLi, it interrupts the
                  // lists, causing a new list to start instead of having
                  // elements from the next list inserted above this tag.
                  prevListNode = currentListNode;
                  currentListNode = null;
              }
          }
      }

      function filterStyles(node, styleValue) {
          var outputStyles = {},
              matches, styles = editor.dom.parseStyle(styleValue);

          each$2(styles, function (value, name) {
              // Convert various MS styles to W3C styles
              switch (name) {
                  case 'mso-list':
                      // Parse out list indent level for lists
                      matches = /\w+ \w+([0-9]+)/i.exec(styleValue);
                      if (matches) {
                          node._listLevel = parseInt(matches[1], 10);
                      }

                      // Remove these nodes <span style="mso-list:Ignore">o</span>
                      // Since the span gets removed we mark the text node and the span
                      if (/Ignore/i.test(value) && node.firstChild) {
                          node._listIgnore = true;
                          node.firstChild._listIgnore = true;
                      }

                      break;

                  case "horiz-align":
                      name = "text-align";
                      break;

                  case "vert-align":
                      name = "vertical-align";
                      break;

                  case "font-color":
                  case "mso-foreground":
                  case "color":
                      name = "color";

                      // remove "windowtext"
                      if (value == "windowtext") {
                          value = "";
                      }

                      break;

                  case "mso-background":
                  case "mso-highlight":
                      name = "background";
                      break;

                  case "font-weight":
                  case "font-style":
                      if (value == "normal") {
                          value = "";
                      }

                      break;

                  case "mso-element":
                      // Remove track changes code
                      if (/^(comment|comment-list)$/i.test(value)) {
                          node.remove();
                          return;
                      }

                      break;

                  case "margin-left":
                      if (node.name === "p" && settings.paste_convert_indents !== false) {
                          var indentValue = parseInt(editor.settings.indentation, 10);
                          value = parseInt(value, 10);

                          // convert to an indent value, must be greater than 0
                          value = Math.round(value / indentValue) * indentValue;

                          // store value and remove
                          if (value) {
                              node.attr('data-mce-indent', "" + value);
                              value = "";
                          }
                      }
                      break;
              }

              if (name.indexOf('mso-comment') === 0) {
                  node.remove();
                  return;
              }

              // Never allow mso- prefixed names
              if (name.indexOf('mso-') === 0) {
                  return;
              }

              // convert to pixel values
              if (value && tinymce.inArray(pixelStyles, name) !== -1) {
                  value = convertToPixels(value);
              }

              // Output only valid styles
              if (validStyles[name]) {
                  outputStyles[name] = value;
              }
          });

          // Convert bold style to "b" element
          if (/(bold|700|800|900)/i.test(outputStyles["font-weight"])) {
              delete outputStyles["font-weight"];
              node.wrap(new Node("strong", 1));
          }

          // Convert italic style to "i" element
          if (/(italic)/i.test(outputStyles["font-style"])) {
              delete outputStyles["font-style"];
              node.wrap(new Node("em", 1));
          }

          // Serialize the styles and see if there is something left to keep
          outputStyles = editor.dom.serializeStyle(outputStyles, node.name);

          if (outputStyles) {
              return outputStyles;
          }

          return null;
      }

      if (settings.paste_enable_default_filters === false) {
          return content;
      }

      // Remove basic Word junk
      content = filter(content, [
          // Word comments like conditional comments etc
          /<!--[\s\S]+?-->/gi,

          // Remove comments, scripts (e.g., msoShowComment), XML tag, VML content,
          // MS Office namespaced tags, and a few other tags
          /<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|meta|link|style|\w:\w+)(?=[\s\/>]))[^>]*>/gi,

          // Convert <s> into <strike> for line-though
          [/<(\/?)s>/gi, "<$1strike>"],

          // Replace nsbp entites to char since it's easier to handle
          [/&nbsp;/gi, "\u00a0"],

          // Convert <span style="mso-spacerun:yes">___</span> to string of alternating
          // breaking/non-breaking spaces of same length
          [/<span\s+style\s*=\s*"\s*mso-spacerun\s*:\s*yes\s*;?\s*"\s*>([\s\u00a0]*)<\/span>/gi,
              function (str, spaces) {
                  return (spaces.length > 0) ?
                      spaces.replace(/./, " ").slice(Math.floor(spaces.length / 2)).split("").join("\u00a0") : "";
              }
          ]
      ]);

      // replace <u> and <strike> with styles
      if (settings.inline_styles) {
          content = content.replace(/<(u|strike)>/gi, function (match, node) {
              var value = (node === "u") ? "underline" : "line-through";
              return '<span style="text-decoration:' + value + ';">';
          });

          content = content.replace(/<\/(u|strike)>/g, '</span>');
      }

      // cleanup table border
      content = content.replace(/<table([^>]+)>/, function ($1, $2) {

          if (settings.schema !== "html4") {
              $2 = $2.replace(/(border|cell(padding|spacing))="([^"]+)"/gi, '');
          }

          return '<table' + $2 + '>';
      });

      // remove double linebreaks (IE issue?)
      if (settings.forced_root_block) {
          content = content.replace(/<br><br>/gi, '');
      }

      var validElements = settings.paste_word_valid_elements;

      if (!validElements) {
          validElements = (
              '-strong/b,-em/i,-u,-span,-p,-ol[type|start|reversed],-ul,-li,-h1,-h2,-h3,-h4,-h5,-h6,' +
              '-p/div,-a[href|name],img[src|alt|width|height],sub,sup,strike,br,del,table[width],tr,' +
              'td[colspan|rowspan|width],th[colspan|rowspan|width],thead,tfoot,tbody'
          );
      }

      // Setup strict schema
      var schema = new Schema({
          valid_elements: validElements,
          valid_children: '-li[p]'
      });

      // Add style/class attribute to all element rules since the user might have removed them from
      // paste_word_valid_elements config option and we need to check them for properties
      each$2(schema.elements, function (rule) {
          /*eslint dot-notation:0*/
          if (!rule.attributes["class"]) {
              rule.attributes["class"] = {};
              rule.attributesOrder.push("class");
          }

          if (!rule.attributes.style) {
              rule.attributes.style = {};
              rule.attributesOrder.push("style");
          }
      });

      // Parse HTML into DOM structure
      var domParser = new DomParser$1({}, schema);

      // Filter styles to remove "mso" specific styles and convert some of them
      domParser.addAttributeFilter('style', function (nodes) {
          var i = nodes.length,
              node, style;

          while (i--) {
              node = nodes[i];

              style = node.attr('style');

              // check for fake list (unordered)
              if (style && style.indexOf('mso-list') !== -1 && node.name !== 'li') {
                  node.attr('data-mce-word-list', 1);
              }

              node.attr('style', filterStyles(node, style));

              // Remove pointess spans
              if (node.name == 'span' && node.parent && !node.attributes.length) {
                  node.unwrap();
              }
          }
      });

      // Check the class attribute for comments or del items and remove those
      domParser.addAttributeFilter('class', function (nodes) {
          var i = nodes.length,
              node, className;

          while (i--) {
              node = nodes[i];

              className = node.attr('class');

              if (/^(MsoCommentReference|MsoCommentText|msoDel)$/i.test(className)) {
                  node.remove();
                  continue;
              }

              if (/^Mso[\w]+/i.test(className) || editor.getParam('clipboard_paste_strip_class_attributes', 2)) {
                  node.attr('class', null);

                  if (className && className.indexOf('MsoList') !== -1 && node.name !== 'li') {
                      node.attr('data-mce-word-list', 1);
                  }

                  if (className && /\s*Mso(Foot|End)note\s*/.test(className)) {
                      var parent = node.parent;

                      // replace footnote span with <sup>
                      if (parent && parent.name === 'a') {
                          node.name = 'sup';
                      }

                      // remove additional span tags
                      if (node.name === 'span' && !node.attributes.length) {
                          node.unwrap();
                      }
                  }

                  // blockquote
                  if (className && /\s*MsoQuote\s*/.test(className)) {
                      node.name = 'blockquote';
                  }
              }
          }
      });

      // Remove all del elements since we don't want the track changes code in the editor
      domParser.addNodeFilter('del', function (nodes) {
          var i = nodes.length;

          while (i--) {
              nodes[i].remove();
          }
      });

      var footnotes = editor.getParam('clipboard_paste_process_footnotes', 'convert');

      // Keep some of the links and anchors
      domParser.addNodeFilter('a', function (nodes) {
          var i = nodes.length,
              node, href, name;

          while (i--) {
              node = nodes[i];
              href = node.attr('href');
              name = node.attr('name');

              if (href && href.indexOf('#_msocom_') != -1) {
                  node.remove();
                  continue;
              }

              // convert URL
              if (href && !name) {
                  href = editor.convertURL(href);
              }

              if (href && href.indexOf('#') !== -1) {
                  href = href.substr(href.indexOf('#'));
              }

              if (!href && !name) {
                  node.unwrap();
              } else {
                  // Remove all named anchors that aren't specific to TOC, Footnotes or Endnotes
                  if (name && !/^_?(?:toc|edn|ftn)/i.test(name)) {
                      node.unwrap();
                      continue;
                  }

                  // remove footnote
                  if (name && footnotes === "remove") {
                      node.remove();
                      continue;
                  }

                  // unlink footnote
                  if (name && footnotes === "unlink") {
                      node.unwrap();
                      continue;
                  }

                  // set href, remove name
                  node.attr({
                      href: href,
                      name: null
                  });

                  // set appropriate anchor
                  if (settings.schema === "html4") {
                      node.attr('name', name);
                  } else {
                      node.attr('id', name);
                  }
              }
          }
      });

      // Remove empty span tags without attributes or content
      domParser.addNodeFilter('span', function (nodes) {
          var i = nodes.length,
              node;

          while (i--) {
              node = nodes[i];

              if (node.parent && !node.attributes.length) {
                  node.unwrap();
              }
          }
      });

      // Remove single paragraphs in table cells
      if (editor.getParam('clipboard_paste_remove_paragraph_in_table_cell')) {
          domParser.addNodeFilter('td', function (nodes) {
              var i = nodes.length,
                  node, firstChild, lastChild;

              while (i--) {
                  node = nodes[i], firstChild = node.firstChild, lastChild = node.lastChild;

                  if (firstChild.name === "p" && firstChild === lastChild) {
                      firstChild.unwrap();
                  }
              }
          });
      }

      // Parse into DOM structure
      var rootNode = domParser.parse(content);

      // Process DOM
      if (settings.paste_convert_word_fake_lists !== false) {
          convertFakeListsToProperLists(rootNode);
      }

      // Serialize DOM back to HTML
      content = new Serializer$1({
          validate: settings.validate
      }, schema).serialize(rootNode);

      return content;
  }

  var each$1 = tinymce.each;

  /**
   * Removes BR elements after block elements. IE9 has a nasty bug where it puts a BR element after each
   * block element when pasting from word. This removes those elements.
   *
   * This:
   *  <p>a</p><br><p>b</p>
   *
   * Becomes:
   *  <p>a</p><p>b</p>
   */
  function removeExplorerBrElementsAfterBlocks(e, o) {
      // Only filter word specific content
      if (!o.wordContent) {
          return;
      }

      var html = o.content, editor = e.editor;

      // Produce block regexp based on the block elements in schema
      var blockElements = [];

      each$1(editor.schema.getBlockElements(), function (block, blockName) {
          blockElements.push(blockName);
      });

      var explorerBlocksRegExp = new RegExp(
          '(?:<br>&nbsp;[\\s\\r\\n]+|<br>)*(<\\/?(' + blockElements.join('|') + ')[^>]*>)(?:<br>&nbsp;[\\s\\r\\n]+|<br>)*',
          'g'
      );

      // Remove BR:s from: <BLOCK>X</BLOCK><BR>
      html = filter(html, [
          [explorerBlocksRegExp, '$1']
      ]);

      // IE9 also adds an extra BR element for each soft-linefeed and it also adds a BR for each word wrap break
      html = filter(html, [
          [/<br><br>/g, '<BR><BR>'], // Replace multiple BR elements with uppercase BR to keep them intact
          [/<br>/g, ' '], // Replace single br elements with space since they are word wrap BR:s
          [/<BR><BR>/g, '<br>'] // Replace back the double brs but into a single BR
      ]);

      o.content = html;
  }

  /**
   * WebKit has a nasty bug where the all computed styles gets added to style attributes when copy/pasting contents.
   * This fix solves that by simply removing the whole style attribute.
   *
   * The paste_webkit_styles option can be set to specify what to keep:
   *  paste_webkit_styles: "none" // Keep no styles
   *  paste_webkit_styles: "all", // Keep all of them
   *  paste_webkit_styles: "font-weight color" // Keep specific ones
   * 
   * @param {Object} self A reference to the plugin.
   * @param {String} content Content that needs to be processed.
   * @return {String} Processed contents.
   */
  function removeWebKitStyles(e, o) {
      var content = o.content, editor = e.editor;

      // skip internal content
      if (o.internal) {
          return;
      }

      if (isWordContent(editor, o.content)) {
          return;
      }

      // Filter away styles that isn't matching the target node
      var webKitStyles = editor.settings.paste_webkit_styles;

      if (editor.settings.clipboard_paste_remove_styles_if_webkit !== true || webKitStyles == "all") {
          return;
      }

      if (webKitStyles) {
          webKitStyles = webKitStyles.split(/[, ]/);
      }

      // Keep specific styles that doesn't match the current node computed style
      if (webKitStyles) {
          var dom = editor.dom,
              node = editor.selection.getNode();

          content = content.replace(/(<[^>]+) style="([^"]*)"([^>]*>)/gi, function (all, before, value, after) {
              var inputStyles = dom.parseStyle(value, 'span'),
                  outputStyles = {};

              if (webKitStyles === "none") {
                  return before + after;
              }

              for (var i = 0; i < webKitStyles.length; i++) {
                  var inputValue = inputStyles[webKitStyles[i]],
                      currentValue = dom.getStyle(node, webKitStyles[i], true);

                  if (/color/.test(webKitStyles[i])) {
                      inputValue = dom.toHex(inputValue);
                      currentValue = dom.toHex(currentValue);
                  }

                  if (currentValue != inputValue) {
                      outputStyles[webKitStyles[i]] = inputValue;
                  }
              }

              outputStyles = dom.serializeStyle(outputStyles, 'span');
              if (outputStyles) {
                  return before + ' style="' + outputStyles + '"' + after;
              }

              return before + after;
          });
      } else {
          // Remove all external styles
          content = content.replace(/(<[^>]+) style="([^"]*)"([^>]*>)/gi, '$1$3');
      }

      // Keep internal styles
      content = content.replace(/(<[^>]+) data-mce-style="([^"]+)"([^>]*>)/gi, function (all, before, value, after) {
          return before + ' style="' + value + '"' + after;
      });

      o.content = content;
  }

  var Entities = tinymce.html.Entities;

  var isPlainText = function (text) {
      // so basically any tag that is not one of the "p, div, br", or is one of them, but is followed
      // by some additional characters qualifies the text as not a plain text (having some HTML tags)
      return !/<(?:(?!\/?(?:\w+))[^>]*|(?:\w+)\s+\w[^>]+)>/.test(text);
  };

  var toBRs = function (text) {
      return text.replace(/\r?\n/g, '<br>');
  };

  var openContainer = function (rootTag, rootAttrs) {
      var key, attrs = [];
      var tag = '<' + rootTag;

      if (typeof rootAttrs === 'object') {
          for (key in rootAttrs) {
              if (Object.prototype.hasOwnProperty.call(rootAttrs, key)) {
                  attrs.push(key + '="' + Entities.encodeAllRaw(rootAttrs[key]) + '"');
              }
          }

          if (attrs.length) {
              tag += ' ' + attrs.join(' ');
          }
      }
      return tag + '>';
  };

  var toBlockElements = function (text, rootTag, rootAttrs) {
      var pieces = text.split(/\r?\n/);
      var i = 0,
          len = pieces.length;
      var stack = [];
      var blocks = [];
      var tagOpen = openContainer(rootTag, rootAttrs);
      var tagClose = '</' + rootTag + '>';
      var isLast, newlineFollows, isSingleNewline;

      // if single-line text then nothing to do
      if (pieces.length === 1) {
          return text;
      }

      for (; i < len; i++) {
          isLast = i === len - 1;
          newlineFollows = !isLast && !pieces[i + 1];
          isSingleNewline = !pieces[i] && !stack.length;

          stack.push(pieces[i] ? pieces[i] : '&nbsp;');

          if (isLast || newlineFollows || isSingleNewline) {
              blocks.push(stack.join('<br>'));
              stack = [];
          }

          if (newlineFollows) {
              i++; // extra progress for extra newline
          }
      }

      return blocks.length === 1 ? blocks[0] : tagOpen + blocks.join(tagClose + tagOpen) + tagClose;
  };

  var convert = function (text, rootTag, rootAttrs) {
      return rootTag ? toBlockElements(text, rootTag, rootAttrs) : toBRs(text);
  };

  /**
   * Creates a paste bin element as close as possible to the current caret location and places the focus inside that element
   * so that when the real paste event occurs the contents gets inserted into this element
   * instead of the current editor selection element.
   */
  var create = function (editor, lastRng, pasteBinDefaultContent) {
    var dom = editor.dom, body = editor.getBody();
    var viewport = editor.dom.getViewPort(editor.getWin()), scrollTop = viewport.y, top = 20;
    var pasteBinElm;

    lastRng = editor.selection.getRng();

    /**
     * Returns the rect of the current caret if the caret is in an empty block before a
     * BR we insert a temporary invisible character that we get the rect this way we always get a proper rect.
     *
     * TODO: This might be useful in core.
     */
    function getCaretRect(rng) {
      var rects, textNode, node, container = rng.startContainer;

      rects = rng.getClientRects();
      if (rects.length) {
        return rects[0];
      }

      if (!rng.collapsed || container.nodeType != 1) {
        return;
      }

      node = container.childNodes[lastRng.startOffset];

      // Skip empty whitespace nodes
      while (node && node.nodeType == 3 && !node.data.length) {
        node = node.nextSibling;
      }

      if (!node) {
        return;
      }

      // Check if the location is |<br>
      // TODO: Might need to expand this to say |<table>
      if (node.tagName == 'BR') {
        textNode = dom.doc.createTextNode('\uFEFF');
        node.parentNode.insertBefore(textNode, node);

        rng = dom.createRng();
        rng.setStartBefore(textNode);
        rng.setEndAfter(textNode);

        rects = rng.getClientRects();
        dom.remove(textNode);
      }

      if (rects.length) {
        return rects[0];
      }
    }

    // Calculate top cordinate this is needed to avoid scrolling to top of document
    // We want the paste bin to be as close to the caret as possible to avoid scrolling
    if (lastRng.getClientRects) {
      var rect = getCaretRect(lastRng);

      if (rect) {
        // Client rects gets us closes to the actual
        // caret location in for example a wrapped paragraph block
        top = scrollTop + (rect.top - dom.getPos(body).y);
      } else {
        top = scrollTop;

        // Check if we can find a closer location by checking the range element
        var container = lastRng.startContainer;
        if (container) {
          if (container.nodeType == 3 && container.parentNode != body) {
            container = container.parentNode;
          }

          if (container.nodeType == 1) {
            top = dom.getPos(container, body).y;
          }
        }
      }
    }

    // Create a pastebin
    pasteBinElm = editor.dom.add(editor.getBody(), 'div', {
      id: "mcepastebin",
      contentEditable: true,
      "data-mce-bogus": "all",
      style: 'position: absolute; top: ' + top + 'px; width: 10px; height: 10px; overflow: hidden; opacity: 0'
    }, pasteBinDefaultContent);

    // Move paste bin out of sight since the controlSelection rect gets displayed otherwise on IE and Gecko
    if (tinymce.isGecko) {
      dom.setStyle(pasteBinElm, 'left', dom.getStyle(body, 'direction', true) == 'rtl' ? 0xFFFF : -0xFFFF);
    }

    // Prevent focus events from bubbeling fixed FocusManager issues
    dom.bind(pasteBinElm, 'beforedeactivate focusin focusout', function (e) {
      e.stopPropagation();
    });

    pasteBinElm.focus();
    editor.selection.select(pasteBinElm, true);

    return lastRng;
  };

  /**
   * Removes the paste bin if it exists.
   */
  var remove = function (editor, lastRng) {
    if (getEl(editor)) {
      var pasteBinClone;

      // WebKit/Blink might clone the div so
      // lets make sure we remove all clones
      // TODO: Man o man is this ugly. WebKit is the new IE! Remove this if they ever fix it!
      while ((pasteBinClone = editor.dom.get('mcepastebin'))) {
        editor.dom.remove(pasteBinClone);
        editor.dom.unbind(pasteBinClone);
      }

      if (lastRng) {
        editor.selection.setRng(lastRng);
      }
    }

    lastRng = null;
  };

  var getEl = function (editor) {
    return editor.dom.get('mcepastebin');
  };

  /**
   * Returns the contents of the paste bin as a HTML string.
   *
   * @return {String} Get the contents of the paste bin.
   */
  var getHtml = function (editor) {
    var pasteBinElm, pasteBinClones, i, dirtyWrappers, cleanWrapper;

    // Since WebKit/Chrome might clone the paste bin when pasting
    // for example: <img style="float: right"> we need to check if any of them contains some useful html.
    // TODO: Man o man is this ugly. WebKit is the new IE! Remove this if they ever fix it!

    var copyAndRemove = function (toElm, fromElm) {
      toElm.appendChild(fromElm);
      editor.dom.remove(fromElm, true); // remove, but keep children
    };

    // find only top level elements (there might be more nested inside them as well, see TINY-1162)
    pasteBinClones = tinymce.grep(editor.getBody().childNodes, function (elm) {
      return elm.id === 'mcepastebin';
    });
    pasteBinElm = pasteBinClones.shift();

    // if clones were found, move their content into the first bin
    tinymce.each(pasteBinClones, function (pasteBinClone) {
      copyAndRemove(pasteBinElm, pasteBinClone);
    });

    // TINY-1162: when copying plain text (from notepad for example) WebKit clones
    // paste bin (with styles and attributes) and uses it as a default  wrapper for
    // the chunks of the content, here we cycle over the whole paste bin and replace
    // those wrappers with a basic div
    dirtyWrappers = editor.dom.select('div[id=mcepastebin]', pasteBinElm);
    for (i = dirtyWrappers.length - 1; i >= 0; i--) {
      cleanWrapper = editor.dom.create('div');
      pasteBinElm.insertBefore(cleanWrapper, dirtyWrappers[i]);
      copyAndRemove(cleanWrapper, dirtyWrappers[i]);
    }

    return pasteBinElm ? pasteBinElm.innerHTML : '';
  };

  var getLastRng = function (lastRng) {
    return lastRng;
  };

  var isDefaultContent = function (pasteBinDefaultContent, content) {
    return content === pasteBinDefaultContent;
  };

  var isPasteBin = function (elm) {
    return elm && elm.id === 'mcepastebin';
  };


  var isDefault = function (editor, pasteBinDefaultContent) {
    var pasteBinElm = getEl(editor);
    return isPasteBin(pasteBinElm) && isDefaultContent(pasteBinElm.innerHTML);
  };

  function PasteBin (editor) {
    var lastRng, pasteBinDefaultContent = '%MCEPASTEBIN%';

    return {
      create: function () {
        lastRng = create(editor, lastRng, pasteBinDefaultContent);
      },
      remove: function () {
        return remove(editor, lastRng);
      },
      getEl: function () {
        return getEl(editor);
      },
      getHtml: function () {
        return getHtml(editor);
      },
      getLastRng: function () {
        return getLastRng(lastRng);
      },
      isDefault: function () {
        return isDefault(editor);
      },
      isDefaultContent: function (content) {
        return isDefaultContent(pasteBinDefaultContent, content);
      }
    };
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

  var each = tinymce.each,
      VK = tinymce.VK,
      DomParser = tinymce.html.DomParser,
      Serializer = tinymce.html.Serializer,
      DOM = tinymce.DOM,
      Dispatcher = tinymce.util.Dispatcher,
      BlobCache = tinymce.file.BlobCache;

  var mceInternalUrlPrefix = 'data:text/mce-internal,';

  function getBase64FromUri(uri) {
      var idx;

      idx = uri.indexOf(',');
      if (idx !== -1) {
          return uri.substr(idx + 1);
      }

      return null;
  }

  function isValidDataUriImage(settings, imgElm) {
      return settings.images_dataimg_filter ? settings.images_dataimg_filter(imgElm) : true;
  }

  function pasteImage(editor, rng, reader, blob) {
      if (rng) {
          editor.selection.setRng(rng);
          rng = null;
      }

      var dataUri = reader.result;
      var base64 = getBase64FromUri(dataUri);

      var img = new Image();
      img.src = dataUri;

      // TODO: Move the bulk of the cache logic to EditorUpload
      if (isValidDataUriImage(editor.settings, img)) {
          var blobInfo, existingBlobInfo;

          existingBlobInfo = BlobCache.findFirst(function (cachedBlobInfo) {
              return cachedBlobInfo.base64() === base64;
          });

          if (!existingBlobInfo) {
              blobInfo = BlobCache.create('mceclip', blob, base64);
              BlobCache.add(blobInfo);
          } else {
              blobInfo = existingBlobInfo;
          }

          return '<img src="' + blobInfo.blobUri() + '" />';

      } else {
          return '<img src="' + dataUri + '" />';
      }
  }

  function preProcess(e, o) {
      var ed = e.editor;

      ed.onPastePreProcess.dispatch(ed, o);
      ed.execCallback('paste_preprocess', e, o);

      var h = o.content;

      // Process away some basic content
      h = h.replace(/^\s*(&nbsp;)+/g, ''); // nbsp entities at the start of contents
      h = h.replace(/(&nbsp;|<br[^>]*>)+\s*$/g, ''); // nbsp entities at the end of contents

      // skip plain text
      if (self.pasteAsPlainText) {
          return;
      }

      o.wordContent = isWordContent(ed, h) && !o.internal;

      if (o.wordContent) {
          h = WordFilter(ed, h);
      }

      // convert some tags if cleanup is off
      if (ed.settings.verify_html === false) {
          h = h.replace(/<b\b([^>]*)>/gi, '<strong$1>');
          h = h.replace(/<\/b>/gi, '</strong>');
      }

      o.content = h;
  }

  function postProcess(e, o) {
      var ed = e.editor,
          dom = ed.dom;

      // remove url conversion containers
      ed.dom.remove(ed.dom.select('div[data-mce-convert]', o.node), 1);

      // skip plain text
      if (e.pasteAsPlainText) {
          return;
      }

      // Remove Apple style spans
      each(dom.select('span.Apple-style-span', o.node), function (n) {
          dom.remove(n, 1);
      });

      // Remove all classes
      if (ed.getParam('clipboard_paste_strip_class_attributes', 2) == 1) {
          // Remove class attribute
          each(dom.select('*[class]', o.node), function (el) {
              el.removeAttribute('class');
          });
      }

      // Convert width and height attributes to styles
      each(dom.select('table, td, th', o.node), function (n) {
          var width = dom.getAttrib(n, 'width');

          if (width) {
              dom.setStyle(n, 'width', width);
              dom.setAttrib(n, 'width', '');
          }

          var height = dom.getAttrib(n, 'height');

          if (height) {
              dom.setStyle(n, 'height', height);
              dom.setAttrib(n, 'height', '');
          }
      });

      // Remove all styles
      if (ed.getParam('clipboard_paste_remove_styles', 1)) {
          // Remove style attribute
          each(dom.select('*[style]', o.node), function (el) {
              el.removeAttribute('style');
              el.removeAttribute('data-mce-style');
          });
      } else {
          // process style attributes
          processStyles(ed, o.node);
      }

      if (o.wordContent) {
          // fix table borders
          var borderColors = ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
          var positions = ['top', 'right', 'bottom', 'left'];

          each(dom.select('table[style], td[style], th[style]', o.node), function (n) {
              var styles = {};

              each(borderStyles, function (name) {
                  // process each side, eg: border-left-width
                  if (/-(top|right|bottom|left)-/.test(name)) {
                      // get style
                      var value = dom.getStyle(n, name);

                      // replace default values with black
                      if (name.indexOf('color') !== -1) {
                          if (value === 'currentcolor' || value === 'windowtext') {
                              each(borderColors, function (str) {
                                  if (str === name) {
                                      return true;
                                  }

                                  var val = dom.getStyle(n, str);

                                  if (/(currentcolor|windowtext)/.test(val)) {
                                      return true;
                                  }

                                  value = val;
                              });
                          }

                          value = namedColorToHex(value);
                      }

                      // Word uses "medium" as the default border-width
                      if (value === "medium") {
                          value = '1';
                      }

                      // if border-style is not set, use "solid"
                      if (name.indexOf('style') !== -1 && value === "none") {
                          value = "solid";
                      }

                      // convert to pixels
                      if (value && /^\d[a-z]?/.test(value)) {
                          value = convertToPixels(value);
                      }

                      styles[name] = value;
                  }
              });

              // convert padding and margin to pixels
              each(positions, function (pos) {
                  var padding = dom.getStyle(n, 'padding-' + pos);
                  var margin = dom.getStyle(n, 'margin-' + pos);

                  if (padding) {
                      styles['padding-' + pos] = convertToPixels(padding);
                  }

                  if (margin) {
                      styles['margin-' + pos] = convertToPixels(margin);
                  }
              });

              each(styles, function (value, name) {

                  // remove styles with no width value
                  if (name.indexOf('-width') !== -1 && value === "") {
                      var prefix = name.replace(/-width/, '');

                      delete styles[prefix + '-style'];
                      delete styles[prefix + '-color'];
                      delete styles[name];
                  }

                  // convert named colors to hex
                  if (name.indexOf('color') !== -1) {
                      styles[name] = namedColorToHex(value);
                  }
              });

              each(backgroundStyles, function (def, name) {
                  var value = dom.getStyle(n, name);

                  if (value === def) {
                      value = "";
                  }

                  styles[name] = value;
              });

              // remove borders
              dom.setStyle(n, 'border', '');

              // remove background
              dom.setStyle(n, 'background', '');

              dom.setStyles(n, styles);
          });

          // update indent conversion
          each(dom.select('[data-mce-indent]', o.node), function (el) {
              if (el.nodeName === "p") {
                  var value = dom.getAttrib(el, 'data-mce-indent');
                  var style = ed.settings.indent_use_margin ? 'margin-left' : 'padding-left';

                  dom.setStyle(el, style, value + 'px');
              }

              dom.setAttrib(el, 'data-mce-indent', '');
          });

          each(dom.select('[data-mce-word-list]', o.node), function (el) {
              el.removeAttribute('data-mce-word-list');
          });
      }

      function isValidDataUriImage(value) {
          return /^(file:|data:image)\//i.test(value);
      }

      function canUploadDataImage() {
          var uploader = ed.plugins.upload;

          return uploader && uploader.plugins.length;
      }

      // Process images - remove local
      each(dom.select('img', o.node), function (el) {
          var src = dom.getAttrib(el, 'src');

          // remove or processs for upload img element if blank, local file url or base64 encoded
          if (!src || isValidDataUriImage(src)) {
              // leave it as it is to be processed as a blob
              if (ed.settings.clipboard_paste_data_images) {
                  return true;
              }

              if (ed.settings.clipboard_paste_upload_data_images != false && canUploadDataImage()) {
                  // add marker
                  ed.dom.setAttrib(el, 'data-mce-upload-marker', '1');
              } else {
                  dom.remove(el);
              }
          } else {
              dom.setAttrib(el, 'src', ed.convertURL(src));
          }
      });

      // remove font and underline tags in IE
      if (isIE) {
          each(dom.select('a', o.node), function (el) {
              each(dom.select('font,u'), function (n) {
                  dom.remove(n, 1);
              });
          });
      }

      // remove tags
      if (ed.getParam('clipboard_paste_remove_tags')) {
          dom.remove(dom.select(ed.getParam('clipboard_paste_remove_tags'), o.node), 1);
      }

      // keep tags
      if (ed.getParam('clipboard_paste_keep_tags')) {
          var tags = ed.getParam('clipboard_paste_keep_tags');

          dom.remove(dom.select('*:not(' + tags + ')', o.node), 1);
      }

      // remove all spans
      if (ed.getParam('clipboard_paste_remove_spans')) {
          dom.remove(dom.select('span', o.node), 1);
          // remove empty spans
      } else {
          ed.dom.remove(dom.select('span:empty', o.node));

          each(dom.select('span', o.node), function (n) {
              // remove span without children eg: <span></span>
              if (!n.childNodes || n.childNodes.length === 0) {
                  dom.remove(n);
              }

              // remove span without attributes
              if (dom.getAttribs(n).length === 0) {
                  dom.remove(n, 1);
              }
          });
      }

      if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
          dom.remove(dom.select('p:empty', o.node));

          each(dom.select('p', o.node), function (n) {
              var h = n.innerHTML;

              // remove paragraph without children eg: <p></p>
              if (!n.childNodes || n.childNodes.length === 0 || /^(\s|&nbsp;|\u00a0)?$/.test(h)) {
                  dom.remove(n);
              }
          });
      }

      // replace paragraphs with linebreaks
      /*if (!ed.getParam('forced_root_block')) {
          var frag = dom.createFragment('<br /><br />');

          each(dom.select('p,div', o.node), function (n) {
              // if the linebreaks are 
              if (n.parentNode.lastChild !== n) {
                  dom.insertAfter(frag, n);
              }

              dom.remove(n, 1);
          });
      }*/

      ed.onPastePostProcess.dispatch(ed, o);
      ed.execCallback('paste_postprocess', e, o);
  }

  /**
   * Process style attributes
   * @param node Node to process
   */
  function processStyles(editor, node) {
      var dom = editor.dom, styleProps$1 = styleProps;

      // Style to keep
      var keepStyles = editor.getParam('clipboard_paste_retain_style_properties');

      // Style to remove
      var removeStyles = editor.getParam('clipboard_paste_remove_style_properties');

      // split to array if string
      if (keepStyles && tinymce.is(keepStyles, 'string')) {
          var styleProps$1 = tinymce.explode(keepStyles);

          each(styleProps$1, function (style, i) {
              if (style === "border") {
                  // add expanded border styles
                  styleProps$1 = styleProps$1.concat(borderStyles);
                  return true;
              }
          });
      }

      // split to array if string
      if (removeStyles && tinymce.is(removeStyles, 'string')) {
          var removeProps = tinymce.explode(removeStyles);

          each(removeProps, function (style, i) {
              if (style === "border") {
                  // add expanded border styles
                  removeProps = removeProps.concat(borderStyles);
                  return true;
              }
          });

          // remove from core styleProps array
          styleProps$1 = tinymce.grep(styleProps$1, function (prop) {
              return tinymce.inArray(removeProps, prop) === -1;
          });
      }

      // Retains some style properties
      each(dom.select('*[style]', node), function (n) {
          var ns = {},
              x = 0;

          // get styles on element
          var styles = dom.parseStyle(n.style.cssText);

          // check style against styleProps array
          each(styles, function (v, k) {
              if (tinymce.inArray(styleProps$1, k) != -1) {
                  ns[k] = v;
                  x++;
              }
          });

          // Remove all of the existing styles
          dom.setAttrib(n, 'style', '');

          // compress
          ns = dom.parseStyle(dom.serializeStyle(ns, n.nodeName));

          if (x > 0) {
              dom.setStyles(n, ns); // Add back the stored subset of styles
          } else {
              // Remove empty span tags that do not have class attributes
              if (n.nodeName == 'SPAN' && !n.className) {
                  dom.remove(n, true);
              }
          }

          // We need to compress the styles on WebKit since if you paste <img border="0" /> it will become <img border="0" style="... lots of junk ..." />
          // Removing the mce_style that contains the real value will force the Serializer engine to compress the styles
          if (tinymce.isWebKit) {
              n.removeAttribute('data-mce-style');
          }
      });

      // convert some attributes
      each(dom.select('*[align]', node), function (el) {
          var v = dom.getAttrib(el, 'align');

          if (v === "left" || v === "right" || v === "center") {
              if (/(IFRAME|IMG|OBJECT|VIDEO|AUDIO|EMBED)/i.test(el.nodeName)) {
                  if (v === "center") {
                      dom.setStyles(el, {
                          'margin': 'auto',
                          'display': 'block'
                      });
                  } else {
                      dom.setStyle(el, 'float', v);
                  }
              } else {
                  dom.setStyle(el, 'text-align', v);
              }
          }

          el.removeAttribute('align');
      });
  }

  /**
   * Convert URL strings to elements
   * @param content HTML to process
   */
  function convertURLs(ed, content) {

      var ex = '([-!#$%&\'\*\+\\./0-9=?A-Z^_`a-z{|}~]+@[-!#$%&\'\*\+\\/0-9=?A-Z^_`a-z{|}~]+\.[-!#$%&\'*+\\./0-9=?A-Z^_`a-z{|}~]+)';
      var ux = '((?:news|telnet|nttp|file|http|ftp|https)://[-!#$%&\'\*\+\\/0-9=?A-Z^_`a-z{|}~;]+\.[-!#$%&\'\*\+\\./0-9=?A-Z^_`a-z{|}~;]+)';

      var attribRe = '(?:(?:[a-z0-9_-]+)=["\'])'; // match attribute before url, eg: href="url"
      var bracketRe = '(?:\}|\].?)'; // match shortcode and markdown, eg: {url} or [url] or [text](url)

      function createLink(url) {
          // create attribs and decode url to prevent double encoding in dom.createHTML
          var attribs = { 'href': ed.dom.decode(url) }, params = ed.getParam('link', {});

          attribs = tinymce.extend(attribs, params.attributes || {});

          return ed.dom.createHTML('a', attribs, url);
      }

      function wrapContent(content) {
          if (content.indexOf('data-mce-convert="url"') === -1) {
              return ed.dom.createHTML('div', { 'data-mce-convert': 'url' }, content);
          }

          return content;
      }

      // existing link...
      var decoded = ed.dom.decode(content);

      // skip blobs and data uri
      if (/^<img src="(data|blob):[^>]+?>/.test(content)) {
          return content;
      }

      if (/^<a([^>]+)>([\s\S]+?)<\/a>$/.test(decoded)) {
          return content;
      }

      if (ed.getParam('autolink_url', true)) {
          if (new RegExp('^' + ux + '$').test(content)) {
              content = createLink(content);
              return content;
          }

          // wrap content - this seems to be required to prevent repeats of link conversion
          content = wrapContent(content);

          // find and link url if not already linked
          content = content.replace(new RegExp('(' + attribRe + '|' + bracketRe + ')?' + ux, 'gi'), function (match, extra, url) {            
              if (extra) {
                  return match;
              }

              // only if not already a link or shortcode
              return createLink(url);
          });
      }

      if (ed.getParam('autolink_email', true)) {

          if (new RegExp('^' + ex + '$').test(content)) {
              return '<a href="mailto:' + content + '">' + content + '</a>';
          }

          // wrap content - this seems to be required to prevent repeats of link conversion
          content = wrapContent(content);

          content = content.replace(new RegExp('(href=["\']mailto:)*' + ex, 'g'), function (match, attrib, email) {
              // only if not already a mailto: link
              if (!attrib) {
                  return '<a href="mailto:' + email + '">' + email + '</a>';
              }

              return match;
          });
      }

      return content;
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

  /**
   * Gets various content types out of the Clipboard API. It will also get the
   * plain text using older IE and WebKit API:s.
   *
   * @param {ClipboardEvent} clipboardEvent Event fired on paste.
   * @return {Object} Object with mime types and data for those mime types.
   */
  function getClipboardContent(editor, clipboardEvent) {
      var content = getDataTransferItems(clipboardEvent.clipboardData || clipboardEvent.dataTransfer || editor.getDoc().dataTransfer);
      //var content = getDataTransferItems(clipboardEvent.clipboardData || editor.getDoc().dataTransfer);

      return content;
  }

  function isKeyboardPasteEvent(e) {
      return (VK.metaKeyPressed(e) && e.keyCode == 86) || (e.shiftKey && e.keyCode == 45);
  }

  function hasContentType(clipboardContent, mimeType) {
      return mimeType in clipboardContent && clipboardContent[mimeType].length > 0;
  }

  function hasHtmlOrText(content) {
      return (hasContentType(content, 'text/html') || hasContentType(content, 'text/plain')) && !content.Files;
  }

  // IE flag to include Edge
  var isIE = tinymce.isIE || tinymce.isIE12;

  tinymce.create('tinymce.plugins.ClipboardPlugin', {
      init: function (ed, url) {
          var self = this;

          self.editor = ed;
          self.url = url;

          register(ed);

          var keyboardPastePlainTextState, keyboardPasteTimeStamp = 0;
          var pasteBin = new PasteBin(ed);

          // set default paste state for dialog trigger
          this.canPaste = false;

          // set pasteAsPlainText flag
          this.pasteAsPlainText = false;

          // Setup plugin events
          self.onPreProcess = new Dispatcher(this);
          self.onPostProcess = new Dispatcher(this);

          ed.onGetClipboardContent = new Dispatcher(this);
          ed.onPastePreProcess = new Dispatcher(this);
          ed.onPastePostProcess = new Dispatcher(this);
          ed.onPasteBeforeInsert = new Dispatcher(this);

          // process quirks
          if (tinymce.isWebKit) {
              self.onPreProcess.add(removeWebKitStyles);
          }

          if (isIE) {
              self.onPreProcess.add(removeExplorerBrElementsAfterBlocks);
          }

          // Register default handlers
          self.onPreProcess.add(preProcess);
          self.onPostProcess.add(postProcess);

          self.pasteText = ed.getParam('clipboard_paste_text', 1);
          self.pasteHtml = ed.getParam('clipboard_paste_html', 1);

          // Add command for external usage
          ed.addCommand('mceInsertClipboardContent', function (u, data) {
              self.pasteAsPlainText = false;

              if (data.text) {
                  self.pasteAsPlainText = true;
                  pasteText(data.text);
              }

              if (data.content) {
                  pasteHtml(data.content);
              }
          });

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

                      if (self.pasteHtml) {
                          m.add({
                              title: 'clipboard.paste_desc',
                              /* TODO - Change to clipboard.paste_desc */
                              icon: 'paste',
                              cmd: 'mcePaste'
                          });
                      }
                      if (self.pasteText) {
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

          function pasteText(text) {
              // encode text and replace returns
              text = ed.dom.encode(text).replace(/\r\n/g, '\n');

              // convert newlines to block elements
              text = convert(text, ed.settings.forced_root_block, ed.settings.forced_root_block_attrs);

              pasteHtml(text);
          }

          function sanitizePastedHTML(html) {
              var parser = new DomParser({ allow_event_attributes: !!ed.settings.clipboard_paste_allow_event_attributes }, ed.schema);

              // Strip elements
              parser.addNodeFilter('meta,svg,script,noscript', function (nodes) {
                  var i = nodes.length;

                  while (i--) {
                      nodes[i].remove();
                  }
              });

              // remove spans
              if (ed.getParam('clipboard_paste_remove_spans')) {
                  parser.addNodeFilter('span', function (nodes, name) {
                      var i = nodes.length;

                      while (i--) {
                          nodes[i].unwrap();
                      }
                  });
              }

              // remove attributes
              var remove_attribs = ed.getParam('clipboard_paste_remove_attributes');

              if (remove_attribs) {
                  parser.addAttributeFilter(remove_attribs, function (nodes, name) {
                      var i = nodes.length;

                      while (i--) {
                          nodes[i].attr(name, null);
                      }
                  });
              }

              var fragment = parser.parse(html, { forced_root_block: false, isRootContent: true });

              return new Serializer({ validate: ed.settings.validate }, ed.schema).serialize(fragment);
          }

          function pasteHtml(content, internal) {
              if (!content) {
                  return;
              }

              // create object to process
              var o = {
                  content: content,
                  internal: internal
              };

              // only process externally sourced content
              if (!internal) {
                  // Execute pre process handlers
                  self.onPreProcess.dispatch(self, o);

                  // sanitize content
                  o.content = sanitizePastedHTML(o.content);

                  // convert urls in content
                  if (ed.getParam('clipboard_paste_convert_urls', true)) {
                      o.content = convertURLs(ed, o.content);
                  }

                  // Create DOM structure
                  o.node = ed.dom.create('div', { style: 'display:none' }, o.content);

                  // Execute post process handlers
                  self.onPostProcess.dispatch(self, o);

                  // get content from node
                  o.content = o.node.innerHTML;

                  // remove empty paragraphs
                  if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
                      o.content = o.content.replace(/<p([^>]+)>(&nbsp;|\u00a0)?<\/p>/g, '');
                  }

                  // clean up extra whitespace
                  if (ed.getParam('clipboard_paste_remove_whitespace')) {
                      o.content = o.content.replace(/(&nbsp;|\u00a0|\s| ){2,}/g, ' ');
                  }

                  // process regular expression
                  if (ed.getParam('clipboard_paste_filter')) {
                      var re, rules = ed.getParam('clipboard_paste_filter').split(';');

                      each(rules, function (s) {
                          // if it is already in Regular Expression format...
                          if (/^\/.*\/(g|i|m)*$/.test(s)) {
                              re = (new Function('return ' + s))();
                              // ...else create expression
                          } else {
                              re = new RegExp(s);
                          }

                          o.content = o.content.replace(re, "");
                      });
                  }
              }

              ed.onPasteBeforeInsert.dispatch(ed, o);

              self._insert(o.content);

              // reset pasteAsPlainText state
              self.pasteAsPlainText = false;
          }

          // This function executes the process handlers and inserts the contents
          function insertClipboardContent(clipboardContent, internal) {
              var content, isPlainTextHtml;

              // Grab HTML from paste bin as a fallback
              if (!isHtmlPaste(clipboardContent)) {
                  content = pasteBin.getHtml();

                  // no content....?
                  if (pasteBin.isDefaultContent(content)) {
                      self.pasteAsPlainText = true;
                  } else {
                      clipboardContent['text/html'] = content;
                  }
              }

              // remove pasteBin and reset rng
              pasteBin.remove();

              ed.onGetClipboardContent.dispatch(ed, clipboardContent);

              // get html content
              content = clipboardContent['x-tinymce/html'] || clipboardContent['text/html'];

              // mark as internal
              internal = internal ? internal : isMarked(content);

              // unmark content
              content = unmark(content);

              // trim
              content = trimHtml(content);

              // pasting content into a pre element so encode html first, then insert using setContent
              if (isPasteInPre()) {
                  var text = clipboardContent['text/plain'];

                  // encode
                  text = ed.dom.encode(text);

                  // prefer plain text, otherwise use encoded html
                  if (content && !text) {
                      text = ed.dom.encode(content);
                  }

                  ed.selection.setContent(text, { no_events: true });

                  return true;
              }

              /*if (!internal && isPlainTextPaste(clipboardContent)) {
                  // set pasteAsPlainText state
                  self.pasteAsPlainText = clipboardContent['text/plain'] == content;
              }*/

              var isPlainTextHtml = (internal === false && (isPlainText(content)));

              // If we got nothing from clipboard API and pastebin or the content is a plain text (with only
              // some BRs, Ps or DIVs as newlines) then we fallback to plain/text
              if (!content.length || isPlainTextHtml) {
                  self.pasteAsPlainText = true;
              }

              // paste text
              if (self.pasteAsPlainText) {
                  // Use plain text contents from Clipboard API unless the HTML contains paragraphs then
                  // we should convert the HTML to plain text since works better when pasting HTML/Word contents as plain text
                  if (hasContentType(clipboardContent, 'text/plain') && isPlainTextHtml) {
                      content = clipboardContent['text/plain'];
                  } else {
                      content = innerText(content);
                  }

                  pasteText(content);

                  return true;
              }

              // paste HTML
              pasteHtml(content, internal);
          }

          ed.onKeyDown.add(function (ed, e) {
              // block events
              if (!ed.getParam('clipboard_allow_cut', 1) && (VK.metaKeyPressed(e) && e.keyCode == 88)) {
                  e.preventDefault();
                  return false;
              }

              if (!ed.getParam('clipboard_allow_copy', 1) && (VK.metaKeyPressed(e) && e.keyCode == 67)) {
                  e.preventDefault();
                  return false;
              }

              function removePasteBinOnKeyUp(e) {
                  // Ctrl+V or Shift+Insert
                  if (isKeyboardPasteEvent(e) && !e.isDefaultPrevented()) {
                      pasteBin.remove();
                  }
              }

              // Ctrl+V or Shift+Insert
              if (isKeyboardPasteEvent(e) && !e.isDefaultPrevented()) {
                  keyboardPasteTimeStamp = new Date().getTime();

                  // Prevent undoManager keydown handler from making an undo level with the pastebin in it
                  e.stopImmediatePropagation();

                  keyboardPastePlainTextState = e.shiftKey && e.keyCode == 86;

                  // mark as plain text paste
                  if (keyboardPastePlainTextState) {
                      self.pasteAsPlainText = true;
                  }

                  pasteBin.remove();
                  pasteBin.create();

                  // Remove pastebin if we get a keyup and no paste event
                  // For example pasting a file in IE 11 will not produce a paste event
                  ed.dom.bind(ed.getBody(), 'keyup', function handler(e) {
                      removePasteBinOnKeyUp(e);
                      ed.dom.unbind(ed.getBody(), 'keyup', handler);
                  });

                  ed.dom.bind(ed.getBody(), 'paste', function handler(e) {
                      removePasteBinOnKeyUp(e);
                      ed.dom.unbind(ed.getBody(), 'paste', handler);
                  });
              }
          });

          /**
           * Chrome on Android doesn't support proper clipboard access so we have no choice but to allow the browser default behavior.
           *
           * @param {Event} e Paste event object to check if it contains any data.
           * @return {Boolean} true/false if the clipboard is empty or not.
           */
          function isBrokenAndroidClipboardEvent(e) {
              var clipboardData = e.clipboardData;

              return navigator.userAgent.indexOf('Android') !== -1 && clipboardData && clipboardData.items && clipboardData.items.length === 0;
          }

          function isHtmlPaste(content) {
              if (!hasContentType(content, "text/html")) {
                  return false;
              }

              return true;
          }

          function pasteImageData(e) {
              var dataTransfer = e.clipboardData || e.dataTransfer;

              var rng = pasteBin.getLastRng();

              function processItems(items) {
                  var i, item, hadImage = false;

                  if (items) {
                      for (i = 0; i < items.length; i++) {
                          item = items[i];

                          if (/^image\/(jpeg|png|gif|bmp)$/.test(item.type)) {
                              hadImage = true;
                              e.preventDefault();

                              if (ed.settings.clipboard_paste_data_images !== false) {
                                  var blob = item.getAsFile ? item.getAsFile() : item;

                                  var reader = new FileReader();
                                  // eslint-disable-next-line no-loop-func
                                  reader.onload = function () {
                                      var html = pasteImage(ed, rng, reader, blob);
                                      pasteHtml(html);
                                  };

                                  reader.readAsDataURL(blob);
                              } else {
                                  pasteHtml('<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-mce-upload-marker="1" />', true);
                              }
                          }
                      }
                  }

                  return hadImage;
              }

              pasteBin.remove();

              if (!dataTransfer) {
                  return false;
              }

              return processItems(dataTransfer.items) || processItems(dataTransfer.files);
          }

          function isPasteInPre() {
              var node = ed.selection.getNode();
              return ed.settings.html_paste_in_pre !== false && node && node.nodeName === 'PRE';
          }

          function getCaretRangeFromEvent(e) {
              return tinymce.dom.RangeUtils.getCaretRangeFromPoint(e.clientX, e.clientY, ed.getDoc());
          }

          function isPlainTextFileUrl(content) {
              var plainTextContent = content['text/plain'];
              return plainTextContent ? plainTextContent.indexOf('file://') === 0 : false;
          }

          function getContentAndInsert(e) {            
              // Getting content from the Clipboard can take some time
              var clipboardTimer = new Date().getTime();
              var clipboardContent = getClipboardContent(ed, e);
              var clipboardDelay = new Date().getTime() - clipboardTimer;

              function isKeyBoardPaste() {
                  if (e.type == 'drop') {
                      return false;
                  }

                  return (new Date().getTime() - keyboardPasteTimeStamp - clipboardDelay) < 1000;
              }

              var internal = hasContentType(clipboardContent, internalHtmlMime());

              keyboardPastePlainTextState = false;

              if (e.isDefaultPrevented() || isBrokenAndroidClipboardEvent(e)) {
                  pasteBin.remove();
                  return;
              }

              // Not a keyboard paste prevent default paste and try to grab the clipboard contents using different APIs
              if (!isKeyBoardPaste()) {
                  e.preventDefault();
              }

              // Try IE only method if paste isn't a keyboard paste
              if (isIE && (!isKeyBoardPaste() || e.ieFake) && !hasContentType(clipboardContent, 'text/html')) {
                  pasteBin.create();

                  ed.dom.bind(ed.dom.get('mcepastebin'), 'paste', function (e) {
                      e.stopPropagation();
                  });

                  ed.getDoc().execCommand('Paste', false, null);
                  clipboardContent["text/html"] = pasteBin.getHtml();
              }

              if (isPlainTextFileUrl(clipboardContent)) {
                  pasteBin.remove();
                  return;
              }

              if (!hasHtmlOrText(clipboardContent) && pasteImageData(e, pasteBin.getLastRng())) {
                  pasteBin.remove();
                  return;
              }

              // If clipboard API has HTML then use that directly
              if (isHtmlPaste(clipboardContent)) {
                  e.preventDefault();

                  // if clipboard lacks internal mime type, inspect html for internal markings
                  if (!internal) {
                      internal = isMarked(clipboardContent['text/html']);
                  }

                  insertClipboardContent(clipboardContent, internal);
              } else {
                  setTimeout(function () {
                      function block(e) {
                          e.preventDefault();
                      }

                      // Block mousedown and click to prevent selection change
                      ed.dom.bind(ed.getDoc(), 'mousedown', block);
                      ed.dom.bind(ed.getDoc(), 'keydown', block);

                      insertClipboardContent(clipboardContent, internal);

                      // Block mousedown and click to prevent selection change
                      ed.dom.unbind(ed.getDoc(), 'mousedown', block);
                      ed.dom.unbind(ed.getDoc(), 'keydown', block);
                  }, 0);
              }
          }

          function openWin(cmd) {
              var title = '', ctrl;

              var msg = ed.getLang('clipboard.paste_dlg_title', 'Use %s+V on your keyboard to paste text into the window.');
              msg = msg.replace(/%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

              if (cmd === "mcePaste") {
                  title = ed.getLang('clipboard.paste_desc');
                  ctrl = '<iframe id="' + ed.id + '_paste_content" src="javascript:;" frameborder="0" title="' + msg + '"></iframe>';

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

              ed.windowManager.open({
                  title: title,
                  content: html,
                  size: 'mce-modal-landscape-medium',
                  open: function () {
                      var ifr = DOM.get(ed.id + '_paste_content');

                      if (ifr.nodeName !== "IFRAME") {
                          window.setTimeout(function () {
                              ifr.focus();
                          }, 10);

                          return;
                      }

                      var doc = ifr.contentWindow.document;

                      var css, cssHTML = '';

                      // Force absolute CSS urls
                      css = tinymce.explode(ed.settings.content_css) || [];
                      css.push(ed.baseURI.toAbsolute("themes/" + ed.settings.theme + "/skins/" + ed.settings.skin + "/content.css"));

                      cssHTML += '<style type="text/css">body {background-color:white;color:black;text-align:left;}</style>';

                      tinymce.each(css, function (u) {
                          cssHTML += '<link href="' + ed.documentBaseURI.toAbsolute('' + u) + '" rel="stylesheet" type="text/css" />';
                      });

                      // Write content into iframe
                      doc.open();
                      doc.write('<html><head><base href="' + ed.settings.base_url + '" />' + cssHTML + '</head><body class="mceContentBody" spellcheck="false">&nbsp;</body></html>');
                      doc.close();

                      doc.designMode = 'on';

                      window.setTimeout(function () {
                          ifr.contentWindow.focus();
                      }, 10);
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
                              var node = DOM.get(ed.id + '_paste_content'), data = {};

                              if (node.nodeName == 'TEXTAREA') {
                                  data.text = node.value;
                              } else {
                                  var content = node.contentWindow.document.body.innerHTML;
                                  // Remove styles
                                  content = content.replace(/<style[^>]*>[\s\S]+?<\/style>/gi, '');
                                  // trim and assign
                                  data.content = tinymce.trim(content);
                              }

                              ed.execCommand('mceInsertClipboardContent', false, data);
                          },
                          classes: 'primary',
                          autofocus: true
                      }
                  ]
              });
          }

          // Grab contents on paste event
          ed.onPaste.add(function (ed, e) {
              getContentAndInsert(e);
          });

          ed.onInit.add(function () {
              var draggingInternally;

              ed.dom.bind(ed.getBody(), ['dragstart', 'dragend'], function (e) {
                  draggingInternally = e.type == 'dragstart';
              });

              ed.dom.bind(ed.getBody(), 'drop', function (e) {
                  var rng = getCaretRangeFromEvent(e);

                  if (e.isDefaultPrevented() || draggingInternally) {
                      return;
                  }

                  if (rng && ed.settings.clipboard_paste_filter_drop !== false) {
                      ed.selection.setRng(rng);
                      getContentAndInsert(e);
                  }
              });

              ed.dom.bind(ed.getBody(), ['dragover', 'dragend'], function (e) {
                  if (ed.settings.clipboard_paste_data_images) {
                      e.preventDefault();
                  }
              });
          });

          // Block all drag/drop events
          if (ed.getParam('clipboard_paste_block_drop')) {
              ed.onInit.add(function () {
                  ed.dom.bind(ed.getBody(), ['dragend', 'dragover', 'draggesture', 'dragdrop', 'drop', 'drag'], function (e) {
                      e.preventDefault();
                      e.stopPropagation();

                      return false;
                  });
              });
          }

          // Add commands
          each(['mcePasteText', 'mcePaste'], function (cmd) {
              ed.addCommand(cmd, function () {
                  var doc = ed.getDoc(),
                      failed;

                  // just open the window
                  if (ed.getParam('paste_use_dialog')) {
                      return openWin(cmd);
                  } else {
                      try {
                          // set plain text mode
                          self.pasteAsPlainText = (cmd === "mcePasteText");

                          doc.execCommand('Paste', false, null);
                      } catch (e) {
                          failed = true;
                      }

                      // Chrome reports the paste command as supported however older IE:s will return false for cut/paste
                      if (!doc.queryCommandEnabled('Paste')) {
                          failed = true;
                      }

                      if (failed) {
                          return openWin(cmd);
                      }
                  }
              });
          });

          // Add buttons
          if (self.pasteHtml) {
              ed.addButton('paste', {
                  title: 'clipboard.paste_desc',
                  cmd: 'mcePaste',
                  ui: true
              });
          }

          if (self.pasteText) {
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
      },


      /**
       * Inserts the specified contents at the caret position.
       */
      _insert: function (content, skip_undo) {
          var ed = this.editor;

          // get validate setting
          var validate = ed.settings.validate;

          // reset validate setting
          ed.settings.validate = true;

          // insert content
          ed.execCommand('mceInsertContent', false, content);

          // reset validate
          ed.settings.validate = validate;
      }
  });
  // Register plugin
  tinymce.PluginManager.add('clipboard', tinymce.plugins.ClipboardPlugin);

})();
