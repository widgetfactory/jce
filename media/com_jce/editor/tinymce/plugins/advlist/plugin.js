/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function () {
    var each = tinymce.each, DOM = tinymce.DOM, Event = tinymce.dom.Event;

    tinymce.create('tinymce.plugins.AdvListPlugin', {
        init: function (ed, url) {
            var self = this;

            self.editor = ed;

            function buildFormats(str) {
                var formats = [];

                each(str.split(/,/), function (type) {
                    var title = type.replace(/-/g, '_');

                    if (type === 'default') {
                        title = 'def';
                    }

                    formats.push({
                        title: 'advlist.' + title,
                        styles: {
                            listStyleType: type === 'default' ? '' : type
                        }
                    });
                });

                return formats;
            }

            // Setup number formats from config or default
            var numlist = ed.getParam("advlist_number_styles", "default,lower-alpha,lower-greek,lower-roman,upper-alpha,upper-roman");

            if (numlist) {
                self.numlist = buildFormats(numlist);
            }

            var bullist = ed.getParam("advlist_bullet_styles", "default,circle,disc,square");

            if (bullist) {
                self.bullist = buildFormats(bullist);
            }
        },
        createControl: function (name, cm) {
            var self = this, btn, format, editor = self.editor;

            if (name == 'numlist' || name == 'bullist') {

                if (self[name] && self[name][0].title === 'advlist.def') {
                    format = self[name][0];
                }

                function hasFormat(node, format) {
                    var state = true;

                    each(format.styles, function (value, name) {
                        // Format doesn't match
                        if (editor.dom.getStyle(node, name) != value) {
                            state = false;
                            return false;
                        }
                    });

                    return state;
                }

                function applyListFormat() {
                    var list, dom = editor.dom, sel = editor.selection;

                    // Check for existing list element
                    list = dom.getParent(sel.getNode(), 'ol,ul');

                    // Switch/add list type if needed
                    if (!list || list.nodeName == (name == 'bullist' ? 'OL' : 'UL') || !format || hasFormat(list, format)) {
                        editor.execCommand(name == 'bullist' ? 'InsertUnorderedList' : 'InsertOrderedList');
                    }

                    // Append styles to new list element
                    if (format) {
                        list = dom.getParent(sel.getNode(), 'ol,ul');
                        if (list) {
                            dom.setStyles(list, format.styles);
                            list.removeAttribute('data-mce-style');
                        }
                    }

                    editor.focus();
                }

                function openDialog() {
                    var form = cm.createForm('numlist_form');

                    form.empty();

                    var start_ctrl = cm.createTextBox('numlist_start_ctrl', {
                        label: editor.getLang('advlist.start', 'Start'),
                        name: 'start',
                        subtype: 'number',
                        attributes: {
                            min: '1'
                        }
                    });

                    form.add(start_ctrl);

                    var reversed_ctrl = cm.createCheckBox('numlist_reversed_ctrl', {
                        label: editor.getLang('advlist.reversed', 'Reversed'),
                        name: 'reversed'
                    });

                    form.add(reversed_ctrl);

                    editor.windowManager.open({
                        title: editor.getLang('advanced.numlist_desc', 'Ordered List'),
                        items: [form],
                        size: 'mce-modal-landscape-small',
                        open: function () {
                            var label = editor.getLang('update', 'Update'), node = editor.selection.getNode();

                            var list = editor.dom.getParent(node, 'ol');

                            if (list) {
                                start_ctrl.value(editor.dom.getAttrib(list, 'start') || 1);
                                reversed_ctrl.checked(!!editor.dom.getAttrib(list, 'reversed'));
                            }

                            DOM.setHTML(this.id + '_insert', label);
                        },
                        buttons: [
                            {
                                title: editor.getLang('remove', 'Remove'),
                                id: 'remove',
                                onclick: function() {
                                    applyListFormat();
                                    this.close();
                                }
                            },
                            {
                                title: editor.getLang('cancel', 'Cancel'),
                                id: 'cancel'
                            },
                            {
                                title: editor.getLang('insert', 'Insert'),
                                id: 'insert',
                                onsubmit: function (e) {
                                    var data = form.submit();
                                    Event.cancel(e);

                                    var list = editor.dom.getParent(editor.selection.getNode(), 'ol');

                                    if (!list) {
                                        return;
                                    }

                                    each(data, function(value, key) {
                                        if (!value) {
                                            value = null;
                                        }
                                         
                                        if (key == 'start' && value == '1') {
                                            value = null;
                                        }

                                        editor.dom.setAttrib(list, key, value);
                                    });
                                },
                                classes: 'primary',
                                scope: self
                            }
                        ]
                    });
                }

                // disabled
                if (!self[name]) {
                    btn = cm.createButton(name, {
                        title: 'advanced.' + name + '_desc',
                        'class': 'mce_' + name,
                        onclick: function () {
                            applyListFormat();
                        }
                    });

                    return btn;
                }

                btn = cm.createSplitButton(name, {
                    title: 'advanced.' + name + '_desc',
                    'class': 'mce_' + name,
                    onclick: function () {
                        if (name === 'numlist') {
                            var list = editor.dom.getParent(editor.selection.getNode(), 'ol');

                            if (list) {
                                return openDialog();
                            }
                        }

                        applyListFormat();
                    }
                });

                btn.onRenderMenu.add(function (btn, menu) {
                    menu.onHideMenu.add(function () {
                        if (self.bookmark) {
                            editor.selection.moveToBookmark(self.bookmark);
                            self.bookmark = 0;
                        }
                    });

                    menu.onShowMenu.add(function () {
                        var dom = editor.dom, list = dom.getParent(editor.selection.getNode(), 'ol,ul'), fmtList;

                        if (list || format) {
                            fmtList = self[name];

                            // Unselect existing items
                            each(menu.items, function (item) {
                                var state = true;

                                item.setSelected(0);

                                if (list && !item.isDisabled()) {
                                    each(fmtList, function (fmt) {
                                        if (fmt.id == item.id) {
                                            if (!hasFormat(list, fmt)) {
                                                state = false;
                                                return false;
                                            }
                                        }
                                    });

                                    if (state)
                                        item.setSelected(1);
                                }
                            });

                            // Select the current format
                            if (!list)
                                menu.items[format.id].setSelected(1);
                        }

                        editor.focus();

                        // IE looses it's selection so store it away and restore it later
                        if (tinymce.isIE) {
                            self.bookmark = editor.selection.getBookmark(1);
                        }
                    });

                    each(self[name], function (item) {
                        item.id = editor.dom.uniqueId();

                        var style = item.styles.listStyleType, icon = style.replace(/-/g, '_');

                        menu.add({
                            id: item.id,
                            title: item.title,
                            icon: 'list_' + icon,
                            onclick: function () {
                                format = item;
                                applyListFormat();
                            }
                        });
                    });
                });

                return btn;
            }
        }
    });

    // Register plugin
    tinymce.PluginManager.add('advlist', tinymce.plugins.AdvListPlugin);
})();