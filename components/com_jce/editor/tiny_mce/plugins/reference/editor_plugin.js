/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function () {
    var each = tinymce.each, DOM = tinymce.DOM;

    function getDateTime(d, fmt) {
        fmt = fmt.replace("%D", "%m/%d/%y");
        fmt = fmt.replace("%r", "%I:%M:%S %p");
        fmt = fmt.replace("%Y", "" + d.getFullYear());
        fmt = fmt.replace("%y", "" + d.getYear());
        fmt = fmt.replace("%m", addZeros(d.getMonth() + 1, 2));
        fmt = fmt.replace("%d", addZeros(d.getDate(), 2));
        fmt = fmt.replace("%H", "" + addZeros(d.getHours(), 2));
        fmt = fmt.replace("%M", "" + addZeros(d.getMinutes(), 2));
        fmt = fmt.replace("%S", "" + addZeros(d.getSeconds(), 2));
        fmt = fmt.replace("%I", "" + ((d.getHours() + 11) % 12 + 1));
        fmt = fmt.replace("%p", "" + (d.getHours() < 12 ? "AM" : "PM"));
        fmt = fmt.replace("%%", "%");
        return fmt;
    }

    function addZeros(value, len) {
        var i;
        value = "" + value;
        if (value.length < len) {
            for (i = 0; i < (len - value.length); i++) {
                value = "0" + value;
            }
        }
        return value;
    }

    tinymce.create('tinymce.plugins.ReferencePlugin', {
        init: function (ed, url) {
            this.editor = ed;

            function openDialog(tag) {
                var cm = ed.controlManager, form = cm.createForm('reference_form');

                form.add(cm.createTextBox('attributes_title', {
                    label: ed.getLang('attributes.label_title', 'Title'),
                    name: 'title'
                }));

                if (tag == 'ins' || tag == 'del') {
                    form.add(cm.createTextBox('reference_cite', {
                        label: ed.getLang('reference.label_cite', 'Cite'),
                        name: 'cite'
                    }));
                    
                    form.add(cm.createTextBox('reference_datetime', {
                        label: ed.getLang('reference.label_datetime', 'Date/Time'),
                        name: 'datetime',
                        button: {
                            icon: 'date',
                            label: ed.getLang('reference.label_datetime', 'Date/Time'),
                            click: function () {
                                this.value(getDateTime(new Date(), "%Y-%m-%dT%H:%M:%S"));
                            }
                        }
                    }));
                }

                ed.windowManager.open({
                    title: ed.getLang('reference.title', 'Reference'),
                    items: [form],
                    size: 'mce-modal-landscape-small',
                    open: function () {
                        var node = ed.selection.getNode(), attribs = {}, update;

                        each(['title', 'datetime', 'cite'], function (name) {
                            if (!node.hasAttribute(name)) {
                                return true;
                            }

                            attribs[name] = ed.dom.getAttrib(node, name);

                            update = true;
                        });

                        if (update) {
                            DOM.setHTML(this.id + '_insert', ed.getLang('update', 'Update'));
                        }

                        form.update(attribs);
                    },
                    buttons: [
                        {
                            title: ed.getLang('common.cancel', 'Cancel'),
                            id: 'cancel'
                        },
                        {
                            title: ed.getLang('common.remove', 'Remove'),
                            onsubmit: function () {
                                var node = ed.selection.getNode();

                                if (node.nodeName.toLowerCase() == tag) {
                                    ed.formatter.remove(tag);
                                    ed.undoManager.add();
                                }
                            }
                        },
                        {
                            title: ed.getLang('common.insert', 'Insert'),
                            id: 'insert',
                            onsubmit: function (e) {
                                tinymce.dom.Event.cancel(e);

                                var node = ed.selection.getNode(), data = form.submit();

                                node = ed.dom.getParent(node, tag);

                                ed.formatter.apply(tag, data, node);

                                ed.undoManager.add();
                            },
                            classes: 'primary',
                            autofocus: true
                        }
                    ]
                });
            }

            // Register buttons
            ed.addButton('cite', {
                title: 'reference.cite_desc',
                onclick: function () {
                    openDialog('cite');
                }
            });

            // acronym is deprecated in HTML5
            if (ed.settings.schema !== "html5-strict") {
                ed.addButton('acronym', {
                    title: 'reference.acronym_desc',
                    onclick: function () {
                        openDialog('acronym');
                    }
                });
            }

            ed.addButton('abbr', {
                title: 'reference.abbr_desc',
                onclick: function () {
                    openDialog('abbr');
                }
            });

            ed.addButton('del', {
                title: 'reference.del_desc',
                onclick: function () {
                    openDialog('del');
                }
            });

            ed.addButton('ins', {
                title: 'reference.ins_desc',
                onclick: function () {
                    openDialog('ins');
                }
            });

            ed.onNodeChange.add(function (ed, cm, n, co) {
                var p = ed.dom.getParent(n, 'CITE,ACRONYM,ABBR,DEL,INS');

                cm.setDisabled('cite', co);
                cm.setDisabled('acronym', co);
                cm.setDisabled('abbr', co);
                cm.setDisabled('del', co);
                cm.setDisabled('ins', co);

                cm.setActive('cite', 0);
                cm.setActive('acronym', 0);
                cm.setActive('abbr', 0);
                cm.setActive('del', 0);
                cm.setActive('ins', 0);

                // Activate all
                if (p) {
                    do {
                        cm.setDisabled(p.nodeName.toLowerCase(), 0);
                        cm.setActive(p.nodeName.toLowerCase(), 1);
                    } while ((p = p.parentNode));
                }
            });

            ed.onPreInit.add(function () {
                // Fixed IE issue where it can't handle these elements correctly
                ed.dom.create('abbr');

                var formats = {};

                each(['cite', 'acronym', 'abbr', 'del', 'ins'], function (name) {
                    formats[name] = {
                        inline: name,
                        remove: 'all',
                        onformat: function (elm, fmt, vars) {
                            each(vars, function (value, key) {
                                ed.dom.setAttrib(elm, key, value);
                            });
                        }
                    };
                });

                ed.formatter.register(formats);
            });
        }
    });

    // Register plugin
    tinymce.PluginManager.add('reference', tinymce.plugins.ReferencePlugin);
})();
