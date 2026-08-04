var each = ibis.each,
    extend = ibis.extend,
    Node = ibis.html.Node,
    VK = ibis.VK,
    Serializer = ibis.html.Serializer,
    DomParser = ibis.html.DomParser,
    SaxParser = ibis.html.SaxParser,
    DOM = ibis.DOM;

var htmlSchema = new ibis.html.Schema({ schema: 'mixed' });

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
    return ibis.inArray(['src', 'data', 'movie', 'url', 'source'], name) !== -1;
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
        value = ibis.trim(value);

        value = value.length > 0 ? value : null;
    }

    return value || null;
}

function parseHTML(value) {
    var nodes = [];

    // template content is inert, so nothing is fetched and no scripts run
    var template = document.createElement('template');
    template.innerHTML = value;

    // extract the media child nodes, leaving the rest as html
    each(template.content.querySelectorAll('source,param,embed,track'), function (elm) {
        var attribs = {};

        each(elm.attributes, function (attr) {
            attribs[attr.name] = attr.value;
        });

        nodes.push({ 'name': elm.nodeName.toLowerCase(), 'value': attribs });

        elm.remove();
    });

    var settings = {
        invalid_elements: 'source,param,embed,track',
        forced_root_block: false,
        verify_html: true,
        validate: true
    };

    var schema = new ibis.html.Schema(settings);

    var content = new Serializer(settings, schema).serialize(new DomParser(settings, schema).parse(template.innerHTML));

    nodes.push({ 'name': 'html', 'value': content });

    return nodes;
}

export {
    each, extend, Node, VK, Serializer, DomParser, SaxParser, DOM,
    htmlSchema, transparentSrc, alignStylesMap,
    isNonEditable, isPreviewMedia, isObjectEmbed, isCenterAligned,
    isAbsoluteUrl, isLocalUrl, isUrlValue, stripQuery, normalizeUrl, escapeRegex,
    cleanClassValue, parseHTML
};
