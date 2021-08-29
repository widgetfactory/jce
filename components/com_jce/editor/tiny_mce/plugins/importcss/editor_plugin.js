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
  var each = tinymce.each,
    DOM = tinymce.DOM,
    PreviewCss = tinymce.util.PreviewCss;

  /* Make a css url absolute
     * @param u URL string
     * @param p URL of the css file
     */
  function toAbsolute(u, p) {
    return u.replace(/url\(["']?(.+?)["']?\)/gi, function (a, b) {

      if (b.indexOf('://') < 0) {
        return 'url("' + p + b + '")';
      }

      return a;
    });
  }

  function isEditorContentCss(url) {
    return url.indexOf('/tiny_mce/') !== -1 && url.indexOf('content.css') !== -1;
  }

  function cleanSelectorText(selectorText) {
    // Parse simple element.class1, .class1
    var selector = /^(?:([a-z0-9\-_]+))?(\.[a-z0-9_\-\.]+)$/i.exec(selectorText);

    // no match
    if (!selector) {
      return '';
    }

    var elementName = selector[1];

    if (elementName !== "body") {
      return selector[2].substr(1).split('.').join(' ');
    }

    return '';
  }

  var rgba = {}, luma = {};

  /*no-bitwise:0;no-cond-assign:0*/

  function getRGBA(val) {
    if (!rgba[val]) {
      var r = 0, b = 0, g = 0, a = 1, values, match;

      if (val.indexOf('#') !== -1) {
        val = val.substr(1);

        // fff -> ffffff
        if (val.length === 3) {
          val += val;
        }

        values = parseInt(val, 16);

        r = (values >> 16) & 0xFF;
        g = (values >> 8) & 0xFF;
        b = (values >> 0) & 0xFF;
        a = (values >> 24) & 0xFF;
      } else {
        // remove spaces
        val = val.replace(/\s/g, '');

        if (match = /^(?:rgb|rgba)\(([^\)]*)\)$/.exec(val)) {
          values = match[1].split(',').map(function (x, i) {
            return parseFloat(x);
          });
        }

        if (values) {
          r = values[0];
          g = values[1];
          b = values[2];

          if (values.length === 4) {
            a = values[3] || 1;
          }
        }
      }

      rgba[val] = { r: r, g: g, b: b, a: a };
    }

    return rgba[val];
  }

  // https://github.com/bgrins/TinyColor/blob/master/tinycolor.js#L75
  function getLuminance(val) {
    if (!luma[val]) {
      var col = getRGBA(val);

      // opacity is set
      /*if (col.a < 1 && color2) {
                var col2 = getRGBA(color2);

                col = {
                    r: ((col2.r - col.r) * col.a) + col.r,
                    g: ((col2.g - col.g) * col.a) + col.g,
                    b: ((col2.b - col.b) * col.a) + col.b
                };
            }*/

      var RsRGB, GsRGB, BsRGB, R, G, B;

      RsRGB = col.r / 255;
      GsRGB = col.g / 255;
      BsRGB = col.b / 255;

      if (RsRGB <= 0.03928) {
        R = RsRGB / 12.92;
      } else {
        R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);
      }
      if (GsRGB <= 0.03928) {
        G = GsRGB / 12.92;
      } else {
        G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);
      }
      if (BsRGB <= 0.03928) {
        B = BsRGB / 12.92;
      } else {
        B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);
      }

      luma[val] = (0.2126 * R) + (0.7152 * G) + (0.0722 * B);

      //luma[val] = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b; // per ITU-R BT.709
    }

    return luma[val];
  }

  // https://github.com/bgrins/TinyColor/blob/master/tinycolor.js#L726
  function isReadable(color1, color2, wcag2, limit) {
    var l1 = getLuminance(color1);
    var l2 = getLuminance(color2);

    var lvl = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    wcag2 = wcag2 || 4.5;
    limit = limit || 21;

    return lvl >= parseFloat(wcag2) && lvl < parseFloat(limit); // AA
  }

  tinymce.create('tinymce.plugins.ImportCSS', {
    init: function (ed, url) {
      this.editor = ed;
      var self = this;

      // create an event to use externally
      ed.onImportCSS = new tinymce.util.Dispatcher();

      ed.onImportCSS.add(function () {
        if (tinymce.is(ed.settings.importcss_classes)) {
          return;
        }

        self._import();
      });

      // attempt to import when the editor is initialised
      ed.onInit.add(function () {
        ed.onImportCSS.dispatch();

        // check for high contrast if not already set in a parameter
        if (ed.settings.content_style_reset === 'auto' && !ed.dom.hasClass(ed.getBody(), 'mceContentReset')) {
          self._setHighContrastMode();
        }

        self._setGuideLinesColor();
      });

      ed.onFocus.add(function (ed) {
        if (ed._hasGuidelines) {
          return;
        }

        self._setGuideLinesColor();
      });
    },

    _setHighContrastMode: function () {
      var ed = this.editor;

      var bodybg = ed.dom.getStyle(ed.getBody(), 'background-color', true), color = ed.dom.getStyle(ed.getBody(), 'color', true);

      if (!bodybg || !color) {
        return;
      }

      var hex = ed.dom.toHex(bodybg);

      // if the colours match, may be an error in stylesheet loading
      if (hex == ed.dom.toHex(color) && hex === '#000000') {
        return;
      }

      if (!isReadable(color, bodybg, 3.0)) {
        ed.dom.addClass(ed.getBody(), 'mceContentReset');
      }
    },

    _setGuideLinesColor: function () {
      var ed = this.editor;

      var gray = [
        '#000000',
        '#080808',
        '#101010',
        '#181818',
        '#202020',
        '#282828',
        '#303030',
        '#383838',
        '#404040',
        '#484848',
        '#505050',
        '#585858',
        '#606060',
        '#686868',
        '#696969',
        '#707070',
        '#787878',
        '#808080',
        '#888888',
        '#909090',
        '#989898',
        '#a0a0a0',
        '#a8a8a8',
        '#a9a9a9',
        '#b0b0b0',
        '#b8b8b8',
        '#bebebe',
        '#c0c0c0',
        '#c8c8c8',
        '#d0d0d0',
        '#d3d3d3',
        '#d8d8d8',
        '#dcdcdc',
        '#e0e0e0',
        '#e8e8e8',
        '#f0f0f0',
        '#f5f5f5',
        '#f8f8f8',
        '#ffffff'
      ];

      var blue = [
        '#0d47a1',
        '#1565c0',
        '#1976d2',
        '#1e88e5',
        '#2196f3',
        '#42a5f5',
        '#64b5f6',
        '#90caf9',
        '#bbdefb',
        '#e3f2fd'
      ];

      var guidelines = '#787878', control = '#1e88e5', controlbg = '#b4d7ff', placeholder = '#efefef', bodybg = ed.dom.getStyle(ed.getBody(), 'background-color', true), color = ed.dom.getStyle(ed.getBody(), 'color', true);

      if (!bodybg) {
        return;
      }

      ed._hasGuidelines = true;

      // guidelines
      for (var i = 0; i < gray.length; i++) {
        if (isReadable(gray[i], bodybg, 4.5, 5.0)) {

          if (ed.dom.toHex(color) === ed.dom.toHex(gray[i])) {
            continue;
          }

          guidelines = gray[i];

          break;
        }
      }

      // control element selection
      for (var i = 0; i < blue.length; i++) {
        if (isReadable(blue[i], bodybg, 4.5, 5.0)) {
          control = blue[i];
          break;
        }
      }

      if (guidelines || control) {
        var css = ':root{';

        if (guidelines) {
          css += '--mce-guidelines: ' + guidelines + ';';
        }

        if (placeholder) {
          css += '--mce-placeholder: ' + placeholder + ';';
        }

        if (control) {
          css += '--mce-control-selection: ' + control + ';';
          css += '--mce-control-selection-bg: ' + controlbg + ';';
        }

        css += '}';

        ed.dom.addStyle(css);
      }
    },

    _import: function () {
      var self = this,
        ed = this.editor,
        doc = ed.getDoc(), href = '',
        rules = [],
        fonts = false;

      var fontface = [], filtered = {}, classes = [];

      function isAllowedStylesheet(href) {
        var styleselect = ed.getParam('styleselect_stylesheets');

        if (!styleselect) {
          return true;
        }

        if (typeof filtered[href] !== 'undefined') {
          return filtered[href];
        }

        filtered[href] = (href.indexOf(styleselect) !== -1);

        return filtered[href];
      }

      function parseCSS(stylesheet) {
        // IE style imports
        each(stylesheet.imports, function (r) {
          if (r.href.indexOf('://fonts.googleapis.com') > 0) {
            var v = '@import url(' + r.href + ');';

            if (self.fontface.indexOf(v) === -1) {
              self.fontface.unshift(v);
            }

            return;
          }

          parseCSS(r);
        });

        try {
          rules = stylesheet.cssRules || stylesheet.rules;
          href = stylesheet.href;

          if (!href) {
            return;
          }

          if (isEditorContentCss(href)) {
            return;
          }

          // get stylesheet href
          href = href.substr(0, href.lastIndexOf('/') + 1);

          ed.hasStyleSheets = true;
        } catch (e) {
          // Firefox fails on rules to remote domain for example:
          // @import url(//fonts.googleapis.com/css?family=Pathway+Gothic+One);
        }

        each(rules, function (r) {
          // Real type or fake it on IE
          switch (r.type || 1) {
            // Rule
            case 1:
              if (!isAllowedStylesheet(stylesheet.href)) {
                return true;
              }

              // IE8
              if (!r.type) { }

              if (r.selectorText) {
                each(r.selectorText.split(','), function (v) {
                  v = v.replace(/^\s*|\s*$|^\s\./g, "");

                  // Is internal or it doesn't contain a class
                  if (/\.mce/.test(v) || !/\.[\w\-]+$/.test(v)) {
                    return;
                  }

                  if (v && classes.indexOf(v) === -1) {
                    classes.push(v);
                  }
                });
              }

              break;

              // Import
            case 3:
              if (r.href.indexOf('//fonts.googleapis.com') > 0) {
                var v = '@import url(' + r.href + ');';

                if (fontface.indexOf(v) === -1) {
                  fontface.unshift(v);
                }
              }

              // only local imports
              if (r.href.indexOf('//') === -1) {
                parseCSS(r.styleSheet);
              }
              break;
              // font-face
            case 5:
              // check for text and skip popular font icons
              if (r.cssText && /(fontawesome|glyphicons|icomoon)/i.test(r.cssText) === false) {
                var v = toAbsolute(r.cssText, href);

                if (fontface.indexOf(v) === -1) {
                  fontface.push(v);
                }
              }
              break;
          }
        });
      }

      // parse stylesheets
      if (!classes.length) {
        try {
          each(doc.styleSheets, function (styleSheet) {
            parseCSS(styleSheet);
          });
        } catch (ex) { }
      }

      // add font-face rules
      if (!fontface.length && !fonts) {
        try {
          // get document head
          var head = DOM.doc.getElementsByTagName('head')[0];
          // create style element
          var style = DOM.create('style', {
            type: 'text/css'
          });

          var css = self.fontface.join("\n");

          if (style.styleSheet) {
            var setCss = function () {
              try {
                style.styleSheet.cssText = css;
              } catch (e) { }
            };
            if (style.styleSheet.disabled) {
              setTimeout(setCss, 10);
            } else {
              setCss();
            }
          } else {
            style.appendChild(DOM.doc.createTextNode(css));
          }

          // add to head
          head.appendChild(style);

          // set fonts flag so we only do this once
          fonts = true;

        } catch (e) { }
      }

      // sort and expose if classes have been set
      if (classes.length) {
        // sort alphabetically
        if (ed.getParam('styleselect_sort', 1)) {
          classes.sort();
        }

        ed.settings.importcss_classes = tinymce.map(classes, function (val) {
          var cls = cleanSelectorText(val);

          var style = PreviewCss(ed, { styles: [], attributes: [], classes: cls.split(' ') });
          return { 'selector': val, 'class': cls, 'style': style };
        });
      }
    }
  });
  // Register plugin
  tinymce.PluginManager.add('importcss', tinymce.plugins.ImportCSS);
})();