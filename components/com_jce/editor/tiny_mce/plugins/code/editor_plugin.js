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
        Node = tinymce.html.Node,
        VK = tinymce.VK;

    function clean(s) {
        // remove javascript comments
        s = s.replace(/^(\/\/ <!\[CDATA\[)/gi, '');
        s = s.replace(/(\n\/\/ \]\]>)$/g, '');

        // remove css comments
        s = s.replace(/^(<!--\n)/g, '');
        s = s.replace(/(\n-->)$/g, '');

        return s;
    }

    tinymce.create('tinymce.plugins.CodePlugin', {
        init: function (ed, url) {
            this.editor = ed;
            this.url = url;

            var blockElements = [];

            ed.addCommand('InsertShortCode', function (ui, html) {
                if (ed.settings.code_protect_shortcode) {
                    html = processShortcode(html, 'pre', true);

                    if (tinymce.is(html)) {
                        ed.execCommand('mceReplaceContent', false, html);
                    }
                }

                return false;
            });

            function processShortcode(html, tagName, encode) {
                // quick check to see if we should proceed
                if (html.indexOf('{') === -1) {
                    return html;
                }

                // skip stuff like {1} etc.
                if (html.charAt(0) == '{' && html.length < 3) {
                    return html;
                }

                tagName = tagName || 'span';

                return html.replace(/(?:([a-z0-9]>)?)(?:\{)([\/\w-]+)(.*)(?:\})(?:(.*)(?:\{\/\1\}))?/g, function (match) {
                    // already wrapped in a tag
                    if (match.charAt(1) === '>') {
                        return match;
                    }

                    return '<' + tagName + ' data-mce-shortcode="1" data-mce-type="shortcode">' + match + '</' + tagName + '>';
                });
            }

            function handleEnterInPre(ed, node) {
                var parents = ed.dom.getParents(node, blockElements.join(','));

                // set defualt content and get the element to use
                var newBlockName = ed.settings.forced_root_block || 'p';

                // reset if force_block_newlines is false (linebreak on enter)
                if (ed.settings.force_block_newlines === false) {
                    newBlockName = 'br';
                }

                // get the first block in the collection
                var block = parents[parents.length - 1];

                // skip if it is the body
                if (block === ed.getBody()) {
                    return;
                }

                // create element
                var elm = ed.dom.create(newBlockName, {}, '\u00a0');

                // insert after parent element
                ed.dom.insertAfter(elm, block);

                var rng = ed.selection.getRng();

                rng.setStart(elm, 0);
                rng.setEnd(elm, 0);

                ed.selection.setRng(rng);
                ed.selection.scrollIntoView(elm);
            }

            ed.onKeyDown.add(function (ed, e) {
                if (e.keyCode == VK.ENTER) {
                    var node = ed.selection.getNode();

                    if (node.nodeName === 'PRE') {
                        if (e.altKey || e.shiftKey || node.getAttribute('data-mce-shortcode')) {
                            handleEnterInPre(ed, node);
                        } else {
                            ed.execCommand("InsertLineBreak", false, e);
                        }

                        // prevent default action
                        e.preventDefault();
                    }
                }

                // Check for tab but not ctrl/cmd+tab since it switches browser tabs
                if (e.keyCode == 9 && !VK.metaKeyPressed(e)) {
                    var node = ed.selection.getNode();

                    if (node.nodeName === 'PRE') {
                        ed.selection.setContent('\t', { no_events: true });
                    }
                }
            });

            ed.onPreInit.add(function () {
                if (ed.settings.content_css !== false) {
                    ed.dom.loadCSS(url + "/css/content.css");
                }

                var boolAttrs = ed.schema.getBoolAttrs();
                
                // store block elements from schema map
                each(ed.schema.getBlockElements(), function (block, blockName) {
                    blockElements.push(blockName);
                });

                if (ed.plugins.textpattern && ed.settings.code_protect_shortcode) {
                    ed.plugins.textpattern.addPattern({
                        start: '{',
                        end: '}',
                        cmd: 'InsertShortCode',
                        remove: true
                    });

                    ed.plugins.textpattern.addPattern({
                        start: ' {',
                        end: '}',
                        format: 'shortcode',
                        remove: false
                    });
                }

                ed.formatter.register('shortcode', {
                    inline: 'span',
                    attributes: {
                        'data-mce-shortcode': '1'
                    }
                });

                // allow script URLS, eg: href="javascript:;"
                if (ed.settings.code_script) {
                    ed.settings.allow_script_urls = true;
                }

                // Convert script elements to span placeholder
                ed.parser.addNodeFilter('script,style,noscript', function (nodes) {
                    var i = nodes.length,
                        node;

                    while (i--) {
                        var node = nodes[i];

                        var pre = new Node('pre', 1);
                        pre.attr({ 'data-mce-code': node.name });

                        var type = node.attr('type');

                        if (type) {
                            node.attr('type', type == 'mce-no/type' ? null : type.replace(/^mce\-/, ''));
                        }

                        each(node.attributes, function (attr) {
                            if (boolAttrs[attr.name] && attr.value != 'false') {
                                attr.value = attr.name;
                            }
                        });

                        // serialize to string
                        var value = new tinymce.html.Serializer({ validate: false }).serialize(node, { no_events: true });
                        // trim
                        value = tinymce.trim(value);

                        var text = new Node('#text', 3);
                        text.value = tinymce.trim(value);
                        pre.append(text);

                        node.replace(pre);
                    }
                });

                if (ed.settings.code_protect_shortcode) {
                    ed.selection.onBeforeSetContent.add(function (ed, o) {
                        o.content = processShortcode(o.content);
                    });
                }

                ed.serializer.addAttributeFilter('data-mce-shortcode', function (nodes, name) {
                    var i = nodes.length, node;

                    while (i--) {
                        node = nodes[i];

                        // append newline to the end of shortcode blocks
                        if (node.name === 'pre') {
                            var newline = new Node('#text', 3);
                            newline.raw = true;
                            newline.value = '\n';
                            node.append(newline);
                        }

                        node.unwrap();
                    }
                });

                ed.parser.addAttributeFilter('data-mce-shortcode', function (nodes) {
                    var i = nodes.length, node, parent;

                    while (i--) {
                        node = nodes[i], parent = node.parent;

                        if (node.parent) {
                            // rename shortcode blocks to <pre>
                            if (parent.name === 'body' || parent.firstChild === node) {
                                node.name = 'pre';
                            }
                            // prevent nesting
                            if (parent.attr('data-mce-shortcode')) {
                                node.unwrap();
                            }
                        }
                    }
                });

                if (ed.plugins.clipboard) {
                    ed.onGetClipboardContent.add(function (ed, content) {
                        var text = content['text/plain'] || '';

                        if (text) {
                            if (text.indexOf('<script') !== -1 || text.indexOf('<style') !== -1) {
                                var value = tinymce.trim(text);

                                value = value.replace(/<(script|style)([^>]*?)>([\s\S]*?)<\/\1>/gi, function (match, type) {
                                    match = match.replace(/<br[^>]*?>/gi, '\n');
                                    return '<pre data-mce-code="' + type + '">' + ed.dom.encode(match) + '</pre>';
                                });

                                value = value.replace(/<\?(php)?([\s\S]*?)\?>/gi, function (match) {
                                    match = match.replace(/<br[^>]*?>/gi, '\n');
                                    return '<pre data-mce-code="php">' + ed.dom.encode(match) + '</pre>';
                                });

                                content['text/plain'] = '';
                                content['text/html'] = content['x-tinymce/html'] = value;
                            }
                        }
                    });
                }
            });

            ed.onInit.add(function () {
                // Display "script" instead of "pre" in element path
                if (ed.theme && ed.theme.onResolveName) {
                    ed.theme.onResolveName.add(function (theme, o) {
                        var node = o.node;

                        if (node.getAttribute('data-mce-code')) {
                            o.name = node.getAttribute('data-mce-code');
                        }

                        if (node.getAttribute('data-mce-shortcode')) {
                            o.name = 'shortcode';
                        }
                    });
                }
            });

            ed.onBeforeSetContent.add(function (ed, o) {
                if (ed.settings.code_protect_shortcode) {
                    // only process content on "load"
                    if (o.content && o.load) {
                        o.content = processShortcode(o.content);
                    }
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
                    o.content = o.content.replace(/<\?(php)?([\s\S]+?)\?>/gi, function (match) {
                        return '<pre data-mce-code="php">' + ed.dom.encode(match) + '</pre>';
                    });
                }
            });

            ed.onPostProcess.add(function (ed, o) {
                if (o.get && !o.source) {
                    // Process converted php
                    if (/(data-mce-php|\{php:start\})/.test(o.content)) {
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
                    }

                    // shortcode content will be encoded as text, so decode
                    if (ed.settings.code_protect_shortcode) {
                        o.content = o.content.replace(/\{(.*)\}/gi, function (match, content) {
                            return '{' + ed.dom.decode(content) + '}';
                        });
                    }

                    // decode code snippets
                    o.content = o.content.replace(/\<pre([^>]+?)>([\s\S]*?)<\/pre>/gi, function (match, attr, content) {
                        // not the droids etc.
                        if (attr.indexOf('data-mce-code') === -1) {
                            return match;
                        }

                        // replace linebreaks with newline
                        content = content.replace(/<br[^>]*?>/gi, '\n');

                        // decode content
                        return ed.dom.decode(content);
                    });
                }
            });

        }
    });
    // Register plugin
    tinymce.PluginManager.add('code', tinymce.plugins.CodePlugin);
})();