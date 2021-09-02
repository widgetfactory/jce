/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each,
        extend = tinymce.extend,
        Node = tinymce.html.Node,
        VK = tinymce.VK,
        Serializer = tinymce.html.Serializer,
        DomParser = tinymce.html.DomParser,
        SaxParser = tinymce.html.SaxParser;

    var htmlSchema = new tinymce.html.Schema({ schema: 'mixed' });

    // media that can be previewed, eg: audio, video, iframe
    function isPreviewMedia(type) {
        return type === 'iframe' || type === 'video' || type === 'audio';
    }

    // media that use the <object> tag, eg: flash, quicktime etc.
    function isObjectEmbed(type) {
        return !isPreviewMedia(type);
    }

    function isSupportedMedia(url) {
        // youtube
        if (/youtu(\.)?be(.+)?\/(.+)/.test(url)) {
            return 'youtube';
        }
        // vimeo
        if (/vimeo(.+)?\/(.+)/.test(url)) {
            return 'vimeo';
        }
        // Dailymotion
        if (/dai\.?ly(motion)?(\.com)?/.test(url)) {
            return 'dailymotion';
        }
        // Scribd
        if (/scribd\.com\/(.+)/.test(url)) {
            return 'scribd';
        }
        // Slideshare
        if (/slideshare\.net\/(.+)\/(.+)/.test(url)) {
            return 'slideshare';
        }
        // Soundcloud
        if (/soundcloud\.com\/(.+)/.test(url)) {
            return 'soundcloud';
        }
        // Spotify
        if (/spotify\.com\/(.+)/.test(url)) {
            return 'spotify';
        }
        // TED
        if (/ted\.com\/talks\/(.+)/.test(url)) {
            return 'ted';
        }
        // Twitch
        if (/twitch\.tv\/(.+)/.test(url)) {
            return 'twitch';
        }
        // Facebook
        /*if (/www\.facebook\.com\/(.+)?(posts|videos)\/(.+)/.test(url)) {
            return 'facebook';
        }
        // Instagram
        if (/instagr\.?am(.+)?\/(.+)/.test(url)) {
            return 'instagram';
        }*/

        // Video
        if (/\.(mp4|ogv|ogg|webm)$/.test(url)) {
            return 'video';
        }

        // Audio
        if (/\.(mp3|ogg|webm|wav|m4a|aiff)$/.test(url)) {
            return 'audio';
        }

        // Quicktime
        if (/\.(mov|qt|mpg|mpeg|m4a|aiff)$/.test(url)) {
            return 'quicktime';
        }

        // Flash
        if (/\.swf$/.test(url)) {
            return 'flash';
        }

        // Quicktime
        if (/\.(avi|wmv|wm|asf|asx|wmx|wvx)$/.test(url)) {
            return 'windowsmedia';
        }

        return false;
    }

    var isAbsoluteUrl = function (url) {
        return url && (url.indexOf('://') > 0 || url.indexOf('//') === 0);
    };

    var isLocalUrl = function (editor, url) {
        if (isAbsoluteUrl(url)) {
            // try and convert to relative
            var relative = editor.documentBaseURI.toRelative(url);

            // is result still absolute?
            return isAbsoluteUrl(relative) === false;
        }

        return true;
    };

    var validateIframe = function (editor, node) {
        var src = node.attr('src');

        if (editor.settings.iframes_allow_supported) {
            if (!src) {
                return false;
            }

            if (isLocalUrl(editor, src)) {
                return true;
            }

            if (isSupportedMedia(src) !== false) {
                return true;
            }

            return false;
        }

        if (editor.settings.iframes_allow_local) {
            if (!src) {
                return false;
            }

            return isLocalUrl(editor, src);
        }

        return true;
    };

    var sanitize = function (editor, html) {
        var writer = new tinymce.html.Writer();
        var blocked;

        new tinymce.html.SaxParser({
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

    /**
     * Check that a node is valid to be processed, ie: must have a url of some sort
     * @param {tinymce.html.Node} node 
     */
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

        // create new schema
        var schema = new tinymce.html.Schema(settings);

        // clean content
        var content = new Serializer(settings, schema).serialize(new DomParser(settings, schema).parse(value));

        nodes.push({ 'name': 'html', 'value': content });

        return nodes;
    }

    function isUrlValue(name) {
        return tinymce.inArray(['src', 'data', 'movie', 'url', 'source'], name) !== -1;
    }

    // Media types supported by this plugin
    var mediaTypes = {
        // Type, clsid, mime types, codebase
        "flash": {
            classid: "CLSID:D27CDB6E-AE6D-11CF-96B8-444553540000",
            type: "application/x-shockwave-flash",
            codebase: "http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,1,53,64"
        },
        "shockwave": {
            classid: "CLSID:166B1BCA-3F9C-11CF-8075-444553540000",
            type: "application/x-director",
            codebase: "http://download.macromedia.com/pub/shockwave/cabs/director/sw.cab#version=10,2,0,023"
        },
        "windowsmedia": {
            classid: "CLSID:6BF52A52-394A-11D3-B153-00C04F79FAA6",
            type: "application/x-mplayer2",
            codebase: "http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab#Version=10,00,00,3646"
        },
        "quicktime": {
            classid: "CLSID:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B",
            type: "video/quicktime",
            codebase: "http://www.apple.com/qtactivex/qtplugin.cab#version=7,3,0,0"
        },
        "divx": {
            classid: "CLSID:67DABFBF-D0AB-41FA-9C46-CC0F21721616",
            type: "video/divx",
            codebase: "http://go.divx.com/plugin/DivXBrowserPlugin.cab"
        },
        "realmedia": {
            classid: "CLSID:CFCDAA03-8BE4-11CF-B84B-0020AFBBCCFA",
            type: "audio/x-pn-realaudio-plugin"
        },
        "java": {
            classid: "CLSID:8AD9C840-044E-11D1-B3E9-00805F499D93",
            type: "application/x-java-applet",
            codebase: "http://java.sun.com/products/plugin/autodl/jinstall-1_5_0-windows-i586.cab#Version=1,5,0,0"
        },
        "silverlight": {
            classid: "CLSID:DFEAF541-F3E1-4C24-ACAC-99C30715084A",
            type: "application/x-silverlight-2"
        },
        "video": {
            type: 'video/mpeg'
        },
        "audio": {
            type: 'audio/mpeg'
        },
        "iframe": {}
    };

    var lookup = {};
    var mimes = {};

    // Parses the default mime types string into a mimes lookup map
    (function (data) {
        var items = data.split(/,/),
            i, y, ext;

        for (i = 0; i < items.length; i += 2) {
            ext = items[i + 1].split(/ /);

            for (y = 0; y < ext.length; y++) {
                mimes[ext[y]] = items[i];
            }
        }
    })(
        "application/x-director,dcr," +
        "video/divx,divx," +
        "application/pdf,pdf," +
        "application/x-shockwave-flash,swf swfl," +
        "audio/mpeg,mpga mpega mp2 mp3," +
        "audio/ogg,ogg spx oga," +
        "audio/x-wav,wav," +
        "video/mpeg,mpeg mpg mpe," +
        "video/mp4,mp4 m4v," +
        "video/ogg,ogg ogv," +
        "video/webm,webm," +
        "video/quicktime,qt mov," +
        "video/x-flv,flv," +
        "video/vnd.rn-realvideo,rv," +
        "video/3gpp,3gp," +
        "video/x-matroska,mkv"
    );

    each(mediaTypes, function (value, key) {
        value.name = key;

        if (value.classid) {
            lookup[value.classid] = value;
        }

        if (value.type) {
            lookup[value.type] = value;
        }

        lookup[key.toLowerCase()] = value;
    });

    function cleanClassValue(value) {
        if (value) {
            value = value.replace(/\s?mce-([\w-]+)/g, '').replace(/\s+/g, ' ');
            value = tinymce.trim(value);

            value = value.length > 0 ? value : null;
        }

        return value || null;
    }

    var createPlaceholderNode = function (editor, node) {
        var placeHolder;

        placeHolder = new Node('img', 1);
        placeHolder.shortEnded = true;

        retainAttributesAndInnerHtml(editor, node, placeHolder);

        placeHolder.attr({
            src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            "data-mce-object": node.name
        });

        return placeHolder;
    };

    var previewToPlaceholder = function (editor, node) {
        var obj = new tinymce.html.DomParser({}, editor.schema).parse(node.innerHTML);
        var ifr = obj.firstChild;

        var placeholder = createPlaceholderNode(editor, ifr);
        var html = new tinymce.html.Serializer().serialize(placeholder);

        editor.dom.replace(editor.dom.createFragment(html), node);
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

        var html = new tinymce.html.Serializer().serialize(preview);

        editor.dom.replace(editor.dom.createFragment(html), node);
    };

    var createPreviewNode = function (editor, node) {
        var previewWrapper;
        var previewNode;
        var shimNode;
        var name = node.name;

        var msg = editor.getLang('media.preview_hint', 'Click to activate, %s + Click to toggle placeholder');
        msg = msg.replace(/%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

        // disable autoplay
        if (node.attr('autoplay')) {
            node.attr('data-mce-p-autoplay', node.attr('autoplay'));

            node.attr('autoplay', null);
        }

        var canResize = function (node) {
            if (node.name === 'video') {
                return 'proportional';
            }

            if (node.name === 'iframe') {
                if (isSupportedMedia(node.attr('src'))) {
                    return 'proportional';
                }

                return 'true';
            }

            return 'false';
        };

        var styles = {}, styleVal = editor.dom.parseStyle(node.attr('style'));

        each(['width', 'height'], function (key) {
            var val = node.attr(key) || styleVal[key] || '';

            if (val && !/(%|[a-z]{1,3})$/.test(val)) {
                val += 'px';
            }

            styles[key] = val;
        });

        // keep some styles
        each(styleVal, function (value, key) {
            if (/(margin|float|align)/.test(key)) {
                styles[key] = value;
            }
        });

        previewWrapper = Node.create('span', {
            'contentEditable': 'false',
            'data-mce-object': name,
            'class': 'mce-object-preview mce-object-' + name,
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

    function processNodeAttributes(editor, tag, node) {
        var attribs = {};

        // get boolean attributes
        var boolAttrs = editor.schema.getBoolAttrs();

        // process attributes
        for (var key in node.attributes.map) {
            var value = node.attributes.map[key];

            // skip src attribute on img placeholder
            if (key === 'src' && node.name === 'img') {
                continue;
            }

            // internal
            if (key === 'draggable' || key === 'contenteditable') {
                continue;
            }

            // skip events
            if (key.indexOf('on') === 0) {
                continue;
            }

            if (key.indexOf('data-mce-p-') === 0) {
                key = key.substr(11);
            }

            if (key === 'data-mce-width' || key === 'data-mce-height') {
                key = key.substr(9);
            }

            // skip invalid tags but not custom dash attributes, eg: data-* or uk-* etc.
            if (!editor.schema.isValid(tag, key) && key.indexOf('-') === -1) {
                continue;
            }

            if (key === 'class') {
                value = cleanClassValue(value);
            }

            if (key === 'style' && value) {
                var styleObject = editor.dom.parseStyle(value);

                // eslint-disable-next-line no-loop-func
                each(['width', 'height'], function (key) {
                    // skip processing in audio element
                    if (tag === 'audio') {
                        return true;
                    }

                    if (!styleObject[key]) {
                        return true;
                    }

                    // if the attribute value exists, remove the style value
                    if (tinymce.is(node.attr(key))) {
                        delete styleObject[key];
                    }
                });

                value = editor.dom.serializeStyle(styleObject);

                // remove if empty
                value = value || null;
            }

            if (key === 'src' || key === 'poster' || key === 'data') {
                value = editor.convertURL(value);
            }

            // set value to key name for boolean attribtues, eg: autoplay="autoplay"
            if (boolAttrs[key]) {
                value = key;
            }

            attribs[key] = value;
        }

        // no data attribute set, use <source> node
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

    /**
     * Convert a placeholder node into the media HTML
     * @param {tinymce/Editor} editor 
     * @param {tinymce/html/Node} node 
     */
    function nodeToMedia(editor, node) {
        var elm, tag = node.attr('data-mce-object'), attribs = {};

        elm = new Node(tag, 1);

        if (/\s*mce-object-preview\s*/.test(node.attr('class')) && node.firstChild && node.firstChild.name === tag) {
            node = node.firstChild;
        }

        attribs = processNodeAttributes(editor, tag, node);

        elm.attr(attribs);

        // process innerHTML to nodes and append
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

                    // short ended for <param /> and <source />
                    if (child.name != 'embed') {
                        inner.shortEnded = true;
                    }

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

        // remove html attribute
        elm.attr('data-mce-html', null);

        // add embed for some object media
        if (tag === 'object' && elm.getAll('embed').length === 0 && elm.attr('type') !== 'application/x-shockwave-flash') {
            var embed = new Node('embed', 1);

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

        return elm;
    }

    var convertPlaceholderToMedia = function (editor, node) {
        var elm = nodeToMedia(editor, node);

        if (!isObjectEmbed(elm.name)) {
            node.empty();
        }

        node.replace(elm);
        node.empty();
    };

    /**
     * Process media HTML attributes
     * @param {*} editor 
     * @param {*} sourceNode 
     * @param {*} targetNode 
     */
    var retainAttributesAndInnerHtml = function (editor, sourceNode, targetNode) {
        var attrName;
        var attrValue;
        var attribs;
        var ai;
        var innerHtml;
        var styles;

        var style = editor.dom.parseStyle(sourceNode.attr('style'));

        // get width an height
        var width = sourceNode.attr('width') || style.width || '';
        var height = sourceNode.attr('height') || style.height || '';

        var style = editor.dom.parseStyle(sourceNode.attr('style'));

        var legacyAttributes = ['bgcolor', 'align', 'border', 'vspace', 'hspace'];

        // attributes that should be styles
        tinymce.each(legacyAttributes, function (na) {
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

                // remove
                sourceNode.attr(na, null);
            }
        });

        attribs = sourceNode.attributes;
        ai = attribs.length;

        while (ai--) {
            attrName = attribs[ai].name;
            attrValue = attribs[ai].value;

            // when converting from preview to placeholder
            if (attrName === 'data-mce-html') {
                targetNode.attr(attrName, attrValue);
                continue;
            }

            // internal attribute for pasted media
            if (attrName === 'data-mce-clipboard-media') {
                targetNode.attr(attrName, attrValue);
                continue;
            }

            // skip internal attributes but not placeholder attributes
            if (attrName.indexOf('data-mce') !== -1) {
                if (attrName.indexOf('data-mce-p-') === -1) {
                    continue;
                }
            }

            // node uses img placeholder, so store element specific attributes
            if (targetNode.name === 'img' && (!htmlSchema.isValid('img', attrName) || attrName == 'src')) {
                attrName = 'data-mce-p-' + attrName;
            }

            // suppress events
            if (attrName.indexOf('on') === 0 && editor.settings.allow_event_attributes) {
                attrName = 'data-mce-p-' + attrName;
            }

            // allow for data-* and custom dash attributes, eg: uk-*
            if (attrName.indexOf('-') !== -1) {
                targetNode.attr(attrName, attrValue);
                continue;
            }

            if (htmlSchema.isValid(targetNode.name, attrName)) {
                targetNode.attr(attrName, attrValue);
            }
        }

        if (width) {
            style.width = /^[0-9.]+$/.test(width) ? (width + 'px') : width;
        }

        if (height) {
            style.height = /^[0-9.]+$/.test(height) ? (height + 'px') : height;
        }

        // get classes as array
        var classes = [];

        if (sourceNode.attr('class')) {
            classes = sourceNode.attr('class').replace(/mce-(\S+)/g, '').replace(/\s+/g, ' ').trim().split(' ');
        }

        var props = lookup[sourceNode.attr('type')] || lookup[sourceNode.attr('classid')] || { name: sourceNode.name };

        // add identifier class
        classes.push('mce-object mce-object-' + props.name);

        if (sourceNode.name == 'audio') {
            var agent = navigator.userAgent.match(/(Chrome|Safari|Gecko)/);

            if (agent) {
                classes.push('mce-object-agent-' + agent[0].toLowerCase());
            }
        }

        // Set class
        targetNode.attr('class', tinymce.trim(classes.join(' ')));

        var styles = editor.dom.serializeStyle(style);

        // add styles
        if (styles) {
            targetNode.attr('style', styles);
        }

        // no src attribute set, use <source> node
        if (!sourceNode.attr('src')) {
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
            // no data attribute set, use <param> node
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
            // media type
            targetNode.attr('data-mce-p-type', props.type);
        }

        // Place the inner HTML contents inside an escaped attribute
        // This enables us to copy/paste the fake object
        if (sourceNode.firstChild) {
            innerHtml = new tinymce.html.Serializer({ inner: true }).serialize(sourceNode);
        }

        if (innerHtml) {
            targetNode.attr("data-mce-html", escape(sanitize(editor, innerHtml)));
            targetNode.empty();
        }
    };

    var isWithinEmbed = function (node) {
        while ((node = node.parent)) {
            if (node.attr('data-mce-object')) {
                return true;
            }
        }

        return false;
    };

    var placeHolderConverter = function (editor) {
        var invalid_elements = editor.settings.invalid_elements.split(',');

        return function (nodes) {
            var i = nodes.length;
            var node;

            while (i--) {
                node = nodes[i];

                if (!node.parent) {
                    continue;
                }

                if (node.parent.attr('data-mce-object')) {
                    continue;
                }

                // mark iframe for removal if invalid
                if (node.name === 'iframe' && validateIframe(editor, node) === false) {
                    invalid_elements.push('iframe');
                }

                // if valid node (validate == false)
                if (tinymce.inArray(invalid_elements, node.name) !== -1) {
                    node.remove();
                    continue;
                }

                if (editor.settings.media_live_embed && !isObjectEmbed(node.name)) {
                    if (!isWithinEmbed(node)) {
                        node.replace(createPreviewNode(editor, node));
                    }
                } else {
                    if (!isWithinEmbed(node)) {
                        node.replace(createPlaceholderNode(editor, node));
                    }
                }
            }
        };
    };

    function htmlToData(ed, mediatype, html) {
        var data = {};

        try {
            html = unescape(html);
        } catch (e) {
            // error
        }

        var nodes = parseHTML(html);

        each(nodes, function (node, i) {
            if (node.name === "source") {
                // create empty source array
                if (!data.source) {
                    data.source = [];
                }

                var val = ed.convertURL(node.value.src);

                data.source.push(val);
            } else if (node.name === "param") {
                if (isUrlValue(node.value.name)) {
                    node.value.value = ed.convertURL(node.value.value);
                }

                data[node.value.name] = node.value.value;
            } else {
                data.html = node.value;
            }
        });

        return data;
    }

    var getMediaData = function (ed) {
        var data = {}, mediatype;
        var node = ed.dom.getParent(ed.selection.getNode(), '[data-mce-object]');

        // validate node
        if (!node) {
            return data;
        }

        // get media node in preview
        if (node.className.indexOf('mce-object-preview') !== -1) {
            node = node.firstChild;
        }

        // mediatype
        mediatype = node.getAttribute('data-mce-object') || node.nodeName.toLowerCase();

        // get html
        var html = ed.dom.getAttrib(node, 'data-mce-html');

        if (html) {
            extend(data, htmlToData(ed, mediatype, html));
        }

        var i, attribs = node.attributes;

        // set src value
        data.src = ed.dom.getAttrib(node, 'data-mce-p-src') || ed.dom.getAttrib(node, 'data-mce-p-data') || ed.dom.getAttrib(node, 'src');

        // convert url
        data.src = ed.convertURL(data.src);

        for (i = attribs.length - 1; i >= 0; i--) {
            var attrib = attribs.item(i),
                name = attrib.name,
                value;

            // get value from element
            value = ed.dom.getAttrib(node, name);

            if (name.indexOf('data-mce-p-') !== -1) {
                name = name.substr(11);
            }

            // skip these as we will use the "src" key instead
            if (name === "data" || name === "src") {
                continue;
            }

            // skip type, codebase etc.
            if (name === "type" || name === "codebase" || name === "classid") {
                continue;
            }

            // convert poster url
            if (name === "poster") {
                value = ed.convertURL(value);
            }

            // special case for flashvars
            if (name === 'flashvars') {
                value = decodeURIComponent(value);
            }

            // skip internal attributes
            if (name.indexOf('data-mce-') !== -1) {
                continue;
            }

            data[name] = value;
        }

        return data;
    };

    var updateMedia = function (ed, data, elm) {
        var preview, attribs = {}, node = ed.dom.getParent(elm || ed.selection.getNode(), '[data-mce-object]');

        var nodeName = node.nodeName.toLowerCase();

        ed.dom.removeClass(node, 'mce-object-preview-block');

        // get iframe/video node
        if (node.className.indexOf('mce-object-preview') !== -1) {
            // set preview parent
            preview = node;

            // get the media node name
            nodeName = node.getAttribute('data-mce-object');

            // transfer reference to media node
            node = ed.dom.select(nodeName, node)[0];
        }

        each(data, function (value, name) {
            if (name === 'html' && value) {
                attribs['data-mce-html'] = escape(value);
                return true;
            }

            // clean up iframe, video and audio attributes
            if (nodeName !== 'img' && !htmlSchema.isValid(nodeName, name)) {
                return true;
            }

            // use prefix attributes for placeholder
            if (nodeName === 'img' && (!htmlSchema.isValid(nodeName, name) || name === 'src')) {
                attribs['data-mce-p-' + name] = value;
                return true;
            }

            attribs[name] = value;
        });

        ed.dom.setAttribs(node, attribs);

        // update style dimensions
        each(['width', 'height'], function (key) {
            if (attribs[key]) {
                ed.dom.setStyle(node, key, attribs[key]);
                // update parent
                if (preview) {
                    ed.dom.setStyle(preview, key, attribs[key]);
                }
            }
        });
    };

    function isMediaObject(ed, node) {
        node = node || ed.selection.getNode();
        return ed.dom.getParent(node, '[data-mce-object]');
    }

    // Register plugin
    tinymce.PluginManager.add('media', function (ed, url) {
        function isMediaNode(node) {
            return node && isMediaObject(ed, node);
        }

        ed.onPreInit.add(function () {
            ed.onUpdateMedia.add(function (ed, o) {
                // only updating audio/video
                if (!isSupportedMedia(o.before)) {
                    return;
                }

                each(ed.dom.select('video.mce-object, audio.mce-object, iframe.mce-object, img.mce-object'), function (elm) {
                    var src = elm.getAttribute('src');

                    // get src for placeholder img
                    if (elm.nodeName === 'IMG') {
                        src = elm.getAttribute('data-mce-p-src');
                    }

                    // check value in <source> element
                    if (elm.nodeName === 'VIDEO' || elm.nodeName === 'AUDIO') {
                        var html = elm.getAttribute('data-mce-html');

                        if (html) {
                            var tmp = ed.dom.create(elm.nodeName, {}, unescape(html));

                            each(tmp.childNodes, function (el) {
                                if (el.nodeName == 'SOURCE') {
                                    if (el.getAttribute('src') == o.before) {
                                        el.setAttribute('src', o.after);
                                    }
                                }
                            });

                            elm.setAttribute('data-mce-html', escape(tmp.innerHTML));
                        }

                        // update poster value
                        var poster = elm.getAttribute('poster');

                        if (poster && poster == o.before) {
                            elm.setAttribute('poster', o.after);
                        }
                    }

                    if (src == o.before) {
                        updateMedia(ed, { src: o.after }, elm);
                    }
                });
            });

            // keep this for legacy
            if (ed.settings.schema === "html4") {
                // iframe
                ed.schema.addValidElements('iframe[longdesc|name|src|frameborder|marginwidth|marginheight|scrolling|align|width|height|allowfullscreen|seamless|*]');
                // audio, video, embed
                ed.schema.addValidElements('video[src|autobuffer|autoplay|loop|controls|width|height|poster|*],audio[src|autobuffer|autoplay|loop|controls|*],source[src|type|media|*],embed[src|type|width|height|*]');
            }

            // Convert video elements to image placeholder
            ed.parser.addNodeFilter('iframe,video,audio,object,embed',
                placeHolderConverter(ed));

            // Convert placeholders to video elements (legacy conversion)
            ed.serializer.addAttributeFilter('data-mce-object', function (nodes, name) {
                var i = nodes.length, node;

                while (i--) {
                    node = nodes[i];

                    if (!node.parent) {
                        continue;
                    }

                    convertPlaceholderToMedia(ed, node);
                }
            });
        });

        ed.onInit.add(function () {
            var settings = ed.settings;

            ed.theme.onResolveName.add(function (theme, o) {
                var name, node = ed.dom.getParent(o.node, '[data-mce-object]');

                if (node) {
                    name = node.getAttribute('data-mce-object');

                    // skip processing as we are using the parent node
                    if (o.node !== node) {
                        o.name = '';
                        return;
                    }

                    if (node.nodeName !== 'IMG') {
                        node = ed.dom.select('iframe,audio,video', node);

                        var src = ed.dom.getAttrib(node, 'src') || ed.dom.getAttrib(node, 'data-mce-p-src') || '';

                        if (src) {
                            var str = isSupportedMedia(ed, src) || '';

                            if (str) {
                                name = str[0].toUpperCase() + str.slice(1);
                            }
                        }
                    }

                    if (name === 'object') {
                        name = 'media';
                    }

                    o.name = name;
                }
            });

            if (!ed.settings.compress.css) {
                ed.dom.loadCSS(url + "/css/content.css");
            }

            ed.onObjectResized.add(function (ed, elm, width, height) {
                if (!isMediaNode(elm)) {
                    return;
                }

                if (ed.dom.hasClass(elm, 'mce-object-preview')) {
                    ed.dom.setStyles(elm, { 'width': '', 'height': '' });

                    elm = elm.firstChild;
                }

                // store values
                ed.dom.setAttrib(elm, 'data-mce-width', width);
                ed.dom.setAttrib(elm, 'data-mce-height', height);

                // remove attributes
                ed.dom.removeAttrib(elm, 'width');
                ed.dom.removeAttrib(elm, 'height');

                // set as styles
                ed.dom.setStyles(elm, { 'width': width, 'height': height });
            });

            ed.dom.bind(ed.getDoc(), 'mousedown touchstart keydown', function (e) {
                var node = ed.dom.getParent(e.target, '.mce-object-preview');

                if (node) {
                    ed.selection.select(node);

                    window.setTimeout(function () {
                        node.setAttribute('data-mce-selected', '2');
                    }, 100);

                    // prevent bubbling up to DragDropOverrides
                    e.stopImmediatePropagation();

                    if (e.type === 'mousedown' && VK.metaKeyPressed(e)) {
                        return previewToPlaceholder(ed, node);
                    }

                    return;
                }
            });

            ed.dom.bind(ed.getDoc(), 'keyup click', function (e) {
                var node = ed.selection.getNode();

                // pause all video and audio in preview elements
                each(ed.dom.select('.mce-object-preview video, .mce-object-preview audio'), function (elm) {
                    elm.pause();
                });

                if (node) {
                    if (node.nodeName === "IMG" && node.getAttribute('data-mce-object') !== 'object') {
                        if (e.type === 'click' && VK.metaKeyPressed(e)) {
                            return placeholderToPreview(ed, node);
                        }
                    }
                }
            });

            ed.onBeforeExecCommand.add(function (ed, cmd, ui, v, o) {
                // FormatBlock, RemoveFormat, ApplyFormat, ToggleFormat
                if (cmd && cmd.indexOf('Format') !== -1) {
                    var node = ed.selection.getNode();

                    // if it is a preview node, select the iframe
                    if (isMediaNode(node)) {
                        if (node.nodeName !== 'IMG') {
                            node = node.firstChild;
                            ed.selection.select(node);
                        }

                        if (tinymce.is(v, 'object')) {
                            v.node = node;
                        }
                    }
                }
            });

            // add a br element after an iframe insert if it is to be converted to a media preview
            ed.selection.onBeforeSetContent.add(function (ed, o) {
                if (settings.media_live_embed) {
                    // remove existing caret to prevent duplicates
                    o.content = o.content.replace(/<br data-mce-caret="1"[^>]+>/gi, '');

                    // add a caret br after iframe content
                    if (/^<(iframe|video|audio)([^>]+)><\/(iframe|video|audio)>$/.test(o.content)) {
                        o.content += '<br data-mce-caret="1" />';
                    }
                }
            });
        });

        // Remove iframe preview on backspace or delete
        ed.onKeyDown.add(function (ed, e) {
            var node = ed.selection.getNode();

            if (e.keyCode === VK.BACKSPACE || e.keyCode === VK.DELETE) {
                if (node) {

                    if (node === ed.getBody()) {
                        node = e.target;
                    }

                    if (isMediaNode(node)) {
                        node = ed.dom.getParent(node, '[data-mce-object]') || node;
                        ed.dom.remove(node);

                        ed.nodeChanged();
                    }
                }
            }
        });

        function updatePreviewSelection(ed) {
            each(ed.dom.select('.mce-object-preview', ed.getBody()), function (node) {

                // for an empty block node, padd with a break
                if (ed.dom.isBlock(node.parentNode) && !node.previousSibling && !node.nextSibling) {
                    ed.dom.insertAfter(ed.dom.create('br', { 'data-mce-bogus': 1 }), node);
                }
            });
        }

        ed.onSetContent.add(function (ed, o) {
            updatePreviewSelection(ed);
        });

        tinymce.util.MediaEmbed = {
            dataToHtml: function (name, data, innerHtml) {
                var html = '';

                if (name === "iframe" || name === "video" || name === "audio") {
                    if (typeof data === "string") {
                        html = data;
                    } else {
                        html = ed.dom.createHTML(name, data, innerHtml);
                    }
                }

                return html;
            }
        };

        ed.addCommand('insertMediaHtml', function (ui, value) {
            var data = {}, name = 'iframe', innerHtml = '';

            if (typeof value === 'string') {
                data = value;
            } else if (value.name && value.data) {
                name = value.name, data = value.data;
                innerHtml = value.innerHtml || '';
            }

            var html = tinymce.util.MediaEmbed.dataToHtml(name, data, innerHtml);

            ed.execCommand('mceInsertContent', false, html, {
                skip_undo: 1
            });

            updatePreviewSelection(ed);

            ed.undoManager.add();
        });

        return {
            getMediaData: function () {
                return getMediaData(ed);
            },

            updateMedia: function (data) {
                return updateMedia(ed, data);
            },

            isMediaObject: function (node) {
                return isMediaObject(ed, node);
            }
        };
    });
})();