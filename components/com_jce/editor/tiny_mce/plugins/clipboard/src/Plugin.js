/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @copyright   Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

import * as CutCopy from './CutCopy';
import * as Quirks from './Quirks';
import * as Newlines from './Newlines';
import * as InternalHtml from './InternalHtml';
import * as Utils from './Utils';
import * as WordFilter from './WordFilter';
import PasteBin from './PasteBin.js';

var each = tinymce.each,
    VK = tinymce.VK,
    DomParser = tinymce.html.DomParser,
    Serializer = tinymce.html.Serializer,
    DOM = tinymce.DOM,
    Dispatcher = tinymce.util.Dispatcher,
    BlobCache = tinymce.file.BlobCache;

var mceInternalUrlPrefix = 'data:text/mce-internal,';

function getBase64FromUri(uri) {
    var idx;

    idx = uri.indexOf(',');
    if (idx !== -1) {
        return uri.substr(idx + 1);
    }

    return null;
}

function isValidDataUriImage(settings, imgElm) {
    return settings.images_dataimg_filter ? settings.images_dataimg_filter(imgElm) : true;
}

function pasteImage(editor, rng, reader, blob) {
    if (rng) {
        editor.selection.setRng(rng);
        rng = null;
    }

    var dataUri = reader.result;
    var base64 = getBase64FromUri(dataUri);

    var img = new Image();
    img.src = dataUri;

    // TODO: Move the bulk of the cache logic to EditorUpload
    if (isValidDataUriImage(editor.settings, img)) {
        var blobInfo, existingBlobInfo;

        existingBlobInfo = BlobCache.findFirst(function (cachedBlobInfo) {
            return cachedBlobInfo.base64() === base64;
        });

        if (!existingBlobInfo) {
            blobInfo = BlobCache.create('mceclip', blob, base64);
            BlobCache.add(blobInfo);
        } else {
            blobInfo = existingBlobInfo;
        }

        return '<img src="' + blobInfo.blobUri() + '" />';

    } else {
        return '<img src="' + dataUri + '" />';
    }
}

function preProcess(e, o) {
    var ed = e.editor;

    ed.onPastePreProcess.dispatch(ed, o);
    ed.execCallback('paste_preprocess', e, o);

    var h = o.content;

    // Process away some basic content
    h = h.replace(/^\s*(&nbsp;)+/g, ''); // nbsp entities at the start of contents
    h = h.replace(/(&nbsp;|<br[^>]*>)+\s*$/g, ''); // nbsp entities at the end of contents

    // skip plain text
    if (self.pasteAsPlainText) {
        return;
    }

    o.wordContent = WordFilter.isWordContent(ed, h) && !o.internal;

    if (o.wordContent) {
        h = WordFilter.WordFilter(ed, h);
    }

    // convert some tags if cleanup is off
    if (ed.settings.verify_html === false) {
        h = h.replace(/<b\b([^>]*)>/gi, '<strong$1>');
        h = h.replace(/<\/b>/gi, '</strong>');
    }

    o.content = h;
}

