import { each, extend, Node, DOM, htmlSchema, transparentSrc, alignStylesMap, isNonEditable, isPreviewMedia, isObjectEmbed, isCenterAligned, stripQuery, cleanClassValue, parseHTML } from './Utils.js';
import { getMediaProps, updateSandbox, isSupportedMedia, isSupportedProvider, isValidElement, isSupportedUrl, validateIframe, objectRequiresEmbed, lookup, mimes } from './Providers.js';

var sanitize = function (editor, html) {
    var writer = new ibis.html.Writer();
    var blocked;

    new ibis.html.SaxParser({
        validate: false,
        allow_conditional_comments: false,
        special: 'script,noscript',

        comment: function (text) {
            writer.comment(text);
        },

        cdata: function (text) {
            writer.cdata(text);
        },

        text: function (text, raw) {
            writer.text(text, raw);
        },

        start: function (name, attrs, empty) {
            blocked = true;

            if (name === 'script' || name === 'noscript' || name === 'svg') {
                return;
            }

            if (attrs.map && attrs.map['data-mce-type'] == 'bookmark' || attrs.map['data-mce-bogus']) {
                return;
            }

            for (var i = attrs.length - 1; i >= 0; i--) {
                var attrName = attrs[i].name;

                if (attrName.indexOf('on') === 0) {
                    delete attrs.map[attrName];
                    attrs.splice(i, 1);
                }

                if (attrName === 'style') {
                    attrs[i].value = editor.dom.serializeStyle(editor.dom.parseStyle(attrs[i].value), name);
                }
            }

            writer.start(name, attrs, empty);

            blocked = false;
        },

        end: function (name) {
            if (blocked) {
                return;
            }

            writer.end(name);
        }
    }, htmlSchema).parse(html);

    return writer.getContent();
};

// eslint-disable-next-line no-unused-vars
function isValidNode(node) {
    var name = node.name;

    if (name == 'iframe' && !node.attr('src')) {
        return false;
    }

    if (name == 'embed' && !node.attr('src')) {
        return false;
    }

    if (name == 'object' && !node.attr('data')) {
        if (node.getAll('param').length == 0) {
            return false;
        }
    }

    if (name == 'video' || name == 'audio') {
        if (!node.attr('src')) {
            if (node.getAll('source').length == 0) {
                return false;
            }
        }
    }

    return true;
}

function isResponsiveMedia(node) {
    var parent = node.parent;

    if (!parent || parent.name != 'div') {
        return false;
    }

    var valid = true;

    var pStyles = DOM.parseStyle(parent.attr('style')),
        nStyles = DOM.parseStyle(node.attr('style')),
        containerStyles = { 'padding-bottom': '56.25%', position: 'relative' },
        mediaStyles = { position: 'absolute' };

    each(containerStyles, function (val, key) {
        if (!ibis.is(pStyles[key]) || pStyles[key] != val) {
            valid = false;
        }
    });

    each(mediaStyles, function (val, key) {
        if (!ibis.is(nStyles[key]) || nStyles[key] != val) {
            valid = false;
        }
    });

    return valid;
}

var isWithinEmbed = function (node) {
    while ((node = node.parent)) {
        if (node.attr('data-mce-object')) {
            return true;
        }
    }

    return false;
};

