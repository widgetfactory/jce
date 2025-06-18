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
var each = tinymce.each, DOM = tinymce.DOM;

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

  each(rules, function (r) {

    if (r.selectorText) {
      var styles = {};

      each(r.style, function (name) {
        var value = r.style.getPropertyValue(name);

        if (isValue(value)) {
          styles[name] = value;
        }

      });

      each(r.selectorText.split(','), function (selector) {
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
  var div = DOM.create('div', {}, content), styles = {}, css = '';

  styles = tinymce.extend(styles, parseCSS(content));

  each(styles, function (value, selector) {
    // skip Word stuff
    if (selector.indexOf('Mso') !== -1) {
      return true;
    }
    
    if (!embed_stylesheet) {
      DOM.setStyles(DOM.select(selector, div), value.styles);
    } else {
      css += value.text;
    }
  });

  if (css) {
    div.prepend(DOM.create('style', { type: 'text/css' }, css));
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

export {
  trimHtml,
  hasContentType,
  getDataTransferItems,
  processStylesheets
};