import { each, extend, htmlSchema, transparentSrc, isPreviewMedia, isCenterAligned, isUrlValue, stripQuery, parseHTML } from './Utils.js';
import { isSupportedMedia } from './Providers.js';

function getMediaHtml(ed, value) {
    if (typeof value == "string") {
        value = { 'src': value };
    }

    var html, nodeName = 'iframe', attribs = {}, innerHTML = '';

    var src = stripQuery(value.src);

    if (/\.(mp4|m4v|ogg|webm|ogv)$/.test(src)) {
        nodeName = 'video';
    } else if (/\.(mp3|m4a|oga)$/.test(src)) {
        nodeName = 'audio';
    }

    nodeName = value.mediatype || nodeName;

    var boolAttrs = ed.schema.getBoolAttrs();

    each(value, function (val, name) {
        if (val == '' && !boolAttrs[name]) {
            return true;
        }

        if (value.innerHTML) {
            innerHTML = value.innerHTML;
        }

        if (ed.schema.isValid(nodeName, name) || name.indexOf('-') !== -1) {
            if (name == 'class') {
                val = val.replace(/mce-(\S+)/g, '').replace(/\s+/g, ' ').trim();
            }

            attribs[name] = val;
        }
    });

    if (nodeName == 'iframe' && !attribs.sandbox) {
        attribs.sandbox = '';
    }

    html = ed.dom.createHTML(nodeName, attribs, innerHTML);

    return html;
}

function isMediaHtml(ed, html) {
    var trimmedString = html.trim();
    var match = trimmedString.match(/^<([a-zA-Z0-9]+)\b/);

    if (match) {
        return isPreviewMedia(match[1].toLowerCase());
    }

    return false;
}

function htmlToData(ed, mediatype, html) {
    var data = {
        innerHTML: ''
    };

    try {
        html = unescape(html);
    } catch (e) {
        // error
    }

    var nodes = parseHTML(html);

    each(nodes, function (node, i) {
        if (node.name == "source") {
            if (!data.source) {
                data.source = [];
            }

            var val = ed.convertURL(node.value.src);

            data.source.push(val);
        }

        if (node.name == "param") {
            if (isUrlValue(node.value.name)) {
                node.value.value = ed.convertURL(node.value.value);
            }

            data[node.value.name] = node.value.value;
        }

        if (node.name == "track") {
            data.innerHTML += ed.dom.createHTML(node.name, node.value);
        }

        if (node.name == "html") {
            data.innerHTML += node.value;
        }
    });

    return data;
}

var getMediaData = function (ed) {
    var data = {}, mediatype;
    var node = ed.dom.getParent(ed.selection.getNode(), '[data-mce-object]');

    var boolAttrs = ed.schema.getBoolAttrs();

    if (!node || node.nodeType != 1) {
        return data;
    }

    if (node.className.indexOf('mce-object-preview') !== -1) {

        var i, attribs = node.attributes;

        for (i = attribs.length - 1; i >= 0; i--) {
            var item = attribs.item(i),
                name = item.name,
                value;

            if (name == 'contenteditable') {
                continue;
            }

            if (name.indexOf('data-mce-') == -1 && name.indexOf('aria-') == -1) {
                data[name] = ed.dom.getAttrib(node, name);
            }
        }

        node = ed.dom.select('audio,video,iframe', node)[0];
    }

    mediatype = node.getAttribute('data-mce-object') || node.nodeName.toLowerCase();

    var html = ed.dom.getAttrib(node, 'data-mce-html');

    if (html) {
        data = extend(data, htmlToData(ed, mediatype, html));
    }

    data.src = ed.dom.getAttrib(node, 'data-mce-p-src') || ed.dom.getAttrib(node, 'data-mce-p-data') || ed.dom.getAttrib(node, 'src');

    data.src = ed.convertURL(data.src);

    if (data.src == transparentSrc) {
        data.src = '';
    }

    var i, attribs = node.attributes;

    for (i = attribs.length - 1; i >= 0; i--) {
        var item = attribs.item(i),
            name = item.name,
            value;

        value = ed.dom.getAttrib(node, name);

        if (name.indexOf('data-mce-p-') !== -1) {
            name = name.substr(11);
        }

        if (name === "data" || name === "src") {
            continue;
        }

        if (name === "type" || name === "codebase" || name === "classid") {
            continue;
        }

        if (name === "poster") {
            value = ed.convertURL(value);
        }

        if (name === 'flashvars') {
            value = decodeURIComponent(value);
        }

        if (name.indexOf('data-mce-') !== -1) {
            continue;
        }

        if (name == 'class') {
            value = value.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim();
        }

        if (boolAttrs[name]) {
            value = true;
        }

        data[name] = value;
    }

    each(['width', 'height'], function (key) {
        var val = ed.dom.getAttrib(node, key);

        if (val) {
            data[key] = val;
        } else {
            val = ed.dom.getStyle(node, key);

            if (val && val.indexOf('%') === -1 && !isNaN(parseInt(val, 10))) {
                data[key] = parseInt(val, 10);
            }
        }
    });

    data.mediatype = mediatype;

    return data;
};