function postProcess(e, o) {
    var ed = e.editor,
        dom = ed.dom;

    // remove url conversion containers
    ed.dom.remove(ed.dom.select('div[data-mce-convert]', o.node), 1);

    // skip plain text
    if (e.pasteAsPlainText) {
        return;
    }

    // Remove Apple style spans
    each(dom.select('span.Apple-style-span', o.node), function (n) {
        dom.remove(n, 1);
    });

    // Remove all classes
    if (ed.getParam('clipboard_paste_strip_class_attributes', 2) == 1) {
        // Remove class attribute
        each(dom.select('*[class]', o.node), function (el) {
            el.removeAttribute('class');
        });
    }

    // Convert width and height attributes to styles
    each(dom.select('table, td, th', o.node), function (n) {
        var width = dom.getAttrib(n, 'width');

        if (width) {
            dom.setStyle(n, 'width', width);
            dom.setAttrib(n, 'width', '');
        }

        var height = dom.getAttrib(n, 'height');

        if (height) {
            dom.setStyle(n, 'height', height);
            dom.setAttrib(n, 'height', '');
        }
    });

    // Remove all styles
    if (ed.getParam('clipboard_paste_remove_styles', 1)) {
        // Remove style attribute
        each(dom.select('*[style]', o.node), function (el) {
            el.removeAttribute('style');
            el.removeAttribute('data-mce-style');
        });
    } else {
        // process style attributes
        processStyles(ed, o.node);
    }

    if (o.wordContent) {
        // fix table borders
        var borderColors = ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
        var positions = ['top', 'right', 'bottom', 'left'];

        each(dom.select('table[style], td[style], th[style]', o.node), function (n) {
            var styles = {};

            each(Utils.borderStyles, function (name) {
                // process each side, eg: border-left-width
                if (/-(top|right|bottom|left)-/.test(name)) {
                    // get style
                    var value = dom.getStyle(n, name);

                    // replace default values with black
                    if (name.indexOf('color') !== -1) {
                        if (value === 'currentcolor' || value === 'windowtext') {
                            each(borderColors, function (str) {
                                if (str === name) {
                                    return true;
                                }

                                var val = dom.getStyle(n, str);

                                if (/(currentcolor|windowtext)/.test(val)) {
                                    return true;
                                }

                                value = val;
                            });
                        }

                        value = Utils.namedColorToHex(value);
                    }

                    // Word uses "medium" as the default border-width
                    if (value === "medium") {
                        value = '1';
                    }

                    // if border-style is not set, use "solid"
                    if (name.indexOf('style') !== -1 && value === "none") {
                        value = "solid";
                    }

                    // convert to pixels
                    if (value && /^\d[a-z]?/.test(value)) {
                        value = Utils.convertToPixels(value);
                    }

                    styles[name] = value;
                }
            });

            // convert padding and margin to pixels
            each(positions, function (pos) {
                var padding = dom.getStyle(n, 'padding-' + pos);
                var margin = dom.getStyle(n, 'margin-' + pos);

                if (padding) {
                    styles['padding-' + pos] = Utils.convertToPixels(padding);
                }

                if (margin) {
                    styles['margin-' + pos] = Utils.convertToPixels(margin);
                }
            });

            each(styles, function (value, name) {

                // remove styles with no width value
                if (name.indexOf('-width') !== -1 && value === "") {
                    var prefix = name.replace(/-width/, '');

                    delete styles[prefix + '-style'];
                    delete styles[prefix + '-color'];
                    delete styles[name];
                }

                // convert named colors to hex
                if (name.indexOf('color') !== -1) {
                    styles[name] = Utils.namedColorToHex(value);
                }
            });

            each(Utils.backgroundStyles, function (def, name) {
                var value = dom.getStyle(n, name);

                if (value === def) {
                    value = "";
                }

                styles[name] = value;
            });

            // remove borders
            dom.setStyle(n, 'border', '');

            // remove background
            dom.setStyle(n, 'background', '');

            dom.setStyles(n, styles);
        });

        // update indent conversion
        each(dom.select('[data-mce-indent]', o.node), function (el) {
            if (el.nodeName === "p") {
                var value = dom.getAttrib(el, 'data-mce-indent');
                var style = ed.settings.indent_use_margin ? 'margin-left' : 'padding-left';

                dom.setStyle(el, style, value + 'px');
            }

            dom.setAttrib(el, 'data-mce-indent', '');
        });

        each(dom.select('[data-mce-word-list]', o.node), function (el) {
            el.removeAttribute('data-mce-word-list');
        });
    }

    function isValidDataUriImage(value) {
        return /^(file:|data:image)\//i.test(value);
    }

    function canUploadDataImage() {
        var uploader = ed.plugins.upload;

        return uploader && uploader.plugins.length;
    }

    // Process images - remove local
    each(dom.select('img', o.node), function (el) {
        var src = dom.getAttrib(el, 'src');

        // remove or processs for upload img element if blank, local file url or base64 encoded
        if (!src || isValidDataUriImage(src)) {
            // leave it as it is to be processed as a blob
            if (ed.settings.clipboard_paste_data_images) {
                return true;
            }

            if (ed.settings.clipboard_paste_upload_data_images != false && canUploadDataImage()) {
                // add marker
                ed.dom.setAttrib(el, 'data-mce-upload-marker', '1');
            } else {
                dom.remove(el);
            }
        } else {
            dom.setAttrib(el, 'src', ed.convertURL(src));
        }
    });

    // remove font and underline tags in IE
    if (isIE) {
        each(dom.select('a', o.node), function (el) {
            each(dom.select('font,u'), function (n) {
                dom.remove(n, 1);
            });
        });
    }

    // remove tags
    if (ed.getParam('clipboard_paste_remove_tags')) {
        dom.remove(dom.select(ed.getParam('clipboard_paste_remove_tags'), o.node), 1);
    }

    // keep tags
    if (ed.getParam('clipboard_paste_keep_tags')) {
        var tags = ed.getParam('clipboard_paste_keep_tags');

        dom.remove(dom.select('*:not(' + tags + ')', o.node), 1);
    }

    // remove all spans
    if (ed.getParam('clipboard_paste_remove_spans')) {
        dom.remove(dom.select('span', o.node), 1);
        // remove empty spans
    } else {
        ed.dom.remove(dom.select('span:empty', o.node));

        each(dom.select('span', o.node), function (n) {
            // remove span without children eg: <span></span>
            if (!n.childNodes || n.childNodes.length === 0) {
                dom.remove(n);
            }

            // remove span without attributes
            if (dom.getAttribs(n).length === 0) {
                dom.remove(n, 1);
            }
        });
    }

    if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
        dom.remove(dom.select('p:empty', o.node));

        each(dom.select('p', o.node), function (n) {
            var h = n.innerHTML;

            // remove paragraph without children eg: <p></p>
            if (!n.childNodes || n.childNodes.length === 0 || /^(\s|&nbsp;|\u00a0)?$/.test(h)) {
                dom.remove(n);
            }
        });
    }

    // replace paragraphs with linebreaks
    /*if (!ed.getParam('forced_root_block')) {
        var frag = dom.createFragment('<br /><br />');

        each(dom.select('p,div', o.node), function (n) {
            // if the linebreaks are 
            if (n.parentNode.lastChild !== n) {
                dom.insertAfter(frag, n);
            }

            dom.remove(n, 1);
        });
    }*/

    ed.onPastePostProcess.dispatch(ed, o);
    ed.execCallback('paste_postprocess', e, o);
}

