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
        VK = tinymce.VK,
        DomParser = tinymce.html.DomParser,
        Serializer = tinymce.html.Serializer,
        SaxParser = tinymce.html.SaxParser;

    tinymce.create('tinymce.plugins.CodePlugin', {
        init: function (ed, url) {
            this.editor = ed;
            this.url = url;

            var blockElements = [], htmlSchema = new tinymce.html.Schema({ schema: 'mixed', invalid_elements: ed.settings.invalid_elements }), xmlSchema = new tinymce.html.Schema({ verify_html: false });

            ed.addCommand('InsertShortCode', function (ui, html) {
                if (ed.settings.code_protect_shortcode) {
                    html = processShortcode(html, 'pre', true);

                    if (tinymce.is(html)) {
                        ed.execCommand('mceReplaceContent', false, html);
                    }
                }

                return false;
            });

            function processOnInsert(value) {
                if (/\{.+\}/gi.test(value) && ed.settings.code_protect_shortcode) {
                    value = processShortcode(value);
                }

                if (ed.settings.code_allow_custom_xml) {
                    value = processXML(value);
                }

                // script / style
                if (/<(\?|script|style)/.test(value)) {
                    value = value.replace(/<(script|style)([^>]*?)>([\s\S]*?)<\/\1>/gi, function (match, type) {
                        match = match.replace(/<br[^>]*?>/gi, '\n');
                        return createCodePre(match, type);
                    });

                    value = value.replace(/<\?(php)?([\s\S]*?)\?>/gi, function (match) {
                        match = match.replace(/<br[^>]*?>/gi, '\n');
                        return createCodePre(match, 'php', 'span');
                    });
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

                // default to inline span if the tagName is not set. This will be converted to pre by the DomParser if required
                tagName = tagName || 'span';

                return html.replace(/(?:([a-z0-9]>)?)(?:\{)([\/\w-]+)(.*)(?:\})(?:(.*)(?:\{\/\1\}))?/g, function (match) {
                    // already wrapped in a tag
                    if (match.charAt(1) === '>') {
                        return match;
                    }

                    return createShortcodePre(match, tagName);
                });
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

                        if (attrs) {
                            for (i = 0, l = attrs.length; i < l; i++) {
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
                tag = tag || 'pre';
                return '<' + tag + ' data-mce-code="shortcode" data-mce-type="shortcode">' + ed.dom.encode(data) + '</' + tag + '>';
            }

            /**
             * Create a code pre. This pre is not contenteditable by the editor, and plaintext-only
             * @param {String} data
             * @param {String} type  
             * @param {String} tag 
             */
            function createCodePre(data, type, tag) {
                type = type || 'script';
                tag = tag || 'pre';
                return '<' + tag + ' data-mce-code="' + type + '" data-mce-contenteditable="false" contenteditable="plaintext-only">' + ed.dom.encode(data) + '</' + tag + '>';
            }

            /**
             * Quick check to see if a string is shortcode, eg: {code}
             * @param {String} str
             */
            function contentIsShortcode(str) {
                return str && str.charAt(0) === '{' && str.charAt(str.length - 1) === '}';
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
                if (e.keyCode == VK.ENTER) {
                    var node = ed.selection.getNode();

                    if (node.nodeName === 'PRE') {
                        var type = node.getAttribute('data-mce-code') || '';

                        if (type) {
                            if (type === 'shortcode') {
                                if (e.shiftKey) {
                                    ed.execCommand("InsertLineBreak", false, e);
                                } else {
                                    handleEnterInPre(ed, node);
                                }

                                e.preventDefault();
                                return;
                            }

                            if (e.altKey || e.shiftKey) {
                                handleEnterInPre(ed, node);
                            } else {
                                ed.execCommand("InsertLineBreak", false, e);
                            }

                            // prevent default action
                            e.preventDefault();
                        }
                    }

                    if (node.nodeName === 'SPAN' && node.getAttribute('data-mce-code')) {
                        handleEnterInPre(ed, node);
                        e.preventDefault();
                    }
                }

                if (e.keyCode == VK.UP && e.altKey) {
                    var node = ed.selection.getNode();

                    handleEnterInPre(ed, node, true);
                    e.preventDefault();
                }

                // Check for tab but not ctrl/cmd+tab since it switches browser tabs
                if (e.keyCode == 9 && !VK.metaKeyPressed(e)) {
                    var node = ed.selection.getNode();

                    if (node.nodeName === 'PRE' && node.getAttribute('data-mce-code')) {
                        ed.selection.setContent('\t', { no_events: true });
                        e.preventDefault();
                    }
                }
            });

            ed.onPreInit.add(function () {
                if (ed.settings.content_css !== false) {
                    ed.dom.loadCSS(url + "/css/content.css");
                }

                var ctrl = ed.controlManager.get('formatselect');

                if (ctrl) {
                    each(['script', 'style', 'php', 'shortcode', 'xml'], function (key) {
                        if (key === 'shortcode' && ed.settings.code_protect_shortcode) {
                            ctrl.add('code.' + key, key, { class: 'mce-code-' + key });

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
                            ed.settings['code_xml'] = !!ed.settings.code_allow_custom_xml;
                        }

                        if (ed.getParam('code_' + key)) {
                            ctrl.add('code.' + key, key, { class: 'mce-code-' + key });

                            ed.formatter.register(key, {
                                block: 'pre',
                                attributes: {
                                    'data-mce-code': key,
                                    'data-mce-contenteditable': 'false',
                                    'contenteditable': 'plaintext-only'
                                }
                            });
                        }
                    });
                }

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

                // allow script URLS, eg: href="javascript:;"
                if (ed.settings.code_script) {
                    ed.settings.allow_script_urls = true;
                }

                ed.selection.onBeforeSetContent.add(function (sel, o) {                    
                    if (ed.settings.code_protect_shortcode) {
                        o.content = processShortcode(o.content);
                    }
                });

                // Convert script elements to span placeholder
                ed.parser.addNodeFilter('script,style,noscript', function (nodes) {
                    var i = nodes.length,
                        node;

                    while (i--) {
                        var node = nodes[i];

                        var pre = new Node('pre', 1);
                        pre.attr({ 'data-mce-code': node.name, 'data-mce-contenteditable': 'false', 'contenteditable': 'plaintext-only' });

                        var type = node.attr('type');

                        if (type) {
                            node.attr('type', type == 'mce-no/type' ? null : type.replace(/^mce\-/, ''));
                        }

                        // remove any code spans that are added to json-like syntax in code blocks
                        if (node.firstChild) {
                            node.firstChild.value = node.firstChild.value.replace(/<span([^>]+)>([\s\S]+?)<\/span>/gi, function (match, attr, content) {
                                if (attr.indexOf('data-mce-code') === -1) {
                                    return match;
                                }

                                return ed.dom.decode(content);
                            });
                        }

                        // serialize to string
                        var value = new Serializer({ validate: false }).serialize(node);

                        // trim
                        value = tinymce.trim(value);

                        var text = new Node('#text', 3);
                        text.value = tinymce.trim(value);
                        pre.append(text);

                        node.replace(pre);
                    }
                });

                ed.parser.addAttributeFilter('data-mce-code', function (nodes, name) {
                    var i = nodes.length, node, parent;

                    function isBody(parent) {
                        return parent.name === 'body';
                    }

                    function isValidCode(type) {
                        return type === 'shortcode' || type === 'php';
                    }

                    while (i--) {
                        node = nodes[i], parent = node.parent;

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
                            if (isBody(parent) || parent.firstChild === node) {
                                node.name = 'pre';

                                // if parent is empty except for the shortcode pre, replace the parent with the pre
                                if (parent.lastChild === parent.firstChild && !isBody(parent)) {
                                    parent.replace(node);
                                }
                            } else {
                                // add whitespace after the span so a cursor can be set
                                if (node === parent.lastChild) {
                                    var nbsp = new Node('#text', 3);
                                    nbsp.value = '\u00a0';

                                    parent.append(nbsp);
                                }
                            }
                        }
                    }
                });

                ed.serializer.addAttributeFilter('data-mce-code', function (nodes, name) {
                    var i = nodes.length, node, child;

                    function createTextNode(value) {
                        var text = new Node('#text', 3);
                        text.raw = true;
                        text.value = value;

                        return text;
                    }

                    function isXmlNode(node) {
                        return !/(shortcode|php)/.test(node.attr('data-mce-code'));
                    }

                    while (i--) {
                        node = nodes[i], child = node.firstChild, root_block = false;

                        // pre node is empty, remove
                        if (node.isEmpty()) {
                            node.remove();
                        }

                        // get the code block type, eg: script, shortcode, style, php
                        var type = node.attr(name);

                        // skip xml
                        if (type === 'xml') {
                            continue;
                        }

                        // skip inline code span (php or shortcode)
                        if (node.name === 'span' && (type === 'shortcode' || type === 'php')) {
                            continue;
                        }

                        // set the root block type for script and style tags so the parser does the work wrapping free text
                        if (type === 'script' || type === 'style') {
                            root_block = type;
                        }

                        var newNode = node.clone(true);

                        do {
                            if (isXmlNode(node)) {
                                var value = child.value;

                                newNode.empty();

                                if (value) {
                                    var parser = new DomParser({ validate: false });

                                    // validate attributes of script and style tags
                                    if (type === 'script' || type === 'style') {
                                        parser.addNodeFilter(type, function (items) {
                                            var n = items.length;

                                            while (n--) {
                                                each(items[n].attributes, function (attr) {
                                                    if (ed.schema.isValid(type, attr.name) === false) {
                                                        items[n].attr(attr.name, null);
                                                    }
                                                });
                                            }
                                        });
                                    }

                                    var fragment = parser.parse(value, { forced_root_block: root_block });
                                    newNode.append(fragment);
                                }
                            }
                        } while (child = child.next);

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

                if (ed.plugins.clipboard) {
                    ed.onGetClipboardContent.add(function (ed, content) {
                        var text = content['text/plain'] || '', value;

                        // trim text
                        text = tinymce.trim(text);

                        if (text) {
                            var node = ed.selection.getNode();

                            // don't process into PRE tags
                            if (node && node.nodeName === 'PRE') {
                                return;
                            }

                            value = processOnInsert(text);

                            // update with processed text
                            if (value !== text) {
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

                if (ed.settings.code_allow_custom_xml) {
                    // only process content on "load"
                    if (o.content && o.load) {
                        o.content = processXML(o.content);
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
                        // replace newlines with <br /> so they are preserved inside the span
                        match = match.replace(/\n/g, '<br />');
                        // create code span
                        return createCodePre(match, 'php', 'span');
                    });
                }
            });

            ed.onPostProcess.add(function (ed, o) {
                if (o.get) {
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
                    o.content = o.content.replace(/<(pre|span)([^>]+?)>([\s\S]*?)<\/\1>/gi, function (match, tag, attr, content) {
                        // not the droids etc.
                        if (attr.indexOf('data-mce-code') === -1) {
                            return match;
                        }

                        // trim content
                        content = tinymce.trim(content);

                        // replace linebreaks with newline
                        content = content.replace(/<br[^>]*?>/gi, '\n');

                        // decode content
                        content = ed.dom.decode(content);

                        // add missing tags in php
                        if (attr.indexOf('data-mce-code="php"') !== -1) {
                            if (!/^<\?(php)?([\s\S]+?)\?>$/.test(content)) {
                                content = '<?php ' + content + ' ?>';
                            }
                        }

                        return content;
                    });
                }
            });
        }
    });
    // Register plugin
    tinymce.PluginManager.add('code', tinymce.plugins.CodePlugin);
})();