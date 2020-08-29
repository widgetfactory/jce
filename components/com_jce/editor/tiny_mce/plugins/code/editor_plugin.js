/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved.
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each,
        JSON = tinymce.util.JSON,
        Node = tinymce.html.Node,
        VK = tinymce.VK,
        BACKSPACE = VK.BACKSPACE,
        DELETE = VK.DELETE;

    function clean(s) {
        // remove javascript comments
        s = s.replace(/^(\/\/ <!\[CDATA\[)/gi, '');
        s = s.replace(/(\n\/\/ \]\]>)$/g, '');

        // remove css comments
        s = s.replace(/^(<!--\n)/g, '');
        s = s.replace(/(\n-->)$/g, '');

        //s = s.replace(/(<!--\[CDATA\[|\]\]-->)/gi, '\n');
        //s = s.replace(/^[\r\n]*|[\r\n]*$/g, '');
        //s = s.replace(/^\s*(\/\/\s*<!--|\/\/\s*<!\[CDATA\[|<!--|<!\[CDATA\[)[\r\n]*/gi, '');
        //s = s.replace(/\s*(\/\/\s*\]\]>|\/\/\s*-->|\]\]>|-->|\]\]-->)\s*$/g, '');

        return s;
    }

    tinymce.create('tinymce.plugins.CodePlugin', {
        init: function (ed, url) {
            var self = this;

            this.editor = ed;
            this.url = url;

            function isCode(n) {
                return ed.dom.is(n, '.mce-item-script, .mce-item-style, .mce-item-php, .mcePhp, style[data-mce-type="text/css"]');
            }

            ed.addCommand('InsertShortCode', function (ui, html) {
                if (ed.settings.code_protect_shortcode) {
                    html = processShortcode(html, 'pre');

                    if (tinymce.is(html)) {
                        ed.execCommand('mceReplaceContent', false, html);
                    }
                }

                return false;
            });

            ed.onPreInit.add(function () {
                if (ed.plugins.textpattern) {
                    ed.plugins.textpattern.addPattern({
                        start: '{',
                        end: '}',
                        cmd: 'InsertShortCode',
                        remove: true
                    });
                }
            });

            function processShortcode(html, tagName) {
                var rng = ed.selection.getRng();

                if (!tagName) {
                    tagName = 'pre';

                    // process mixed code as inline using <code> tags
                    if (html.charAt(0) !== '{' || (rng && rng.startOffset > 1)) {
                        tagName = 'code';
                    }
                }

                // skip stuff like {1} etc.
                if (html.charAt(0) == '{' && html.length < 4) {
                    return html;
                }

                return html.replace(/(?:<(?:pre|code|samp)[^>]*>)?(?:\{|\[)([\w-]+)\b([^(\}\])]*?)(?:\}|\])(?:([\s\S]+?)(?:\{|\])\/\1(?:\}|\]))?/g, function (match, tag, attribs, content) {
                    // already encased in <pre>, <code> or <samp> tag
                    if (match.charAt(0) !== '{' && match.charAt(0) !== '[') {
                        return match;
                    }

                    var start = match.charAt(0), end = (start == '[') ? ']' : '}';

                    if (start == '[' && !content) {
                        return match;
                    }

                    // create opening tag, eg: {position}
                    var data = start + tag + attribs + end;

                    // if there is content, there must be a closing tag
                    if (content) {
                        // encode html-like syntax
                        if (/</.test(content)) {
                            content = ed.dom.encode(content);
                        }

                        data += content;

                        // end tag, eg: {/position}
                        data += start + '/' + tag + end;
                    }

                    return '<' + tagName + ' data-mce-shortcode="1">' + data + '</' + tagName + '>';
                });
            }

            ed.onNodeChange.add(function (ed, cm, n, co) {
                ed.dom.removeClass(ed.dom.select('.mce-item-selected'), 'mce-item-selected');

                if (isCode(n)) {
                    ed.dom.addClass(n, 'mce-item-selected');
                }
            });

            ed.onKeyDown.add(function (ed, e) {
                if (e.keyCode === BACKSPACE || e.keyCode === DELETE) {
                    self._removeCode(e);
                }
            });

            ed.onPreInit.add(function () {
                if (ed.settings.content_css !== false) {
                    ed.dom.loadCSS(url + "/css/content.css");
                }

                // allow script URLS, eg: href="javascript:;"
                if (ed.getParam('code_script')) {
                    ed.settings.allow_script_urls = true;
                }

                // Convert script elements to span placeholder
                ed.parser.addNodeFilter('script,style', function (nodes) {
                    for (var i = 0, len = nodes.length; i < len; i++) {
                        self._serializeSpan(nodes[i]);
                    }
                });

                ed.parser.addNodeFilter('noscript', function (nodes) {
                    for (var i = 0, len = nodes.length; i < len; i++) {
                        self._serializeNoScript(nodes[i]);
                    }
                });

                if (ed.settings.code_protect_shortcode) {
                    ed.selection.onBeforeSetContent.add(function (ed, o) {
                        o.content = processShortcode(o.content);
                    });
                }

                // Convert span placeholders to script elements
                ed.serializer.addNodeFilter('div,span,pre,img', function (nodes, name, args) {
                    for (var i = 0, len = nodes.length; i < len; i++) {
                        var node = nodes[i],
                            cls = node.attr('class');

                        if ((name == 'span' || name === 'img') && /mce-item-script/.test(cls)) {
                            self._buildScript(node);
                        }

                        if ((name == 'span' || name === 'img') && /mce-item-style/.test(cls)) {
                            self._buildStyle(node);
                        }

                        if (name == 'div' && node.attr('data-mce-type') == 'noscript') {
                            self._buildNoScript(node);
                        }
                    }
                });

                ed.serializer.addAttributeFilter('data-mce-shortcode', function (nodes, name) {
                    var i = nodes.length, node;

                    while (i--) {
                        node = nodes[i];
                        node.unwrap();
                    }
                });

                /*ed.serializer.addNodeFilter('style', function (nodes, name, args) {
                    var node, value = '';

                    for (var i = 0, len = nodes.length; i < len; i++) {
                        node = nodes[i];

                        node.attr('type', node.attr('data-mce-type') || 'text/css');

                        if (node.firstChild) {
                            value = node.firstChild.value;
                            value = clean(value);

                            node.empty();
                        }

                        var text = new Node('#text', 3);
                        text.raw = true;
                        text.value = tinymce.trim(value);
                        node.append(text);
                    }
                });*/

                if (ed.plugins.clipboard) {
                    ed.onPastePreProcess.add(function (ed, o) {
                        if (ed.settings.preformat_code_on_paste) {
                            o.content = o.content.replace(/<(script|style)([^>]+)>([\s\S]+?)<\/\1>/gi, function (a, b) {
                                a = a.replace(/<br\/?>/gi, '\n');
                                return '<pre>' + ed.dom.encode(a) + '</pre>';
                            });

                            o.content = o.content.replace(/<\?(php)?([\s\S]+?)\?>/gi, function (a, b, c) {
                                a = a.replace(/<br\/?>/gi, '\n');
                                return '<pre>' + ed.dom.encode(a) + '</pre>';
                            });
                        }
                    });
                }
            });

            ed.onInit.add(function () {
                // Display "script" instead of "span" in element path
                if (ed.theme && ed.theme.onResolveName) {
                    ed.theme.onResolveName.add(function (theme, o) {
                        var node = o.node, cls = node.className, name = node.nodeName;

                        if (name === 'SPAN') {
                            if (/mce-item-script/.test(cls)) {
                                o.name = 'script';
                            }

                            if (/mce-item-style/.test(cls)) {
                                o.name = 'style';
                            }

                            if (/mce(-item-php|Php)/.test(cls)) {
                                o.name = 'php';
                            }
                        }

                        if (node.getAttribute('data-mce-shortcode')) {
                            o.name = 'shortcode';
                        }
                    });
                }

                // enter in a pre element results in a new paragraph
                if (ed.settings.code_protect_shortcode) {
                    ed.settings.br_in_pre = false;
                }
            });

            ed.onBeforeSetContent.add(function (ed, o) {

                if (ed.settings.code_protect_shortcode) {
                    o.content = processShortcode(o.content);
                }

                // test for PHP, Script or Style
                if (/<(\?|script|style)/.test(o.content)) {
                    // Remove javascript if not enabled
                    if (!ed.getParam('code_script')) {
                        o.content = o.content.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
                    }

                    if (!ed.getParam('code_style')) {
                        o.content = o.content.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
                    }

                    // Remove PHP if not enabled
                    if (!ed.getParam('code_php')) {
                        o.content = o.content.replace(/<\?(php)?([\s\S]*?)\?>/gi, '');
                    }

                    // don't process further in source code mode
                    if (o.source) {
                        return;
                    }

                    // PHP code within an attribute
                    o.content = o.content.replace(/\="([^"]+?)"/g, function (a, b) {
                        b = b.replace(/<\?(php)?(.+?)\?>/gi, function (x, y, z) {
                            return '{php:start}' + ed.dom.encode(z) + '{php:end}';
                        });

                        return '="' + b + '"';
                    });

                    // PHP code within a textarea
                    if (/<textarea/.test(o.content)) {
                        o.content = o.content.replace(/<textarea([^>]*)>([\s\S]*?)<\/textarea>/gi, function (a, b, c) {
                            c = c.replace(/<\?(php)?(.+?)\?>/gi, function (x, y, z) {
                                return '{php:start}' + ed.dom.encode(z) + '{php:end}';
                            });
                            return '<textarea' + b + '>' + c + '</textarea>';
                        });

                    }

                    // PHP code within an element
                    o.content = o.content.replace(/<([^>]+)<\?(php)?(.+?)\?>([^>]*?)>/gi, function (a, b, c, d, e) {
                        if (b.charAt(b.length) !== ' ') {
                            b += ' ';
                        }
                        return '<' + b + 'data-mce-php="' + d + '" ' + e + '>';
                    });

                    // PHP code other
                    o.content = o.content.replace(/<\?(php)?([\s\S]+?)\?>/gi, '<span class="mcePhp" data-mce-type="php"><!--$2-->\u00a0</span>');

                    // padd empty script tags
                    o.content = o.content.replace(/<script([^>]+)><\/script>/gi, '<script$1>\u00a0</script>');

                    // protect style and script tags from forced_root_block
                    o.content = o.content.replace(/<(script|style)([^>]*)>/gi, function (a, b, c) {
                        if (c.indexOf('data-mce-type') === -1) {
                            if (c.indexOf('type') === -1) {
                                var type = (b === "script") ? "javascript" : "css";
                                c += ' data-mce-type="text/' + type + '"';
                            } else {
                                c = c.replace(/type="([^"]+)"/i, 'data-mce-type="$1"');
                            }
                        }

                        return '<' + b + c + '>';
                    });
                }
            });

            ed.onPostProcess.add(function (ed, o) {
                if (o.get && !o.source) {
                    // Process converted php
                    if (/(mce-item-php|mcePhp|data-mce-php|\{php:start\})/.test(o.content)) {
                        // attribute value
                        o.content = o.content.replace(/\{php:\s?start\}([^\{]+)\{php:\s?end\}/g, function (a, b) {
                            return '<?php' + ed.dom.decode(b) + '?>';
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

                        // other
                        o.content = o.content.replace(/<span class="mcePhp"><!--([\s\S]*?)-->(&nbsp;|\u00a0)?<\/span>/g, function (a, b, c) {
                            return '<?php' + ed.dom.decode(b) + '?>';
                        });
                    }

                    // remove data-mce-type
                    o.content = o.content.replace(/<(script|style)([^>]*)>/gi, function (a, b, c) {
                        c = c.replace(/\s?data-mce-type="[^"]+"/gi, "");

                        return '<' + b + c + '>';
                    });
                }
            });

        },
        _removeCode: function (e) {
            var ed = this.editor,
                s = ed.selection,
                n = s.getNode();

            if (ed.dom.is(n, '.mce-item-script, .mce-item-style, .mce-item-php, .mce-item-php, style[data-mce-type="text/css"]')) {
                ed.undoManager.add();

                ed.dom.remove(n);

                if (e) {
                    e.preventDefault();
                }
            }
        },

        _buildScript: function (n) {
            var self = this,
                ed = this.editor,
                v, node, text, p;

            if (!n.parent)
                return;

            // element text
            /*if (n.firstChild) {
                v = n.firstChild.value;
            }*/
            var code = n.attr('data-mce-code') || '';

            if (code) {
                v = unescape(code);
            }

            p = JSON.parse(n.attr('data-mce-json')) || {};

            p.type = n.attr('data-mce-type') || p.type || 'text/javascript';

            node = new Node('script', 1);

            if (v) {

                v = tinymce.trim(v);

                if (v) {
                    text = new Node('#text', 3);
                    text.raw = true;
                    // add cdata
                    if (p.type === "text/javascript") {
                        v = clean(tinymce.trim(v));
                    }
                    text.value = v;
                    node.append(text);
                }
            }

            each(p, function (v, k) {
                if (k === "type") {
                    v = v.replace(/mce-/, '');
                }

                node.attr(k, v);
            });

            // set data-mce-type
            node.attr('data-mce-type', p.type);

            n.replace(node);

            return true;
        },

        _buildStyle: function (n) {
            var self = this,
                ed = this.editor,
                v, node, text, p;

            if (!n.parent)
                return;

            // element text
            /*if (n.firstChild) {
                v = n.firstChild.value;
            }*/

            var code = n.attr('data-mce-code') || '';

            if (code) {
                v = unescape(code);
            }

            p = JSON.parse(n.attr('data-mce-json')) || {};

            if (!p.type) {
                p.type = 'text/css';
            }

            node = new Node('style', 1);

            if (v) {

                v = tinymce.trim(v);

                if (v) {
                    text = new Node('#text', 3);
                    text.raw = true;
                    v = clean(tinymce.trim(v));
                    text.value = v;
                    node.append(text);
                }
            }

            // add scoped attribute
            /*if (n.parent.name === 'head') {
                p.scoped = null;
            } else {
                p.scoped = "scoped";
            }*/

            each(p, function (v, k) {
                if (k === "type") {
                    v = v.replace(/mce-/, '');
                }

                node.attr(k, v);
            });

            // set data-mce-type
            node.attr('data-mce-type', p.type);

            n.replace(node);

            return true;
        },

        _buildNoScript: function (n) {
            var self = this,
                ed = this.editor,
                p, node;

            if (!n.parent)
                return;

            p = JSON.parse(n.attr('data-mce-json')) || {};

            node = new Node('noscript', 1);

            each(p, function (v, k) {
                node.attr(k, v);
            });

            n.wrap(node);
            n.unwrap();

            return true;
        },

        _serializeSpan: function (n) {
            var ed = this.editor,
                v, p = {};

            if (!n.parent)
                return;

            each(n.attributes, function (at) {
                if (at.name === 'type' || at.name.indexOf('data-mce-') !== -1) {
                    return;
                }

                p[at.name] = at.value;
            });

            /*var span = new Node('span', 1);

            span.attr('class', 'mce-item-' + n.name);
            span.attr('data-mce-json', JSON.serialize(p));
            span.attr('data-mce-type', n.attr('data-mce-type') || p.type);

            v = n.firstChild ? n.firstChild.value : '';

            if (v.length) {
                var text = new Node('#comment', 8);
                text.value = clean(v);
                span.append(text);
            }
            // padd empty span to prevent it being removed
            span.append(new tinymce.html.Node('#text', 3)).value = '\u00a0';

            n.replace(span);*/

            var img = new Node('img', 1);

            img.attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
            img.attr('class', 'mce-item-' + n.name);
            img.attr('data-mce-resize', 'false');
            img.attr('data-mce-json', JSON.serialize(p));
            img.attr('data-mce-type', n.attr('data-mce-type') || p.type);

            v = n.firstChild ? n.firstChild.value : '';

            if (v.length) {
                img.attr('data-mce-code', escape(clean(v)));
            }

            n.replace(img);
        },
        _serializeNoScript: function (n) {
            var self = this,
                ed = this.editor,
                dom = ed.dom,
                v, k, p = {};

            if (!n.parent)
                return;

            each(n.attributes, function (at) {
                if (at.name == 'type')
                    return;

                p[at.name] = at.value;
            });

            var div = new Node('div', 1);

            div.attr('data-mce-json', JSON.serialize(p));
            div.attr('data-mce-type', n.name);

            n.wrap(div);
            n.unwrap();
        }
    });
    // Register plugin
    tinymce.PluginManager.add('code', tinymce.plugins.CodePlugin);
})();