/**
 * Process style attributes
 * @param node Node to process
 */
function processStyles(editor, node) {
    var dom = editor.dom;

    // Style to keep
    var keepStyles = editor.getParam('clipboard_paste_retain_style_properties');

    // Style to remove
    var removeStyles = editor.getParam('clipboard_paste_remove_style_properties');

    // split to array if string
    if (keepStyles && tinymce.is(keepStyles, 'string')) {
        var styleProps = tinymce.explode(keepStyles);

        each(styleProps, function (style, i) {
            if (style === "border") {
                // add expanded border styles
                styleProps = styleProps.concat(Utils.borderStyles);
                return true;
            }
        });
    }

    // split to array if string
    if (removeStyles && tinymce.is(removeStyles, 'string')) {
        var removeProps = tinymce.explode(removeStyles);

        each(removeProps, function (style, i) {
            if (style === "border") {
                // add expanded border styles
                removeProps = removeProps.concat(Utils.borderStyles);
                return true;
            }
        });

        // remove from core styleProps array
        styleProps = tinymce.grep(styleProps, function (prop) {
            return tinymce.inArray(removeProps, prop) === -1;
        });
    }

    // Retains some style properties
    each(dom.select('*[style]', node), function (n) {
        var ns = {},
            x = 0;

        // get styles on element
        var styles = dom.parseStyle(n.style.cssText);

        // check style against styleProps array
        each(styles, function (v, k) {
            if (tinymce.inArray(styleProps, k) != -1) {
                ns[k] = v;
                x++;
            }
        });

        // Remove all of the existing styles
        dom.setAttrib(n, 'style', '');

        // compress
        ns = dom.parseStyle(dom.serializeStyle(ns, n.nodeName));

        if (x > 0) {
            dom.setStyles(n, ns); // Add back the stored subset of styles
        } else {
            // Remove empty span tags that do not have class attributes
            if (n.nodeName == 'SPAN' && !n.className) {
                dom.remove(n, true);
            }
        }

        // We need to compress the styles on WebKit since if you paste <img border="0" /> it will become <img border="0" style="... lots of junk ..." />
        // Removing the mce_style that contains the real value will force the Serializer engine to compress the styles
        if (tinymce.isWebKit) {
            n.removeAttribute('data-mce-style');
        }
    });

    // convert some attributes
    each(dom.select('*[align]', node), function (el) {
        var v = dom.getAttrib(el, 'align');

        if (v === "left" || v === "right" || v === "center") {
            if (/(IFRAME|IMG|OBJECT|VIDEO|AUDIO|EMBED)/i.test(el.nodeName)) {
                if (v === "center") {
                    dom.setStyles(el, {
                        'margin': 'auto',
                        'display': 'block'
                    });
                } else {
                    dom.setStyle(el, 'float', v);
                }
            } else {
                dom.setStyle(el, 'text-align', v);
            }
        }

        el.removeAttribute('align');
    });
}

/**
 * Convert URL strings to elements
 * @param content HTML to process
 */
function convertURLs(ed, content) {

    var ex = '([-!#$%&\'\*\+\\./0-9=?A-Z^_`a-z{|}~]+@[-!#$%&\'\*\+\\/0-9=?A-Z^_`a-z{|}~]+\.[-!#$%&\'*+\\./0-9=?A-Z^_`a-z{|}~]+)';
    var ux = '((?:news|telnet|nttp|file|http|ftp|https)://[-!#$%&\'\*\+\\/0-9=?A-Z^_`a-z{|}~;]+\.[-!#$%&\'\*\+\\./0-9=?A-Z^_`a-z{|}~;]+)';

    var attribRe = '(?:(?:href|src|poster|data|value|srcset|longdesc|usemap|cite|classid|codebase)=["\'])'; // match attribute before url, eg: href="url"
    var bracketRe = '(?:\{|\].?)'; // match shortcode and markdown, eg: {url} or [url] or [text](url)

    function createLink(url) {
        var attribs = ['href="' + url + '"'];

        if (ed.settings.default_link_target) {
            attribs.push('target="' + ed.settings.default_link_target + '"');
        }

        return '<a ' + attribs.join(' ') + '>' + url + '</a>';
    }

    function wrapContent(content) {
        if (content.indexOf('data-mce-convert="url"') === -1) {
            return ed.dom.createHTML('div', { 'data-mce-convert': 'url' }, content);
        }

        return content;
    }

    // existing link...
    var decoded = ed.dom.decode(content);

    // skip blobs and data uri
    if (/^<img src="(data|blob):[^>]+?>/.test(content)) {
        return content;
    }

    if (/^<a([^>]+)>([\s\S]+?)<\/a>$/.test(decoded)) {
        return content;
    }

    if (ed.getParam('autolink_url', true)) {
        if (new RegExp('^' + ux + '$').test(content)) {
            content = createLink(content);
            return content;
        }

        // wrap content - this seems to be required to prevent repeats of link conversion
        content = wrapContent(content);

        // find and link url if not already linked
        content = content.replace(new RegExp('(' + attribRe + '|' + bracketRe + ')?' + ux, 'gi'), function (match, extra, url) {
            if (extra) {
                return match;
            }

            // only if not already a link or shortcode
            return createLink(url);
        });
    }

    if (ed.getParam('autolink_email', true)) {

        if (new RegExp('^' + ex + '$').test(content)) {
            return '<a href="mailto:' + content + '">' + content + '</a>';
        }

        // wrap content - this seems to be required to prevent repeats of link conversion
        content = wrapContent(content);

        content = content.replace(new RegExp('(href=["\']mailto:)*' + ex, 'g'), function (match, attrib, email) {
            // only if not already a mailto: link
            if (!attrib) {
                return '<a href="mailto:' + email + '">' + email + '</a>';
            }

            return match;
        });
    }

    return content;
}