var retainAttributesAndInnerHtml = function (editor, sourceNode, targetNode) {
    var attrName;
    var attrValue;
    var attribs;
    var ai;
    var innerHtml;
    var styles;

    var boolAttrs = editor.schema.getBoolAttrs();

    var src = sourceNode.attr('src');

    if (src) {
        var provider = isSupportedMedia(editor, src), defaultAttributes = getMediaProps(editor, { src: src }, provider);

        each(defaultAttributes, function (val, name) {
            if (!ibis.is(sourceNode.attr(name)) && !(name in boolAttrs)) {

                if (name === 'style' && ibis.is(val, 'object')) {
                    val = editor.dom.serializeStyle(val);
                }

                sourceNode.attr(name, val);
            }
        });

        updateSandbox(editor, sourceNode);
    }

    var style = editor.dom.parseStyle(sourceNode.attr('style'));

    var width = sourceNode.attr('width') || style.width || '';
    var height = sourceNode.attr('height') || style.height || '';

    var style = editor.dom.parseStyle(sourceNode.attr('style'));

    var legacyAttributes = ['bgcolor', 'align', 'border', 'vspace', 'hspace'];

    each(legacyAttributes, function (na) {
        var v = sourceNode.attr(na);

        if (v) {
            switch (na) {
                case 'bgcolor':
                    style['background-color'] = v;
                    break;
                case 'align':
                    if (/^(left|right)$/.test(v)) {
                        style['float'] = v;
                    } else {
                        style['vertical-align'] = v;
                    }
                    break;
                case 'vspace':
                    style['margin-top'] = v;
                    style['margin-bottom'] = v;
                    break;
                case 'hspace':
                    style['margin-left'] = v;
                    style['margin-right'] = v;
                    break;
                default:
                    style[na] = v;
                    break;
            }

            sourceNode.attr(na, null);
        }
    });

    attribs = sourceNode.attributes;
    ai = attribs.length;

    while (ai--) {
        attrName = attribs[ai].name;
        attrValue = attribs[ai].value;

        if (attrName === 'data-mce-html') {
            targetNode.attr(attrName, attrValue);
            continue;
        }

        if (attrName === 'data-mce-clipboard-media') {
            targetNode.attr(attrName, attrValue);
            continue;
        }

        if (attrName.indexOf('data-mce') !== -1) {
            if (attrName.indexOf('data-mce-p-') === -1) {
                continue;
            }
        }

        // node uses img placeholder, so store element specific attributes
        if (targetNode.name === 'img') {
            // autoplay has already been handled to prevent autoplay
            if (attrName === 'data-mce-p-autoplay') {
                targetNode.attr(attrName, attrValue);

                continue;
            }

            if (!htmlSchema.isValid('img', attrName) || attrName == 'src') {
                attrName = 'data-mce-p-' + attrName;
            }
        }

        if (attrName.indexOf('on') === 0 && editor.settings.allow_event_attributes) {
            attrName = 'data-mce-p-' + attrName;
        }

        if (attrName.indexOf('-') !== -1) {
            targetNode.attr(attrName, attrValue);
            continue;
        }

        if (htmlSchema.isValid(targetNode.name, attrName)) {
            targetNode.attr(attrName, attrValue);
        }

        if (ibis.is(boolAttrs[attrName]) && attrValue == "false") {
            targetNode.attr(attrName, null);
        }

        if (attrName == 'sandbox' && attrValue === false) {
            targetNode.attr(attrName, null);
        }
    }

    if (width && !style.width) {
        style.width = /^[0-9.]+$/.test(width) ? (width + 'px') : width;
    }

    if (height && !style.height) {
        style.height = /^[0-9.]+$/.test(height) ? (height + 'px') : height;
    }

    var classes = [];

    if (sourceNode.attr('class')) {
        classes = sourceNode.attr('class').replace(/mce-(\S+)/g, '').replace(/\s+/g, ' ').trim().split(' ');
    }

    var props = lookup[sourceNode.attr('type')] || lookup[sourceNode.attr('classid')] || { name: sourceNode.name };

    classes.push('mce-object mce-object-' + props.name);

    if (sourceNode.name == 'audio') {
        var agent = navigator.userAgent.match(/(Chrome|Safari|Gecko)/);

        if (agent) {
            classes.push('mce-object-agent-' + agent[0].toLowerCase());
        }
    }

    targetNode.attr('class', ibis.trim(classes.join(' ')));

    var styles = editor.dom.serializeStyle(style);

    if (styles) {
        targetNode.attr('style', styles);
    }

    if (!src) {
        var sources = sourceNode.getAll('source');

        if (sources.length) {
            var node = sources[0], name = 'src';

            if (targetNode.name === 'img') {
                name = 'data-mce-p-' + name;
            }

            targetNode.attr(name, node.attr('src'));
        }
    }

    if (sourceNode.name === 'object') {
        if (!sourceNode.attr('data')) {
            var params = sourceNode.getAll('param');

            each(params, function (param) {
                if (param.attr('name') === 'src' || param.attr('name') === 'url') {
                    targetNode.attr({
                        'data-mce-p-data': param.attr('value')
                    });

                    return false;
                }
            });
        }

        targetNode.attr('data-mce-p-type', props.type);
    }

    if (sourceNode.firstChild) {
        innerHtml = new ibis.html.Serializer({ inner: true }).serialize(sourceNode);
    }

    if (innerHtml) {
        targetNode.attr("data-mce-html", escape(sanitize(editor, innerHtml)));
        targetNode.empty();
    }
};

