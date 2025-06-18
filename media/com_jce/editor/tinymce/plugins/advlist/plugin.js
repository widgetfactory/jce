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
    var each = tinymce.each, DOM = tinymce.DOM, Event = tinymce.dom.Event;

    tinymce.PluginManager.add('advlist', function (editor, url) {
        var self = this;

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
        var numlist = editor.getParam("advlist_number_styles", "default,lower-alpha,lower-greek,lower-roman,upper-alpha,upper-roman");

        if (numlist) {
            self.numlist = buildFormats(numlist);
        }

        var bullist = editor.getParam("advlist_bullist_styles", "default,circle,disc,square");

        if (bullist) {
            self.bullist = buildFormats(bullist);
        }

        this.createControl = function (name, cm) {
            var self = this, btn, format;

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

                            // add any default classes
                            var classes = editor.getParam('advlist_' + name + '_classes', '');

                            if (classes) {
                                classes = classes.trim();

                                classes.split(/\s+/).forEach(function (cls) {
                                    if (cls) {
                                        editor.dom.addClass(list, cls);
                                    }
                                });
                            }
                        }
                    }

                    editor.focus();
                }

                function openDialog() {
                    var form = cm.createForm(name + '_form');

                    form.empty();

                    var type_ctrl = cm.createListBox(name + '_type_ctrl', {
                        label: editor.getLang('advlist.type', 'Type'),
                        name: 'type',
                        onselect: function () { }
                    });

                    form.add(type_ctrl);

                    each(self[name], function (item) {
                        var style = item.styles.listStyleType, icon = style.replace(/-/g, '_');

                        if (!style) {
                            style = 'default';
                        }

                        type_ctrl.add(
                            editor.getLang(item.title),
                            style,
                            {
                                icon: icon ? 'list_' + icon : ''
                            }
                        );
                    });

                    if (name == 'numlist') {
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
                    }

                    var styles = editor.getParam('advlist_' + name + '_custom_classes', '').trim().split(',').filter(function (cls) {
                        return cls.trim() !== '';
                    });

                    var styles_ctrl = cm.createStylesBox(name + '_class', {
                        label: editor.getLang('adlist.class', 'Classes'),
                        onselect: function () { },
                        name: 'classes',
                        styles: styles
                    });

                    form.add(styles_ctrl);

                    editor.windowManager.open({
                        title: editor.getLang('advanced.' + name + '_desc', 'List'),
                        items: [form],
                        size: 'mce-modal-landscape-small',
                        open: function () {
                            var label = editor.getLang('update', 'Update'), node = editor.selection.getNode(), listStyleType = 'default';

                            var list = editor.dom.getParent(node, name == 'bullist' ? 'ul' : 'ol');

                            var classes = editor.getParam('advlist_' + name + '_classes', '').trim().split(' ').filter(function (cls) {
                                return cls.trim() !== '';
                            });

                            if (list) {
                                if (name == 'numlist') {
                                    start_ctrl.value(editor.dom.getAttrib(list, 'start') || 1);
                                    reversed_ctrl.checked(!!editor.dom.getAttrib(list, 'reversed'));
                                }

                                classes = editor.dom.getAttrib(list, 'class');

                                // clean
                                classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                                    return cls.trim() !== '';
                                });

                                listStyleType = editor.dom.getStyle(list, 'list-style-type') || 'default';
                                type_ctrl.value(listStyleType);
                            }

                            styles_ctrl.value(classes);

                            DOM.setHTML(this.id + '_insert', label);
                        },
                        buttons: [
                            {
                                title: editor.getLang('remove', 'Remove'),
                                id: 'remove',
                                onclick: function () {
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

                                    var list = editor.dom.getParent(editor.selection.getNode(), name == 'bullist' ? 'ul' : 'ol');

                                    if (!list) {
                                        return;
                                    }

                                    if (data.type == 'default') {
                                        editor.dom.setStyles(list, { 'list-style-type': '' });
                                        list.removeAttribute('data-mce-style');
                                    } else {
                                        editor.dom.setStyles(list, { 'list-style-type': data.type });
                                        list.removeAttribute('data-mce-style');
                                    }

                                    each(data, function (value, key) {
                                        if (!value) {
                                            value = null;
                                        }

                                        if (key == 'start' && value == '1') {
                                            value = null;
                                        }

                                        if (key == 'type') {
                                            value = null;
                                        }

                                        if (key == 'classes') {
                                            key = 'class';
                                        }

                                        editor.dom.setAttrib(list, key, value);
                                    });

                                    editor.undoManager.add();
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
                    onclick: function (e) {
                        var list = editor.dom.getParent(editor.selection.getNode(), name == 'bullist' ? 'ul' : 'ol');

                        if (list && !e.altKey) {
                            return openDialog();
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

                                    if (state) {
                                        item.setSelected(1);
                                    }
                                }
                            });

                            // Select the current format
                            if (!list) {
                                menu.items[format.id].setSelected(1);
                            }
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
        };
    });
})();