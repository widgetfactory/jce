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

import { each, extend, DOM, VK, isNonEditable } from './Utils.js';
import { extendSandboxExclusions, getMediaProps, isSupportedMedia, isValidElement } from './Providers.js';
import { placeHolderConverter, convertPlaceholderToMedia, convertMediaToPlaceholder, previewToPlaceholder, placeholderToPreview, createPreviewNode } from './Nodes.js';
import { getMediaHtml, isMediaHtml, getMediaData, updateMedia } from './Media.js';

ibis.PluginManager.add('media', function (ed, url) {
    var custom_sandbox_iframes_exclusions = ed.getParam('media_iframes_sandbox_exclusions');

    if (custom_sandbox_iframes_exclusions && typeof custom_sandbox_iframes_exclusions === 'string') {
        custom_sandbox_iframes_exclusions = custom_sandbox_iframes_exclusions.split(',').map(function (item) {
            return item.trim();
        });
    }

    extendSandboxExclusions(custom_sandbox_iframes_exclusions);

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
                if (node.nodeName !== 'IMG') {
                    e.target = previewToPlaceholder(ed, node);
                }
            }

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

            if (!isSupportedMedia(ed, o.before)) {
                return;
            }

            each(ed.dom.select('video.mce-object, audio.mce-object, iframe.mce-object, img.mce-object'), function (elm) {
                var src = elm.getAttribute('src');

                if (elm.nodeName === 'IMG') {
                    src = elm.getAttribute('data-mce-p-src');
                }

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

        if (ed.settings.schema === "html4") {
            ed.schema.addValidElements('iframe[longdesc|name|src|frameborder|marginwidth|marginheight|scrolling|align|width|height|allowfullscreen|seamless|*]');
            ed.schema.addValidElements('video[src|autobuffer|autoplay|loop|controls|width|height|poster|*],audio[src|autobuffer|autoplay|loop|controls|*],source[src|type|media|*],embed[src|type|width|height|*]');
        }

        ed.parser.addNodeFilter('iframe,video,audio,object,embed',
            placeHolderConverter(ed));

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

            ed.dom.setAttrib(elm, 'data-mce-width', width);
            ed.dom.setAttrib(elm, 'data-mce-height', height);

            ed.dom.removeAttrib(elm, 'width');
            ed.dom.removeAttrib(elm, 'height');

            ed.dom.setStyles(elm, { 'width': width, 'height': height });
        });

        ed.dom.bind(ed.getDoc(), 'keyup click', function (e) {
            var node = ed.selection.getNode();

            if (!node.hasAttribute('data-mce-object')) {
                return;
            }

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
            if (cmd && (cmd == 'ApplyFormat' || cmd == 'RemoveFormat' || cmd == 'ToggleFormat')) {
                var node = ed.selection.getNode();

                if (ibis.is(values, 'object') && values.node) {
                    node = values.node;
                }

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

                    if (mediaNode && ibis.is(values, 'object')) {
                        values.node = mediaNode;
                    }
                }
            }
        });

        ed.onBeforeSetContent.add(function (ed, o) {
            if (settings.media_live_embed) {
                o.content = o.content.replace(/<br data-mce-caret="1"[^>]+>/gi, '');

                if (/^<(iframe|video|audio)([^>]+)><\/(iframe|video|audio)>$/.test(o.content)) {
                    o.content += '<br data-mce-caret="1" />';
                }
            }
        });
    });

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

        var node = isMediaObject();

        if (!node) {
            return;
        }

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

    ed.onCopy.add(setClipboardData);
    ed.onCut.add(setClipboardData);

    function updatePreviewSelection(ed) {
        each(ed.dom.select('.mce-object-preview', ed.getBody()), function (node) {

            if (ed.dom.isBlock(node.parentNode) && !node.previousSibling && !node.nextSibling) {
                ed.dom.insertAfter(ed.dom.create('br', { 'data-mce-bogus': 1 }), node);
            }
        });
    }

    ed.onSetContent.add(function (ed, o) {
        updatePreviewSelection(ed);
    });

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

    ibis.util.MediaEmbed = {
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

        var html = ibis.util.MediaEmbed.dataToHtml(name, data, innerHtml);

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
        },

        convertMediaToPlaceholder: function (node) {
            return convertMediaToPlaceholder(ed, node);
        }
    });
});