function processNodeAttributes(editor, tag, node) {
    var attribs = {}, styles = {};

    var boolAttrs = editor.schema.getBoolAttrs();

    for (var key in node.attributes.map) {
        var value = node.attributes.map[key];

        if (key === 'src' && node.name === 'img') {
            continue;
        }

        if (key === 'draggable' || key === 'contenteditable') {
            continue;
        }

        if (key.indexOf('on') === 0) {
            continue;
        }

        if (key.indexOf('data-mce-p-') === 0) {
            key = key.substring(11);
        }

        if (key === 'data-mce-width' || key === 'data-mce-height') {
            key = key.substring(9);
        }

        if (key.indexOf('data-mce-') === 0) {
            continue;
        }

        if (node.name == 'span' && node.attr('data-mce-object')) {
            continue;
        }

        if (!editor.schema.isValid(tag, key) && key.indexOf('-') == -1) {
            continue;
        }

        if (key === 'class') {
            var align = value.match(/mce-object-preview-(left|center|right)/);

            if (align) {
                styles = extend(styles, alignStylesMap[align[1]]);

                if (!node.attr('style')) {
                    node.attr('style', editor.dom.serializeStyle(styles));
                }
            }

            value = cleanClassValue(value);
        }

        if (key === 'style' && value) {
            var styleObject = editor.dom.parseStyle(value);

            // eslint-disable-next-line no-loop-func
            each(['width', 'height'], function (key) {
                if (tag === 'audio') {
                    return true;
                }

                if (!styleObject[key]) {
                    return true;
                }

                var attrValue = ibis.is(node.attr(key)) ? node.attr(key) : '';

                if (attrValue && !/\D/.test(attrValue)) {
                    attrValue += 'px';
                }

                if (attrValue && attrValue == styleObject[key]) {
                    delete styleObject[key];
                }
            });

            styleObject = extend(styleObject, styles);

            value = editor.dom.serializeStyle(styleObject);

            value = value || null;
        }

        if (key === 'src' || key === 'poster' || key === 'data') {
            value = editor.convertURL(value);
        }

        if (boolAttrs[key]) {
            value = key;
        }

        attribs[key] = value;
    }

    if (!node.attr('data')) {
        var params = node.getAll('param');

        if (params.length) {
            var param = params[0];

            var value = param.attr('src') || param.attr('url') || null;

            if (value) {
                attribs.src = editor.convertURL(value);

                param.remove();
            }
        }
    }

    return attribs;
}

var createPlaceholderNode = function (editor, node) {
    var placeHolder;

    placeHolder = new Node('img', 1);
    placeHolder.shortEnded = true;

    retainAttributesAndInnerHtml(editor, node, placeHolder);

    placeHolder.attr({
        src: transparentSrc,
        "data-mce-object": node.name
    });

    if (isNonEditable(editor, node)) {
        placeHolder.attr('contenteditable', 'false');
        placeHolder.attr('data-mce-resize', 'false');
    }

    return placeHolder;
};

function createReplacementNode(editor, node) {
    var html = new ibis.html.Serializer().serialize(node);

    var div = editor.dom.create('div', {}, html);

    return div.firstChild;
}