/**
 * Gets various content types out of a datatransfer object.
 *
 * @param {DataTransfer} dataTransfer Event fired on paste.
 * @return {Object} Object with mime types and data for those mime types.
 */
function getDataTransferItems(dataTransfer) {
    var items = {};

    if (dataTransfer) {
        // Use old WebKit/IE API
        if (dataTransfer.getData) {
            var legacyText = dataTransfer.getData('Text');
            if (legacyText && legacyText.length > 0) {
                if (legacyText.indexOf(mceInternalUrlPrefix) === -1) {
                    items['text/plain'] = legacyText;
                }
            }
        }

        if (dataTransfer.types) {
            for (var i = 0; i < dataTransfer.types.length; i++) {
                var contentType = dataTransfer.types[i];
                try { // IE11 throws exception when contentType is Files (type is present but data cannot be retrieved via getData())
                    items[contentType] = dataTransfer.getData(contentType);
                } catch (ex) {
                    items[contentType] = ""; // useless in general, but for consistency across browsers
                }
            }
        }
    }

    return items;
}

/**
 * Gets various content types out of the Clipboard API. It will also get the
 * plain text using older IE and WebKit API:s.
 *
 * @param {ClipboardEvent} clipboardEvent Event fired on paste.
 * @return {Object} Object with mime types and data for those mime types.
 */
function getClipboardContent(editor, clipboardEvent) {
    //var content = getDataTransferItems(clipboardEvent.clipboardData || clipboardEvent.dataTransfer || editor.getDoc().dataTransfer);
    var content = getDataTransferItems(clipboardEvent.clipboardData || editor.getDoc().dataTransfer);

    return content;
}

function isKeyboardPasteEvent(e) {
    return (VK.metaKeyPressed(e) && e.keyCode == 86) || (e.shiftKey && e.keyCode == 45);
}

function hasContentType(clipboardContent, mimeType) {
    return mimeType in clipboardContent && clipboardContent[mimeType].length > 0;
}

function hasHtmlOrText(content) {
    return (hasContentType(content, 'text/html') || hasContentType(content, 'text/plain')) && !content.Files;
}

// IE flag to include Edge
var isIE = tinymce.isIE || tinymce.isIE12;

