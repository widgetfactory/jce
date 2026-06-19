import split from './src/utils/split';
import { TAGS, PADDED_RX } from './src/constants';
import createPadding from './src/filters/padding';
import { processAttributes } from './src/filters/processAttributes';
import { convertFromGeshi, convertToGeshi } from './src/geshi';

var each = ibis.each;
var Node = ibis.html.Node;

ibis.PluginManager.add('cleanup', function (ed, url) {
  if (ed.settings.verify_html === false) {
    ed.settings.validate = false;
  }

  var padding = createPadding(Node);

  var eventAttrs = [
    'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave',
    'onkeydown', 'onkeypress', 'onkeyup',
    'onload', 'onunload', 'onabort', 'onerror', 'onresize', 'onscroll', 'onselect',
    'onchange', 'onsubmit', 'onreset', 'onfocus', 'onblur', 'oninput', 'oninvalid',
    'ondragstart', 'ondragenter', 'ondragend', 'ondragleave', 'ondragover', 'ondrop',
    'oncontextmenu', 'onwheel', 'oncopy', 'oncut', 'onpaste',
    'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange', 'onseeked', 'onseeking',
    'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange', 'onwaiting',
    'oncanplay', 'oncanplaythrough', 'ondurationchange', 'onemptied', 'onended',
    'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onmousewheel',
    'onshow', 'onsort', 'ontoggle', 'onclose', 'oncuechange'
  ];

  ed.onPreInit.add(function () {
    ed.serializer.addAttributeFilter('data-mce-caret', function (nodes) {
      var i = nodes.length;

      while (i--) {
        nodes[i].remove();
      }
    });

    if (ed.settings.remove_trailing_brs === false) {
      ed.serializer.addAttributeFilter('data-mce-bogus', function (nodes) {
        var i = nodes.length;
        var node, textNode;

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

    ed.serializer.addAttributeFilter('data-mce-tmp', function (nodes, name) {
      var i = nodes.length;
      while (i--) {
        nodes[i].attr('data-mce-tmp', null);
      }
    });

    ed.parser.addAttributeFilter('data-mce-tmp', function (nodes, name) {
      var i = nodes.length;
      while (i--) {
        nodes[i].attr('data-mce-tmp', null);
      }
    });

    if (ed.settings.allow_event_attributes) {
      var dataEventAttrs = tinymce.map(eventAttrs, function (name) {
        return 'data-mce-' + name;
      });

      ed.serializer.addAttributeFilter(dataEventAttrs, function (nodes, name) {
        var i = nodes.length;

        while (i--) {
          nodes[i].attr(name.slice(9), nodes[i].attr(name));
          nodes[i].attr(name, null);
        }
      });
    }

    function removeEventAttributes() {
      each(ed.schema.elements, function (elm) {
        if (!elm.attributesOrder || elm.attributesOrder.length === 0) {
          return true;
        }

        each(elm.attributes, function (obj, name) {
          if (name.indexOf('on') === 0) {
            delete elm.attributes[name];
            elm.attributesOrder.splice(ibis.inArray(elm, elm.attributesOrder, name), 1);
          }
        });
      });
    }

    if (ed.settings.verify_html !== false) {
      if (!ed.settings.allow_event_attributes) {
        removeEventAttributes();
      }

      var elements = ed.schema.elements;

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

      each(elements, function (v, k) {
        if (k.indexOf('mce:') === 0) {
          return true;
        }

        if (ibis.inArray(TAGS, k) === -1) {
          ed.schema.addCustomElements(k);
        }
      });
    }

    ed.parser.addNodeFilter('a,i,span,li', function (nodes, name) {
      padding.ensureEmptyInlineNodes(nodes, name);
    });

    ed.serializer.addAttributeFilter('data-mce-empty', function (nodes) {
      padding.cleanupEmptyInlineNodes(nodes);
    });
  });

  if (ed.settings.verify_html === false) {
    ed.addCommand('mceCleanup', function () {
      var s = ed.settings;
      var se = ed.selection;
      var bm = se.getBookmark();

      var content = ed.getContent({ cleanup: true });

      console.log(content);

      s.verify_html = true;

      var schema = new ibis.html.Schema(s);

      content = new ibis.html.Serializer({ validate: true }, schema)
        .serialize(
          new ibis.html.DomParser({
            validate: true,
            allow_event_attributes: !!ed.settings.allow_event_attributes
          }, schema).parse(content)
        );

      ed.setContent(content, { cleanup: true });
      se.moveToBookmark(bm);
    });
  }

  ed.onBeforeSetContent.add(function (ed, o) {
    o.content = o.content.replace(/^<br>/, '');
    o.content = convertFromGeshi(o.content);
    o.content = padding.paddEmptyTags(o.content);

    o.content = processAttributes(ed, o.content);

    if (ed.settings.allow_event_attributes) {
      var doc = document.implementation.createHTMLDocument('');
      var div = doc.createElement('div');
      div.innerHTML = o.content;

      tinymce.each(div.querySelectorAll('*'), function (node) {
        var attrs = node.attributes;
        for (var i = attrs.length - 1; i >= 0; i--) {
          var name = attrs[i].name;

          if (name.indexOf('on') === 0) {
            node.setAttribute('data-mce-' + name, attrs[i].value);
            node.removeAttribute(name);
          }

        }
      });

      o.content = div.innerHTML;
    }
  });

  ed.onPostProcess.add(function (ed, o) {
    if (o.set) {
      o.content = convertFromGeshi(o.content);
    }

    if (o.get) {
      o.content = convertToGeshi(o.content);

      o.content = o.content.replace(/<a([^>]*)class="jce(box|popup|lightbox|tooltip|_tooltip)"([^>]*)><\/a>/gi, '');
      o.content = o.content.replace(/<span class="jce(box|popup|lightbox|tooltip|_tooltip)">(.*?)<\/span>/gi, '$2');
      o.content = o.content.replace(/_mce_(src|href|style|coords|shape)="([^"]+)"\s*?/gi, '');

      if (ed.settings.validate === false) {
        o.content = o.content.replace(/<body([^>]*)>([\s\S]*)<\/body>/, '$2');

        if (!ed.getParam('remove_tag_padding')) {
          o.content = o.content.replace(/<(p|h1|h2|h3|h4|h5|h6|th|td|pre|div|address|caption)\b([^>]*)><\/\1>/gi, '<$1$2>&nbsp;</$1>');
        }
      }

      o.content = o.content.replace(/<(a|i|span)([^>]+)>(&nbsp;|\u00a0)<\/\1>/gi, function (match, tag, attribs) {
        attribs = attribs.replace('data-mce-empty="1"', '');
        return '<' + tag + ' ' + ibis.trim(attribs) + '></' + tag + '>';
      });

      o.content = o.content.replace(/<li data-mce-empty="1">(&nbsp;|\u00a0)<\/li>/gi, '<li></li>');

      if (ed.getParam('remove_div_padding')) {
        o.content = o.content.replace(/<div([^>]*)>(&nbsp;|\u00a0)<\/div>/g, '<div$1></div>');
      }

      if (ed.getParam('pad_empty_tags', true) === false) {
        o.content = o.content.replace(PADDED_RX, '<$1$2></$1>');
      }

      if (ed.getParam('keep_nbsp', true) && ed.settings.entity_encoding === "raw") {
        o.content = o.content.replace(/\u00a0/g, '&nbsp;');
      }

      o.content = o.content.replace(/(uk|v|ng|data)-([\w-]+)=""(\s|>)/gi, '$1-$2$3');

      if (ed.settings.padd_empty_editor) {
        o.content = o.content.replace(/^(<div>(&nbsp;|&#160;|\s|\u00a0|)<\/div>[\r\n]*|<br(\s*\/)?>[\r\n]*)$/, '');
      }

      o.content = o.content.replace(/<hr(.*)class="system-pagebreak"(.*?)\/?>/gi, '<hr$1class="system-pagebreak"$2/>');
      o.content = o.content.replace(/<hr id="system-readmore"(.*?)>/gi, '<hr id="system-readmore" />');
    }
  });

  ed.onSaveContent.add(function (ed, o) {
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

  ed.addButton('cleanup', {
    title: 'advanced.cleanup_desc',
    cmd: 'mceCleanup'
  });

  this.paddEmptyTags = padding.paddEmptyTags;
});