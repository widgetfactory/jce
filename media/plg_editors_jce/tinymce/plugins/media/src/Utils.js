var each = tinymce.each,
    extend = tinymce.extend,
    Node = tinymce.html.Node,
    VK = tinymce.VK,
    Serializer = tinymce.html.Serializer,
    DomParser = tinymce.html.DomParser,
    SaxParser = tinymce.html.SaxParser,
    DOM = tinymce.DOM;

// Polyfill for String.prototype.startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (search, pos) {
        pos = pos || 0;
        return this.substring(pos, pos + search.length) === search;
    };
}

// ES5-compatible indexOf helper
function indexOf(array, item) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === item) {
            return i;
        }
    }
    return -1;
}

var htmlSchema = new tinymce.html.Schema({ schema: 'mixed' });

var transparentSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

var alignStylesMap = {
    left: { float: 'left' },
    center: { 'display': 'block', 'margin-left': 'auto', 'margin-right': 'auto' },
    right: { float: 'right' }
};

function isNonEditable(ed, node) {
    var nonEditClass = ed.settings.noneditable_noneditable_class || 'mceNonEditable';

    if (node.attr) {
        return node.hasClass(nonEditClass);
    }

    return DOM.hasClass(node, nonEditClass);
}

function isPreviewMedia(type) {
    return type == 'iframe' || type == 'video' || type == 'audio';
}

function isObjectEmbed(type) {
    return !isPreviewMedia(type);
}

function isCenterAligned(style) {
    return style.display == 'block' && style['margin-left'] == 'auto' && style['margin-right'] == 'auto';
}

var isAbsoluteUrl = function (url) {
    if (!url) {
        return false;
    }

    if (url.indexOf('//') === 0) {
        return true;
    }

    return url.indexOf('://') > 0;
};

var isLocalUrl = function (editor, url) {
    if (isAbsoluteUrl(url)) {
        var relative = editor.documentBaseURI.toRelative(url);

        return isAbsoluteUrl(relative) === false;
    }

    return true;
};

function isUrlValue(name) {
    return tinymce.inArray(['src', 'data', 'movie', 'url', 'source'], name) !== -1;
}

function stripQuery(value) {
    if (value) {
        const match = value.match(/^(.*?\.[a-z0-9]{2,10})(?:[?#&].*|$)/i);

        return match ? match[1] : value;
    }

    return value;
}

function normalizeUrl(u) {
    u = (u || '').trim();

    if (u.startsWith('//')) {
        u = 'placeholder:' + u;
    } else if (!/:\/\//i.test(u)) {
        u = 'placeholder://' + u;
    }

    try {
        var p = new URL(u);
        var host = p.hostname.replace(/^www\./i, '');
        var path = p.pathname.replace(/\/+$/, '');

        return (host + path).toLowerCase();
    } catch (e) {
        return u
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .replace(/\/+$/, '')
            .toLowerCase();
    }
}

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanClassValue(value) {
    if (value) {
        value = value.replace(/\s?mce-([\w-]+)/g, '').replace(/\s+/g, ' ');
        value = tinymce.trim(value);

        value = value.length > 0 ? value : null;
    }

    return value || null;
}

function parseHTML(value) {
    var nodes = [];

    new SaxParser({
        start: function (name, attrs) {
            if (name === "source" && attrs.map) {
                nodes.push({ 'name': name, 'value': attrs.map });
            } else if (name === "param") {
                nodes.push({ 'name': name, 'value': attrs.map });
            } else if (name === "embed") {
                nodes.push({ 'name': name, 'value': attrs.map });
            } else if (name === "track") {
                nodes.push({ 'name': name, 'value': attrs.map });
            }
        }
    }).parse(value);

    var settings = {
        invalid_elements: 'source,param,embed,track',
        forced_root_block: false,
        verify_html: true,
        validate: true
    };

    var schema = new tinymce.html.Schema(settings);

    var content = new Serializer(settings, schema).serialize(new DomParser(settings, schema).parse(value));

    nodes.push({ 'name': 'html', 'value': content });

    return nodes;
}

export {
    each, extend, Node, VK, Serializer, DomParser, SaxParser, DOM,
    htmlSchema, transparentSrc, alignStylesMap,
    indexOf, isNonEditable, isPreviewMedia, isObjectEmbed, isCenterAligned,
    isAbsoluteUrl, isLocalUrl, isUrlValue, stripQuery, normalizeUrl, escapeRegex,
    cleanClassValue, parseHTML
};