tinymce.create('tinymce.plugins.ClipboardPlugin', {
    init: function (ed, url) {
        var self = this;

        self.editor = ed;
        self.url = url;

        CutCopy.register(ed);

        var keyboardPastePlainTextState, keyboardPasteTimeStamp = 0;
        var pasteBin = new PasteBin(ed);

        // set default paste state for dialog trigger
        this.canPaste = false;

        // set pasteAsPlainText flag
        this.pasteAsPlainText = false;

        // Setup plugin events
        self.onPreProcess = new Dispatcher(this);
        self.onPostProcess = new Dispatcher(this);

        ed.onGetClipboardContent = new Dispatcher(this);
        ed.onPastePreProcess = new Dispatcher(this);
        ed.onPastePostProcess = new Dispatcher(this);
        ed.onPasteBeforeInsert = new Dispatcher(this);

        // process quirks
        if (tinymce.isWebKit) {
            self.onPreProcess.add(Quirks.removeWebKitStyles);
        }

        if (isIE) {
            self.onPreProcess.add(Quirks.removeExplorerBrElementsAfterBlocks);
        }

        // Register default handlers
        self.onPreProcess.add(preProcess);
        self.onPostProcess.add(postProcess);

        self.pasteText = ed.getParam('clipboard_paste_text', 1);
        self.pasteHtml = ed.getParam('clipboard_paste_html', 1);

        // Add command for external usage
        ed.addCommand('mceInsertClipboardContent', function (u, data) {
            self.pasteAsPlainText = false;

            if (data.text) {
                self.pasteAsPlainText = true;
                pasteText(data.text);
            }

            if (data.content) {
                pasteHtml(data.content);
            }
        });

        ed.onInit.add(function () {
            if (ed.plugins.contextmenu) {
                ed.plugins.contextmenu.onContextMenu.add(function (th, m, e) {
                    var c = ed.selection.isCollapsed();

                    if (ed.getParam('clipboard_cut', 1)) {
                        m.add({
                            title: 'advanced.cut_desc',
                            /* TODO - Change to clipboard.cut_desc */
                            icon: 'cut',
                            cmd: 'Cut'
                        }).setDisabled(c);
                    }

                    if (ed.getParam('clipboard_copy', 1)) {
                        m.add({
                            title: 'advanced.copy_desc',
                            /* TODO - Change to clipboard.copy_desc */
                            icon: 'copy',
                            cmd: 'Copy'
                        }).setDisabled(c);
                    }

                    if (self.pasteHtml) {
                        m.add({
                            title: 'clipboard.paste_desc',
                            /* TODO - Change to clipboard.paste_desc */
                            icon: 'paste',
                            cmd: 'mcePaste'
                        });
                    }
                    if (self.pasteText) {
                        m.add({
                            title: 'clipboard.paste_text_desc',
                            /* TODO - Change to clipboard.paste_text_desc */
                            icon: 'pastetext',
                            cmd: 'mcePasteText'
                        });
                    }
                });

            }
        });

        function pasteText(text) {
            // encode text and replace returns
            text = ed.dom.encode(text).replace(/\r\n/g, '\n');

            // convert newlines to block elements
            text = Newlines.convert(text, ed.settings.forced_root_block, ed.settings.forced_root_block_attrs);

            pasteHtml(text);
        }

        function sanitizePastedHTML(html) {
            var parser = new DomParser({ allow_event_attributes: !!ed.settings.clipboard_paste_allow_event_attributes }, ed.schema);

            // Strip elements
            parser.addNodeFilter('meta,svg,script,noscript', function (nodes) {
                var i = nodes.length;

                while (i--) {
                    nodes[i].remove();
                }
            });

            // remove spans
            if (ed.getParam('clipboard_paste_remove_spans')) {
                parser.addNodeFilter('span', function (nodes, name) {
                    var i = nodes.length;

                    while (i--) {
                        nodes[i].unwrap();
                    }
                });
            }

            // remove attributes
            var remove_attribs = ed.getParam('clipboard_paste_remove_attributes');

            if (remove_attribs) {
                parser.addAttributeFilter(remove_attribs, function (nodes, name) {
                    var i = nodes.length;

                    while (i--) {
                        nodes[i].attr(name, null);
                    }
                });
            }

            var fragment = parser.parse(html, { forced_root_block: false, isRootContent: true });

            return new Serializer({ validate: ed.settings.validate }, ed.schema).serialize(fragment);
        }

        function pasteHtml(content, internal) {
            if (!content) {
                return;
            }

            // create object to process
            var o = {
                content: content,
                internal: internal
            };

            // only process externally sourced content
            if (!internal) {
                // Execute pre process handlers
                self.onPreProcess.dispatch(self, o);

                // sanitize content
                o.content = sanitizePastedHTML(o.content);

                // convert urls in content
                if (ed.getParam('clipboard_paste_convert_urls', true)) {
                    o.content = convertURLs(ed, o.content);
                }

                // Create DOM structure
                o.node = ed.dom.create('div', { style: 'display:none' }, o.content);

                // Execute post process handlers
                self.onPostProcess.dispatch(self, o);

                // get content from node
                o.content = o.node.innerHTML;

                // remove empty paragraphs
                if (ed.getParam('clipboard_paste_remove_empty_paragraphs', true)) {
                    o.content = o.content.replace(/<p([^>]+)>(&nbsp;|\u00a0)?<\/p>/g, '');
                }

                // clean up extra whitespace
                if (ed.getParam('clipboard_paste_remove_whitespace')) {
                    o.content = o.content.replace(/(&nbsp;|\u00a0|\s| ){2,}/g, ' ');
                }

                // process regular expression
                if (ed.getParam('clipboard_paste_filter')) {
                    var re, rules = ed.getParam('clipboard_paste_filter').split(';');

                    each(rules, function (s) {
                        // if it is already in Regular Expression format...
                        if (/^\/.*\/(g|i|m)*$/.test(s)) {
                            re = (new Function('return ' + s))();
                            // ...else create expression
                        } else {
                            re = new RegExp(s);
                        }

                        o.content = o.content.replace(re, "");
                    });
                }
            }

            ed.onPasteBeforeInsert.dispatch(ed, o);

            self._insert(o.content);

            // reset pasteAsPlainText state
            self.pasteAsPlainText = false;
        }

        // This function executes the process handlers and inserts the contents
        function insertClipboardContent(clipboardContent, internal) {
            var content, isPlainTextHtml;

            // Grab HTML from paste bin as a fallback
            if (!isHtmlPaste(clipboardContent)) {
                content = pasteBin.getHtml();

                // no content....?
                if (pasteBin.isDefaultContent(content)) {
                    self.pasteAsPlainText = true;
                } else {
                    // is marked as internal paste
                    internal = internal ? internal : InternalHtml.isMarked(content);

                    clipboardContent['text/html'] = content;
                }
            }

            // remove pasteBin and reset rng
            pasteBin.remove();

            ed.onGetClipboardContent.dispatch(ed, clipboardContent);

            // get html content
            content = clipboardContent['x-tinymce/html'] || clipboardContent['text/html'];

            // unmark content
            content = InternalHtml.unmark(content);

            // trim
            content = Utils.trimHtml(content);

            // pasting content into a pre element so encode html first, then insert using setContent
            if (isPasteInPre()) {
                var text = clipboardContent['text/plain'];

                // encode
                text = ed.dom.encode(text);

                // prefer plain text, otherwise use encoded html
                if (content && !text) {
                    text = ed.dom.encode(content);
                }

                ed.selection.setContent(text, { no_events: true });

                return true;
            }

            /*if (!internal && isPlainTextPaste(clipboardContent)) {
                // set pasteAsPlainText state
                self.pasteAsPlainText = clipboardContent['text/plain'] == content;
            }*/

            var isPlainTextHtml = (internal === false && (Newlines.isPlainText(content)));

            // If we got nothing from clipboard API and pastebin or the content is a plain text (with only
            // some BRs, Ps or DIVs as newlines) then we fallback to plain/text
            if (!content.length || isPlainTextHtml) {
                self.pasteAsPlainText = true;
            }

            // paste text
            if (self.pasteAsPlainText) {
                // Use plain text contents from Clipboard API unless the HTML contains paragraphs then
                // we should convert the HTML to plain text since works better when pasting HTML/Word contents as plain text
                if (hasContentType(clipboardContent, 'text/plain') && isPlainTextHtml) {
                    content = clipboardContent['text/plain'];
                } else {
                    content = Utils.innerText(content);
                }

                pasteText(content);

                return true;
            }

            // paste HTML
            pasteHtml(content, internal);
        }

        ed.onKeyDown.add(function (ed, e) {
            // block events
            if (!ed.getParam('clipboard_allow_cut', 1) && (VK.metaKeyPressed(e) && e.keyCode == 88)) {
                e.preventDefault();
                return false;
            }

            if (!ed.getParam('clipboard_allow_copy', 1) && (VK.metaKeyPressed(e) && e.keyCode == 67)) {
                e.preventDefault();
                return false;
            }

            function removePasteBinOnKeyUp(e) {
                // Ctrl+V or Shift+Insert
                if (isKeyboardPasteEvent(e) && !e.isDefaultPrevented()) {
                    pasteBin.remove();
                }
            }

            // Ctrl+V or Shift+Insert
            if (isKeyboardPasteEvent(e) && !e.isDefaultPrevented()) {
                keyboardPasteTimeStamp = new Date().getTime();

                // Prevent undoManager keydown handler from making an undo level with the pastebin in it
                e.stopImmediatePropagation();

                keyboardPastePlainTextState = e.shiftKey && e.keyCode == 86;

                // mark as plain text paste
                if (keyboardPastePlainTextState) {
                    self.pasteAsPlainText = true;
                }

                pasteBin.remove();
                pasteBin.create();

                // Remove pastebin if we get a keyup and no paste event
                // For example pasting a file in IE 11 will not produce a paste event
                ed.dom.bind(ed.getBody(), 'keyup', function handler(e) {
                    removePasteBinOnKeyUp(e);
                    ed.dom.unbind(ed.getBody(), 'keyup', handler);
                });

                ed.dom.bind(ed.getBody(), 'paste', function handler(e) {
                    removePasteBinOnKeyUp(e);
                    ed.dom.unbind(ed.getBody(), 'paste', handler);
                });
            }
        });

        /**
         * Chrome on Android doesn't support proper clipboard access so we have no choice but to allow the browser default behavior.
         *
         * @param {Event} e Paste event object to check if it contains any data.
         * @return {Boolean} true/false if the clipboard is empty or not.
         */
        function isBrokenAndroidClipboardEvent(e) {
            var clipboardData = e.clipboardData;

            return navigator.userAgent.indexOf('Android') !== -1 && clipboardData && clipboardData.items && clipboardData.items.length === 0;
        }

        function isHtmlPaste(content) {
            if (!hasContentType(content, "text/html")) {
                return false;
            }

            return true;
        }

        function pasteImageData(e) {
            var dataTransfer = e.clipboardData || e.dataTransfer;

            var rng = pasteBin.getLastRng();

            function processItems(items) {
                var i, item, hadImage = false;

                if (items) {
                    for (i = 0; i < items.length; i++) {
                        item = items[i];

                        if (/^image\/(jpeg|png|gif|bmp)$/.test(item.type)) {
                            hadImage = true;
                            e.preventDefault();

                            if (ed.settings.clipboard_paste_data_images) {
                                var blob = item.getAsFile ? item.getAsFile() : item;

                                var reader = new FileReader();
                                // eslint-disable-next-line no-loop-func
                                reader.onload = function () {
                                    var html = pasteImage(ed, rng, reader, blob);
                                    pasteHtml(html);
                                };

                                reader.readAsDataURL(blob);
                            } else {
                                pasteHtml('<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-mce-upload-marker="1" />', true);
                            }
                        }
                    }
                }

                return hadImage;
            }

            pasteBin.remove();

            if (!dataTransfer) {
                return false;
            }

            return processItems(dataTransfer.items) || processItems(dataTransfer.files);
        }

        function isPasteInPre() {
            var node = ed.selection.getNode();
            return ed.settings.html_paste_in_pre !== false && node && node.nodeName === 'PRE';
        }

        function getCaretRangeFromEvent(e) {
            return tinymce.dom.RangeUtils.getCaretRangeFromPoint(e.clientX, e.clientY, ed.getDoc());
        }

        function isPlainTextFileUrl(content) {
            var plainTextContent = content['text/plain'];
            return plainTextContent ? plainTextContent.indexOf('file://') === 0 : false;
        }

        function getContentAndInsert(e) {
            // Getting content from the Clipboard can take some time
            var clipboardTimer = new Date().getTime();
            var clipboardContent = getClipboardContent(ed, e);
            var clipboardDelay = new Date().getTime() - clipboardTimer;

            function isKeyBoardPaste() {
                if (e.type == 'drop') {
                    return false;
                }

                return (new Date().getTime() - keyboardPasteTimeStamp - clipboardDelay) < 1000;
            }

            var internal = hasContentType(clipboardContent, InternalHtml.internalHtmlMime());

            keyboardPastePlainTextState = false;

            if (e.isDefaultPrevented() || isBrokenAndroidClipboardEvent(e)) {
                pasteBin.remove();
                return;
            }

            // Not a keyboard paste prevent default paste and try to grab the clipboard contents using different APIs
            if (!isKeyBoardPaste()) {
                e.preventDefault();
            }

            // Try IE only method if paste isn't a keyboard paste
            if (isIE && (!isKeyBoardPaste() || e.ieFake) && !hasContentType(clipboardContent, 'text/html')) {
                pasteBin.create();

                ed.dom.bind(ed.dom.get('mcepastebin'), 'paste', function (e) {
                    e.stopPropagation();
                });

                ed.getDoc().execCommand('Paste', false, null);
                clipboardContent["text/html"] = pasteBin.getHtml();
            }

            if (isPlainTextFileUrl(clipboardContent)) {
                pasteBin.remove();
                return;
            }

            if (!hasHtmlOrText(clipboardContent) && pasteImageData(e, pasteBin.getLastRng())) {
                pasteBin.remove();
                return;
            }

            // If clipboard API has HTML then use that directly
            if (isHtmlPaste(clipboardContent)) {
                e.preventDefault();

                // if clipboard lacks internal mime type, inspect html for internal markings
                if (!internal) {
                    internal = InternalHtml.isMarked(clipboardContent['text/html']);
                }

                insertClipboardContent(clipboardContent, internal);
            } else {
                setTimeout(function () {
                    function block(e) {
                        e.preventDefault();
                    }

                    // Block mousedown and click to prevent selection change
                    ed.dom.bind(ed.getDoc(), 'mousedown', block);
                    ed.dom.bind(ed.getDoc(), 'keydown', block);

                    insertClipboardContent(clipboardContent, internal);

                    // Block mousedown and click to prevent selection change
                    ed.dom.unbind(ed.getDoc(), 'mousedown', block);
                    ed.dom.unbind(ed.getDoc(), 'keydown', block);
                }, 0);
            }
        }

        function openWin(cmd) {
            var title = '', ctrl;

            var msg = ed.getLang('clipboard.paste_dlg_title', 'Use %s+V on your keyboard to paste text into the window.');
            msg = msg.replace(/%s/g, tinymce.isMac ? 'CMD' : 'CTRL');

            if (cmd === "mcePaste") {
                title = ed.getLang('clipboard.paste_desc');
                ctrl = '<iframe id="' + ed.id + '_paste_content" src="javascript:;" frameborder="0" title="' + msg + '"></iframe>';

            } else {
                title = ed.getLang('clipboard.paste_text_desc');
                ctrl = '<textarea id="' + ed.id + '_paste_content" dir="ltr" wrap="soft" rows="7" autofocus></textarea>';
            }

            var html = '' +
                '<div class="mceModalRow mceModalStack">' +
                '   <label for="' + ed.id + '_paste_content">' + msg + '</label>' +
                '</div>' +
                '<div class="mceModalRow">' +
                '   <div class="mceModalControl">' + ctrl + '</div>' +
                '</div>';

            ed.windowManager.open({
                title: title,
                content: html,
                size: 'mce-modal-landscape-medium',
                open: function () {
                    var ifr = DOM.get(ed.id + '_paste_content');

                    if (ifr.nodeName !== "IFRAME") {
                        window.setTimeout(function () {
                            ifr.focus();
                        }, 10);

                        return;
                    }

                    var doc = ifr.contentWindow.document;

                    var css, cssHTML = '';

                    // Force absolute CSS urls
                    css = tinymce.explode(ed.settings.content_css) || [];
                    css.push(ed.baseURI.toAbsolute("themes/" + ed.settings.theme + "/skins/" + ed.settings.skin + "/content.css"));

                    cssHTML += '<style type="text/css">body {background-color:white;color:black;text-align:left;}</style>';

                    tinymce.each(css, function (u) {
                        cssHTML += '<link href="' + ed.documentBaseURI.toAbsolute('' + u) + '" rel="stylesheet" type="text/css" />';
                    });

                    // Write content into iframe
                    doc.open();
                    doc.write('<html><head><base href="' + ed.settings.base_url + '" />' + cssHTML + '</head><body class="mceContentBody" spellcheck="false">&nbsp;</body></html>');
                    doc.close();

                    doc.designMode = 'on';

                    window.setTimeout(function () {
                        ifr.contentWindow.focus();
                    }, 10);
                },
                buttons: [
                    {
                        title: ed.getLang('cancel', 'Cancel'),
                        id: 'cancel'
                    },
                    {
                        title: ed.getLang('insert', 'Insert'),
                        id: 'insert',
                        onsubmit: function (e) {
                            var node = DOM.get(ed.id + '_paste_content'), data = {};

                            if (node.nodeName == 'TEXTAREA') {
                                data.text = node.value;
                            } else {
                                var content = node.contentWindow.document.body.innerHTML;
                                // Remove styles
                                content = content.replace(/<style[^>]*>[\s\S]+?<\/style>/gi, '');
                                // trim and assign
                                data.content = tinymce.trim(content);
                            }

                            ed.execCommand('mceInsertClipboardContent', false, data);
                        },
                        classes: 'primary',
                        autofocus: true
                    }
                ]
            });
        }

        // Grab contents on paste event
        ed.onPaste.add(function (ed, e) {
            getContentAndInsert(e);
        });

        ed.onInit.add(function () {
            var draggingInternally;

            ed.dom.bind(ed.getBody(), ['dragstart', 'dragend'], function (e) {
                draggingInternally = e.type == 'dragstart';
            });

            ed.dom.bind(ed.getBody(), 'drop', function (e) {
                var rng = getCaretRangeFromEvent(e);

                if (e.isDefaultPrevented() || draggingInternally) {
                    return;
                }

                if (rng && ed.settings.clipboard_paste_filter_drop !== false) {
                    ed.selection.setRng(rng);
                    getContentAndInsert(e);
                }
            });

            ed.dom.bind(ed.getBody(), ['dragover', 'dragend'], function (e) {
                if (ed.settings.clipboard_paste_data_images) {
                    e.preventDefault();
                }
            });
        });

        // Block all drag/drop events
        if (ed.getParam('clipboard_paste_block_drop')) {
            ed.onInit.add(function () {
                ed.dom.bind(ed.getBody(), ['dragend', 'dragover', 'draggesture', 'dragdrop', 'drop', 'drag'], function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    return false;
                });
            });
        }

        // Add commands
        each(['mcePasteText', 'mcePaste'], function (cmd) {
            ed.addCommand(cmd, function () {
                var doc = ed.getDoc(),
                    failed;

                // just open the window
                if (ed.getParam('paste_use_dialog')) {
                    return openWin(cmd);
                } else {
                    try {
                        // set plain text mode
                        self.pasteAsPlainText = (cmd === "mcePasteText");

                        doc.execCommand('Paste', false, null);
                    } catch (e) {
                        failed = true;
                    }

                    // Chrome reports the paste command as supported however older IE:s will return false for cut/paste
                    if (!doc.queryCommandEnabled('Paste')) {
                        failed = true;
                    }

                    if (failed) {
                        return openWin(cmd);
                    }
                }
            });
        });

        // Add buttons
        if (self.pasteHtml) {
            ed.addButton('paste', {
                title: 'clipboard.paste_desc',
                cmd: 'mcePaste',
                ui: true
            });
        }

        if (self.pasteText) {
            ed.addButton('pastetext', {
                title: 'clipboard.paste_text_desc',
                cmd: 'mcePasteText',
                ui: true
            });
        }

        if (ed.getParam('clipboard_cut', 1)) {
            ed.addButton('cut', {
                title: 'advanced.cut_desc',
                cmd: 'Cut',
                icon: 'cut'
            });
        }

        if (ed.getParam('clipboard_copy', 1)) {
            ed.addButton('copy', {
                title: 'advanced.copy_desc',
                cmd: 'Copy',
                icon: 'copy'
            });
        }
    },


    /**
     * Inserts the specified contents at the caret position.
     */
    _insert: function (content, skip_undo) {
        var ed = this.editor;

        // get validate setting
        var validate = ed.settings.validate;

        // reset validate setting
        ed.settings.validate = true;

        // insert content
        ed.execCommand('mceInsertContent', false, content);

        // reset validate
        ed.settings.validate = validate;
    }
});
// Register plugin
tinymce.PluginManager.add('clipboard', tinymce.plugins.ClipboardPlugin);