/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved.
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
        VK = tinymce.VK;

    var Styles = new tinymce.html.Styles(), htmlSchema = new tinymce.html.Schema({ schema: 'mixed' });

    function isObjectEmbed(type) {
        if (type === 'iframe' || type === 'video' || type === 'audio') {
            return false;
        }

        return true;
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
        if (/www\.facebook\.com\/(.+)?(posts|videos)\/(.+)/.test(url)) {
            return 'facebook';
        }
        // Instagram
        if (/instagr\.?am(.+)?\/(.+)/.test(url)) {
            return 'instagram';
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

    /**
     * Convert a URL
     */
    function convertUrl(editor, url, force_absolute) {
        var settings = editor.settings,
            converter = settings.url_converter,
            scope = settings.url_converter_scope || self;

        if (!url)
            return url;

        var parts, query = '',
            n = url.indexOf('?');

        if (n === -1) {
            url = url.replace(/&amp;/g, '&');
            n = url.indexOf('&');
        }

        if (n > 0) {
            query = url.substring(n + 1, url.length), url = url.substr(0, n);
        }

        if (force_absolute) {
            url = editor.documentBaseURI.toAbsolute(url);
        } else {
            url = converter.call(scope, url, 'src', 'object');
        }

        return url + (query ? '?' + query : '');
    }

    var validateIframe = function (editor, node) {
        var src = node.attr('src');

        if (!src) {
            return false;
        }

        if (editor.settings.iframes_allow_supported) {
            if (isLocalUrl(editor, src)) {
                return true;
            }

            if (isSupportedMedia(src) !== false) {
                return true;
            }

            return false;
        }

        if (editor.settings.iframes_allow_local) {
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
        "video/vnd.rn-realvideo,rv", +
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
    }

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
                return 'true';
            }

            return 'false';
        }

        previewWrapper = Node.create('span', {
            'contentEditable': 'false',
            'data-mce-object': name,
            'class': 'mce-object-preview mce-object-' + name,
            'aria-details': msg,
            'data-mce-resize': canResize(node)
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

            if (!editor.schema.isValid(tag, key)) {
                continue;
            }

            if (key === 'class') {
                value = cleanClassValue(value);
            }

            if (key === 'style' && value) {
                var styleObject = editor.dom.parseStyle(value);

                tinymce.each(['width', 'height'], function (key) {
                    // delete style value
                    delete styleObject[key];
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
                    attribs['src'] = editor.convertURL(value);

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

        // Inject innerhtml
        var html = node.attr('data-mce-html');

        if (html) {
            var innerNode = new Node('#text', 3);
            innerNode.raw = true;
            innerNode.value = sanitize(editor, unescape(html));
            elm.append(innerNode);
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

            // node uses img placeholder, so store element specific attributes
            if (targetNode.name === 'img' && (!htmlSchema.isValid('img', attrName) || attrName == 'src')) {
                attrName = 'data-mce-p-' + attrName;
            }

            if (attrName.indexOf('data-mce-') !== -1) {
                targetNode.attr(attrName, attrValue);
            }

            if (htmlSchema.isValid(targetNode.name, attrName)) {
                targetNode.attr(attrName, attrValue);
            }
        }

        style.width = /^[0-9.]+$/.test(width) ? (width + 'px') : width;
        style.height = /^[0-9.]+$/.test(height) ? (height + 'px') : height;

        // get classes as array
        var classes = [];

        if (sourceNode.attr('class')) {
            classes = sourceNode.attr('class').split(' ');
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

        // add styles
        if (styles = editor.dom.serializeStyle(style)) {
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

                node.remove();
            }
        }

        // no data attribute set, use <param> node
        if (!sourceNode.attr('data') && sourceNode.name === 'object') {
            var params = sourceNode.getAll('param');

            each(params, function (param) {
                if (param.attr('name') === 'src' || param.attr('name') === 'url') {
                    targetNode.attr({
                        'data-mce-p-data': param.attr('value')
                    });

                    param.remove();

                    return false;
                }
            });
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

    tinymce.create('tinymce.plugins.MediaPlugin', {
        init: function (ed, url) {
            var self = this;

            self.editor = ed;
            self.url = url;

            function isMediaNode(n) {
                return n && ed.dom.getParent(n, '[data-mce-object]') !== null;
            }

            ed.onPreInit.add(function () {
                var invalid = ed.settings.invalid_elements;

                if (!ed.settings.forced_root_block) {
                    //ed.settings.media_live_embed = false;
                }

                // keep this for legacy
                if (ed.settings.schema === "html4") {
                    // iframe
                    ed.schema.addValidElements('iframe[longdesc|name|src|frameborder|marginwidth|marginheight|scrolling|align|width|height|allowfullscreen|seamless|*]');
                    // audio, video, embed
                    ed.schema.addValidElements('video[src|autobuffer|autoplay|loop|controls|width|height|poster|*],audio[src|autobuffer|autoplay|loop|controls|*],source[src|type|media|*],embed[src|type|width|height|*]');
                }

                invalid = tinymce.explode(invalid, ',');

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
                    var n = o.node;

                    if (n) {
                        var cls = ed.dom.getAttrib(n, 'class', '');

                        if (cls.indexOf('mce-object-') !== -1) {
                            var match = /mce-object-(video|audio|iframe)/i.exec(cls);

                            name = match ? match[0] : 'media';
                            
                            var src = n.getAttribute('src') || n.getAttribute('data-mce-p-src') || '';

                            if (src) {
                                var str = isSupportedMedia(ed, src) || '';

                                if (str) {
                                    name = ucfirst(str);
                                }
                            }

                            o.name = name;
                        }
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

                ed.dom.bind(ed.getDoc(), 'keyup click', function (e) {
                    var node = e.target;

                    ed.dom.removeAttrib(ed.dom.select('[data-mce-selected].mce-object-preview'), 'data-mce-selected');

                    // pause all video and audio in preview elements
                    each(ed.dom.select('.mce-object-preview video, .mce-object-preview audio'), function (elm) {
                        elm.pause();
                    });

                    if (isMediaNode(node)) {
                        var preview = ed.dom.getParent(node, '.mce-object-preview');

                        e.preventDefault();
                        e.stopImmediatePropagation();

                        if (e.type === 'click' && VK.metaKeyPressed(e)) {
                            if (node.nodeName === "IMG") {
                                return placeholderToPreview(ed, node);
                            }

                            if (preview) {
                                preview = previewToPlaceholder(ed, preview);
                            }
                        }

                        if (preview) {
                            ed.selection.select(preview.firstChild);

                            // add a slight delay before adding selected class to avoid it being removed by the keyup event
                            window.setTimeout(function () {
                                ed.dom.setAttrib(preview, 'data-mce-selected', '2');
                            }, 10);
                        }
                    }
                });

                ed.onBeforeExecCommand.add(function (ed, cmd, ui, v, o) {
                    // FormatBlock, RemoveFormat, ApplyFormat, ToggleFormat
                    if (cmd && cmd.indexOf('Format') !== -1) {
                        var node = ed.selection.getNode();

                        // if it is a preview node, select the iframe
                        if (node && ed.dom.hasClass(node, 'mce-object-preview')) {
                            ed.selection.select(node.firstChild);

                            if (tinymce.is(v, 'object')) {
                                v.node = node.firstChild;
                            }
                        }
                    }
                });

                // add a br element after an iframe insert if it is to be converted to a media preview
                ed.selection.onBeforeSetContent.add(function (ed, o) {
                    if (settings.media_live_embed) {
                        // remove existing caret to prevent duplicates
                        o.content = o.content.replace(/<br data-mce-caret="1"[^>]+>/gi, '');

                        // ad a caret br after iframe content
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

                        if (node.className.indexOf('mce-object-shim') !== -1) {
                            node = node.parentNode;
                        }

                        if (node.className.indexOf('mce-object-preview') !== -1) {
                            ed.dom.remove(node);
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
                    var html = ''

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
        }
    });

    // Register plugin
    tinymce.PluginManager.add('media', tinymce.plugins.MediaPlugin);
})();