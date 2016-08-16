/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each, extend = tinymce.extend, Node = tinymce.html.Node;

    function split(str, delim) {
        return str.split(delim || ',');
    }

    var fontIconRe = /<([a-z0-9]+)([^>]+)class="([^"]*)(glyph|uk-)?(fa|icon)-([\w-]+)([^"]*)"([^>]*)>(&nbsp;|\u00a0)?<\/\1>/gi;

    var emptyRx = /<(ol|ul|sub|sup|blockquote|span|font|a|table|tbody|tr|strong|em|b|i)\b([^>]+)><\/\1>/gi;
    var paddedRx = /<(p|h1|h2|h3|h4|h5|h6|pre|div|address|caption)\b([^>]+)>(&nbsp;|\u00a0)<\/\1>/gi;

    tinymce.create('tinymce.plugins.CleanupPlugin', {
        init: function (ed, url) {
            var self = this;
            this.editor = ed;

            // set validate value to verify_html value
            if (ed.settings.verify_html === false) {
                ed.settings.validate = false;
            }

            ed.onPreInit.add(function () {

                if (ed.settings.validate) {
                    // add support for "bootstrap" icons
                    var elements = ed.schema.elements;

                    if (!ed.getParam('pad_empty_tags', true)) {
                        each(elements, function(v, k) {
                            if (v.paddEmpty) {
                                v.paddEmpty = false;
                            }
                        });
                    }

                    if (!ed.getParam('table_pad_empty_cells', true)) {
                        elements['th'].paddEmpty = false;
                        elements['td'].paddEmpty = false;
                    }
                }

                // only if "Cleanup HTML" enabled
                if (ed.settings.validate) {
                    // Invalid Attribute Values cleanup
                    var invalidAttribValue = ed.getParam('invalid_attribute_values', '');

                    if (invalidAttribValue) {
                        function replaceAttributeValue(nodes, name, re) {
                            var i = nodes.length, node;

                            while (i--) {
                                node = nodes[i];

                                // remove attribute if it matches expression
                                if (new RegExp(re).test(node.attr(name))) {
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
                            var re, matches = /([a-z\*]+)\[([a-z]+)([\^\$~]?=)["']([^"']+)["']\]/i.exec(item);

                            if (matches && matches.length == 5) {
                                var tag = matches[1], attrib = matches[2], expr = matches[3], value = matches[4];

                                switch (expr) {
                                    default:
                                    case '=':
                                        re = '(' + value + ')';
                                        break;
                                    case '!=':
                                        re = '(^' + value + ')';
                                        break;
                                    case '^=':
                                        re = '^(' + value + ')';
                                        break;
                                    case '$=':
                                        re = '(' + value + ')$';
                                        break;
                                    case '~=':
                                        re = value;
                                        break;
                                }
                                if (re) {
                                    // all tags
                                    if (tag == '*') {
                                        ed.parser.addAttributeFilter(attrib, function (nodes, name) {
                                            replaceAttributeValue(nodes, name, re);
                                        });
                                        // specific tag
                                    } else {
                                        ed.parser.addNodeFilter(tag, function (nodes, name) {
                                            replaceAttributeValue(nodes, attrib, re);
                                        });
                                    }
                                }
                            }
                        });
                    }
                } else {
                    ed.serializer.addNodeFilter(ed.settings.invalid_elements, function (nodes, name) {
                        var i = nodes.length, node;

                        if (ed.schema.isValidChild('body', name)) {
                            while (i--) {
                                node = nodes[i];
                                node.remove();
                            }
                        }
                    });

                    ed.parser.addNodeFilter(ed.settings.invalid_elements, function (nodes, name) {
                        var i = nodes.length, node;

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
                }

                // try and keep empty a tags that are not anchors, process bootstrap icons
                ed.parser.addNodeFilter('a,i,span', function (nodes, name) {
                    var i = nodes.length, node, cls;

                    while (i--) {
                        node = nodes[i], cls = node.attr('class');
                        // padd it with a space if its empty and has a class, eg: <i class="icon-ok"></i>
                        if (cls && !node.firstChild) {
                            node.attr('data-mce-bootstrap', '1');
                            node.append(new Node('#text', '3')).value = '\u00a0';
                        }
                    }
                });
                // cleanup padded "bootstrap" tags
                ed.serializer.addAttributeFilter('data-mce-bootstrap', function (nodes, name) {
                    var i = nodes.length, node, fc;

                    while (i--) {
                        node = nodes[i], fc = node.firstChild;
                        node.attr('data-mce-bootstrap', null);

                        if (fc && (fc.value === '\u00a0' || fc.value === '&nbsp;')) {
                            fc.remove();
                        }
                    }
                });

                // disable onclick etc.
                ed.parser.addAttributeFilter('onclick,ondblclick', function (nodes, name) {
                    var i = nodes.length, node;

                    while (i--) {
                        node = nodes[i];

                        node.attr('data-mce-' + name, node.attr(name));
                        node.attr(name, null);
                    }
                });

                ed.serializer.addAttributeFilter('data-mce-onclick,data-mce-ondblclick', function (nodes, name) {
                    var i = nodes.length, node, k;

                    while (i--) {
                        node = nodes[i], k = name.replace('data-mce-', '');

                        node.attr(k, node.attr(name));
                        node.attr(name, null);
                    }
                });

                ed.serializer.addNodeFilter('br', function (nodes, name) {
                    var i = nodes.length, node, k;

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
                    var i = nodes.length, node, k;

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
            if (ed.settings.validate === false && ed.settings.verify_html === false) {
                ed.addCommand('mceCleanup', function () {
                    var s = ed.settings, se = ed.selection, bm;
                    bm = se.getBookmark();

                    var content = ed.getContent({
                        cleanup: true
                    });

                    var schema = new tinymce.html.Schema({
                        validate: true,
                        verify_html: true,
                        valid_styles: s.valid_styles,
                        valid_children: s.valid_children,
                        custom_elements: s.custom_elements,
                        extended_valid_elements: s.extended_valid_elements
                    });
                    content = new tinymce.html.Serializer({
                        validate: true
                    }, schema).serialize(new tinymce.html.DomParser({
                        validate: true
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
                o.content = self.convertFromGeshi(o.content);

                // only if "Cleanup HTML" enabled
                if (ed.settings.validate) {
                    // remove attributes
                    if (ed.getParam('invalid_attributes')) {
                        var s = ed.getParam('invalid_attributes', '');

                        o.content = o.content.replace(new RegExp('<([^>]+)(' + s.replace(/,/g, '|') + ')="([^"]+)"([^>]*)>', 'gi'), '<$1$4>');
                    }
                }

                // pad bootstrap icons
                o.content = o.content.replace(fontIconRe, '<$1$2class="$3$4$5-$6$7"$8>&nbsp;</$1>');

                // padd some empty tags
                o.content = o.content.replace(/<(a|i|span)([^>]+)><\/\1>/gi, '<$1$2>&nbsp;</$1>');
            });

            // Cleanup callback
            ed.onPostProcess.add(function (ed, o) {
                if (o.set) {
                    // Geshi
                    o.content = self.convertFromGeshi(o.content);
                }
                if (o.get) {
                    // Geshi
                    o.content = self.convertToGeshi(o.content);

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

                    // clean bootstrap icons
                    o.content = o.content.replace(fontIconRe, '<$1$2class="$3$4$5-$6$7"$8></$1>');

                    // clean empty tags
                    o.content = o.content.replace(/<(a|i|span)([^>]+)>(&nbsp;|\u00a0)<\/\1>/gi, '<$1$2></$1>');

                    // remove padding on div (legacy)
                    if (ed.getParam('remove_div_padding')) {
                        o.content = o.content.replace(/<div([^>]*)>(&nbsp;|\u00a0)<\/div>/g, '<div$1></div>');
                    }

                    // remove padding on everything
                    if (ed.getParam('pad_empty_tags', true) === false) {
                        o.content = o.content.replace(paddedRx, '<$1$2></$1>');
                    }
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
        },
        convertFromGeshi: function (h) {
            h = h.replace(/<pre xml:lang="([^"]+)"([^>]*)>(.*?)<\/pre>/g, function (a, b, c, d) {
                var attr = '';

                if (c && /\w/.test(c)) {
                    attr = c.split(' ').join(' data-geshi-');
                }

                return '<pre data-geshi-lang="' + b + '"' + attr + '>' + d + '</pre>';
            });

            return h;
        },
        convertToGeshi: function (h) {
            h = h.replace(/<pre([^>]+)data-geshi-lang="([^"]+)"([^>]*)>(.*?)<\/pre>/g, function (a, b, c, d, e) {
                var s = b + d;
                s = s.replace(/data-geshi-/gi, '').replace(/\s+/g, ' ').replace(/\s$/, '');

                return '<pre xml:lang="' + c + '"' + s + '>' + e + '</pre>';
            });

            return h;
        },
        getInfo: function () {
            return {
                longname: 'Cleanup',
                author: 'Ryan Demmer',
                authorurl: 'http://www.joomlacontenteditor.net',
                infourl: 'http://www.joomlacontenteditor.net',
                version: '@@version@@'
            };
        }
    });

    // Register plugin
    tinymce.PluginManager.add('cleanup', tinymce.plugins.CleanupPlugin);
})();
