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
        JSON = tinymce.util.JSON,
        Node = tinymce.html.Node,
        VK = tinymce.VK;

    var Styles = new tinymce.html.Styles();

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
        }, new tinymce.html.Schema({})).parse(html);

        return writer.getContent();
    };

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

    tinymce.create('tinymce.plugins.MediaPlugin', {
        init: function (ed, url) {
            var self = this,
                lookup = {};

            var cbase = {
                // Type, clsid, mime types, codebase
                "flash": {
                    codebase: "http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=" + ed.getParam('media_version_flash', '10,1,53,64')
                },
                "shockwave": {
                    codebase: "http://download.macromedia.com/pub/shockwave/cabs/director/sw.cab#version=" + ed.getParam('media_version_shockwave', '10,2,0,023')
                },
                "windowsmedia": {
                    codebase: "http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab#Version=" + ed.getParam('media_version_windowsmedia', '10,00,00,3646')
                },
                "quicktime": {
                    codebase: "http://www.apple.com/qtactivex/qtplugin.cab#version=" + ed.getParam('media_version_quicktime', '7,3,0,0')
                },
                "java": {
                    codebase: "http://java.sun.com/products/plugin/autodl/jinstall-1_5_0-windows-i586.cab#Version=" + ed.getParam('media_version_java', '1,5,0,0')
                }
            };

            each(cbase, function (v, k) {
                extend(mediaTypes[k], v);
            });

            this.mimes = {};

            // Parses the default mime types string into a mimes lookup map
            (function (data) {
                var items = data.split(/,/),
                    i, y, ext;

                for (i = 0; i < items.length; i += 2) {
                    ext = items[i + 1].split(/ /);

                    for (y = 0; y < ext.length; y++) {
                        self.mimes[ext[y]] = items[i];
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

            self.editor = ed;
            self.url = url;

            each(mediaTypes, function (v, k) {
                v.name = k;

                if (v.classid) {
                    lookup[v.classid] = v;
                }
                if (v.type) {
                    lookup[v.type] = v;
                }

                lookup['mce-item-' + k] = v;
                lookup[k.toLowerCase()] = v;
            });

            self.lookup = lookup;

            /**
             * Convert a media preview into an image placeholder
             * @param {Node} preview
             */
            function previewToImage(preview) {
                var ifr = new tinymce.html.DomParser({}, ed.schema).parse(preview.innerHTML);
                var node = ifr.firstChild;

                var attribs = {};
                var data = self.createTemplate(node);

                // standard attributes
                each(['id', 'lang', 'dir', 'tabindex', 'xml:lang', 'style', 'title', 'width', 'height', 'class'], function (at) {
                    attribs[at] = node.attr(at);

                    // delete from serializable data
                    delete data[at];
                });

                var o = { 'iframe': data };

                attribs = tinymce.extend(attribs, {
                    src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                    'data-mce-json': JSON.serialize(o),
                    'data-mce-type': 'iframe'
                });

                // dimensions
                each(['width', 'height'], function (at) {
                    attribs[at] = node.attr(at);
                    attribs['data-mce-' + at] = attribs[at];
                });

                // keep internal attributes
                for (key in node.attributes.map) {
                    if (key.indexOf('data-mce-') !== -1) {
                        attribs[key] = n.attributes.map[key];
                    }
                }

                var placeholder = ed.dom.create('img', attribs);

                // add dimensions as styles
                ed.dom.setStyles(placeholder, {
                    'width': attribs.width,
                    'height': attribs.height
                });

                var sib = preview.nextSibling;

                if (sib && sib.nodeName === 'BR' && sib.getAttribute('data-mce-bogus')) {
                    ed.dom.remove(sib);
                }

                ed.dom.addClass(placeholder, 'mce-item-media mce-item-iframe');
                ed.dom.replace(placeholder, preview);

                return placeholder;
            }
            /**
             * Convert an image placeholder into a media preview
             * @param {Node} img 
             */
            function imageToPreview(img) {
                // make sure the image is selected
                ed.selection.select(img);

                var clone = ed.dom.clone(img);

                // remove styles
                ed.dom.setStyles(clone, { 'width': '', 'height': '' });

                // remove classes
                ed.dom.removeClass(clone, 'mce-item-media');
                ed.dom.removeClass(clone, 'mce-item-iframe');

                // get iframe data from the stored json
                var json = JSON.parse(clone.getAttribute('data-mce-json'));
                var data = json.iframe || {};

                var attribs = ed.dom.getAttribs(clone);

                for (var i = 0; i < attribs.length; i++) {
                    var name = attribs[i].nodeName;

                    if (name === "src" || name.indexOf('data-mce-') !== -1) {
                        continue;
                    }

                    var value = ed.dom.getAttrib(clone, name);

                    if (value === '') {
                        continue;
                    }

                    data[name] = value;
                }

                // add resized width and height values
                each(['width', 'height'], function (key) {
                    data[key] = clone.getAttribute('data-mce-' + key) || clone.getAttribute(key);
                });

                ed.execCommand('insertMediaHtml', false, { name: 'iframe', data: data });
            }

            function isMediaNode(n) {
                return n && (ed.dom.is(n, '.mce-item-media, .mce-item-shim') || ed.dom.getParent(n, '.mce-item-media') !== null);
            }

            function isIframeMedia(n) {
                return isMediaNode(n) && ed.dom.getParent(n, '.mce-item-iframe') !== null;
            }

            function isMediaClass(cls) {
                return cls && /mce-item-(media|flash|shockwave|windowsmedia|quicktime|realmedia|divx|silverlight|audio|video|generic|iframe)/.test(cls);
            }
            
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
                    return false;
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

                // Add custom 'comment' element
                ed.schema.addCustomElements('mce-comment');

                invalid = tinymce.explode(invalid, ',');

                // Convert video elements to image placeholder
                ed.parser.addNodeFilter('object,embed,video,audio,iframe', function (nodes) {
                    var i = nodes.length,
                        node;

                    while (i--) {
                        node = nodes[i], cls = node.attr('class') || '';

                        if (!isValidNode(node)) {
                            node.remove();
                            continue;
                        }

                        // if valid node (validate == false)
                        if (tinymce.inArray(invalid, node.name) == -1) {
                            self.toImage(node);
                            // remove node
                        } else {
                            node.remove();
                        }
                    }
                });

                // Convert placeholders to video elements (legacy conversion)
                ed.serializer.addNodeFilter('img,span,div', function (nodes, name, args) {
                    var i = nodes.length,
                        node, cls;

                    while (i--) {
                        node = nodes[i];
                        cls = node.attr('class') || '';

                        if (isMediaClass(cls)) {
                            self.restoreElement(node, args);
                        }
                    }
                });
            });

            ed.onInit.add(function () {
                var settings = ed.settings;
                
                // Display "media" instead of "img" in element path
                if (ed.theme && ed.theme.onResolveName) {
                    ed.theme.onResolveName.add(function (theme, o) {
                        var n = o.node;

                        if (n) {
                            var cls = ed.dom.getAttrib(n, 'class', '');

                            if (cls.indexOf('mce-item-media') !== -1) {
                                o.name = 'media';
                            }

                            if (cls.indexOf('mce-item-iframe') !== -1) {
                                o.name = 'iframe';
                            }
                        }
                    });
                }

                if (!ed.settings.compress.css) {
                    ed.dom.loadCSS(url + "/css/content.css");
                }

                ed.onObjectResized.add(function (ed, elm, width, height) {
                    if (!isMediaNode(elm)) {
                        return;
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
                    var node = e.target, sel = ed.selection.getNode();

                    ed.dom.removeClass(ed.dom.select('.mce-item-selected.mce-item-preview'), 'mce-item-selected');

                    // edge case where forced_root_block:false
                    if (node === ed.getBody() && isMediaNode(sel)) {
                        if (sel.parentNode === node && !sel.nextSibling) {
                            ed.dom.insertAfter(ed.dom.create('br', { 'data-mce-bogus': 1 }), sel);
                        }

                        return;
                    }

                    if (isIframeMedia(node)) {
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        var preview = ed.dom.getParent(node, '.mce-item-media.mce-item-preview');

                        if (e.type === 'click' && VK.metaKeyPressed(e)) {
                            if (node.nodeName === "IMG") {
                                return imageToPreview(node);
                            }

                            if (preview) {
                                preview = previewToImage(preview);
                            }
                        }

                        if (preview) {
                            ed.selection.select(preview);

                            // add a slight delay before adding selected class to avoid it being removed by the keyup event
                            window.setTimeout(function () {
                                ed.dom.addClass(preview, 'mce-item-selected');
                            }, 10);
                        }

                        e.preventDefault();
                    }
                });

                ed.onBeforeExecCommand.add(function (ed, cmd, ui, v, o) {
                    // FormatBlock, RemoveFormat, ApplyFormat, ToggleFormat
                    if (cmd && cmd.indexOf('Format') !== -1) {
                        var node = ed.selection.getNode();

                        // if it is a preview node, select the iframe
                        if (node && ed.dom.hasClass(node, 'mce-item-preview')) {
                            ed.selection.select(node.firstChild);
                        }
                    }
                });
                
                // add a br element after an iframe insert if it is to be converted to a media preview
                ed.selection.onBeforeSetContent.add(function (ed, o) {
                    if (settings.media_live_embed) {
                        // remove existing caret to prevent duplicates
                        o.content = o.content.replace(/<br data-mce-caret="1"[^>]+>/gi, '');
                        // ad a caret br after iframe content
                        if (/^<iframe([^>]+)><\/iframe>$/.test(o.content)) {
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

                        if (node.className.indexOf('mce-item-shim') !== -1) {
                            node = node.parentNode;
                        }

                        if (node.className.indexOf('mce-item-preview') !== -1) {
                            ed.dom.remove(node);
                        }
                    }
                }
            });

            ed.onBeforeSetContent.add(function (ed, o) {
                var h = o.content;

                // process comments within media elements
                h = h.replace(/<(audio|embed|object|video|iframe)([^>]*?)>([\w\W]+?)<\/\1>/gi, function (a, b, c, d) {

                    // convert conditional comments to simpler format
                    d = d.replace(/<!(--)?(<!)?\[if([^\]]+)\](>--)?>/gi, '<![if$3]>');

                    // convert conditional comments
                    d = d.replace(/<!\[if([^\]]+)\]>/gi, function (a, b) {
                        return '<mce-comment data-comment-condition="[if' + b + ']">';
                    });

                    // convert conditional comments end
                    d = d.replace(/<!(--<!)?\[endif\](--)?>/gi, '</mce-comment>');

                    return '<' + b + c + '>' + d + '</' + b + '>';
                });

                o.content = h;
            });

            ed.onPostProcess.add(function (ed, o) {
                if (o.get) {
                    // process comments within media elements
                    o.content = o.content.replace(/<mce-comment data-comment-condition="([^>]+)">/gi, '<!--$1>');
                    o.content = o.content.replace(/<\/mce-comment>/g, '<![endif]-->');
                }
            });

            function updatePreviewSelection(ed) {
                var nodes = ed.dom.select('.mce-item-preview', ed.getBody());

                if (nodes.length) {
                    var node = nodes[nodes.length - 1];

                    // for an empty block node, padd with a break
                    if (node && ed.dom.isBlock(node.parentNode) && !node.previousSibling && !node.nextSibling) {
                        //ed.dom.add(node.parentNode, 'br', { 'data-mce-bogus': '1' });

                        ed.dom.insertAfter(ed.dom.create('br', { 'data-mce-bogus': 1 }), node);
                    }
                }
            }

            ed.onSetContent.add(function (ed, o) {
                updatePreviewSelection(ed);
            });

            tinymce.util.MediaEmbed = {
                dataToHtml: function (name, data, innerHtml) {
                    var html = ''

                    if (name === "iframe") {

                        if (typeof data === "string") {
                            html = data;
                        } else {
                            html = ed.dom.createHTML('iframe', data, innerHtml);
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
        },

        /**
         * Convert a URL
         */
        convertUrl: function (url, force_absolute) {
            var self = this,
                ed = self.editor,
                settings = ed.settings,
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
                url = ed.documentBaseURI.toAbsolute(url);
            } else {
                url = converter.call(scope, url, 'src', 'object');
            }

            return url + (query ? '?' + query : '');
        },
        /**
         * Create Template object
         * Private internal function
         * @param n Node
         * @param o Object
         * @return o Object
         */
        createTemplate: function (n, o) {
            var self = this,
                ed = this.editor,
                dom = ed.dom,
                nn, hc, cn, html, v;

            hc = n.firstChild;
            nn = n.name;

            o = o || {};

            function is_child(n) {
                return /^(audio|embed|object|video|iframe)$/.test(n.parent.name);
            }

            // test for media nodes
            if (/^(audio|embed|object|param|source|video|iframe)$/.test(nn)) {

                var at = this.serializeAttributes(n);

                switch (nn) {
                    case 'audio':
                    case 'embed':
                    case 'object':
                    case 'video':
                    case 'iframe':
                    case 'param':
                        // create node object if is a parent or child object
                        if (hc || is_child(n)) {
                            if (typeof o[nn] == 'undefined') {
                                o[nn] = {};
                            }

                            extend(o[nn], at);

                            o = o[nn];
                            // otherwise add attributes (eg: iframe, embed, audio, video)
                        } else {
                            extend(o, at);
                        }

                        break;
                    case 'source':
                        // create node array
                        if (typeof o[nn] == 'undefined') {
                            o[nn] = [];
                        }

                        o[nn].push(at);

                        break;
                }

                // process next childnode
                if (hc) {
                    cn = n.firstChild;

                    while (cn) {
                        self.createTemplate(cn, o);
                        cn = cn.next;
                    }
                }
            } else {
                if (nn == 'mce-comment') {
                    if (v = n.attr('data-comment-condition')) {
                        if (typeof o[nn] == 'undefined') {
                            o[nn] = {};
                        }

                        extend(o[nn], {
                            'data-comment-condition': v
                        });

                        if (hc) {
                            cn = n.firstChild;

                            o = o[nn];

                            while (cn) {
                                self.createTemplate(cn, o);
                                cn = cn.next;
                            }
                        }
                    } else {
                        v = new tinymce.html.Serializer({
                            inner: true,
                            validate: false
                        }).serialize(n);

                        if (typeof o[nn] == 'undefined') {
                            o[nn] = [tinymce.trim(v)];
                        } else {
                            o[nn].push(tinymce.trim(v));
                        }
                    }
                } else {
                    if (nn == '#text') {
                        html = n.value;
                    } else {
                        html = new tinymce.html.Serializer().serialize(n);
                    }
                }
            }

            if (html) {
                if (typeof o.html == 'undefined') {
                    o.html = [];
                }

                o.html.push(html);
            }

            return o;
        },
        /**
         * Convert media elements to image placeholder
         * @param n Media Element
         * @return img Image Element
         */
        toImage: function (n) {
            var self = this,
                ed = this.editor,
                type, name, o = {},
                data = {},
                classid = '',
                styles, placeholder;

            // If node isn't in document or is child of media node
            if (!n.parent || /^(object|audio|video|embed|iframe)$/.test(n.parent.name)) {
                return;
            }

            // Create image
            placeholder = new Node('img', 1);

            name = n.name;
            var style = Styles.parse(n.attr('style'));

            // get width an height
            var w = n.attr('width') || style.width || '';
            var h = n.attr('height') || style.height || '';

            var type = n.attr('type');

            data = this.createTemplate(n);

            // convert from single embed
            if (name == 'embed' && type == 'application/x-shockwave-flash') {
                name = 'object';

                data.param = {};

                // get and assign flash variables
                each(['bgcolor', 'flashvars', 'wmode', 'allowfullscreen', 'allowscriptaccess', 'quality'], function (k) {
                    var v = n.attr(k);

                    if (v) {
                        if (k == 'flashvars') {
                            try {
                                v = encodeURIComponent(v);
                            } catch (e) { }
                        }

                        data.param[k] = v;
                    }

                    delete data[k];
                });
            }

            // remove nested children
            each(['audio', 'embed', 'object', 'video', 'iframe'], function (el) {
                each(n.getAll(el), function (node) {
                    node.remove();
                });
            });

            if (n.attr('classid')) {
                classid = n.attr('classid').toUpperCase();
            }

            if (name == 'object') {
                if (!data.data) {
                    var param = data.param;

                    if (param) {
                        data.data = param.src || param.url || param.movie || param.source;
                    }
                }
            } else {
                if (!data.src && data.source) {
                    if (data.source.length > 1) {
                        data.src = data.source[0].src;
                    }
                }
            }

            // get type data
            var lookup = this.lookup[classid] || this.lookup[type] || this.lookup[name] || {
                name: 'generic'
            };

            type = lookup.name || type;

            var style = Styles.parse(n.attr('style'));

            // attributes that should be styles
            each(['bgcolor', 'align', 'border', 'vspace', 'hspace'], function (na) {
                var v = n.attr(na);

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
                }
            });

            // standard attributes
            each(['id', 'lang', 'dir', 'tabindex', 'xml:lang', 'title'], function (at) {
                placeholder.attr(at, n.attr(at));
            });

            // keep internal attributes
            for (key in n.attributes.map) {
                if (key.indexOf('data-mce-') !== -1) {
                    placeholder.attr(key, n.attributes.map[key]);
                }
            }

            if (/^[\-0-9\.]+$/.test(w)) {
                w = w + 'px';
            }

            if (/^[\-0-9\.]+$/.test(h)) {
                h = h + 'px';
            }

            style.width = w;
            style.height = h;

            o[name] = data;

            // get classes as array
            var classes = [];

            if (n.attr('class')) {
                classes = n.attr('class').split(' ');
            }

            // make name lowercase
            name = name.toLowerCase();

            // add identifier class
            classes.push('mce-item-media mce-item-' + name.toLowerCase());

            // add type class
            if (type && name !== type.toLowerCase()) {
                classes.push('mce-item-' + type.split('/').pop().toLowerCase());
            }

            if (name == 'audio') {
                var agent = navigator.userAgent.match(/(Opera|Chrome|Safari|Gecko)/);
                if (agent) {
                    classes.push('mce-item-agent' + agent[0].toLowerCase());
                }
            }

            // Set class
            placeholder.attr('class', tinymce.trim(classes.join(' ')));

            if (name === "iframe" && (ed.getParam('media_live_embed', 1))) {
                var preview = new Node(name, 1);

                var attrs = o.iframe;

                tinymce.extend(attrs, {
                    src: n.attr('src'),
                    allowfullscreen: n.attr('allowfullscreen'),
                    width: n.attr('width') || w,
                    height: n.attr('height') || h,
                    frameborder: '0'
                });

                // rename the img node to a span
                placeholder.name = 'span';

                preview.attr(attrs);

                var msg = ed.getLang('media.preview_hint', 'Click to activate, %s + Click to toggle placeholder');
                msg = msg.replace(/%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

                placeholder.attr({
                    contentEditable: 'false',
                    'class': 'mce-item-preview mce-item-media mce-item-' + name,
                    'data-mce-type': 'preview',
                    'aria-details': msg
                });

                var shim = new Node('span', 1);
                shim.attr('class', 'mce-item-shim');
                shim.attr('data-mce-bogus', '1');

                placeholder.append(preview);
                placeholder.append(shim);

                // remove container if present
                if (n.parent && n.parent.attr('data-mce-preview')) {
                    n.parent.unwrap();
                }
            } else {
                placeholder.attr({
                    'src': 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                });

                // add width values back as data-mce-width attribute
                if (n.attr('width')) {
                    placeholder.attr('data-mce-width', n.attr('width'));
                }

                // add width values back as data-mce-width attribute
                if (n.attr('height')) {
                    placeholder.attr('data-mce-height', n.attr('height'));
                }

                // Set data attributes
                placeholder.attr({
                    'data-mce-json': JSON.serialize(o),
                    'data-mce-type': name
                });
            }

            // add styles
            if (styles = ed.dom.serializeStyle(style)) {
                placeholder.attr('style', styles);
            }

            // Replace the video/object/embed element with a placeholder image containing the data
            n.replace(placeholder);
        },
        /**
         * Serialize node attributes into JSON Object
         * @param n Node
         * @return attribs Object
         */
        serializeAttributes: function (n) {
            var ed = this.editor,
                self = this,
                attribs = {},
                k, v;

            if (n != 'iframe' || n != 'param') {
                // get type and src
                var type = n.attr('type'),
                    src = n.attr('src') || n.attr('data');

                // Attempt mime-type lookup
                if (!type && src) {
                    var ext;

                    if (/\.([a-z0-9]{2,4})/.test(src)) {
                        ext = /\.([a-z0-9]{2,4})/.exec(src);
                        ext = ext[1] || '';
                    }

                    if (ext) {
                        attribs.type = this.mimes[ext];
                    }
                }
            }

            if (n.name == 'param') {
                k = n.attr('name');
                v = n.attr('value');

                if (k && v != '') {
                    if (k == 'flashvars') {
                        try {
                            v = encodeURIComponent(v);
                        } catch (e) { }
                    }
                }
                attribs[k] = v;
            } else {
                for (k in n.attributes.map) {
                    v = n.attributes.map[k];

                    // skip events
                    if (k.indexOf('on') === 0) {
                        break;
                    }

                    // skip internal attributes
                    if (k.indexOf('data-mce-') === 0) {
                        break;
                    }

                    switch (k) {
                        case 'poster':
                        case 'src':
                        case 'data':
                            attribs[k] = self.convertUrl(v);
                            break;
                        case 'autoplay':
                        case 'controls':
                        case 'loop':
                        case 'seamless':
                        // needed for Youtube iframes!
                        case 'allowfullscreen':
                            if (!!v) {
                                attribs[k] = k;
                            }
                            break;
                        case 'frameborder':
                            // remove in html5
                            if (parseInt(v) == 0 && ed.settings.schema === 'html5') {
                                attribs['seamless'] = 'seamless';
                            } else {
                                attribs[k] = v;
                            }
                            break;
                        case 'type':
                            attribs[k] = v.replace(/"/g, "'");
                            break;
                        default:
                            attribs[k] = v;
                            break;
                    }
                }
            }

            // param values to embed
            if (n.name == 'embed' && n.parent.name == 'object') {
                var params = n.parent.getAll('param');

                if (params) {
                    each(params, function (p) {
                        k = p.attr('name');
                        v = p.attr('value');

                        if (k && v != '') {
                            if (k == 'flashvars') {
                                try {
                                    v = encodeURIComponent(v);
                                } catch (e) { }
                            }
                        }

                        attribs[k] = v;
                    });

                }
            }

            return attribs;
        },
        /**
         * Create Node structure from template object
         * @param data JSON Data Object
         * @param el Parent Element
         * @return Parent Element
         */
        createNodes: function (data, el) {
            var self = this,
                ed = this.editor,
                s, dom = ed.dom;

            /**
             * Internal function to create or process a node
             * @param o Data object
             * @param el Element
             */
            function createNode(o, el) {

                // process node object
                each(o, function (v, k) {
                    var nn = el.name,
                        n;

                    if (tinymce.is(v, 'object')) {
                        if (/(param|source)/.test(nn) && /(audio|embed|object|video)/.test(k)) {
                            el = el.parent;
                        }

                        if (k == 'mce-comment') {
                            var node = new Node('#comment', 8);
                            node.value = v['data-comment-condition'] + '>';

                            delete v['data-comment-condition'];

                            el.append(node);

                            createNode(v, el);

                            node = new Node('#comment', 8);
                            node.value = '<![endif]';
                            el.append(node);
                        } else {
                            // create source elements from array
                            if (v instanceof Array) {
                                // iterate through array
                                each(v, function (s) {
                                    // set attribute if string
                                    if (tinymce.is(s, 'string')) {
                                        self.setAttribs(el, data, k, s);
                                        // create node if object
                                    } else {
                                        node = new Node(k, 1);

                                        if (k == 'source') {
                                            node.shortEnded = true;
                                        }

                                        createNode(s, node);
                                        el.append(node);
                                    }
                                });

                                // create media elements
                            } else {
                                if (k == 'param') {
                                    for (n in v) {
                                        var param = new Node(k, 1);
                                        param.shortEnded = true;
                                        self.setAttribs(param, data, n, v[n]);
                                        el.append(param);
                                    }
                                } else {
                                    node = new Node(k, 1);

                                    el.append(node);

                                    createNode(v, node);
                                }
                            }
                        }
                    } else {
                        if (nn == '#comment') {
                            var comment = new Node('#comment', 8);
                            comment.value = dom.decode(v);
                            el.append(comment);
                        } else {
                            self.setAttribs(el, data, k, v);
                        }
                    }
                });

            }

            // create nodes
            createNode(data, el);

            return el;
        },
        /**
         * Internal function to set a node's attributes
         * @param n Node
         * @param k Attribute Key
         * @param v Attribute Value
         */
        setAttribs: function (n, data, k, v) {
            var ed = this.editor,
                dom = ed.dom,
                nn = n.name;

            if (v == null || typeof v == 'undefined') {
                return;
            }

            // skip event attributes
            if (k.indexOf('on') === 0) {
                return;
            }

            if (nn == 'param') {
                switch (k) {
                    case 'flashvars':
                        try {
                            v = decodeURIComponent(v);
                        } catch (e) { }
                        break;
                    case 'src':
                    case 'movie':
                    case 'source':
                    case 'url':
                        v = this.convertUrl(v);
                        break;
                }

                n.attr('name', k);
                n.attr('value', v.toString());
            } else {
                switch (k) {
                    case 'width':
                    case 'height':
                        v = data[k] || v;
                        n.attr(k, v.toString());
                        break;
                    case 'class':
                        var cls = tinymce.explode(' ', n.attr('class'));

                        if (tinymce.inArray(cls, v) === -1 && v.indexOf('mce-item-') === -1) {
                            cls.push(tinymce.trim(v));
                        }

                        v = tinymce.trim(cls.join(' '));

                        if (v) {
                            n.attr('class', v);
                        }

                        break;
                    case 'type':
                        n.attr(k, v.replace(/(&(quot|apos);|")/g, "'"));
                        break;
                    case 'flashvars':
                        try {
                            v = decodeURIComponent(v);
                        } catch (e) { }

                        n.attr(k, v);
                        break;
                    case 'src':
                    case 'data':
                    case 'source':
                        n.attr(k, this.convertUrl(v));
                        break;
                    case 'html':
                        var html = new Node('#text', 3);
                        html.raw = true;
                        // decode and sanitize html
                        v = sanitize(ed, dom.decode(v));
                        html.value = (n.value ? n.value : '') + v;
                        n.append(html);
                        break;
                    default:
                        if (!k || typeof v == 'undefined') {
                            return;
                        }

                        n.attr(k, v.toString());

                        break;
                }
            }
        },
        /**
         * Get the mimetype from the class name or src
         * @param Class name eg: mce-item-flash or src
         * @return mimetype eg: application/x-shockwave-flash
         */
        getMimeType: function (s) {

            // get from source value
            if (/\.([a-z0-9]{2,4})/.test(s)) {
                var ext = s.substring(s.length, s.lastIndexOf('.') + 1).toLowerCase();
                return this.mimes[ext];
            }

            var props, type, cl = s.match(/mce-item-(audio|video|flash|shockwave|windowsmedia|quicktime|realmedia|divx|pdf|silverlight|iframe)/);

            if (cl) {
                props = mediaTypes[cl[1]];

                if (props) {
                    type = props.type;
                }
            }

            return type;
        },
        /**
         * Build Object / Embed / Audio / Video element
         * @param o Properties object containing classid, codebase, mimetype etc.
         * @param n Image Element to replace
         * @return Object / Audio / Video / Embed element
         */
        restoreElement: function (n, args) {
            var self = this, props, v;

            if (/mce-item-preview/.test(n.attr('class'))) {
                if (n.firstChild && n.firstChild.name === "iframe") {
                    var ifr = n.firstChild.clone();

                    // pass in id (not added in clone!)
                    ifr.attr('id', n.firstChild.attr('id'));

                    // clean up classes
                    var cls = ifr.attr('class');

                    if (cls) {
                        cls = cls.replace(/\s?mce-item-([\w]+)/g, '').replace(/\s+/g, ' ');
                        cls = tinymce.trim(cls);

                        ifr.attr('class', cls.length > 0 ? cls : null);
                    }

                    n.empty();
                    n.replace(ifr);

                    return;
                }
            }

            var data = JSON.parse(n.attr('data-mce-json'));
            var name = this.getNodeName(n.attr('class'));

            // create parent node
            var parent = new Node(name, 1);

            // get root object
            var root = data[name];
            var src = root.src || root.data || '';
            var params = root.param || '';

            var style = Styles.parse(n.attr('style'));

            each(['width', 'height'], function (k) {
                v = n.attr('data-mce-' + k);

                // if the value doesn't exist, return
                if (!v) {
                    return true;
                }

                // set width and height but not for audio element
                if (v && name != 'audio') {
                    if (!root[k] || root[k] != v) {
                        root[k] = v;
                    }
                }

                // check for and set width and height for child object/embed/video
                each(['object', 'embed', 'video'], function (s) {
                    if (root[s] && !root[s][k]) {
                        root[s][k] = v;
                    }
                });

                // delete style value
                delete style[k];
            });

            // standard attributes
            each(['id', 'lang', 'dir', 'tabindex', 'xml:lang', 'title', 'class'], function (at) {
                v = n.attr(at);

                if (at == 'class') {
                    v = v.replace(/\s?mce-item-([\w]+)/g, '');
                    v = tinymce.trim(v);
                }

                if (v && /\w+/.test(v)) {
                    root[at] = v;
                }
            });

            // serialize styles 
            root.style = Styles.serialize(style);

            if (!root.style) {
                delete root.style;
            }

            // check for XHTML Strict setting
            var strict = /mce-item-(flash|shockwave)/.test(n.attr('class'));

            // not type attribute set
            if (!root.type) {
                root.type = this.getMimeType(src) || this.getMimeType(n.attr('class'));
            }

            // create embed node if necessary
            if (name == 'object') {
                params = params || {};

                delete root.src;
                // add attributes for XHTML Flash / Director
                if (strict) {
                    root.data = src;

                    // add movie param for Flash
                    if (/mce-item-flash/.test(n.attr('class'))) {
                        extend(params, {
                            'movie': src
                        });
                    }

                    // remove src param if present
                    delete params.src;

                    // delete embed node if present
                    delete root.embed;
                    delete root.classid;
                    delete root.codebase;
                } else {
                    var lookup = this.lookup[root.type] || this.lookup[name] || {
                        name: 'generic'
                    };

                    if (lookup.name !== "generic") {

                        if (!root.embed) {
                            // create embed node
                            root.embed = {
                                width: root.width,
                                height: root.height,
                                src: src,
                                type: root.type
                            };
                        }

                        delete root.data;
                    }

                    if (!root.classid) {
                        root.classid = lookup.classid;
                    }

                    if (!root.codebase) {
                        root.codebase = lookup.codebase;
                    }

                    // transfer embed attributes
                    if (root.embed) {
                        for (k in params) {
                            if (/^(movie|source|url)$/.test(k)) {
                                root.embed.src = params[k];
                            } else {
                                root.embed[k] = params[k];
                            }
                        }
                    }

                    if (lookup.name !== "generic") {
                        // add src parameter
                        var k = 'src';

                        // use url for WindowsMedia
                        if (/mce-item-windowsmedia/.test(n.attr('class'))) {
                            k = 'url';
                        }

                        // use source for Silverlight
                        if (/mce-item-silverlight/.test(n.attr('class'))) {
                            k = 'source';
                        }

                        params[k] = src;
                    }

                    var props = this.lookup[name];

                    // add classid, codebase, type if not present
                    extend(root, props);

                    if (root.classid && root.codebase) {
                        delete root.type;
                    }
                }
                // audio / video
            } else {
                // remove src in audio / video attributes if multiple source elements present
                if (root.src && root.source) {
                    if (tinymce.is(root.source, 'array') && root.source.length) {
                        // only one source item...
                        if (root.source.length == 1) {
                            // if the values are the same, remove source
                            if (root.source[0].src == root.src) {
                                delete root.source;
                            }
                            // get mimetype
                            if (!root.type) {
                                root.type = this.getMimeType(root.src);
                            }
                        } else {
                            delete root.src;
                        }
                    }
                }
            }

            // add / update params

            if (params) {
                root.param = params;
            }

            var nodes = this.createNodes(root, parent);

            // replace nodes
            n.replace(nodes);
        },
        getNodeName: function (s) {
            s = /mce-item-(audio|embed|object|video|iframe)/i.exec(s);

            if (s) {
                return s[1].toLowerCase();
            }
        }
    });

    // Register plugin
    tinymce.PluginManager.add('media', tinymce.plugins.MediaPlugin);
})();