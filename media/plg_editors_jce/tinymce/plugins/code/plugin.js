(function () {
    'use strict';

    /* eslint-disable */

    const Node$1 = tinymce.html.Node;

    /**
     * Create a TinyMCE text node
     * @param {String} value
     * @param {Boolean} raw
     */
    function createTextNode(value, raw) {
        var text = new Node$1('#text', 3);
        text.raw = raw !== false ? true : false;
        text.value = value;
        return text;
    }

    /**
     * Create a shortcode pre/span. This differs from the code pre as it is still contenteditable.
     * @param {String} data
     * @param {String} tag
     */
    function createShortcodeHtml(editor, data, tag) {
        // decode data before re-encoding
        data = editor.dom.decode(data);

        // replace newlines with linebreaks
        data = data.replace(/[\n\r]/gi, '<br />');

        return editor.dom.createHTML(tag || 'pre', {
            'data-mce-code': 'shortcode'
        }, editor.dom.encode(data));
    }

    /**
     * Create a code pre. This pre is not contenteditable by the editor, and plaintext-only.
     * @param {String} data
     * @param {String} type
     * @param {String} tag
     */
    function createHtml(editor, data, type, tag) {
        type = type || 'script';
        tag = tag || 'pre';

        var code_blocks = editor.settings.code_use_blocks !== false;

        // "protect" code if we are not using code blocks
        if (!code_blocks) {
            // convert linebreaks to newlines
            data = data.replace(/<br[^>]*?>/gi, '\n');

            // create placeholder span
            return editor.dom.createHTML('img', {
                src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                'data-mce-resize': 'false',
                'data-mce-code': type,
                'data-mce-type': 'placeholder',
                'data-mce-value': escape(data)
            });
        }

        return editor.dom.createHTML(tag, {
            'data-mce-code': type
        }, editor.dom.encode(data));
    }

    var Content = { createTextNode, createShortcodeHtml, createHtml };

    const each$1 = tinymce.each;

    let htmlSchema, shortEndedElements = {}, booleanAttributes = {};

    function init(editor) {
        htmlSchema = new tinymce.html.Schema({
            schema: 'mixed',
            invalid_elements: editor.settings.invalid_elements
        });

        each$1(editor.schema.getShortEndedElements(), function (_shortEnded, name) {
            shortEndedElements[name.toLowerCase()] = true;
        });

        each$1(editor.schema.getBoolAttrs(), function (_boolAttr, name) {
            booleanAttributes[name.toLowerCase()] = true;
        });
    }

    function canKeepCode(editor, type) {
        if (editor.settings.validate === false) {
            return true;
        }

        return !!editor.getParam('code_allow_' + type);
    }

    /**
     * Check whether a tag is a defined invalid element
     * @param {Object} editor
     * @param {String} name
     */
    function isInvalidElement(editor, name) {
        var invalid_elements = editor.settings.invalid_elements.split(',');
        return tinymce.inArray(invalid_elements, name) !== -1;
    }

    /**
     * Check if a tag is an XML element - not part of the HTML Schema, but is also not a defined invalid element
     * @param {Object} editor
     * @param {String} name
     */
    function isXmlElement(editor, name) {
        return !htmlSchema.isValid(name) && !isInvalidElement(editor, name);
    }

    /**
     * Check that the element or attribute is valid
     * @param {Object} editor
     * @param {String} tag
     * @param {String} attr
     */
    function isValid(editor, tag, attr) {
        if (isXmlElement(editor, tag)) {
            return true;
        }

        if (editor.settings.validate === false) {
            return true;
        }

        return editor.schema.isValid(tag, attr);
    }

    /**
     * Recursively sanitize a DOM node to a string, filtering invalid tags/attributes and event handlers.
     * @param {Object} editor
     * @param {Node} node
     * @param {Boolean} raw
     */
    function sanitizeNode(editor, node, raw) {
        const html = [];

        switch (node.nodeType) {
            case 1: {
                const tagName = node.nodeName.toLowerCase();

                if (!isValid(editor, tagName)) {
                    return '';
                }

                html.push('<', tagName);

                for (let { name, value } of Array.from(node.attributes)) {
                    if (!isValid(editor, tagName, name)) {
                        continue;
                    }

                    if (!editor.settings.allow_event_attributes && name.startsWith('on')) {
                        continue;
                    }

                    if (booleanAttributes[name]) {
                        if (value === '' || value === 'true' || value === name) {
                            html.push(' ', name);
                            continue;
                        }
                    }

                    html.push(' ', name, '="', editor.dom.encode(value, true), '"');
                }

                if (shortEndedElements[tagName]) {
                    if (editor.settings.schema === 'html5-strict') {
                        html.push('>');
                    } else {
                        html.push(' />');
                    }
                } else {
                    html.push('>');

                    for (let child of Array.from(node.childNodes)) {
                        html.push(sanitizeNode(editor, child));
                    }

                    html.push('</', tagName, '>');
                }

                break;
            }

            case 3: {
                var text = node.nodeValue;
                text = text ;
                html.push(text);
                break;
            }

            case 5: {
                html.push('<![CDATA[', editor.dom.encode(node.nodeValue, true), ']]>');
                break;
            }

            case 8: {
                html.push('<!--', editor.dom.encode(node.nodeValue, true), '-->');
                break;
            }
        }

        return html.join('');
    }

    /**
     * Validate xml code using DOMParser. Removes event attributes if required, and validates nested html using the editor schema.
     * @param {Object} editor
     * @param {String} xml
     */
    function validateXml(editor, xml) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xml, 'text/xml');
        return sanitizeNode(editor, doc.documentElement);
    }

    /**
     * Detect and process xml tags
     * @param {Object} editor
     * @param {String} content
     */
    function processXML(editor, content) {
        return content.replace(/<([a-z0-9\-_\:\.]+)(?:[^>]*?)\/?>((?:[\s\S]*?)<\/\1>)?/gi, function (match, tag) {
            tag = tag.toLowerCase();

            if (tag === 'svg' && editor.settings.code_allow_svg_in_xml === false) {
                return match;
            }

            if (tag === 'math' && editor.settings.code_allow_mathml_in_xml === false) {
                return match;
            }

            if (!isXmlElement(editor, tag)) {
                return match;
            }

            if (editor.settings.code_validate_xml !== false) {
                match = validateXml(editor, match);
            }

            return Content.createHtml(editor, match, 'xml');
        });
    }

    /**
     * Detect and process sourcerer shortcode
     * @param {Object} editor
     * @param {String} html
     */
    function processSourcerer(editor, html) {
        if (html.indexOf('{/source}') === -1) {
            return html;
        }

        return html.replace(/(?:(<(code|pre|samp|span)[^>]*(data-mce-type="code")?>|")?)\{source(.*?)\}([\s\S]+?)\{\/source\}/g, function (match) {
            if (match.charAt(0) === '<' || match.charAt(0) === '"') {
                return match;
            }

            match = editor.dom.decode(match);

            return '<pre data-mce-code="shortcode" data-mce-label="sourcerer">' + editor.dom.encode(match) + '</pre>';
        });
    }

    /**
     * Detect and process shortcode in an html string
     * @param {Object} editor
     * @param {String} html
     * @param {String} tagName
     */
    function processShortcode(editor, html, tagName) {
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
            html = processSourcerer(editor, html);
        }

        // default to inline span if the tagName is not set. This will be converted to pre by the DomParser if required
        tagName = tagName || 'span';

        // Temporarily protect shortcodes inside attribute values so they are not processed
        var attrPlaceholders = [];

        html = html.replace(/=("[^"]*\{[^"]*"|'[^']*\{[^']*')/g, function (match) {
            attrPlaceholders.push(match);
            return '="__SHORTCODE_ATTR_' + (attrPlaceholders.length - 1) + '__"';
        });

        // shortcode blocks eg: {article}\nhtml{/article} or inline or single line shortcode, eg: {youtube}https://www.youtube.com/watch?v=xxDv_RTdLQo{/youtube}
        html = html.replace(/(?:(<(code|pre|samp|span)[^>]*(data-mce-type="code")?>)?)(?:\{)([\w-]+)(.*?)(?:\/?\})(?:([\s\S]+?)\{\/\4\})?/g, function (match) {
            // already wrapped in a tag
            if (match.charAt(0) === '<') {
                return match;
            }

            return Content.createShortcodeHtml(editor, match, tagName);
        });

        // Restore protected attribute values
        if (attrPlaceholders.length) {
            html = html.replace(/="__SHORTCODE_ATTR_(\d+)__"/g, function (_match, index) {
                return attrPlaceholders[parseInt(index, 10)];
            });
        }

        return html;
    }

    /**
     * Detect and process PHP code in an html string
     * @param {Object} editor
     * @param {String} content
     */
    function processPhp(editor, content) {
        if (!canKeepCode(editor, 'php')) {
            return content.replace(/<\?(php)?([\s\S]*?)\?>/gi, '');
        }

        // PHP code within an attribute
        content = content.replace(/\="([^"]+?)"/g, function (_a, b) {
            b = b.replace(/<\?(php)?(.+?)\?>/gi, function (_x, _y, z) {
                return '__php_start__' + editor.dom.encode(z) + '__php_end__';
            });

            return '="' + b + '"';
        });

        // PHP code within a textarea
        if (/<textarea/.test(content)) {
            content = content.replace(/<textarea([^>]*)>([\s\S]*?)<\/textarea>/gi, function (_a, b, c) {
                c = c.replace(/<\?(php)?(.+?)\?>/gi, function (_x, _y, z) {
                    return '__php_start__' + editor.dom.encode(z) + '__php_end__';
                });
                return '<textarea' + b + '>' + c + '</textarea>';
            });
        }

        // PHP code within an element
        content = content.replace(/<([^>]+)<\?(php)?(.+?)\?>([^>]*?)>/gi, function (_a, b, _c, d, e) {
            if (b.charAt(b.length) !== ' ') {
                b += ' ';
            }
            return '<' + b + 'data-mce-php="' + d + '" ' + e + '>';
        });

        // PHP code other
        content = content.replace(/<\?(php)?([\s\S]+?)\?>/gi, function (match) {
            match = match.replace(/\n/g, '<br />');
            return Content.createHtml(editor, match, 'php');
        });

        return content;
    }

    /**
     * Process content on insert (paste or programmatic insert)
     * @param {Object} editor
     * @param {String} value
     * @param {Node} node
     */
    function processOnInsert(editor, value, _node) {
        if (/\{.+\}/gi.test(value) && editor.settings.code_protect_shortcode) {
            var tagName;
            value = processShortcode(editor, value, tagName);
        }

        // process custom xml if enabled, otherwise it will be removed by the parser
        if (canKeepCode(editor, 'custom_xml')) {
            value = processXML(editor, value);
        }

        // script / style
        if (/<(\?|script|style)/.test(value)) {
            // process script and style tags, remove if not allowed
            value = value.replace(/<(script|style)([^>]*?)>([\s\S]*?)<\/\1>/gi, function (match, type) {
                if (!canKeepCode(editor, type)) {
                    return '';
                }

                match = match.replace(/<br[^>]*?>/gi, '\n');

                return Content.createHtml(editor, match, type);
            });

            value = processPhp(editor, value);
        }

        // link[rel="stylesheet"]
        if (/<link[^>]*?rel="stylesheet"[^>]*?>/gi.test(value)) {
            value = value.replace(/<link[^>]*?rel="stylesheet"[^>]*?>/gi, function (match) {
                if (!canKeepCode(editor, 'style')) {
                    return '';
                }

                return Content.createHtml(editor, match, 'link');
            });
        }

        return value;
    }

    var Process = {
        init,
        processOnInsert,
        processShortcode,
        processPhp,
        processXML
    };

    const each = tinymce.each,
        Node = tinymce.html.Node,
        VK = tinymce.VK,
        DomParser = tinymce.html.DomParser,
        Serializer = tinymce.html.Serializer;

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

    tinymce.PluginManager.add('code', function (editor, url) {

        function canKeepCode(type) {
            if (editor.settings.validate === false) {
                return true;
            }

            if (editor.getParam('code_allow_' + type)) {
                return true;
            }

            return false;
        }

        var blockElements = [], inlineElements = [];

        // should code blocks be used?
        var code_blocks = editor.settings.code_use_blocks !== false;

        // allow script URLs, eg: href="javascript:;"
        if (editor.settings.code_allow_script) {
            editor.settings.allow_script_urls = true;
        }

        editor.addCommand('InsertShortCode', function (ui, html) {
            if (editor.settings.code_protect_shortcode) {
                html = Process.processShortcode(editor, html, 'pre');

                if (tinymce.is(html)) {
                    editor.execCommand('mceReplaceContent', false, html);
                }
            }

            return false;
        });

        function handleEnterInPre(ed, node, before) {
            var parents = ed.dom.getParents(node, blockElements.join(','));

            var newBlockName = ed.settings.forced_root_block || 'p';

            if (ed.settings.force_block_newlines === false) {
                newBlockName = 'br';
            }

            var block = parents.shift();

            if (block === ed.getBody()) {
                return;
            }

            var elm = ed.dom.create(newBlockName, {}, '\u00a0');

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

        editor.onKeyDown.add(function (ed, e) {
            var node;

            if (e.keyCode == VK.ENTER) {
                node = ed.selection.getNode();

                // override enter key behaviour in shortcode pre blocks
                if (node.nodeName === 'PRE' && node.getAttribute('data-mce-code') === 'shortcode') {
                    if (!e.shiftKey) {
                        ed.execCommand('InsertLineBreak', false, e);
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

        editor.onPreInit.add(function () {
            // Initialize process module schemas
            Process.init(editor);

            function isCodePlaceholder(node) {
                return node.nodeName === 'SPAN' && node.getAttribute('data-mce-code') && node.getAttribute('data-mce-type') == 'placeholder';
            }

            editor.dom.bind(editor.getDoc(), 'keyup click', function (e) {
                var node = e.target,
                    sel = editor.selection.getNode();

                editor.dom.removeClass(editor.dom.select('.mce-item-selected'), 'mce-item-selected');

                // edge case where forced_root_block:false
                if (node === editor.getBody() && isCodePlaceholder(sel)) {
                    if (sel.parentNode === node && !sel.nextSibling) {
                        editor.dom.insertAfter(editor.dom.create('br', {
                            'data-mce-bogus': 1
                        }), sel);
                    }

                    return;
                }

                if (isCodePlaceholder(node)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    editor.selection.select(node);

                    // add a slight delay before adding selected class to avoid it being removed by the keyup event
                    window.setTimeout(function () {
                        editor.dom.addClass(node, 'mce-item-selected');
                    }, 10);

                    e.preventDefault();
                }
            });

            var ctrl = editor.controlManager.get('formatselect');

            if (ctrl) {
                each(['script', 'style', 'php', 'shortcode', 'xml'], function (key) {
                    var title = editor.getLang('code.' + key, key);

                    if (key === 'shortcode' && editor.settings.code_protect_shortcode) {
                        ctrl.add(title, key, {
                            class: 'mce-code-' + key
                        });

                        editor.formatter.register('shortcode', {
                            block: 'pre',
                            attributes: {
                                'data-mce-code': 'shortcode'
                            }
                        });

                        return true;
                    }

                    // map settings value to simplified key
                    if (key === 'xml') {
                        editor.settings.code_allow_xml = !!editor.settings.code_allow_custom_xml;
                    }

                    if (canKeepCode(key) && code_blocks) {
                        ctrl.add(title, key, {
                            class: 'mce-code-' + key
                        });

                        editor.formatter.register(key, {
                            block: 'pre',
                            attributes: {
                                'data-mce-code': key
                            },
                            onformat: function (elm) {
                                // replace linebreaks with newlines
                                each(editor.dom.select('br', elm), function (br) {
                                    editor.dom.replace(editor.dom.doc.createTextNode('\n'), br);
                                });
                            }
                        });
                    }
                });
            }

            // store block elements from schema map
            each(editor.schema.getBlockElements(), function (_block, blockName) {
                blockElements.push(blockName);
            });

            // store inline elements from schema map
            each(editor.schema.getTextInlineElements(), function (_inline, name) {
                inlineElements.push(name);
            });

            if (editor.settings.code_protect_shortcode) {
                editor.textpattern.addPattern({
                    start: '{',
                    end: '}',
                    cmd: 'InsertShortCode',
                    remove: true
                });

                editor.textpattern.addPattern({
                    start: ' {',
                    end: '}',
                    format: 'inline-shortcode',
                    remove: false
                });
            }

            editor.formatter.register('inline-shortcode', {
                inline: 'span',
                attributes: {
                    'data-mce-code': 'shortcode'
                }
            });

            editor.selection.onBeforeSetContent.addToTop(function (sel, o) {
                var target = sel.getNode();

                // don't process into PRE tags
                if (target && target.nodeName === 'PRE') {
                    return;
                }

                o.content = Process.processOnInsert(editor, o.content, target);
            });

            var onSetContent = function () {
                each(editor.dom.select('pre[data-mce-code]', editor.getBody()), function (elm) {
                    var parent = editor.dom.getParent(elm, 'p');

                    if (parent) {
                        // clone p and remove elm from clone to check if p has other meaningful content (ignores bookmarks, whitespace)
                        var clone = parent.cloneNode(true);
                        var clonedElm = clone.querySelector('[data-mce-code]');

                        if (clonedElm) {
                            clone.removeChild(clonedElm);
                        }

                        if (editor.dom.isEmpty(clone)) {
                            editor.dom.remove(parent, 1);
                        }
                    }
                });
            };

            // remove paragraph parent of a pre block
            editor.onSetContent.add(onSetContent);
            editor.selection.onSetContent.add(onSetContent);

            // Convert script elements to span placeholder
            editor.parser.addNodeFilter('script,style,link', function (nodes) {
                var i = nodes.length,
                    node;

                while (i--) {
                    node = nodes[i];
                    var parent = node.parent;

                    if (parent && parent.name === 'pre') {
                        // don't process script/style/link inside pre blocks
                        continue;
                    }

                    // only allow link[rel="stylesheet"]
                    if (node.name == 'link' && node.attr('rel') != 'stylesheet') {
                        node.remove();
                        continue;
                    }

                    // remove data-mce-fragment attribute added by insertContent
                    node.attr('data-mce-fragment', null);

                    // remove any code spans that are added to json-like syntax in code blocks
                    if (node.firstChild) {
                        node.firstChild.value = node.firstChild.value.replace(/<span([^>]+)>([\s\S]+?)<\/span>/gi, function (match, attr, content) {
                            if (attr.indexOf('data-mce-code') === -1) {
                                return match;
                            }

                            return editor.dom.decode(content);
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
                            title: editor.dom.encode(value)
                        });

                        // eslint-disable-next-line no-loop-func
                        each(node.attributes, function (attr) {
                            placeholder.attr('data-mce-p-' + attr.name, attr.value);
                        });

                        if (value) {
                            placeholder.attr('data-mce-value', escape(value));
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

                    var text = Content.createTextNode(value, false);
                    pre.append(text);

                    node.replace(pre);
                }
            });

            editor.parser.addAttributeFilter('data-mce-code', function (nodes, name) {
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

                            if (node.name == 'pre' && parent && parent.name == 'p') {
                                // if the pre is the only child of the parent, replace the parent
                                if (isOnlyChild(node)) {
                                    if (parent.parent) {
                                        parent.replace(node);
                                    }
                                }
                            }
                        }

                        // add whitespace after the span so a cursor can be set
                        if (node.name == 'span' && node === parent.lastChild) {
                            var nbsp = Content.createTextNode('\u00a0');
                            parent.append(nbsp);
                        }
                    }
                }
            });

            editor.serializer.addAttributeFilter('data-mce-code', function (nodes, name) {
                var i = nodes.length,
                    node, child;

                function isXmlNode(node) {
                    return !/(shortcode|php)/.test(node.attr('data-mce-code'));
                }

                while (i--) {
                    var root_block = false;

                    node = nodes[i];

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

                        var imgValue = node.attr('data-mce-value');

                        if (imgValue) {
                            var imgText = Content.createTextNode(unescape(imgValue));

                            if (type == 'php' || type == 'shortcode') {
                                elm = imgText;
                            } else {
                                elm.append(imgText);
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

                    child = node.firstChild;
                    var newNode = node.clone(true),
                        text = '';

                    if (child) {
                        do {
                            if (isXmlNode(node)) {
                                var childVal = child.name == 'br' ? '\n' : child.value;

                                if (childVal) {
                                    text += childVal;
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
                            parser.addNodeFilter(type, function (items, filterName) {
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

                                        if (editor.schema.isValid(filterName, attr.name) === false) {
                                            item.attr(attr.name, null);
                                        }
                                    });
                                }
                            });
                        }

                        var fragment = parser.parse(text, {
                            forced_root_block: root_block
                        });

                        newNode.append(fragment);
                    }

                    node.replace(newNode);

                    if (type === 'shortcode' && newNode.name === 'pre') {
                        var newline = Content.createTextNode('\n');
                        newNode.append(newline);
                        newNode.unwrap();
                    }
                }
            });

            editor.onContextMenu.addToTop(function (ed, e) {
                var node = ed.selection.getNode();

                if (node && node.hasAttribute('data-mce-code')) {
                    return false;
                }
            });
        });

        editor.onInit.add(function () {
            // Display "script" instead of "pre" in element path
            if (editor.theme && editor.theme.onResolveName) {
                editor.theme.onResolveName.add(function (theme, o) {
                    var node = o.node;

                    if (node.getAttribute('data-mce-code')) {
                        o.name = node.getAttribute('data-mce-code');
                    }
                });
            }
        });

        var hitAreaSize = 32;

        editor.onMouseDown.add(function (ed, e) {
            var pre = e.target.closest('pre[data-mce-code]');

            if (!pre) {
                return;
            }

            var { clientX, clientY } = e;
            var { top, right } = pre.getBoundingClientRect();

            if (clientX >= right - hitAreaSize && clientY <= top + hitAreaSize) {
                ed.dom.toggleClass(pre, 'mce-code-toggle');
            }
        });

        editor.onBeforeSetContent.addToTop(function (ed, o) {
            if (editor.settings.code_protect_shortcode) {
                if (o.content.indexOf('data-mce-code="shortcode"') === -1) {
                    o.content = Process.processShortcode(editor, o.content);
                }
            }

            if (canKeepCode('custom_xml')) {
                // only process content on "load"
                if (o.content && o.load) {
                    o.content = Process.processXML(editor, o.content);
                }
            }

            // test for PHP, Script or Style
            if (/<(\?|script|style|link)/.test(o.content)) {
                // Remove javascript if not enabled
                if (!canKeepCode('script')) {
                    o.content = o.content.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
                }

                if (!canKeepCode('style')) {
                    o.content = o.content.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
                    o.content = o.content.replace(/<link[^>]*?rel="stylesheet"[^>]*?>/gi, '');
                }

                o.content = Process.processPhp(editor, o.content);
            }
        });

        editor.onPostProcess.add(function (ed, o) {
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
                if (editor.settings.code_protect_shortcode) {
                    o.content = o.content.replace(/\{([\s\S]+?)\}/gi, function (match, content) {
                        return '{' + ed.dom.decode(content) + '}';
                    });

                    // sourcerer with encoded content
                    o.content = o.content.replace(/\{source([^\}]*?)\}([\s\S]+?)\{\/source\}/gi, function (match, start, content) {
                        return '{source' + start + '}' + ed.dom.decode(content) + '{/source}';
                    });

                    // other shortcode tags
                    o.content = o.content.replace(/\{([\w-]+)(.*?)\}([\s\S]+)\{\/\1\}/gi, function (match, start, attr, content) {
                        return '{' + start + attr + '}' + ed.dom.decode(content) + '{/' + start + '}';
                    });
                }

                // decode code snippets
                o.content = o.content.replace(/<(pre|span)([^>]+?)>([\s\S]*?)<\/\1>/gi, function (match, tag, attr, content) {
                    if (attr.indexOf('data-mce-code') === -1) {
                        return match;
                    }

                    content = tinymce.trim(content);

                    var node = ed.dom.create('div', {}, match), elm = node.firstChild, type = elm.getAttribute('data-mce-code');

                    if (type != 'script') {
                        content = content.replace(/<br[^>]*?>/gi, '\n');
                    }

                    content = ed.dom.decode(content);

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