var updateMedia = function (ed, data, elm) {
    var preview, attribs = {}, node = ed.dom.getParent(elm || ed.selection.getNode(), '[data-mce-object]');
    var boolAttrs = ed.schema.getBoolAttrs();

    boolAttrs.preload = true;

    var nodeName = node.nodeName.toLowerCase();

    each(['block', 'center', 'left', 'right'], function (val) {
        ed.dom.removeClass(node, 'mce-object-preview-' + val);
    });

    if (node.className.indexOf('mce-object-preview') !== -1) {
        preview = node;

        nodeName = node.getAttribute('data-mce-object');

        node = ed.dom.select(nodeName, node)[0];
    }

    if (preview) {
        preview.removeAttribute('style');
    }

    each(data, function (value, name) {
        if (name === 'innerHTML' && value) {
            attribs['data-mce-html'] = escape(value);
            return true;
        }

        if (nodeName !== 'img' && (!htmlSchema.isValid(nodeName, name) && name.indexOf('-') == -1)) {
            return true;
        }

        if (name in boolAttrs && (value == "false" || !value)) {
            value = null;

            if (name == 'autoplay') {
                attribs['data-mce-p-' + name] = null;
            }
        }

        if (nodeName === 'img' && (!htmlSchema.isValid(nodeName, name) || name === 'src') && value !== null) {
            attribs['data-mce-p-' + name] = value;
            return true;
        }

        if (nodeName == 'iframe' && name == 'src') {
            attribs['data-mce-p-' + name] = value;
            value = value.replace('autoplay=1', 'autoplay=1');
        }

        if (name == 'class' && value) {
            ed.dom.addClass(node, value);
            return true;
        }

        if (name == 'style') {

            if (value) {
                if (ibis.is(value, 'object')) {
                    value = ed.dom.serializeStyle(value);
                }

                ed.dom.setStyles(node, ed.dom.parseStyle(value));

                return true;
            }

            value = null;
        }

        if (name == 'sandbox' && value === false) {
            value = null;
        }

        attribs[name] = value;
    });

    ed.dom.setAttribs(node, attribs);

    var styleObject = ed.dom.parseStyle(node.getAttribute('style'));

    if (preview) {
        if (isCenterAligned(styleObject)) {
            ed.dom.addClass(preview, 'mce-object-preview-center');
        }

        if (styleObject['float']) {
            ed.dom.addClass(preview, 'mce-object-preview-' + styleObject['float']);
        }
    }

    each(['width', 'height'], function (key) {
        if (attribs[key]) {
            ed.dom.setStyle(node, key, attribs[key]);

            if (preview) {
                ed.dom.setStyle(preview, key, attribs[key]);
            }
        }
    });
};

export { getMediaHtml, isMediaHtml, htmlToData, getMediaData, updateMedia };