var createPreviewNode = function (editor, node) {
    var previewWrapper;
    var previewNode;
    var shimNode;
    var name = node.name;

    var msg = editor.getLang('media.preview_hint', 'Click to activate, ALT + Click to toggle placeholder');
    msg = msg.replace(/%s/g, 'ALT');

    if (node.attr('autoplay')) {
        node.attr('data-mce-p-autoplay', node.attr('autoplay'));

        node.attr('autoplay', null);
    }

    if (name == 'iframe' && node.attr('src')) {
        var src = node.attr('src');

        node.attr('data-mce-p-src', src);

        node.attr('src', src.replace('autoplay=1', 'autoplay=0'));
    }

    var canResize = function (node) {
        if (node.name === 'video') {
            return 'proportional';
        }

        if (node.name === 'iframe') {
            if (isSupportedMedia(editor, node.attr('src'))) {
                return 'proportional';
            }

            return 'true';
        }

        return 'false';
    };

    var classes = ['mce-object-preview', 'mce-object-' + name];

    var styles = {}, styleVal = editor.dom.parseStyle(node.attr('style'));

    each(['width', 'height'], function (key) {
        var val = node.attr(key) || styleVal[key] || '';

        if (val && !/(%|[a-z]{1,3})$/.test(val)) {
            val += 'px';
        }

        styles[key] = val;
    });

    each(styleVal, function (value, key) {
        if (/(margin|float|align)/.test(key)) {
            styles[key] = value;
        }
    });

    if (isCenterAligned(styleVal)) {
        classes.push('mce-object-preview-center');

        delete styles['margin-left'];
        delete styles['margin-right'];
    }

    if (styleVal['float']) {
        classes.push('mce-object-preview-' + styleVal['float']);

        delete styles['float'];
    }

    previewWrapper = Node.create('span', {
        'contentEditable': 'false',
        'data-mce-contenteditable': 'true',
        'data-mce-object': name,
        'class': classes.join(' '),
        'aria-details': msg,
        'data-mce-resize': canResize(node),
        'style': editor.dom.serializeStyle(styles)
    });

    previewNode = Node.create(name, {
        src: node.attr('src')
    });

    retainAttributesAndInnerHtml(editor, node, previewNode);

    shimNode = Node.create('span', {
        'class': 'mce-object-shim'
    });

    previewWrapper.append(previewNode);
    previewWrapper.append(shimNode);

    return previewWrapper;
};

var previewToPlaceholder = function (editor, node) {
    var obj = new ibis.html.DomParser({}, editor.schema).parse(node.innerHTML);
    var ifr = obj.firstChild;

    var placeholder = createPlaceholderNode(editor, ifr);

    var replacement = createReplacementNode(editor, placeholder);

    editor.dom.replace(replacement, node);

    return replacement;
};

var placeholderToPreview = function (editor, node) {
    var name;

    var placeholder = new Node('img', 1);
    placeholder.shortEnded = true;

    var attributes = node.attributes, i = attributes.length;

    while (i--) {
        name = attributes[i].nodeName;
        placeholder.attr(name, '' + node.getAttribute(name));
    }

    var elm = nodeToMedia(editor, placeholder);

    var preview = createPreviewNode(editor, elm);

    var replacement = createReplacementNode(editor, preview);

    editor.dom.replace(replacement, node);

    return replacement;
};

function nodeToMedia(editor, node) {
    var elm, tag = node.attr('data-mce-object'), attribs = {};

    if (isResponsiveMedia(node)) {
        var parent = node.parent;

        parent.attr('contenteditable', null);
        parent.attr('data-mce-contenteditable', null);
    }

    elm = new Node(tag, 1);

    attribs = processNodeAttributes(editor, tag, node);

    if (/\s*mce-object-preview\s*/.test(node.attr('class')) && node.firstChild && node.firstChild.name === tag) {
        node = node.firstChild;
    }

    attribs = extend(attribs, processNodeAttributes(editor, tag, node));

    elm.attr(attribs);

    var html = node.attr('data-mce-html');

    if (html) {
        var childNodes = parseHTML(unescape(html));

        each(childNodes, function (child) {
            var inner;

            if (child.name === 'html') {
                var inner = new Node('#text', 3);
                inner.raw = true;
                inner.value = sanitize(editor, child.value);
                elm.append(inner);
            } else {
                var inner = new Node(child.name, 1);

                inner.shortEnded = true;

                each(child.value, function (val, key) {
                    if (htmlSchema.isValid(inner.name, key)) {
                        inner.attr(key, val);
                    }
                });

                elm.append(inner);

                if (inner.name == 'source' && inner.attr('src') == elm.attr('src')) {
                    elm.attr('src', null);
                }
            }
        });
    }

    elm.attr('data-mce-html', null);

    if (tag === 'object' && elm.getAll('embed').length === 0 && objectRequiresEmbed(elm.attr('type'))) {
        var embed = new Node('embed', 1);

        embed.shortEnded = true;

        each(attribs, function (value, name) {
            if (name === 'data') {
                embed.attr('src', value);
            }

            if (htmlSchema.isValid('embed', name)) {
                embed.attr(name, value);
            }
        });

        elm.append(embed);
    }

    if (tag === 'iframe') {
        updateSandbox(editor, elm);
    }

    return elm;
}

