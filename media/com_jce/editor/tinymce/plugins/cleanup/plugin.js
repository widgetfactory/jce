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
  var each = tinymce.each,
    Node = tinymce.html.Node;

  function split(str, delim) {
    return str.split(delim || ',');
  }

  // list of HTML tags
  var tags = [
    'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'bgsound', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'content', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'image', 'img', 'input', 'ins', 'isindex', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 'nav', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 'progress', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr', 'xmp'
  ];

  var fontIconRe = /<([a-z0-9]+)([^>]+)class="([^"]*)(glyph|uk-)?(fa|icon)-([\w-]+)([^"]*)"([^>]*)><\/\1>/gi;
  var paddedRx = /<(p|h1|h2|h3|h4|h5|h6|pre|div|address|caption)\b([^>]+)>(&nbsp;|\u00a0)<\/\1>/gi;

  tinymce.PluginManager.add('cleanup', function (ed, url) {
    // set validate value to verify_html value
    if (ed.settings.verify_html === false) {
      ed.settings.validate = false;
    }

    ed.onPreInit.add(function () {
      // Remove bogus elements
      ed.serializer.addAttributeFilter('data-mce-caret', function (nodes, name, args) {
        var i = nodes.length;

        while (i--) {
          nodes[i].remove();
        }
      });

      // cleanup data-mce-bogus tags
      if (ed.settings.remove_trailing_brs === false) {
        // Remove bogus elements
        ed.serializer.addAttributeFilter('data-mce-bogus', function (nodes, name, args) {
          var i = nodes.length, node, textNode;

          while (i--) {
            node = nodes[i];

            if (node.name !== 'br') {
              continue;
            }

            if (!node.prev && !node.next) {
              textNode = new Node('#text', 3);
              textNode.value = '\u00a0';
              node.replace(textNode);
            } else {
              node.remove();
            }
          }
        });
      }

      // cleanup tmp attributes
      ed.serializer.addAttributeFilter('data-mce-tmp', function (nodes, name) {
        var i = nodes.length,
          node;

        while (i--) {
          node = nodes[i];
          node.attr('data-mce-tmp', null);
        }
      });

      // cleanup tmp attributes
      ed.parser.addAttributeFilter('data-mce-tmp', function (nodes, name) {
        var i = nodes.length,
          node;

        while (i--) {
          node = nodes[i];
          node.attr('data-mce-tmp', null);
        }
      });

      function removeEventAttributes() {
        // remove all event attributes
        each(ed.schema.elements, function (elm) {
          // no attributes on this element
          if (!elm.attributesOrder || elm.attributesOrder.length === 0) {
            return true;
          }

          each(elm.attributes, function (obj, name) {
            if (name.indexOf('on') === 0) {
              delete elm.attributes[name];
              elm.attributesOrder.splice(tinymce.inArray(elm, elm.attributesOrder, name), 1);
            }
          });
        });
      }

      if (ed.settings.verify_html !== false) {
        if (!ed.settings.allow_event_attributes) {
          removeEventAttributes();
        }

        // add support for "bootstrap" icons
        var elements = ed.schema.elements;

        // allow empty elements. There really is no need to remove them...
        each(split('ol ul sub sup blockquote font table tbody tr strong b'), function (name) {
          if (elements[name]) {
            elements[name].removeEmpty = false;
          }
        });

        if (!ed.getParam('pad_empty_tags', true)) {
          each(elements, function (v, k) {
            if (v.paddEmpty) {
              v.paddEmpty = false;
            }
          });
        }

        if (!ed.getParam('table_pad_empty_cells', true)) {
          elements.th.paddEmpty = false;
          elements.td.paddEmpty = false;
        }

        each(elements, function (v, k) {
          // skip internal elements
          if (k.indexOf('mce:') == 0) {
            return true;
          }

          // custom element
          if (tinymce.inArray(tags, k) === -1) {
            ed.schema.addCustomElements(k);
          }
        });
      }

      // only if "Cleanup HTML" enabled
      if (ed.settings.verify_html !== false) {
        // Invalid Attribute Values cleanup
        var invalidAttribValue = ed.getParam('invalid_attribute_values', '');

        if (invalidAttribValue) {
          /**
                       * adapted from https://github.com/tinymce/tinymce/blob/master/src/core/src/main/js/ui/Selector.js
                       * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
                       */
          function attrFilter(value, expr, check) {
            return !expr ? !!check :
              expr === "=" ? value === check :
                expr === "*=" ? value.indexOf(check) >= 0 :
                  expr === "~=" ? (" " + value + " ").indexOf(" " + check + " ") >= 0 :
                    expr === "!=" ? value != check :
                      expr === "^=" ? value.indexOf(check) === 0 :
                        expr === "$=" ? value.substr(value.length - check.length) === check :
                          false;
          }

          function replaceAttributeValue(nodes, name, expr, check) {
            var i = nodes.length,
              node;

            while (i--) {
              node = nodes[i];

              var value = node.attr(name);

              if (!value) {
                continue;
              }

              // remove attribute if it matches expression
              if (!expr || attrFilter(value, expr, check)) {
                node.attr(name, null);
                // remove temp attribute
                if (name === 'src' || name === 'href' || name === 'style') {
                  node.attr('data-mce-' + name, null);
                }

                // remove <a> nodes without attributes
                if (node.name === "a" && !node.attributes.length) {
                  node.unwrap();
                }
              }
            }
          }

          each(tinymce.explode(invalidAttribValue), function (item) {
            var matches = /([a-z0-9\*]+)\[([a-z0-9-]+)([\^\$\!~\*]?=)?["']?([^"']+)?["']?\]/i.exec(item);

            if (matches && matches.length == 5) {
              var tag = matches[1],
                attrib = matches[2],
                expr = matches[3],
                value = matches[4];

              // remove the entire attribute
              if (attrib && !expr && !value) {
                expr = '';
              }

              if (typeof expr !== "undefined") {
                // all tags
                if (tag == '*') {
                  ed.parser.addAttributeFilter(attrib, function (nodes, name) {
                    replaceAttributeValue(nodes, name, expr, value);
                  });
                  ed.serializer.addAttributeFilter(attrib, function (nodes, name) {
                    replaceAttributeValue(nodes, name, expr, value);
                  });
                  // specific tag
                } else {
                  ed.parser.addNodeFilter(tag, function (nodes, name) {
                    replaceAttributeValue(nodes, attrib, expr, value);
                  });
                  ed.serializer.addNodeFilter(tag, function (nodes, name) {
                    replaceAttributeValue(nodes, attrib, expr, value);
                  });
                }
              }
            }
          });
        }
      }

      ed.serializer.addNodeFilter(ed.settings.invalid_elements, function (nodes, name) {
        var i = nodes.length,
          node;

        if (ed.schema.isValidChild('body', name)) {
          while (i--) {
            node = nodes[i];
            node.remove();
          }
        }
      });

      ed.parser.addNodeFilter(ed.settings.invalid_elements, function (nodes, name) {
        var i = nodes.length,
          node;

        if (ed.schema.isValidChild('body', name)) {
          while (i--) {
            node = nodes[i];

            // don't remove system spans
            if (name === 'span' && node.attr('data-mce-type')) {
              continue;
            }

            node.unwrap();
          }
        }
      });

      // try and keep empty a tags that are not anchors, process bootstrap icons
      ed.parser.addNodeFilter('a,i,span,li', function (nodes, name) {
        var i = nodes.length,
          node, cls;

        while (i--) {
          node = nodes[i], cls = (node.attr('class') || name === "li");
          // padd it with a space if its empty and has a class, eg: <i class="icon-ok"></i>
          if (cls && !node.firstChild) {
            node.attr('data-mce-empty', '1');
            node.append(new Node('#text', '3')).value = '\u00a0';
          }
        }
      });

      // cleanup padded "bootstrap" tags
      ed.serializer.addAttributeFilter('data-mce-empty', function (nodes, name) {
        var i = nodes.length,
          node, fc;

        while (i--) {
          node = nodes[i], fc = node.firstChild;
          node.attr('data-mce-empty', null);

          if (fc && (fc.value === '\u00a0' || fc.value === '&nbsp;')) {
            fc.remove();
          }
        }
      });

      // disable onclick etc.
      ed.parser.addAttributeFilter('onclick,ondblclick,onmousedown,onmouseup', function (nodes, name) {
        var i = nodes.length,
          node;

        while (i--) {
          node = nodes[i];

          node.attr('data-mce-' + name, node.attr(name));
          node.attr(name, 'return false;');
        }
      });

      ed.serializer.addAttributeFilter('data-mce-onclick,data-mce-ondblclick,data-mce-onmousedown,data-mce-onmouseup', function (nodes, name) {
        var i = nodes.length,
          node, k;

        while (i--) {
          node = nodes[i], k = name.replace('data-mce-', '');

          node.attr(k, node.attr(name));
          node.attr(name, null);
        }
      });

      ed.serializer.addNodeFilter('br', function (nodes, name) {
        var i = nodes.length,
          node;

        if (i) {
          while (i--) {
            node = nodes[i];

            // parent node is body
            if (node.parent && node.parent.name === "body" && !node.prev) {
              node.remove();
            }
          }
        }
      });

      // remove br in Gecko
      ed.parser.addNodeFilter('br', function (nodes, name) {
        var i = nodes.length,
          node;

        if (i) {
          while (i--) {
            node = nodes[i];

            // parent node is body
            if (node.parent && node.parent.name === "body" && !node.prev) {
              node.remove();
            }
          }
        }
      });
    });

    // run cleanup with default settings
    if (ed.settings.verify_html === false) {
      ed.addCommand('mceCleanup', function () {
        var s = ed.settings,
          se = ed.selection,
          bm;
        bm = se.getBookmark();

        var content = ed.getContent({
          cleanup: true
        });

        // set verify to true
        s.verify_html = true;

        // create new schema
        var schema = new tinymce.html.Schema(s);

        // clean content
        content = new tinymce.html.Serializer({
          validate: true
        }, schema).serialize(new tinymce.html.DomParser({
          validate: true,
          allow_event_attributes: !!ed.settings.allow_event_attributes
        }, schema).parse(content));

        ed.setContent(content, {
          cleanup: true
        });

        se.moveToBookmark(bm);
      });
    }

    // Cleanup callback
    ed.onBeforeSetContent.add(function (ed, o) {
      // remove br tag added by Firefox
      o.content = o.content.replace(/^<br>/, '');

      // Geshi
      o.content = convertFromGeshi(o.content);

      // only if "Cleanup HTML" enabled
      if (ed.settings.validate) {
        // remove attributes
        if (ed.getParam('invalid_attributes')) {
          var s = ed.getParam('invalid_attributes', '');

          o.content = o.content.replace(new RegExp('<([^>]+)(' + s.replace(/,/g, '|') + ')="([^"]+)"([^>]*)>', 'gi'), function () {
            // get tag an attributes (if any) from arguments array, eg: match, p1,p2...pn, offset, string
            var args = arguments, tag = args[1], attribs = args[args.length - 3] || '';
            return '<' + tag + attribs + '>';
          });
        }
      }

      // pad bootstrap icons
      o.content = o.content.replace(fontIconRe, '<$1$2class="$3$4$5-$6$7"$8 data-mce-empty="1">&nbsp;</$1>');

      // padd some empty tags
      o.content = o.content.replace(/<(a|i|span)\b([^>]+)><\/\1>/gi, '<$1$2 data-mce-empty="1">&nbsp;</$1>');

      // padd list elements
      o.content = o.content.replace(/<li><\/li>/, '<li data-mce-empty="1">&nbsp;</li>');
    });

    // Cleanup callback
    ed.onPostProcess.add(function (ed, o) {
      if (o.set) {
        // Geshi
        o.content = convertFromGeshi(o.content);
      }
      if (o.get) {
        // Geshi
        o.content = convertToGeshi(o.content);

        // Remove empty jcemediabox / jceutilities anchors
        o.content = o.content.replace(/<a([^>]*)class="jce(box|popup|lightbox|tooltip|_tooltip)"([^>]*)><\/a>/gi, '');
        // Remove span elements with jcemediabox / jceutilities classes
        o.content = o.content.replace(/<span class="jce(box|popup|lightbox|tooltip|_tooltip)">(.*?)<\/span>/gi, '$2');
        // legacy mce stuff
        o.content = o.content.replace(/_mce_(src|href|style|coords|shape)="([^"]+)"\s*?/gi, '');

        if (ed.settings.validate === false) {
          // fix body content
          o.content = o.content.replace(/<body([^>]*)>([\s\S]*)<\/body>/, '$2');

          if (!ed.getParam('remove_tag_padding')) {
            // pad empty elements
            o.content = o.content.replace(/<(p|h1|h2|h3|h4|h5|h6|th|td|pre|div|address|caption)\b([^>]*)><\/\1>/gi, '<$1$2>&nbsp;</$1>');
          }
        }

        if (!ed.getParam('table_pad_empty_cells', true)) {
          o.content = o.content.replace(/<(th|td)([^>]*)>(&nbsp;|\u00a0)<\/\1>/gi, '<$1$2></$1>');
        }

        // clean empty tags
        o.content = o.content.replace(/<(a|i|span)([^>]+)>(&nbsp;|\u00a0)<\/\1>/gi, function (match, tag, attribs) {
          // remove data-mce-empty attribute
          attribs = attribs.replace('data-mce-empty="1"', '');
          // return empty tag
          return '<' + tag + ' ' + tinymce.trim(attribs) + '></' + tag + '>';
        });

        // clean empty list tags
        o.content = o.content.replace(/<li data-mce-empty="1">(&nbsp;|\u00a0)<\/li>/gi, '<li></li>');

        // remove padding on div (legacy)
        if (ed.getParam('remove_div_padding')) {
          o.content = o.content.replace(/<div([^>]*)>(&nbsp;|\u00a0)<\/div>/g, '<div$1></div>');
        }

        // remove padding on everything
        if (ed.getParam('pad_empty_tags', true) === false) {
          o.content = o.content.replace(paddedRx, '<$1$2></$1>');
        }

        // convert multiple consecutive non-breaking spaces
        if (ed.getParam('keep_nbsp', true) && ed.settings.entity_encoding === "raw") {
          o.content = o.content.replace(/\u00a0/g, '&nbsp;');
        }

        // fix boolean custom attributes
        o.content = o.content.replace(/(uk|v|ng|data)-([\w-]+)=""(\s|>)/gi, '$1-$2$3');

        // Remove empty contents
        if (ed.settings.padd_empty_editor) {
          o.content = o.content.replace(/^(<div>(&nbsp;|&#160;|\s|\u00a0|)<\/div>[\r\n]*|<br(\s*\/)?>[\r\n]*)$/, '');
        }

        // fix self-closing hr tags for pagebreak
        o.content = o.content.replace(/<hr(.*)class="system-pagebreak"(.*?)\/?>/gi, '<hr$1class="system-pagebreak"$2/>');
        // fix self-closing hr tags for readmore
        o.content = o.content.replace(/<hr id="system-readmore"(.*?)>/gi, '<hr id="system-readmore" />');
      }
    });

    ed.onSaveContent.add(function (ed, o) {
      // Convert entities to characters
      if (ed.getParam('cleanup_pluginmode')) {

        var entities = {
          '&#39;': "'",
          '&amp;': '&',
          '&quot;': '"',
          '&apos;': "'"
        };

        o.content = o.content.replace(/&(#39|apos|amp|quot);/gi, function (a) {
          return entities[a];
        });
      }
    });

    // Register buttons
    ed.addButton('cleanup', {
      title: 'advanced.cleanup_desc',
      cmd: 'mceCleanup'
    });

    function convertFromGeshi(h) {
      h = h.replace(/<pre xml:lang="([^"]+)"([^>]*)>(.*?)<\/pre>/g, function (a, b, c, d) {
        var attr = '';

        if (c && /\w/.test(c)) {
          attr = c.split(' ').join(' data-geshi-');
        }

        return '<pre data-geshi-lang="' + b + '"' + attr + '>' + d + '</pre>';
      });

      return h;
    }

    function convertToGeshi(h) {
      h = h.replace(/<pre([^>]+)data-geshi-lang="([^"]+)"([^>]*)>(.*?)<\/pre>/g, function (a, b, c, d, e) {
        var s = b + d;
        s = s.replace(/data-geshi-/gi, '').replace(/\s+/g, ' ').replace(/\s$/, '');

        return '<pre xml:lang="' + c + '"' + s + '>' + e + '</pre>';
      });

      return h;
    }
  });
})();