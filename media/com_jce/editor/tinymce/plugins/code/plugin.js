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
    Node = tinymce.html.Node,
    VK = tinymce.VK,
    DomParser = tinymce.html.DomParser,
    Serializer = tinymce.html.Serializer,
    SaxParser = tinymce.html.SaxParser;

  function createTextNode(value, raw) {
    var text = new Node('#text', 3);
    text.raw = raw !== false ? true : false;
    text.value = value;

    return text;
  }

  function isOnlyChild(node) {
    var parent = node.parent,
      child = parent.firstChild,
      count = 0;

    if (child) {
      do {
        if (child.type === 1) {
          // Ignore bogus elements
          if (child.attributes.map['data-mce-type'] || child.attributes.map['data-mce-bogus']) {
            continue;
          }

          if (child === node) {
            continue;
          }

          count++;
        }

        // Keep comments
        if (child.type === 8) {
          count++;
        }

        // Keep non whitespace text nodes
        if ((child.type === 3 && !/^[ \t\r\n]*$/.test(child.value))) {
          count++;
        }
      } while ((child = child.next));
    }

    return count === 0;
  }

  tinymce.PluginManager.add('code', function (ed, url) {

    var blockElements = [], inlineElements = [],
      htmlSchema = new tinymce.html.Schema({
        schema: 'mixed',
        invalid_elements: ed.settings.invalid_elements
      }),
      xmlSchema = new tinymce.html.Schema({
        verify_html: false
      });

    // should code blocks be used?
    var code_blocks = ed.settings.code_use_blocks !== false;

    // allow script URLS, eg: href="javascript:;"
    if (ed.settings.code_allow_script) {
      ed.settings.allow_script_urls = true;
    }

    ed.addCommand('InsertShortCode', function (ui, html) {
      if (ed.settings.code_protect_shortcode) {
        html = processShortcode(html, 'pre', true);

        if (tinymce.is(html)) {
          ed.execCommand('mceReplaceContent', false, html);
        }
      }

      return false;
    });

    function processOnInsert(value, node) {
      if (/\{.+\}/gi.test(value) && ed.settings.code_protect_shortcode) {
        var tagName;

        // an empty block container, so insert as <pre>
        /*if (node && ed.dom.isEmpty(node)) {
          tagName = 'pre';
        }*/

        value = processShortcode(value, tagName);
      }

      if (ed.settings.code_allow_custom_xml) {
        value = processXML(value);
      }

      // script / style
      if (/<(\?|script|style)/.test(value)) {
        // process script and style tags
        value = value.replace(/<(script|style)([^>]*?)>([\s\S]*?)<\/\1>/gi, function (match, type) {
          if (!ed.getParam('code_allow_' + type)) {
            return '';
          }

          match = match.replace(/<br[^>]*?>/gi, '\n');

          return createCodePre(match, type);
        });

        value = processPhp(value);
      }

      return value;
    }

    /**
     * Detect and process shortcode in an html string
     * @param {String} html
     * @param {String} tagName
     */
    function processShortcode(html, tagName) {
      // quick check to see if we should proceed
      if (html.indexOf('{') === -1) {
        return html;
      }

      // skip stuff like {1} etc.
      if (html.charAt(0) == '{' && html.length < 3) {
        return html;
      }

      // process as sourcerer
      if (html.indexOf('{/source}') != -1) {
        html = processSourcerer(html);
      }

      // default to inline span if the tagName is not set. This will be converted to pre by the DomParser if required
      tagName = tagName || 'span';

      // shortcode blocks eg: {article}\nhtml{/article} or inline or single line shortcode, eg: {youtube}https://www.youtube.com/watch?v=xxDv_RTdLQo{/youtube}
      return html.replace(/(?:(<(code|pre|samp|span)[^>]*(data-mce-type="code")?>)?)(?:\{)([\w-]+)(.*?)(?:\/?\})(?:([\s\S]+?)\{\/\4\})?/g, function (match) {
        // already wrapped in a tag
        if (match.charAt(0) === '<') {
          return match;
        }

        return createShortcodePre(match, tagName);
      });
    }

    function processSourcerer(html) {
      // quick check to see if we should proceed
      if (html.indexOf('{/source}') === -1) {
        return html;
      }

      // shortcode blocks eg: {source}html{/source}
      return html.replace(/(?:(<(code|pre|samp|span)[^>]*(data-mce-type="code")?>|")?)\{source(.*?)\}([\s\S]+?)\{\/source\}/g, function (match) {
        // already wrapped in a tag
        if (match.charAt(0) === '<' || match.charAt(0) === '"') {
          return match;
        }

        match = ed.dom.decode(match);

        return '<pre data-mce-code="shortcode" data-mce-label="sourcerer">' + ed.dom.encode(match) + '</pre>';
      });
    }

    function processPhp(content) {
      // Remove PHP if not enabled
      if (!ed.settings.code_allow_php) {
        return content.replace(/<\?(php)?([\s\S]*?)\?>/gi, '');
      }

      // PHP code within an attribute
      content = content.replace(/\="([^"]+?)"/g, function (a, b) {
        b = b.replace(/<\?(php)?(.+?)\?>/gi, function (x, y, z) {
          return '__php_start__' + ed.dom.encode(z) + '__php_end__';
        });

        return '="' + b + '"';
      });

      // PHP code within a textarea
      if (/<textarea/.test(content)) {
        content = content.replace(/<textarea([^>]*)>([\s\S]*?)<\/textarea>/gi, function (a, b, c) {
          c = c.replace(/<\?(php)?(.+?)\?>/gi, function (x, y, z) {
            return '__php_start__' + ed.dom.encode(z) + '__php_end__';
          });
          return '<textarea' + b + '>' + c + '</textarea>';
        });
      }

      // PHP code within an element
      content = content.replace(/<([^>]+)<\?(php)?(.+?)\?>([^>]*?)>/gi, function (a, b, c, d, e) {
        if (b.charAt(b.length) !== ' ') {
          b += ' ';
        }
        return '<' + b + 'data-mce-php="' + d + '" ' + e + '>';
      });

      // PHP code other
      content = content.replace(/<\?(php)?([\s\S]+?)\?>/gi, function (match) {
        // replace newlines with <br /> so they are preserved inside the span
        match = match.replace(/\n/g, '<br />');

        // create code span
        return createCodePre(match, 'php', 'span');
      });

      return content;
    }

    /**
     * Check whether a tag is a defined invalid element
     * @param {String} name
     */
    function isInvalidElement(name) {
      var invalid_elements = ed.settings.invalid_elements.split(',');
      return tinymce.inArray(invalid_elements, name) !== -1;
    }

    /**
     * Check if a tag is an XML element - not part of the HMTL Schema, but is also not a defined invalid element
     * @param {String} name
     */
    function isXmlElement(name) {
      return !htmlSchema.isValid(name) && !isInvalidElement(name);
    }

    /**
     * Validate xml code using a custom SaxParser. This will remove event attributes ir required, and validate nested html using the editor schema.
     * @param {String} xml
     */
    function validateXml(xml) {
      var html = [];

      // check that the element or attribute is not invalid
      function isValid(tag, attr) {
        // is an xml tag and is not an invalid_element
        if (isXmlElement(tag)) {
          return true;
        }

        return ed.schema.isValid(tag, attr);
      }

      new SaxParser({
        start: function (name, attrs, empty) {
          if (!isValid(name)) {
            return;
          }

          html.push('<', name);

          var attr;

          if (attrs) {
            for (var i = 0, len = attrs.length; i < len; i++) {
              attr = attrs[i];

              if (!isValid(name, attr.name)) {
                continue;
              }

              // skip event attributes
              if (ed.settings.allow_event_attributes !== true) {
                if (attr.name.indexOf('on') === 0) {
                  continue;
                }
              }

              html.push(' ', attr.name, '="', ed.dom.encode('' + attr.value, true), '"');
            }
          }

          if (!empty) {
            html[html.length] = '>';
          } else {
            html[html.length] = ' />';
          }
        },

        text: function (value) {
          if (value.length > 0) {
            html[html.length] = value;
          }
        },

        end: function (name) {
          if (!isValid(name)) {
            return;
          }

          html.push('</', name, '>');
        },

        cdata: function (text) {
          html.push('<![CDATA[', text, ']]>');
        },

        comment: function (text) {
          html.push('<!--', text, '-->');
        }
      }, xmlSchema).parse(xml);

      return html.join('');
    }

    /**
     * Detect and process xml tags
     * @param {String} content
     */
    function processXML(content) {
      return content.replace(/<([a-z0-9\-_\:\.]+)(?:[^>]*?)\/?>((?:[\s\S]*?)<\/\1>)?/gi, function (match, tag) {
        // lowercase tag name
        tag = tag.toLowerCase();
        
        // check if svg is allowed
        if (tag === 'svg' && ed.settings.code_allow_svg_in_xml === false) {
          return match;
        }

        // check if mathml is allowed
        if (tag === 'math' && ed.settings.code_allow_mathml_in_xml === false) {
          return match;
        }

        // check if the tags is part of the generic HTML schema, return if true
        if (!isXmlElement(tag)) {
          return match;
        }

        // validate xml by default to remove event attributes and invalid nested html
        if (ed.settings.code_validate_xml !== false) {
          match = validateXml(match);
        }

        return createCodePre(match, 'xml');
      });
    }

    /**
     * Create a shortcode pre. This differs from the code pre as it is still contenteditable
     * @param {String} data
     * @param {String} tag
     */
    function createShortcodePre(data, tag) {
      // decode data before re-encoding
      data = ed.dom.decode(data);

      // replace newlines with linebreaks
      data = data.replace(/[\n\r]/gi, '<br />');

      return ed.dom.createHTML(tag || 'pre', {
        'data-mce-code': 'shortcode',
        'data-mce-type': 'shortcode'
      }, ed.dom.encode(data));
    }

    /**
     * Create a code pre. This pre is not contenteditable by the editor, and plaintext-only
     * @param {String} data
     * @param {String} type
     * @param {String} tag
     */
    function createCodePre(data, type, tag) {
      // "protect" code if we are not using code blocks
      if (!code_blocks) {
        // convert linebreaks to newlines
        data = data.replace(/<br[^>]*?>/gi, '\n');

        // create placeholder span
        return ed.dom.createHTML('img', {
          src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'data-mce-resize': 'false',
          'data-mce-code': type || 'script',
          'data-mce-type': 'placeholder',
          'data-mce-value': escape(data)
        });
      }

      return ed.dom.createHTML(tag || 'pre', {
        'data-mce-code': type || 'script'
      }, ed.dom.encode(data));
    }

    function handleEnterInPre(ed, node, before) {
      var parents = ed.dom.getParents(node, blockElements.join(','));

      // set defualt content and get the element to use
      var newBlockName = ed.settings.forced_root_block || 'p';

      // reset if force_block_newlines is false (linebreak on enter)
      if (ed.settings.force_block_newlines === false) {
        newBlockName = 'br';
      }

      // get the first block in the collection
      var block = parents.shift();

      // skip if it is the body
      if (block === ed.getBody()) {
        return;
      }

      // create element
      var elm = ed.dom.create(newBlockName, {}, '\u00a0');

      // insert after parent element
      if (before) {
        block.parentNode.insertBefore(elm, block);
      } else {
        ed.dom.insertAfter(elm, block);
      }

      var rng = ed.selection.getRng();

      rng.setStart(elm, 0);
      rng.setEnd(elm, 0);

      ed.selection.setRng(rng);
      ed.selection.scrollIntoView(elm);
    }

    ed.onKeyDown.add(function (ed, e) {
      var node;

      if (e.keyCode == VK.ENTER) {
        node = ed.selection.getNode();

        // override enter key behaviour in shortcode pre blocks
        if (node.nodeName === 'PRE' && node.getAttribute('data-mce-code') === 'shortcode') {
          if (!e.shiftKey) {
            ed.execCommand("InsertLineBreak", false, e);
            e.preventDefault();
          }

          return;
        }

        if (node.nodeName === 'SPAN' && node.getAttribute('data-mce-code')) {
          handleEnterInPre(ed, node);
          e.preventDefault();
        }
      }

      if (e.keyCode == VK.UP && e.altKey) {
        node = ed.selection.getNode();

        if (node.nodeName == 'PRE') {
          handleEnterInPre(ed, node, true);
          e.preventDefault();
        }
      }

      // Check for tab but not ctrl/cmd+tab since it switches browser tabs
      if (e.keyCode == 9 && !VK.metaKeyPressed(e)) {
        node = ed.selection.getNode();

        if (node.nodeName === 'PRE' && node.getAttribute('data-mce-code')) {
          ed.selection.setContent('\t', {
            no_events: true
          });
          e.preventDefault();
        }
      }

      if (e.keyCode === VK.BACKSPACE || e.keyCode === VK.DELETE) {
        node = ed.selection.getNode();

        if (node.nodeName === 'SPAN' && node.getAttribute('data-mce-code') && node.getAttribute('data-mce-type') === 'placeholder') {
          ed.undoManager.add();

          ed.dom.remove(node);
          e.preventDefault();
        }
      }
    });

    ed.onPreInit.add(function () {
      function isCodePlaceholder(node) {
        return node.nodeName === 'SPAN' && node.getAttribute('data-mce-code') && node.getAttribute('data-mce-type') == 'placeholder';
      }

      ed.dom.bind(ed.getDoc(), 'keyup click', function (e) {
        var node = e.target,
          sel = ed.selection.getNode();

        ed.dom.removeClass(ed.dom.select('.mce-item-selected'), 'mce-item-selected');

        // edge case where forced_root_block:false
        if (node === ed.getBody() && isCodePlaceholder(sel)) {
          if (sel.parentNode === node && !sel.nextSibling) {
            ed.dom.insertAfter(ed.dom.create('br', {
              'data-mce-bogus': 1
            }), sel);
          }

          return;
        }

        if (isCodePlaceholder(node)) {
          e.preventDefault();
          e.stopImmediatePropagation();

          ed.selection.select(node);

          // add a slight delay before adding selected class to avoid it being removed by the keyup event
          window.setTimeout(function () {
            ed.dom.addClass(node, 'mce-item-selected');
          }, 10);

          e.preventDefault();
        }
      });

      var ctrl = ed.controlManager.get('formatselect');

      if (ctrl) {
        each(['script', 'style', 'php', 'shortcode', 'xml'], function (key) {
          // control element title
          var title = ed.getLang('code.' + key, key);

          if (key === 'shortcode' && ed.settings.code_protect_shortcode) {
            ctrl.add(title, key, {
              class: 'mce-code-' + key
            });

            ed.formatter.register('shortcode', {
              block: 'pre',
              attributes: {
                'data-mce-code': 'shortcode'
              }
            });

            return true;
          }

          // map settings value to simplified key
          if (key === 'xml') {
            ed.settings.code_allow_xml = !!ed.settings.code_allow_custom_xml;
          }

          if (ed.getParam('code_allow_' + key) && code_blocks) {
            ctrl.add(title, key, {
              class: 'mce-code-' + key
            });

            ed.formatter.register(key, {
              block: 'pre',
              attributes: {
                'data-mce-code': key
              },
              onformat: function (elm, fmt, vars) {
                // replace linebreaks with newlines
                each(ed.dom.select('br', elm), function (br) {
                  ed.dom.replace(ed.dom.doc.createTextNode('\n'), br);
                });
              }
            });
          }
        });
      }

      // store block elements from schema map
      each(ed.schema.getBlockElements(), function (block, blockName) {
        blockElements.push(blockName);
      });

      each(ed.schema.getTextInlineElements(), function (inline, name) {
        inlineElements.push(name);
      });

      if (ed.settings.code_protect_shortcode) {
        ed.textpattern.addPattern({
          start: '{',
          end: '}',
          cmd: 'InsertShortCode',
          remove: true
        });

        ed.textpattern.addPattern({
          start: ' {',
          end: '}',
          format: 'inline-shortcode',
          remove: false
        });
      }

      ed.formatter.register('inline-shortcode', {
        inline: 'span',
        attributes: {
          'data-mce-code': 'shortcode'
        }
      });

      // remove paragraph parent of a pre block
      ed.selection.onSetContent.add(function (sel, o) {
        each(ed.dom.select('pre[data-mce-code]', ed.getBody()), function (elm) {
          var p = ed.dom.getParent(elm, 'p');

          if (p && p.childNodes.length === 1) {
            ed.dom.remove(p, 1);
          }
        });
      });

      // Convert script elements to span placeholder
      ed.parser.addNodeFilter('script,style', function (nodes) {
        var i = nodes.length,
          node;

        while (i--) {
          var node = nodes[i];

          // remove any code spans that are added to json-like syntax in code blocks
          if (node.firstChild) {
            node.firstChild.value = node.firstChild.value.replace(/<span([^>]+)>([\s\S]+?)<\/span>/gi, function (match, attr, content) {
              if (attr.indexOf('data-mce-code') === -1) {
                return match;
              }

              return ed.dom.decode(content);
            });
          }

          if (!code_blocks) {
            var value = '';

            if (node.firstChild) {
              value = tinymce.trim(node.firstChild.value);
            }

            var placeholder = Node.create('img', {
              src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
              'data-mce-code': node.name,
              'data-mce-type': 'placeholder',
              'data-mce-resize': 'false',
              title: ed.dom.encode(value)
            });

            // eslint-disable-next-line no-loop-func
            each(node.attributes, function (attr) {
              placeholder.attr('data-mce-p-' + attr.name, attr.value);
            });

            if (value) {
              placeholder.attr('data-mce-value', escape(value));

              //var text = createTextNode('<!--mce:protected ' + escape(value) + '-->')
              //placeholder.append(text);
            }

            node.replace(placeholder);

            continue;
          }

          // serialize to string
          value = new Serializer({
            validate: false
          }).serialize(node);

          // trim
          value = tinymce.trim(value);

          var pre = new Node('pre', 1);

          pre.attr({
            'data-mce-code': node.name
          });

          var text = createTextNode(value, false);
          pre.append(text);

          node.replace(pre);
        }
      });

      ed.parser.addAttributeFilter('data-mce-code', function (nodes, name) {
        var i = nodes.length,
          node, parent;

        function isBody(parent) {
          return parent.name === 'body';
        }

        function isValidCode(type) {
          return type === 'shortcode' || type === 'php';
        }

        function isBlockNode(node) {
          return tinymce.inArray(blockElements, node.name) != -1;
        }

        function isInlineTextNode(node) {
          return tinymce.inArray(inlineElements, node.name) != -1;
        }

        function isInlineNode(node) {
          if (node.name != 'span') {
            return false;
          }

          if (node.next && (node.next.type == '#text' || !isBlockNode(node.next))) {
            return true;
          }

          if (node.prev && (node.prev.type == '#text' || !isBlockNode(node.prev))) {
            return true;
          }

          if (node.parent && !isBlockNode(node.parent)) {
            return true;
          }

          return false;
        }

        while (i--) {
          node = nodes[i], parent = node.parent;

          // don't process placeholders
          if (node.attr('data-mce-type') == 'placeholder') {
            continue;
          }

          if (!isValidCode(node.attr(name))) {
            continue;
          }

          var value = node.firstChild.value;

          // replace linebreaks with newlines
          if (value) {
            node.firstChild.value = value.replace(/<br[\s\/]*>/g, '\n');
          }

          if (parent) {
            // don't process shortcode in code blocks
            if (parent.attr(name)) {
              node.unwrap();
              continue;
            }

            // rename shortcode blocks to <pre>
            if (isBody(parent) || isOnlyChild(node) || !isInlineNode(node)) {
              node.name = 'pre';

              // reset if node parent is inline and not a block node, eg: <strong>{var}</strong>
              if (node.parent && isInlineTextNode(node.parent)) {
                node.name = 'span';
              }
            }

            // add whitespace after the span so a cursor can be set
            if (node.name == 'span' && node === parent.lastChild) {
              var nbsp = createTextNode('\u00a0');
              parent.append(nbsp);
            }
          }
        }
      });

      ed.serializer.addAttributeFilter('data-mce-code', function (nodes, name) {
        var i = nodes.length,
          node, child;

        function isXmlNode(node) {
          return !/(shortcode|php)/.test(node.attr('data-mce-code'));
        }

        while (i--) {
          var root_block = false;

          node = nodes[i];

          // get the code block type, eg: script, shortcode, style, php
          var type = node.attr(name);

          if (node.name === 'img') {
            var elm = new Node(type, 1);

            for (var key in node.attributes.map) {
              var val = node.attributes.map[key];

              if (key.indexOf('data-mce-p-') !== -1) {
                key = key.substr(11);
              } else {
                val = null;
              }

              elm.attr(key, val);
            }

            var value = node.attr('data-mce-value');

            if (value) {
              var text = createTextNode(unescape(value));

              // only use text node if shortcode or php
              if (type == 'php' || type == 'shortcode') {
                elm = text;
              } else {
                elm.append(text);
              }
            }

            node.replace(elm);

            continue;
          }

          // pre node is empty, remove
          if (node.isEmpty()) {
            node.remove();
          }

          // skip xml
          if (type === 'xml') {
            continue;
          }

          // set the root block type for script and style tags so the parser does the work wrapping free text
          if (type === 'script' || type === 'style') {
            root_block = type;
          }

          var child = node.firstChild,
            newNode = node.clone(true),
            text = '';

          if (child) {
            do {
              if (isXmlNode(node)) {
                var value = child.name == 'br' ? '\n' : child.value;

                if (value) {
                  text += value;
                }
              }
            } while ((child = child.next));
          }

          if (text) {
            newNode.empty();

            var parser = new DomParser({
              validate: false
            });

            // validate attributes of script and style tags
            if (type === 'script' || type === 'style') {
              parser.addNodeFilter(type, function (items, name) {
                var n = items.length;

                while (n--) {
                  var item = items[n];

                  // eslint-disable-next-line no-loop-func
                  each(item.attributes, function (attr) {
                    if (!attr) {
                      return true;
                    }

                    // allow data-* attributes
                    if (attr.name.indexOf('data-') === 0 && attr.name.indexOf('data-mce-') === -1) {
                      return true;
                    }

                    if (ed.schema.isValid(name, attr.name) === false) {
                      item.attr(attr.name, null);
                    }
                  });
                }
              });
            }

            // parse text and process
            var fragment = parser.parse(text, {
              forced_root_block: root_block
            });
            // append fragment to <pre> clone
            newNode.append(fragment);
          }

          node.replace(newNode);

          if (type === 'shortcode' && newNode.name === 'pre') {
            // append newline to the end of shortcode blocks
            var newline = createTextNode('\n');
            newNode.append(newline);

            // unwrap to text as further processing is not needed
            newNode.unwrap();
          }
        }
      });

      ed.onPaste.addToTop(function (ed, e) {
        var clipboardData = e.clipboardData || window.clipboardData || null;

        if (!clipboardData) {
          return;
        }

        var text = clipboardData.getData('text/plain') || clipboardData.getData('Text') || clipboardData.getData('text') || '';
        var value = '';

        // trim text
        text = tinymce.trim(text);

        if (text) {
          var node = ed.selection.getNode();

          // don't process into PRE tags
          if (node && node.nodeName === 'PRE') {
            return;
          }

          value = processOnInsert(text, node);

          // update with processed text
          if (value !== text) {
            e.preventDefault();
            ed.execCommand('mceInsertContent', false, value);
          }
        }
      });

      /*ed.onNodeChange.add(function (ed, cm, node) {
        var toolbar = DOM.get(ed.id + '_toolbar');
        
        if (node && node.hasAttribute('data-mce-code')) {
          if (toolbar) {
            DOM.addClass(toolbar, 'mceDisabled');
          }
        } else {
          DOM.removeClass(toolbar, 'mceDisabled');
        }
      });*/

      ed.onContextMenu.addToTop(function (ed, e) {
        var node = ed.selection.getNode();

        if (node && node.hasAttribute('data-mce-code')) {
          return false;
        }
      });
    });

    ed.onInit.add(function () {
      // Display "script" instead of "pre" in element path
      if (ed.theme && ed.theme.onResolveName) {
        ed.theme.onResolveName.add(function (theme, o) {
          var node = o.node;

          if (node.getAttribute('data-mce-code')) {
            o.name = node.getAttribute('data-mce-code');
          }
        });
      }
    });

    ed.onBeforeSetContent.addToTop(function (ed, o) {
      if (ed.settings.code_protect_shortcode) {
        if (o.content.indexOf('data-mce-code="shortcode"') === -1) {
          o.content = processShortcode(o.content);
        }
      }

      if (ed.settings.code_allow_custom_xml) {
        // only process content on "load"
        if (o.content && o.load) {
          o.content = processXML(o.content);
        }
      }

      // test for PHP, Script or Style
      if (/<(\?|script|style)/.test(o.content)) {
        // Remove javascript if not enabled
        if (!ed.settings.code_allow_script) {
          o.content = o.content.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
        }

        if (!ed.settings.code_allow_style) {
          o.content = o.content.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
        }

        o.content = processPhp(o.content);
      }
    });

    ed.onPostProcess.add(function (ed, o) {
      if (o.get) {
        // Process converted php
        if (/(data-mce-php|__php_start__)/.test(o.content)) {
          // attribute value
          o.content = o.content.replace(/({source})?__php_start__(.*?)__php_end__/g, function (match, pre, code) {
            return (pre || '') + '<?php' + ed.dom.decode(code) + '?>';
          });

          // textarea
          o.content = o.content.replace(/<textarea([^>]*)>([\s\S]*?)<\/textarea>/gi, function (a, b, c) {
            if (/&lt;\?php/.test(c)) {
              c = ed.dom.decode(c);
            }
            return '<textarea' + b + '>' + c + '</textarea>';
          });

          // as attribute
          o.content = o.content.replace(/data-mce-php="([^"]+?)"/g, function (a, b) {
            return '<?php' + ed.dom.decode(b) + '?>';
          });
        }

        // shortcode content will be encoded as text, so decode
        if (ed.settings.code_protect_shortcode) {

          o.content = o.content.replace(/\{([\s\S]+?)\}/gi, function (match, content) {
            return '{' + ed.dom.decode(content) + '}';
          });

          // sourcerer with encoded content
          o.content = o.content.replace(/\{source([^\}]*?)\}([\s\S]+?)\{\/source\}/gi, function (match, start, content) {
            return '{source' + start + '}' + ed.dom.decode(content) + '{/source}';
          });

          // other shotcode tags
          o.content = o.content.replace(/\{([\w-]+)(.*?)\}([\s\S]+)\{\/\1\}/gi, function (match, start, attr, content) {
            return '{' + start + attr + '}' + ed.dom.decode(content) + '{/' + start + '}';
          });
        }

        // decode code snippets
        o.content = o.content.replace(/<(pre|span)([^>]+?)>([\s\S]*?)<\/\1>/gi, function (match, tag, attr, content) {
          // not the droids etc.
          if (attr.indexOf('data-mce-code') === -1) {
            return match;
          }

          // trim content
          content = tinymce.trim(content);

          // get element from match
          var node = ed.dom.create('div', {}, match), elm = node.firstChild, type = elm.getAttribute('data-mce-code');

          // replace linebreaks with newline in some blocks
          if (type != 'script') {
            content = content.replace(/<br[^>]*?>/gi, '\n');
          }

          // decode content
          content = ed.dom.decode(content);

          // remove and replace <?php?> tags
          if (type == 'php') {
            content = content.replace(/<\?(php)?/gi, '').replace(/\?>/g, '');
            content = '<?php\n' + tinymce.trim(content) + '\n?>';
          }

          return content;
        });

        // decode protected code
        o.content = o.content.replace(/<!--mce:protected ([\s\S]+?)-->/gi, function (match, content) {
          return unescape(content);
        });
      }
    });
  });
})();