/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
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

    function isNonEditable(ed, node) {
        var nonEditClass = ed.settings.noneditable_noneditable_class || 'mceNonEditable';

        if (node.attr) {
            return node.hasClass(nonEditClass);
        }

        return DOM.hasClass(node, nonEditClass);
    }

    var alignStylesMap = {
        left: { float: 'left' },
        center: { 'display': 'block', 'margin-left': 'auto', 'margin-right': 'auto' },
        right: { float: 'right' }
    };

    /**
     * Check if a node is wrapped in a "responsive" container
     * @param {Node} node 
     * @returns boolean
     */
    function isResponsiveMedia(node) {
        var parent = node.parent;

        if (parent.name != 'div') {
            return false;
        }

        var valid = true;

        var pStyles = DOM.parseStyle(parent.attr('style')),
            nStyles = DOM.parseStyle(node.attr('style')),
            containerStyles = { 'padding-bottom': '56.25%', position: 'relative' },
            mediaStyles = { position: 'absolute' };

        each(containerStyles, function (val, key) {
            if (!tinymce.is(pStyles[key]) || pStyles[key] != val) {
                valid = false;
            }
        });

        each(mediaStyles, function (val, key) {
            if (!tinymce.is(nStyles[key]) || nStyles[key] != val) {
                valid = false;
            }
        });

        return valid;
    }

    // media that can be previewed, eg: audio, video, iframe
    function isPreviewMedia(type) {
        return type == 'iframe' || type == 'video' || type == 'audio';
    }

    // media that use the <object> tag, eg: flash, quicktime etc.
    function isObjectEmbed(type) {
        return !isPreviewMedia(type);
    }

    function isCenterAligned(style) {
        return style.display == 'block' && style['margin-left'] == 'auto' && style['margin-right'] == 'auto';
    }

    var sandbox_iframes_exclusions = [
        'youtube.com',
        'youtube-nocookie.com',
        'youtu.be',
        'vimeo.com',
        'player.vimeo.com',
        'dailymotion.com',
        'embed.music.apple.com',
        'open.spotify.com',
        'giphy.com',
        'dai.ly',
        'codepen.io',
        'maps.google.com',
        'google.com/maps',
        'docs.google.com',
        'google.com/docs',
        'sheets.google.com',
        'google.com/sheets',
        'slides.google.com',
        'google.com/slides',
        'forms.google.com',
        'google.com/forms',
        'canva.com',
        'slideshare.net',
        'slides.com',
        'facebook.com',
        'instagram.com',
        'bandcamp.com',
        'calendly.com'
    ];

    var mediaProviders = {
        'youtube': /youtu(\.)?be(.+)?\/(.+)/,
        'vimeo': /vimeo(.+)?\/(.+)/,
        'dailymotion': /dai\.?ly(motion)?(\.com)?/,
        'scribd': /scribd\.com\/(.+)/,
        'slideshare': /slideshare\.net\/(.+)\/(.+)/,
        'soundcloud': /soundcloud\.com\/(.+)/,
        'spotify': /spotify\.com\/(.+)/,
        'ted': /ted\.com\/talks\/(.+)/,
        'twitch': /twitch\.tv\/(.+)/,
        'facebook': /facebook\.com\/(.+)/,
        'instagram': /instagram\.com\/(.+)/,
        'bandcamp': /bandcamp\.com\/(.+)/,
        'calendly': /calendly\.com\/(.+)/
    };

    function objectRequiresEmbed(type) {
        // flash
        if (type == 'application/x-shockwave-flash') {
            return false;
        }

        // pdf
        if (type == 'application/pdf') {
            return false;
        }

        return true;
    }

    /**
    * Get a default set of media properties based on the url
    * @param {string} data 
    * @param {string} provider 
    */
    function getMediaProps(ed, data, provider) {
        var value = data.src || '';

        // map of default values
        var defaultValues = {
            'youtube': {
                'src': value,
                'width': 560,
                'height': 315,
                'frameborder': 0,
                'allowfullscreen': "allowfullscreen",
                'allow': "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
                'sandbox': false,
                'oembed': true
            },
            'vimeo': {
                'src': value,
                'width': 560,
                'height': 315,
                'frameborder': 0,
                'allowfullscreen': "allowfullscreen",
                'allow': "autoplay; fullscreen",
                'sandbox': false,
                'oembed': true
            },
            'dailymotion': {
                'src': value,
                'width': 640,
                'height': 360,
                'frameborder': 0,
                'allowfullscreen': "allowfullscreen",
                'allow': "autoplay; fullscreen",
                'sandbox': false,
                'oembed': true
            },
            'video': {
                'src': value,
                'controls': true,
                'type': 'video/mpeg'
            },
            'slideshare': {
                'src': '',
                'width': 427,
                'height': 356,
                'frameborder': 0,
                'allowfullscreen': "allowfullscreen",
                'allow': "fullscreen",
                'sandbox': false,
                'oembed': true
            },
            'soundcloud': {
                'src': '',
                'width': '100%',
                'height': 400,
                'frameborder': 0,
                'scrolling': 'no',
                'allow': "autoplay; fullscreen",
                'sandbox': false,
                'oembed': true
            },
            'spotify': {
                'src': value,
                'width': 300,
                'height': 380,
                'frameborder': 0,
                'allowtransparency': true,
                'allow': "encrypted-media",
                'sandbox': false,
                'oembed': true
            },
            'ted': {
                'src': '',
                'width': 560,
                'height': 316,
                'frameborder': 0,
                'allowfullscreen': "allowfullscreen",
                'allow': "fullscreen",
                'sandbox': false,
                'oembed': true
            },
            'twitch': {
                'src': '',
                'width': 500,
                'height': 281,
                'frameborder': 0,
                'allowfullscreen': "allowfullscreen",
                'allow': "autoplay; fullscreen",
                'sandbox': false,
                'oembed': true
            },
            'instagram': {
                'src': '',
                'width': 400,
                'height': 480,
                'frameborder': 0,
                'allowfullscreen': "allowfullscreen",
                'sandbox': false,
                'oembed': false
            },
            'facebook': {
                'src': '',
                'frameborder': 0,
                'width': 500,
                'height': 280,
                'allowtransparency': 'allowtransparency',
                'allowfullscreen': "allowfullscreen",
                'scrolling': 'no',
                'allow': 'encrypted-media;fullscreen',
                'sandbox': false,
                'oembed': false
            },
            'bandcamp': {
                'src': '',
                'width': 350,
                'height': 120,
                'frameborder': 0,
                'allowtransparency': true,
                'sandbox': false,
                'oembed': true
            },
            'calendly': {
                'src': '',
                'width': 400,
                'height': 600,
                'frameborder': 0,
                'allowtransparency': true,
                'sandbox': false,
                'oembed': false
            }
        };

        // clean url for media providers
        value = value.replace(/[^a-z0-9-_:&;=%\?\[\]\/\.]/gi, '');

        if (!defaultValues[provider]) {
            defaultValues[provider] = {};
        }

        defaultValues[provider].src = value;

        // check for Youtube
        if (provider === 'youtube') {
            // process default values
            var src = value.replace(/youtu(\.)?be([^\/]+)?\/(.+)/, function (a, b, c, d) {
                d = d.replace(/(watch\?v=|v\/|embed\/)/, '');

                if (b && !c) {
                    c = '.com';
                }

                id = d.replace(/([^\?&#]+)/, function ($0, $1) {
                    return $1;
                });

                return 'youtube' + c + '/embed/' + id;
            });

            defaultValues[provider].src = src;
        }

        // check for Vimeo
        if (provider === 'vimeo') {
            if (value.indexOf('player.vimeo.com/video/') == -1) {
                // process default values
                var id = '', hash = '', matches = /vimeo\.com\/(?:\w+\/){0,3}((?:[0-9]+\b)(?:\/[a-z0-9]+)?)/.exec(value);

                if (matches && tinymce.is(matches, 'array')) {
                    var params = matches[1].split('/');

                    var id = params[0];

                    if (params.length == 2) {
                        hash = params[1];
                    }

                    value = 'https://player.vimeo.com/video/' + id + (hash ? '?h=' + hash : '');
                }
            }

            defaultValues[provider].src = value;
        }

        // dailymotion
        if (provider === 'dailymotion') {
            var id = '', s = /dai\.?ly(motion)?(.+)?\/(swf|video)?\/?([a-z0-9]+)_?/.exec(value);

            if (s && tinymce.is(s, 'array')) {
                id = s.pop();
            }

            defaultValues[provider].src = 'https://dailymotion.com/embed/video/' + id;
        }

        if (provider === 'spotify') {
            defaultValues[provider].src = value.replace(/open\.spotify\.com\/track\//, 'open.spotify.com/embed/track/');
        }

        if (provider === 'ted') {
            defaultValues[provider].src = value.replace(/www\.ted.com\/talks\//, 'embed.ted.com/talks/');
        }

        if (provider === 'twitch') {
            defaultValues[provider].src = value.replace(/twitch\.tv\//, 'player.twitch.tv/?channel=');
        }

        if (provider === 'instagram') {
            value = value.replace(/\/\?.+$/gi, '');
            value = value.replace(/\/$/, '');

            defaultValues[provider].src = value + '/embed/captioned';
        }

        if (provider === 'facebook') {
            var url = 'https://www.facebook.com/plugins/';

            if (value.indexOf('/videos/') !== -1) {
                url += 'video.php?href=';
            }

            if (value.indexOf('/posts/') !== -1) {
                url += 'post.php?href=';

                // update height for posts
                defaultValues[provider].height = 247;

                // remove query string from url
                value = value.replace(/\?.+$/, '');
            }

            defaultValues[provider].src = url + encodeURIComponent(value);
        }

        if (provider === 'bandcamp') {
            // remove query string from url
            value = value.replace(/\?.+$/, '');
            value = value.replace(/\/$/, '');

            defaultValues[provider].src = value + '/embed/';
        }

        if (provider === 'calendly') {
            // remove query string from url
            value = value.replace(/\?.+$/, '');
            value = value.replace(/\/$/, '');

            defaultValues[provider].src = 'https://calendly.com/' + value + '?embed_domain=' + ed.documentBaseURI.getDomain() + '&embed_type=Inline';
        }

        return defaultValues[provider];
    }

    /**
     * Update the sandbox attribute on an iframe node based on the media provider, url and editor settings
     * @param {Editor} editor 
     * @param {Node} node 
     * @returns 
     */
    function updateSandbox(editor, node) {
        var src = node.attr('src');

        // leave existing sandbox attribute values
        if (node.attr('sandbox')) {
            return;
        }

        var provider = isSupportedMedia(editor, src), defaultAttributes = getMediaProps(editor, { src: src }, provider);

        // set default sandbox attribute value from providers or remove it
        if (defaultAttributes.sandbox === false) {
            node.attr('sandbox', null);
        } else {
            node.attr('sandbox', defaultAttributes.sandbox || '');
        }

        // remove sandbox on local urls
        if (isLocalUrl(editor, src)) {
            node.attr('sandbox', null);

            return;
        }

        // remove sandbox on all iframes
        if (editor.getParam('media_iframes_sandbox', true) === false) {
            node.attr('sandbox', null);

            return;
        }

        try {
            // get the uri of the src
            var url = new URL(src);

            // create a "site" string from the host and path, eg: google.com/maps
            var host = url.host.toLowerCase();
            var path = url.pathname.toLowerCase();
            var site = (host.startsWith('www.') ? host.slice(4) : host) + path;

            // remove sandbox on exclusions
            if (sandbox_iframes_exclusions.some(function (value) {
                var exclusion = value.toLowerCase();
                return site.indexOf(exclusion) === 0 || host.indexOf(exclusion) === 0;
            })) {
                node.attr('sandbox', null);
            }
        } catch (e) {
            // ignore
        }
    }

    /**
     * Validate a url against a list default or custom providers urls, eg: Youtube, Vimeo etc.
     * @param {Object} editor 
     * @param {String} url 
     * @returns Supportd provide value
     */
    function isSupportedProvider(editor, url) {
        var providers = editor.settings.media_iframes_supported_media || Object.keys(mediaProviders);
        var supported = false;

        if (typeof providers == 'string') {
            providers = providers.split(',');
        }

        for (var i = 0; i < providers.length; i++) {
            var value = providers[i];

            if (!value) {
                continue;
            }

            value = value.replace(/\/$/, '');
            var rx = mediaProviders[value] || new RegExp(value + '\/(.+)/');

            if (rx.test(url)) {
                supported = mediaProviders[value] ? value : 'iframe';
                break;
            }
        }

        return supported;
    }

    function isSupportedIframe(editor, url) {
        // iframes not supported
        if (!isValidElement(editor, 'iframe')) {
            return false;
        }

        if (!url) {
            return false;
        }

        // allow local only
        if (editor.settings.media_iframes_allow_local) {
            return isLocalUrl(editor, url);
        }

        var value = isSupportedProvider(editor, url);

        // allow local an support
        if (editor.settings.media_iframes_allow_supported) {
            if (isLocalUrl(editor, url)) {
                return true;
            }

            return value;
        }

        // return any supported provider
        if (value) {
            return value;
        }

        // allow all
        return true;
    }

    function isValidElement(editor, value) {
        var elements = editor.getParam('media_valid_elements', '', 'hash');
        return elements[value] || false;
    }

    function isSupportedUrl(editor, tag, url) {
        if (editor.settings['media_' + tag + '_allow_local']) {
            return isLocalUrl(editor, url);
        }

        return true;
    }

    function isSupportedMedia(editor, url, type) {
        url = url || '';

        // Remove query string from URL
        url = stripQuery(url);
        var ext = url.split('.').pop().toLowerCase();
        type = (type || '').toLowerCase();

        // Extension-based type groups
        var audioExts = ['mp3', 'ogg', 'webm', 'wav', 'm4a', 'aiff'];
        var videoExts = ['mp4', 'ogv', 'ogg', 'webm', 'mov', 'qt', 'mpg', 'mpeg', 'divx'];
        var objectExts = ['swf', 'pdf'];

        // Strict MIME-type match if provided
        if (type.startsWith('audio/')) {            
            if (indexOf(audioExts, ext) === -1) {
                return false;
            }
            if (isValidElement(editor, 'audio') && isSupportedUrl(editor, 'audio', url)) {
                return 'audio';
            }
        }

        if (type.startsWith('video/')) {
            if (indexOf(videoExts, ext) === -1) {
                return false;
            }
            if (isValidElement(editor, 'video') && isSupportedUrl(editor, 'video', url)) {
                return 'video';
            }
        }

        // Fallback to extension if no usable MIME type
        if (indexOf(videoExts, ext) !== -1 && isValidElement(editor, 'video') && isSupportedUrl(editor, 'video', url)) {
            return 'video';
        }

        if (indexOf(audioExts, ext) !== -1 && isValidElement(editor, 'audio') && isSupportedUrl(editor, 'audio', url)) {
            return 'audio';
        }

        if (indexOf(objectExts, ext) !== -1 && isValidElement(editor, 'object') && isSupportedUrl(editor, 'object', url)) {
            return 'object';
        }

        // Check for supported iframe providers (e.g. YouTube, Vimeo)
        var value = isSupportedIframe(editor, url);

        if (value) {
            return 'iframe';
        }

        return false;
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
            // try and convert to relative
            var relative = editor.documentBaseURI.toRelative(url);

            // is result still absolute?
            return isAbsoluteUrl(relative) === false;
        }

        return true;
    };

    var validateIframe = function (editor, node) {
        var src = node.attr('src');

        // keep nonEditable nodes
        if (isNonEditable(editor, node)) {
            return true;
        }

        return isSupportedIframe(editor, src);
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

                // remove any node with a data-mce-bookmark attribute
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

    function stripQuery(value) {
        if (value) {
            // Match until the last file extension and strip everything after, eg: ?v=1, #hash, &param=value etc.
            const match = value.match(/^(.*?\.[a-z0-9]{2,10})(?:[?#&].*|$)/i);

            return match ? match[1] : value;

        }

        return value;
    }

    /**
     * Convert media data into appropriate HTML
     * @param {object} ed Editor
     * @param {mixed} value Media source or data object
     */
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
            // allow for boolean attribues to have empty values
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
        // find the first tag, eg: <video
        var match = trimmedString.match(/^<([a-zA-Z0-9]+)\b/);

        if (match) {
            return isPreviewMedia(match[1].toLowerCase());
        }

        return false;
    }

    // Media types supported by this plugin
    var mediaTypes = {
        // Type, clsid, mime types, codebase
        "flash": {
            type: "application/x-shockwave-flash"
        },
        "quicktime": {
            type: "video/quicktime"
        },
        "divx": {
            type: "video/divx"
        },
        "video": {
            type: 'video/mpeg'
        },
        "audio": {
            type: 'audio/mpeg'
        },
        "iframe": {},
        "pdf": {
            type: "application/pdf"
        }
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
        var html = new tinymce.html.Serializer().serialize(node);

        var div = editor.dom.create('div', {}, html);

        return div.firstChild;
    }

    var previewToPlaceholder = function (editor, node) {
        var obj = new tinymce.html.DomParser({}, editor.schema).parse(node.innerHTML);
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

    var createPreviewNode = function (editor, node) {
        var previewWrapper;
        var previewNode;
        var shimNode;
        var name = node.name;

        var msg = editor.getLang('media.preview_hint', 'Click to activate, ALT + Click to toggle placeholder');
        // b/c replacement
        msg = msg.replace(/%s/g, 'ALT');

        // disable autoplay
        if (node.attr('autoplay')) {
            node.attr('data-mce-p-autoplay', node.attr('autoplay'));

            node.attr('autoplay', null);
        }

        if (name == 'iframe' && node.attr('src')) {
            var src = node.attr('src');

            // store original src
            node.attr('data-mce-p-src', src);

            // remove autoplay
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

        // keep some styles
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

    function processNodeAttributes(editor, tag, node) {
        var attribs = {}, styles = {};

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
                key = key.substring(11);
            }

            if (key === 'data-mce-width' || key === 'data-mce-height') {
                key = key.substring(9);
            }

            // skip system attributes
            if (key.indexOf('data-mce-') === 0) {
                continue;
            }

            // skip preview span attributes
            if (node.name == 'span' && node.attr('data-mce-object')) {
                continue;
            }

            // skip invalid tags but not custom dash attributes, eg: data-* or uk-* etc.
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
                    // skip processing in audio element
                    if (tag === 'audio') {
                        return true;
                    }

                    if (!styleObject[key]) {
                        return true;
                    }

                    var attrValue = tinymce.is(node.attr(key)) ? node.attr(key) : '';

                    if (attrValue && !/\D/.test(attrValue)) {
                        attrValue += 'px';
                    }

                    // if the attribute value exists, remove the style value
                    if (attrValue && attrValue == styleObject[key]) {
                        delete styleObject[key];
                    }
                });

                styleObject = extend(styleObject, styles);

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

        attribs = processNodeAttributes(editor, tag, node);

        if (/\s*mce-object-preview\s*/.test(node.attr('class')) && node.firstChild && node.firstChild.name === tag) {
            node = node.firstChild;
        }

        attribs = extend(attribs, processNodeAttributes(editor, tag, node));

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

                    // short ended for <embed />, <param /> and <source />
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

        // remove html attribute
        elm.attr('data-mce-html', null);

        // add embed for some object media
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

        var boolAttrs = editor.schema.getBoolAttrs();

        // get node src (video, audio, iframe)
        var src = sourceNode.attr('src');

        // default attributes
        if (src) {
            var provider = isSupportedMedia(editor, src), defaultAttributes = getMediaProps(editor, { src: src }, provider);

            each(defaultAttributes, function (val, name) {
                if (!tinymce.is(sourceNode.attr(name)) && !(name in boolAttrs)) {
                    sourceNode.attr(name, val);
                }
            });

            updateSandbox(editor, sourceNode);
        }

        var style = editor.dom.parseStyle(sourceNode.attr('style'));

        // get width an height
        var width = sourceNode.attr('width') || style.width || '';
        var height = sourceNode.attr('height') || style.height || '';

        var style = editor.dom.parseStyle(sourceNode.attr('style'));

        var legacyAttributes = ['bgcolor', 'align', 'border', 'vspace', 'hspace'];

        // attributes that should be styles
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

            // remove "false" boolean attributes
            if (tinymce.is(boolAttrs[attrName]) && attrValue == "false") {
                targetNode.attr(attrName, null);
            }

            // remove sandbox attribute if false
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
        return function (nodes) {
            var i = nodes.length;
            var node;

            var media_live_embed = editor.settings.media_live_embed;
            var strict_embed = editor.settings.media_strict_embed !== false; // strict embed is enabled by default

            while (i--) {
                node = nodes[i];

                if (!node.parent) {
                    continue;
                }

                if (node.parent.attr('data-mce-object')) {
                    continue;
                }

                if (node.firstChild && node.firstChild.attr('data-mce-type') == 'bookmark') {
                    node.firstChild.remove();
                }

                // mark iframe for removal if invalid
                if (node.name === 'iframe') {
                    // click to play embed remove the src attribute
                    if (!node.attr('src')) {
                        media_live_embed = false;
                    } else if (validateIframe(editor, node) === false) {
                        node.remove();
                        continue;
                    }
                }

                // if valid node (validate == false)
                if (!isValidElement(editor, node.name) && !isNonEditable(editor, node)) {
                    node.remove();
                    continue;
                }

                // validate non-iframe node
                if (node.name !== 'iframe') {
                    var src = node.attr('src') || node.attr('data') || '';

                    // get the mime type from the type attribute
                    var type = node.attr('type') || node.attr('data-mce-p-type') || '';

                    if (!src) {
                        // get the source from the first source tag
                        if (node.name === 'video' || node.name === 'audio') {
                            var sources = node.getAll('source');

                            for (var j = 0; j < sources.length; j++) {
                                var source = sources[j];

                                // skip empty source
                                if (!source.attr('src')) {
                                    continue;
                                }

                                // remove unsupported source
                                if (!isSupportedUrl(editor, node.name, source.attr('src'))) {
                                    source.remove();
                                    // adjust index
                                    sources.splice(j, 1);
                                }
                            }

                            // get src value from any remaining source
                            if (sources.length) {
                                src = sources[0].attr('src');
                                type = sources[0].attr('type') || type;
                            }
                        }
                        
                        // get the source from the param tag
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

                            // try embed
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
                        // validate 
                        if (!isSupportedUrl(editor, node.name, src)) {
                            node.remove();
                            continue;
                        }
                    } else {
                        media_live_embed = false;
                        continue;
                    }

                    if (strict_embed) {
                        var newName = isSupportedMedia(editor, src, type);

                        // not supported
                        if (!newName) {
                            node.remove();
                            continue;
                        }

                        // iframe, but not a supported provider, eg: Youtube etc.
                        if (newName == 'iframe' && !isSupportedProvider(editor, src)) {
                            node.remove();
                            continue;
                        }

                        // node has been renamed, so validate child nodes
                        if (newName !== node.name) {
                            // clean up child nodes after conversion
                            // eslint-disable-next-line no-loop-func
                            each(node.children(), function (elm) {
                                if (!editor.schema.isValidChild(newName, elm.name)) {
                                    elm.remove();
                                }
                            });
                        }

                        // rename node
                        node.name = newName;

                        // update src attribute
                        node.attr('src', src);

                        // update data and type attributes for object
                        if (newName == 'object') {
                            // set data attribute
                            node.attr('data', src);

                            // remove src attribute
                            node.attr('src', null);

                            // clean the src value
                            var cleanSrc = stripQuery(src);

                            // get the extension
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
            }
        };
    };

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
                // create empty source array
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

        // validate node
        if (!node || node.nodeType != 1) {
            return data;
        }

        // get media node in preview
        if (node.className.indexOf('mce-object-preview') !== -1) {

            // get preview attributes
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

            // reset node to iframe
            node = ed.dom.select('audio,video,iframe', node)[0];
        }

        // mediatype
        mediatype = node.getAttribute('data-mce-object') || node.nodeName.toLowerCase();

        // get html
        var html = ed.dom.getAttrib(node, 'data-mce-html');

        if (html) {
            data = extend(data, htmlToData(ed, mediatype, html));
        }

        // set src value
        data.src = ed.dom.getAttrib(node, 'data-mce-p-src') || ed.dom.getAttrib(node, 'data-mce-p-data') || ed.dom.getAttrib(node, 'src');

        // convert url
        data.src = ed.convertURL(data.src);

        // reset data.src if "empty"
        if (data.src == transparentSrc) {
            data.src = '';
        }

        var i, attribs = node.attributes;

        for (i = attribs.length - 1; i >= 0; i--) {
            var item = attribs.item(i),
                name = item.name,
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

            // clean class value
            if (name == 'class') {
                // clean and trim value
                value = value.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim();
            }

            // set the value true for boolean attributes for easier processing
            if (boolAttrs[name]) {
                value = true;
            }

            data[name] = value;
        }

        // get integer width and height values
        each(['width', 'height'], function (key) {
            var val = ed.dom.getStyle(node, key) || ed.dom.getAttrib(node, key);

            if (val) {
                data[key] = parseInt(val, 10);
            }
        });

        data.mediatype = mediatype;

        return data;
    };

    var updateMedia = function (ed, data, elm) {
        var preview, attribs = {}, node = ed.dom.getParent(elm || ed.selection.getNode(), '[data-mce-object]');
        var boolAttrs = ed.schema.getBoolAttrs();

        var nodeName = node.nodeName.toLowerCase();

        // clean up classes
        each(['block', 'center', 'left', 'right'], function (val) {
            ed.dom.removeClass(node, 'mce-object-preview-' + val);
        });

        // get iframe/video node
        if (node.className.indexOf('mce-object-preview') !== -1) {
            // set preview parent
            preview = node;

            // get the media node name
            nodeName = node.getAttribute('data-mce-object');

            // transfer reference to media node
            node = ed.dom.select(nodeName, node)[0];
        }

        // clear styles on preview node
        if (preview) {
            preview.removeAttribute('style');
        }

        each(data, function (value, name) {
            if (name === 'innerHTML' && value) {
                attribs['data-mce-html'] = escape(value);
                return true;
            }

            // clean up iframe, video and audio attributes
            if (nodeName !== 'img' && (!htmlSchema.isValid(nodeName, name) && name.indexOf('-') == -1)) {
                return true;
            }

            // remove "false" boolean attributes
            if (tinymce.is(boolAttrs[name]) && !value) {
                value = null;

                // remove autoplay fallback
                if (name == 'autoplay') {
                    attribs['data-mce-p-' + name] = null;
                }
            }

            // use prefix attributes for placeholder
            if (nodeName === 'img' && (!htmlSchema.isValid(nodeName, name) || name === 'src') && value !== null) {
                attribs['data-mce-p-' + name] = value;
                return true;
            }

            if (nodeName == 'iframe' && name == 'src') {
                attribs['data-mce-p-' + name] = value;
                // reset autoplay
                value = value.replace('autoplay=1', 'autoplay=1');
            }

            // update classes then continue
            if (name == 'class' && value) {
                ed.dom.addClass(node, value);
                return true;
            }

            // update styles then continue
            if (name == 'style' && value) {
                ed.dom.setStyles(node, ed.dom.parseStyle(value));
                return true;
            }

            // set value to null to remove
            if (name == 'sandbox' && value === false) {
                value = null;
            }

            attribs[name] = value;
        });

        // update attributes
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

    // Register plugin
    tinymce.PluginManager.add('media', function (ed, url) {
        // get custom sandbox exclusions
        var custom_sandbox_iframes_exclusions = ed.getParam('media_iframes_sandbox_exclusions', []);

        // combine with defined sandbox_iframes_exclusions
        sandbox_iframes_exclusions = sandbox_iframes_exclusions.concat(custom_sandbox_iframes_exclusions);

        function isMediaObject(node) {
            node = node || ed.selection.getNode();
            return ed.dom.getParent(node, '[data-mce-object]');
        }

        function isMediaNode(node) {
            return node && isMediaObject(node);
        }

        function findMediaNode(elm, nodeName) {
            var nodes = ed.dom.select(nodeName, elm);
            return nodes.length ? nodes[0] : null;
        }

        function objectActivate(ed, e) {
            var node = isMediaObject(e.target);

            if (node && !isNonEditable(ed, node)) {
                ed.selection.select(node);

                if (ed.dom.getAttrib(node, 'data-mce-selected')) {
                    node.setAttribute('data-mce-selected', '2');
                }

                if (e.type === 'mousedown' && e.altKey) {
                    // update the event target with the new node
                    if (node.nodeName !== 'IMG') {
                        e.target = previewToPlaceholder(ed, node);
                    }
                }

                // prevent bubbling up to DragDropOverrides
                e.stopImmediatePropagation();
                e.preventDefault();

                return;
            }
        }

        ed.onMouseDown.add(objectActivate);
        ed.onKeyDown.add(objectActivate);

        ed.onNodeChange.addToTop(function (ed, cm, n, collapsed, o) {
            if (isMediaNode(n) && !isNonEditable(ed, n) && !o.contenteditable) {
                o.contenteditable = true;
            }
        });

        ed.onPreInit.add(function () {
            ed.onUpdateMedia.add(function (ed, o) {
                if (!o.before || !o.after) {
                    return;
                }

                // only updating audio/video
                if (!isSupportedMedia(ed, o.before)) {
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

            ed.dom.bind(ed.getDoc(), 'touchstart', function (e) {
                objectActivate(ed, e);
            });
        });

        ed.onInit.add(function () {
            var settings = ed.settings;

            each(['left', 'right', 'center'], function (align) {
                ed.formatter.register('align' + align, {
                    selector: 'span[data-mce-object]',
                    collapsed: false,
                    ceFalseOverride: true,
                    classes: 'mce-object-preview-' + align,
                    deep: true,
                    onremove: function (elm) {
                        each(['left', 'right', 'center'], function (val) {
                            ed.dom.removeClass(elm, 'mce-object-preview-' + val);
                        });
                    }
                });
            });

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

            ed.dom.bind(ed.getDoc(), 'keyup click', function (e) {
                var node = ed.selection.getNode();

                if (!node.hasAttribute('data-mce-object')) {
                    return;
                }

                // pause all video and audio in preview elements
                each(ed.dom.select('.mce-object-preview video, .mce-object-preview audio'), function (elm) {
                    elm.pause();
                });

                if (node) {
                    if (node.nodeName === "IMG" && node.getAttribute('data-mce-object') !== 'object') {
                        if (isNonEditable(ed, node)) {
                            return;
                        }

                        if (e.type === 'click' && e.altKey) {
                            e.target = placeholderToPreview(ed, node);
                        }
                    }
                }
            });

            ed.onBeforeExecCommand.add(function (ed, cmd, ui, values, o) {
                // RemoveFormat, ApplyFormat, ToggleFormat
                if (cmd && (cmd == 'ApplyFormat' || cmd == 'RemoveFormat' || cmd == 'ToggleFormat')) {
                    var node = ed.selection.getNode();

                    if (tinymce.is(values, 'object') && values.node) {
                        node = values.node;
                    }

                    // if it is a preview node, select the iframe
                    if (isMediaNode(node) && node.nodeName !== 'IMG') {
                        var mediaNode = findMediaNode(node, node.getAttribute('data-mce-object'));

                        if (mediaNode) {
                            var range = ed.dom.createRng();
                            range.setStart(mediaNode, 0);
                            range.setEnd(mediaNode, 0);

                            var sel = ed.selection.getSel();
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }

                        if (mediaNode && tinymce.is(values, 'object')) {
                            values.node = mediaNode;
                        }
                    }
                }
            });

            // add a br element after an iframe insert if it is to be converted to a media preview
            ed.onBeforeSetContent.add(function (ed, o) {
                if (settings.media_live_embed) {
                    // remove existing caret to prevent duplicates
                    o.content = o.content.replace(/<br data-mce-caret="1"[^>]+>/gi, '');

                    // add a caret br after iframe content
                    if (/^<(iframe|video|audio)([^>]+)><\/(iframe|video|audio)>$/.test(o.content)) {
                        o.content += '<br data-mce-caret="1" />';
                    }
                }
            });

            /*ed.onContentEditableSelect.add(function (ed, e) {
                // get selected node
                var node = isMediaObject();

                if (node && !isNonEditable(ed, node)) {
                    ed.selection.select(node);
                    node.setAttribute('data-mce-selected', '1');
                }
            });*/
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

                        if (isNonEditable(ed, node)) {
                            e.preventDefault();
                            return;
                        }

                        node = ed.dom.getParent(node, '[data-mce-object]') || node;
                        ed.dom.remove(node);

                        ed.nodeChanged();
                    }
                }
            }
        });

        function setClipboardData(ed, e) {
            var clipboardData = e.clipboardData;

            if (!clipboardData) {
                return;
            }

            // get selected node
            var node = isMediaObject();

            if (!node) {
                return;
            }

            // clear operation for non-editable
            if (isNonEditable(ed, node)) {
                clipboardData.clearData();
                return;
            }

            ed.selection.select(node);

            var content = ed.selection.getContent({
                contextual: true
            });

            var data = {
                html: content,
                text: content.toString()
            };

            clipboardData.clearData();
            clipboardData.setData('text/html', data.html);
            clipboardData.setData('text/plain', data.text);
        }

        // update clipboardData 
        ed.onCopy.add(setClipboardData);
        ed.onCut.add(setClipboardData);

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

        /**
         * Validate content on save.
         */
        ed.onWfEditorSave.add(function (ed, o) {
            var body = DOM.create('div', {}, o.content);

            each(DOM.select('audio,video,object,iframe,embed', body), function (tag) {
                var name = tag.nodeName.toLowerCase();

                if (!isValidElement(ed, name) && !isNonEditable(ed, tag)) {
                    DOM.remove(tag);
                }
            });

            o.content = body.innerHTML;
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

        extend(this, {
            getMediaData: function () {
                return getMediaData(ed);
            },

            getMediaProps: function (data, provider) {
                return getMediaProps(ed, data, provider);
            },

            updateMedia: function (data) {
                return updateMedia(ed, data);
            },

            isMediaObject: function (node) {
                return isMediaObject(node);
            },

            isSupportedMedia: function (url) {
                return isSupportedMedia(ed, url);
            },

            getMediaHtml: function (data) {
                return getMediaHtml(ed, data);
            },

            isMediaHtml: function (html) {
                return isMediaHtml(ed, html);
            }
        });
    });
})();