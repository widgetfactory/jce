/**
 * @package     JCE
 * @copyright   Copyright (c) 2009       Moxiecode Systems AB. All rights reserved.
 * @copyright   Copyright (c) 1999–2015  Ephox Corp. All rights reserved.
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 * @note        Forked or includes code from TinyMCE 3.x/4.x/5.x (originally LGPL 2.1) and relicensed under GPL 2+ per LGPL 2.1 §3.
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var DOM = tinymce.DOM, Event = tinymce.dom.Event, each = tinymce.each, extend = tinymce.extend;

    // A selection of useful utilities borrowed from https://github.com/tinymce/tinymce/blob/develop/modules/tinymce/src/plugins/link/main/ts/core/Utils.ts
    var isAnchor = function (elm) {
        return elm && elm.nodeName.toLowerCase() === 'a';
    };

    var hasFileSpan = function (elm) {
        return isAnchor(elm) && elm.querySelector('span.wf_file_text') && elm.childNodes.length === 1;
    };

    function containsTextAndElementNodes(nodes) {
        var hasTextNodes = false;
        var hasElementNodes = false;

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            if (node.nodeType === 3) { // Text node
                hasTextNodes = true;
            } else if (node.nodeType === 1 && node.tagName != 'A') { // Element node
                hasElementNodes = true;
            }

            // If we have both types of nodes, we can return true immediately
            if (hasTextNodes && hasElementNodes) {
                return true;
            }
        }

        // If we reach this point, the array contains either text nodes or element nodes, but not both
        return false;
    }

    var collectNodesInRange = function (rng, predicate) {
        if (rng.collapsed) {
            return [];
        } else {
            var contents = rng.cloneContents();
            var walker = new tinymce.dom.TreeWalker(contents.firstChild, contents);
            var elements = [], nodes = [];
            var current = contents.firstChild;

            do {
                if (predicate(current)) {
                    elements.push(current);
                } else {
                    nodes.push(current);
                }
            } while ((current = walker.next()));

            if (nodes.length && containsTextAndElementNodes(nodes)) {
                return nodes;
            }

            return elements;
        }
    };

    var isOnlyTextSelected = function (ed) {
        // Allow anchor and inline text elements to be in the selection but nothing else
        var inlineTextElements = ed.schema.getTextInlineElements();
        var isElement = function (elm) {
            return elm.nodeType === 1 && !isAnchor(elm) && !inlineTextElements[elm.nodeName.toLowerCase()];
        };
        // Collect all non inline text elements in the range and make sure no elements were found
        var elements = collectNodesInRange(ed.selection.getRng(), isElement);

        return elements.length === 0;
    };

    var trimCaretContainers = function (text) {
        return text.replace(/\uFEFF/g, '');
    };

    var getAnchorText = function (selection, anchorElm) {
        var text = anchorElm ? (anchorElm.innerText || anchorElm.textContent) : selection.getContent({ format: 'text' });
        return trimCaretContainers(text);
    };

    var updateTextContent = function (elm, text) {
        tinymce.each(elm.childNodes, function (node) {
            // If it's a text node and has non-whitespace content
            if (node.nodeType == 3 && node.nodeValue.trim() !== "") {
                node.textContent = text;
            }
        });
    };

    function createLink(ed, data) {
        var node = ed.selection.getNode(), anchor = ed.dom.getParent(node, 'a[href]'), params = ed.getParam('link', {});

        if (typeof data === 'string') {
            data = { url: data, text: data };
        }

        // remove the link if no url
        if (!data.url) {
            if (isAnchor(node)) {
                ed.execCommand('unlink', false);
            }

            return false;
        }

        var text = getAnchorText(ed.selection, isAnchor(node) ? node : null) || '';

        // workaround for font items
        if (node && node.hasAttribute('data-mce-item')) {
            text = '';
            ed.selection.select(node);
        }

        // use passed in text value or node text or url
        data.text = data.text || text || data.url;

        // add missing protocol
        if (/^\s*www\./i.test(data.url)) {
            data.url = 'https://' + data.url;
        }

        var args = {
            'href': data.url,
            'title': data.title || '',
            'target': data.target || ''
        };

        args = tinymce.extend(args, params.attributes || {});

        // no selection, so create a link from the url
        if (ed.selection.isCollapsed()) {
            ed.execCommand('mceInsertContent', false, ed.dom.createHTML('a', args, data.text));
        // apply link to selection
        } else {
            args['data-mce-tmp'] = '1';

            ed.execCommand('mceInsertLink', false, args);

            if (isAnchor(anchor)) {
                updateTextContent(node, data.text);
            }

            var elms = ed.dom.select('[data-mce-tmp="1"]');

            each(elms, function (elm) {
                // remove tmp attribute
                elm.removeAttribute('data-mce-tmp');

                updateTextContent(elm, data.text);
            });
        }

        ed.undoManager.add();
        ed.nodeChanged();
    }

    tinymce.PluginManager.add('link', function (ed, url) {
        // Register commands
        ed.addCommand('mceLink', function () {
            var se = ed.selection, n = se.getNode();

            if (n.nodeName == 'A' && !isAnchor(n)) {
                se.select(n);
            }

            ed.windowManager.open({
                file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=link',
                size: 'mce-modal-square-xlarge'
            }, {
                plugin_url: url
            });
        });

        ed.addShortcut('meta+k', 'link.desc', 'mceLink');

        var urlCtrl, textCtrl, titleCtrl, targetCtrl;

        ed.onPreInit.add(function () {
            var params = ed.getParam('link', {});

            params = extend({
                attributes: {}
            }, params);

            var isMobile = window.matchMedia("(max-width: 600px)").matches;

            // use basic dialog if set in param or device screen size < 768px
            var isBasicDialog = params.basic_dialog === true || isMobile;

            if (!isBasicDialog) {
                return;
            }

            var cm = ed.controlManager, form = cm.createForm('link_form');

            var args = {
                label: ed.getLang('url', 'URL'),
                name: 'url',
                clear: true,
                attributes: {
                    required: true
                }
            };

            if (params.file_browser) {
                tinymce.extend(args, {
                    picker: true,
                    picker_label: 'browse',
                    picker_icon: 'files',
                    onpick: function (e) {
                        ed.execCommand('mceFileBrowser', true, {
                            caller: 'link',
                            callback: function (selected, data) {
                                if (data.length) {
                                    var src = data[0].url, title = data[0].title;
                                    urlCtrl.value(src);

                                    // clean up title by removing extension
                                    title = title.replace(/\.[^.]+$/i, '');

                                    textCtrl.value(title);

                                    window.setTimeout(function () {
                                        urlCtrl.focus();
                                    }, 10);
                                }
                            },
                            filter: params.filetypes || 'files',
                            value: urlCtrl.value()
                        });
                    }
                });
            }

            urlCtrl = cm.createUrlBox('link_url', args);

            form.add(urlCtrl);

            textCtrl = cm.createTextBox('link_text', {
                label: ed.getLang('link.text', 'Text'),
                name: 'text',
                clear: true,
                attributes: {
                    required: true
                }
            });

            form.add(textCtrl);

            if (params.title_ctrl !== false) {

                titleCtrl = cm.createTextBox('link_title', {
                    label: ed.getLang('link.title', 'Title'),
                    name: 'title',
                    clear: true
                });

                form.add(titleCtrl);

            }

            if (params.target_ctrl !== false) {
                targetCtrl = cm.createListBox('link_target', {
                    label: ed.getLang('link.target', 'Taget'),
                    name: 'target',
                    onselect: function (v) { }
                });

                var targetValues = {
                    '': '--',
                    '_blank': ed.getLang('link.target_blank', 'Open in new window'),
                    '_self': ed.getLang('link.target_self', 'Open in same window'),
                    '_parent': ed.getLang('link.target_parent', 'Open in parent window'),
                    '_top': ed.getLang('link.target_top', 'Open in top window')
                };

                each(targetValues, function (name, value) {
                    targetCtrl.add(name, value);
                });

                form.add(targetCtrl);
            }

            if (params.classes_ctrl !== false) {
                var stylesListCtrl = cm.createStylesBox('link_class', {
                    label: ed.getLang('link.class', 'Classes'),
                    onselect: function () { },
                    name: 'classes',
                    styles: params.custom_classes || []
                });
    
                form.add(stylesListCtrl);
            }

            // Register commands
            ed.addCommand('mceLink', function () {
                ed.windowManager.open({
                    title: ed.getLang('link.desc', 'Link'),
                    items: [form],
                    size: 'mce-modal-landscape-small',
                    open: function () {
                        var label = ed.getLang('insert', 'Insert'), node = ed.selection.getNode(), src = '', title = '', target = params.attributes.target || '';
                        var state = isOnlyTextSelected(ed);

                        var anchorNode = ed.dom.getParent(node, 'a[href]');

                        var classes = params.attributes.classes || '';
                        classes.trim().split(' ').filter(function (cls) {
                            return cls.trim() !== '';
                        });

                        if (anchorNode) {
                            ed.selection.select(anchorNode);

                            src = ed.dom.getAttrib(anchorNode, 'href');

                            if (src) {
                                label = ed.getLang('update', 'Update');
                            }

                            // reset node in IE if the link is the first element
                            if (tinymce.isIE) {
                                var start = ed.selection.getStart(),
                                    end = ed.selection.getEnd();

                                if (start === end && start.nodeName === "A") {
                                    anchorNode = start;
                                }
                            }

                            // allow editing of File Manager text
                            if (hasFileSpan(anchorNode)) {
                                state = true;
                            }

                            title = ed.dom.getAttrib(anchorNode, 'title');
                            target = ed.dom.getAttrib(anchorNode, 'target');

                            classes = ed.dom.getAttrib(node, 'class');

                            // clean
                            classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                                return cls.trim() !== '';
                            });
                        }

                        // get anchor or selected element text
                        var text = getAnchorText(ed.selection, isAnchor(node) ? node : null) || '';

                        // workaround for font items
                        if (node && node.hasAttribute('data-mce-item')) {
                            state = false;
                        }

                        urlCtrl.value(src);

                        textCtrl.value(text);
                        textCtrl.setDisabled(!state);

                        // update title and target
                        if (titleCtrl) {
                            titleCtrl.value(title);
                        }

                        if (targetCtrl) {
                            targetCtrl.value(target);
                        }

                        if (stylesListCtrl) {
                            stylesListCtrl.value(classes);
                        }

                        window.setTimeout(function () {
                            urlCtrl.focus();
                        }, 10);

                        DOM.setHTML(this.id + '_insert', label);
                    },
                    buttons: [
                        {
                            title: ed.getLang('common.cancel', 'Cancel'),
                            id: 'cancel'
                        },
                        {
                            title: ed.getLang('insert', 'Insert'),
                            id: 'insert',
                            onsubmit: function (e) {
                                var data = form.submit();

                                Event.cancel(e);

                                createLink(ed, data);
                            },
                            classes: 'primary',
                            scope: self
                        }
                    ]
                });
            });
        });

        ed.onInit.add(function () {
            if (ed && ed.plugins.contextmenu) {
                ed.plugins.contextmenu.onContextMenu.add(function (th, m, e) {
                    m.addSeparator();
                    m.add({ title: 'link.desc', icon: 'link', cmd: 'mceLink', ui: true });
                    if ((e.nodeName == 'A' && !ed.dom.getAttrib(e, 'name'))) {
                        m.add({ title: 'advanced.unlink_desc', icon: 'unlink', cmd: 'UnLink' });
                    }
                });
            }
        });

        ed.onNodeChange.add(function (ed, cm, n, co) {
            var link = ed.dom.getParent(n, 'a[href]'), anchor = link && ed.dom.hasClass(link, 'mce-item-anchor');

            // remove existing selections
            ed.dom.removeAttrib(ed.dom.select('a'), 'data-mce-selected');

            if (link) {
                ed.dom.setAttrib(link, 'data-mce-selected', 'inline-boundary');
            }

            // set active if link
            cm.setActive('unlink', link);
            cm.setActive('link', link);
            // set disabled if anchor
            cm.setDisabled('link', anchor);
        });

        this.createControl = function (n, cm) {
            if (n !== 'link') {
                return null;
            }

            var params = ed.getParam('link', {});

            if (params.quicklink === false || params.basic_dialog === true) {
                // Register buttons
                return cm.createButton('link', {
                    title: 'link.desc',
                    cmd: 'mceLink'
                });
            }

            var html = '' +
                '<div class="mceToolbarRow">' +
                '   <div class="mceToolbarItem mceFlexAuto">' +
                '       <input type="text" id="' + ed.id + '_link_input" aria-label="' + ed.getLang('dlg.url', 'URL') + '" />' +
                '   </div>' +
                '   <div class="mceToolbarItem">' +
                '       <button type="button" id="' + ed.id + '_link_submit" class="mceButton mceButtonLink" title="' + ed.getLang('advanced.link_desc', 'Insert Link') + '" aria-label="' + ed.getLang('link.insert', 'Insert Link') + '">' +
                '           <span class="mceIcon mce_link"></span>' +
                '       </button>' +
                '   </div>' +
                '   <div class="mceToolbarItem">' +
                '       <button type="button" id="' + ed.id + '_link_unlink" class="mceButton mceButtonUnlink" disabled="disabled" title="' + ed.getLang('advanced.unlink_desc', 'Remove Link') + '" aria-label="' + ed.getLang('advanced.unlink_desc', 'Remove Link') + '">' +
                '           <span class="mceIcon mce_unlink"></span>' +
                '       </button>' +
                '   </div>' +
                '</div>';

            var ctrl = cm.createSplitButton('link', {
                title: 'link.desc',
                cmd: 'mceLink',
                max_width: 264,
                onselect: function (node) {
                    createLink(ed, { url: node.value, text: '' });
                }
            });

            if (!ctrl) {
                return;
            }

            ctrl.onRenderMenu.add(function (c, m) {
                var item = m.add({
                    onclick: function (e) {
                        e.preventDefault();

                        // remove selected state
                        item.setSelected(false);

                        var n = ed.dom.getParent(e.target, '.mceButton');

                        if (n.disabled) {
                            return;
                        }

                        if (ed.dom.hasClass(n, 'mceButtonLink')) {
                            var value = DOM.getValue(ed.id + '_link_input');
                            createLink(ed, { url: value, text: '' });
                        }

                        if (ed.dom.hasClass(n, 'mceButtonUnlink')) {
                            ed.execCommand('unlink', false);
                        }

                        m.hideMenu();
                    },
                    html: html
                });

                m.onShowMenu.add(function () {
                    var selection = ed.selection, value = '';

                    DOM.setAttrib(ed.id + '_link_unlink', 'disabled', 'disabled');

                    var node = ed.dom.getParent(selection.getNode(), 'a[href]');

                    if (isAnchor(node)) {
                        selection.select(node);
                        value = node.getAttribute('href');
                        DOM.setAttrib(ed.id + '_link_unlink', 'disabled', null);
                    }

                    // focus input after short timeout
                    window.setTimeout(function () {
                        DOM.get(ed.id + '_link_input').focus();
                    }, 10);

                    // set value
                    DOM.setValue(ed.id + '_link_input', value);
                });
            });

            return ctrl;
        };

        extend(this, {
            isAnchor: isAnchor,
            hasFileSpan: hasFileSpan,
            isOnlyTextSelected: isOnlyTextSelected,
            getAnchorText: getAnchorText,
            updateTextContent: updateTextContent
        });
    });
})();