var convertPlaceholderToMedia = function (editor, node) {
    var elm = nodeToMedia(editor, node);

    if (!isObjectEmbed(elm.name)) {
        node.empty();
    }

    node.replace(elm);
    node.empty();

    return elm;
};

var convertMediaToPlaceholder = function (editor, node) {
    var media_live_embed = editor.settings.media_live_embed;
    var strict_embed = editor.settings.media_strict_embed !== false;

    if (node.parent.attr('data-mce-object')) {
        return false;
    }

    if (node.firstChild && node.firstChild.attr('data-mce-type') == 'bookmark') {
        node.firstChild.remove();
    }

    if (node.name === 'iframe') {
        if (!node.attr('src')) {
            media_live_embed = false;
        } else if (validateIframe(editor, node) === false) {
            node.remove();
            return false;
        }
    }

    if (!isValidElement(editor, node.name) && !isNonEditable(editor, node)) {
        node.remove();
        return false;
    }

    if (node.name !== 'iframe') {
        var src = node.attr('src') || node.attr('data') || '';

        var type = node.attr('type') || node.attr('data-mce-p-type') || '';

        if (!src) {
            if (node.name === 'video' || node.name === 'audio') {
                var sources = node.getAll('source');

                for (var j = 0; j < sources.length; j++) {
                    var source = sources[j];

                    if (!source.attr('src')) {
                        continue;
                    }

                    if (!isSupportedUrl(editor, node.name, source.attr('src'))) {
                        source.remove();
                        sources.splice(j, 1);
                    }
                }

                if (sources.length) {
                    src = sources[0].attr('src');
                    type = sources[0].attr('type') || type;
                }
            }

            if (node.name === 'object') {
                var params = node.getAll('param');

                if (params.length) {
                    for (var j = 0; j < params.length; j++) {
                        var param = params[j];

                        if (param.attr('movie')) {
                            src = param.attr('value');
                        }
                    }
                }

                if (!src) {
                    var embed = node.getAll('embed');

                    if (embed.length) {
                        src = embed[0].attr('src');
                        type = embed[0].attr('type') || type;
                    }
                }
            }
        }

        if (src) {
            if (!isSupportedUrl(editor, node.name, src)) {
                node.remove();
                return false;
            }
        } else {
            media_live_embed = false;
            return false;
        }

        if (strict_embed) {
            var newName = isSupportedMedia(editor, src, type);

            if (!newName) {
                node.remove();
                return false;
            }

            if (newName == 'iframe' && !isSupportedProvider(editor, src)) {
                node.remove();
                return false;
            }

            if (newName !== node.name) {
                // eslint-disable-next-line no-loop-func
                each(node.children(), function (elm) {
                    if (!editor.schema.isValidChild(newName, elm.name)) {
                        elm.remove();
                    }
                });
            }

            node.name = newName;

            node.attr('src', src);

            if (newName == 'object') {
                node.attr('data', src);

                node.attr('src', null);

                var cleanSrc = stripQuery(src);

                var ext = cleanSrc.split('.').pop();

                node.attr('type', mimes[ext] || 'application/octet-stream');
            }
        }
    }

    if (media_live_embed && !isObjectEmbed(node.name) && !isResponsiveMedia(node) && !isNonEditable(editor, node)) {
        if (!isWithinEmbed(node)) {
            node.replace(createPreviewNode(editor, node));
        }
    } else {
        if (!isWithinEmbed(node)) {
            if (isResponsiveMedia(node)) {
                node.parent.attr({
                    'contentEditable': 'false',
                    'data-mce-contenteditable': 'true'
                });
            }

            node.replace(createPlaceholderNode(editor, node));
        }
    }
};

var placeHolderConverter = function (editor) {
    return function (nodes) {
        var i = nodes.length;
        var node;

        while (i--) {
            node = nodes[i];

            if (!node.parent) {
                continue;
            }

            if (convertMediaToPlaceholder(editor, node) === false) {
                continue;
            }
        }
    };
};

export {
    sanitize, isValidNode, isResponsiveMedia, isWithinEmbed,
    retainAttributesAndInnerHtml, processNodeAttributes,
    createPlaceholderNode, createReplacementNode, createPreviewNode,
    previewToPlaceholder, placeholderToPreview,
    nodeToMedia, convertPlaceholderToMedia, convertMediaToPlaceholder,
    placeHolderConverter
};
