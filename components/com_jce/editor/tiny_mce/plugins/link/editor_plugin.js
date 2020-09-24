/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var DOM = tinymce.DOM, Event = tinymce.dom.Event;

    function createLink(ed, data) {
        var node = ed.selection.getNode(), anchor = ed.dom.getParent(node, 'A');

        if (typeof data === 'string') {
            data = {url : data, text : data};
        }

        if (!data.url) {
            if (anchor && anchor.nodeName === 'A') {
                ed.execCommand('unlink', false);
            }

            return false;
        }

        if (!data.text) {
            return false;
        }

        // add missing protocol
        if (/^\s*www\./i.test(data.url)) {
            data.url = 'https://' + data.url;
        }

        var args = {
            'href': data.url
        };

        // set default target
        if (ed.settings.default_link_target) {
            args['target'] = ed.settings.default_link_target;
        }

        // no selection, so create a link from the url
        if (ed.selection.isCollapsed()) {
            ed.execCommand('mceInsertContent', false, ed.dom.createHTML('a', args, data.text));
            // apply link to selection
        } else {
            ed.execCommand('mceInsertLink', false, args);

            if (anchor && anchor.nodeName === 'A') {
                anchor.textContent = data.text;
            }
        }

        ed.undoManager.add();
        ed.nodeChanged();
    }

    tinymce.create('tinymce.plugins.LinkPlugin', {
        init: function (ed, url) {
            this.editor = ed;
            this.url = url;

            function isLink(n) {
                // no node specified
                if (!n) {
                    return false;
                }

                // get link
                n = ed.dom.getParent(n, 'A');

                // is a link but not an anchor
                return n && isAnchor(n) === false;
            }

            function isAnchor(n) {
                return ed.dom.hasClass(n, 'mce-item-anchor');
            }

            // Register commands
            ed.addCommand('mceLink', function () {
                var se = ed.selection, n = se.getNode();

                if (n.nodeName == 'A' && !isAnchor(n)) {
                    se.select(n);
                }

                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=link',
                    size: 'mce-modal-portrait-large'
                }, {
                    plugin_url: url
                });
            });

            ed.addShortcut('meta+k', 'link.desc', 'mceLink');

            var urlCtrl, textCtrl;

            ed.onPreInit.add(function () {
                var params = ed.getParam('link', {});
                
                if (params.basic_dialog !== true) {
                    return;
                }

                var cm = ed.controlManager, form = cm.createForm('link_form');

                urlCtrl = cm.createTextBox('link_url', {
                    label: ed.getLang('url', 'URL'),
                    name: 'url',
                    clear: true,
                    attributes: {
                        required: true
                    }
                });

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

                // Register commands
                ed.addCommand('mceLink', function () {
                    ed.windowManager.open({
                        title: ed.getLang('link.desc', 'Link'),
                        items: [form],
                        size: 'mce-modal-landscape-small',
                        open: function () {
                            var label = ed.getLang('insert', 'Insert'), node = ed.selection.getNode(), src = '', text = '', state = true;

                            if (!ed.selection.isCollapsed()) {
                                if (node) {
                                    node = ed.dom.getParent(node, 'A') || node;

                                    text = ed.selection.getContent({
                                        format: 'text'
                                    });

                                    src = ed.dom.getAttrib(node, 'href');

                                    if (src) {
                                        label = ed.getLang('update', 'Update');
                                    }

                                    var shortEnded = ed.schema.getShortEndedElements();

                                    // reset node in IE if the link is the first element
                                    if (tinymce.isIE || tinymce.isIE11) {
                                        var start = ed.selection.getStart(),
                                            end = ed.selection.getEnd();

                                        if (start === end && start.nodeName === "A") {
                                            node = start;
                                        }
                                    }

                                    // node is a link
                                    if (node.nodeName === "A") {
                                        var nodes = node.childNodes,
                                            i;

                                        if (nodes.length === 0) {
                                            state = false;
                                        } else {
                                            for (i = nodes.length - 1; i >= 0; i--) {
                                                if (nodes[i].nodeType !== 3) {
                                                    state = false;
                                                    break;
                                                }
                                            }
                                        }
                                        // selection is a shortEnded element, eg: img
                                    } else if (shortEnded[node.nodeName]) {
                                        state = false;
                                        // selection contains some html
                                    } else if (/</.test(ed.selection.getContent())) {
                                        state = false;
                                    }
                                }
                            }

                            urlCtrl.value(src);

                            textCtrl.value(text);
                            textCtrl.setDisabled(!state);

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
                var link = isLink(n), anchor = isAnchor(n);

                // remove existing selections
                ed.dom.removeAttrib(ed.dom.select('a'), 'data-mce-selected');

                if (link) {
                    ed.dom.setAttrib(ed.dom.getParent(n, 'a[href]'), 'data-mce-selected', 'inline-boundary');
                }

                // set active if link
                cm.setActive('unlink', link);
                cm.setActive('link', link);
                // set disabled if anchor
                cm.setDisabled('link', anchor);
            });
        },
        createControl: function (n, cm) {
            var self = this,
                ed = this.editor;

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
                '       <input type="text" id="' + ed.id + '_link_input" aria-label="' + ed.getLang('link.href', 'URL') + '" />' +
                '   </div>' +
                '   <div class="mceToolbarItem">' +
                '       <button type="button" id="' + ed.id + '_link_submit" class="mceButton mceButtonLink" title="' + ed.getLang('link.insert', 'Insert Link') + '" aria-label="' + ed.getLang('link.insert', 'Insert Link') + '">' +
                '           <span class="mceIcon mce_link"></span>' +
                '       </button>' +
                '   </div>' +
                '   <div class="mceToolbarItem">' +
                '       <button type="button" id="' + ed.id + '_link_unlink" class="mceButton mceButtonUnlink" disabled="disabled" title="' + ed.getLang('link.unlink', 'Remove Link') + '" aria-label="' + ed.getLang('link.unlink', 'Remove Link') + '">' +
                '           <span class="mceIcon mce_unlink"></span>' +
                '       </button>' +
                '   </div>' +
                '</div>';

            var ctrl = cm.createSplitButton('link', {
                title: 'link.desc',
                cmd: 'mceLink',
                max_width: 264,
                onselect: function (node) {
                    createLink(ed, node.value);
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
                            createLink(ed, {url : value, text : value});
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

                    if (!selection.isCollapsed()) {
                        var node = selection.getNode();
                        node = ed.dom.getParent(node, 'A') || node;

                        if (node.nodeName === 'A') {
                            value = node.getAttribute('href');
                            DOM.setAttrib(ed.id + '_link_unlink', 'disabled', null);
                        }
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
        }
    });

    // Register plugin
    tinymce.PluginManager.add('link', tinymce.plugins.LinkPlugin);
})();
