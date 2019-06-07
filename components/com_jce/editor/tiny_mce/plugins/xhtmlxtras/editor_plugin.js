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

    tinymce.create('tinymce.plugins.XHTMLXtrasPlugin', {
        init: function (ed, url) {
            this.editor = ed;

            // Register commands
            ed.addCommand('mceCite', function () {
                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=xhtmlxtras&element=cite',
                    width: 480 + parseInt(ed.getLang('xhtmlxtras.cite_delta_width', 0)),
                    height: 340 + parseInt(ed.getLang('xhtmlxtras.cite_delta_height', 0)),
                    inline: 1,
                    size: 'mce-modal-portrait-medium'
                }, {
                        plugin_url: url,
                        element: 'cite'
                    });
            });


            ed.addCommand('mceAcronym', function () {
                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=xhtmlxtras&element=acronym',
                    width: 480 + parseInt(ed.getLang('xhtmlxtras.acronym_delta_width', 0)),
                    height: 340 + parseInt(ed.getLang('xhtmlxtras.acronym_delta_height', 0)),
                    inline: 1,
                    size: 'mce-modal-portrait-medium'
                }, {
                        plugin_url: url,
                        element: 'acronym'
                    });
            });


            ed.addCommand('mceAbbr', function () {
                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=xhtmlxtras&element=abbr',
                    width: 480 + parseInt(ed.getLang('xhtmlxtras.abbr_delta_width', 0)),
                    height: 340 + parseInt(ed.getLang('xhtmlxtras.abbr_delta_height', 0)),
                    inline: 1,
                    size: 'mce-modal-portrait-medium'
                }, {
                        plugin_url: url,
                        element: 'abbr'
                    });
            });


            ed.addCommand('mceDel', function () {
                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=xhtmlxtras&element=del',
                    width: 480 + parseInt(ed.getLang('xhtmlxtras.del_delta_width', 0)),
                    height: 380 + parseInt(ed.getLang('xhtmlxtras.del_delta_height', 0)),
                    inline: 1,
                    size: 'mce-modal-portrait-medium'
                }, {
                        plugin_url: url,
                        element: 'del'
                    });
            });


            ed.addCommand('mceIns', function () {
                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=xhtmlxtras&element=ins',
                    width: 480 + parseInt(ed.getLang('xhtmlxtras.ins_delta_width', 0)),
                    height: 380 + parseInt(ed.getLang('xhtmlxtras.ins_delta_height', 0)),
                    inline: 1,
                    size: 'mce-modal-portrait-medium'
                }, {
                        plugin_url: url,
                        element: 'ins'
                    });
            });


            ed.addCommand('mceAttributes', function () {
                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=xhtmlxtras&element=attributes',
                    width: 640,
                    height: 500,
                    inline: 1
                }, {
                        plugin_url: url
                    });
            });

            // Register buttons
            ed.addButton('cite', {
                title: 'xhtmlxtras.cite_desc',
                cmd: 'mceCite'
            });

            // acronym is deprecated in HTML5
            if (ed.settings.schema !== "html5-strict") {
                ed.addButton('acronym', {
                    title: 'xhtmlxtras.acronym_desc',
                    cmd: 'mceAcronym'
                });
            }

            ed.addButton('abbr', {
                title: 'xhtmlxtras.abbr_desc',
                cmd: 'mceAbbr'
            });
            ed.addButton('del', {
                title: 'xhtmlxtras.del_desc',
                cmd: 'mceDel'
            });
            ed.addButton('ins', {
                title: 'xhtmlxtras.ins_desc',
                cmd: 'mceIns'
            });
            /*ed.addButton('attribs', {
                title : 'xhtmlxtras.attribs_desc',
                cmd : 'mceAttributes'
            });*/

            ed.onNodeChange.add(function (ed, cm, n, co) {
                n = ed.dom.getParent(n, 'CITE,ACRONYM,ABBR,DEL,INS');

                cm.setDisabled('cite', co);
                cm.setDisabled('acronym', co);
                cm.setDisabled('abbr', co);
                cm.setDisabled('del', co);
                cm.setDisabled('ins', co);
                cm.setDisabled('attribs', n && n.nodeName == 'BODY');
                cm.setActive('cite', 0);
                cm.setActive('acronym', 0);
                cm.setActive('abbr', 0);
                cm.setActive('del', 0);
                cm.setActive('ins', 0);

                // Activate all
                if (n) {
                    do {
                        cm.setDisabled(n.nodeName.toLowerCase(), 0);
                        cm.setActive(n.nodeName.toLowerCase(), 1);
                    } while (n = n.parentNode);
                }
            });

            ed.onPreInit.add(function () {
                // Fixed IE issue where it can't handle these elements correctly
                ed.dom.create('abbr');

                ed.formatter.register({
                    cite: {
                        inline: 'cite',
                        remove: 'all',
                        onformat: function (elm, fmt, vars) {
                            each(vars, function (value, key) {
                                ed.dom.setAttrib(elm, key, value);
                            });

                        }

                    },

                    acronym: {
                        inline: 'acronym',
                        remove: 'all',
                        onformat: function (elm, fmt, vars) {
                            each(vars, function (value, key) {
                                ed.dom.setAttrib(elm, key, value);
                            });

                        }

                    },

                    abbr: {
                        inline: 'abbr',
                        remove: 'all',
                        onformat: function (elm, fmt, vars) {
                            each(vars, function (value, key) {
                                ed.dom.setAttrib(elm, key, value);
                            });

                        }

                    },

                    del: {
                        inline: 'del',
                        remove: 'all',
                        onformat: function (elm, fmt, vars) {
                            each(vars, function (value, key) {
                                ed.dom.setAttrib(elm, key, value);
                            });

                        }

                    },

                    ins: {
                        inline: 'ins',
                        remove: 'all',
                        onformat: function (elm, fmt, vars) {
                            each(vars, function (value, key) {
                                ed.dom.setAttrib(elm, key, value);
                            });

                        }

                    },

                    attributes: {
                        inline: 'span',
                        remove: 'all',
                        onformat: function (elm, fmt, vars) {
                            each(vars, function (value, key) {
                                ed.dom.setAttrib(elm, key, value);
                            });

                        }

                    }
                });
            });
        },

        createControl: function (n, cm) {
            var self = this,
                ed = this.editor;

            if (n !== 'attribs') {
                return null;
            }

            var html = '' +
                '<div class="mceToolbarRow">' +
                '   <div class="mceToolbarItem">' +
                '       <input type="text" name="' + ed.id + '_attribs_name[]" aria-label="' + ed.getLang('name', 'Name') + '" placeholder="' + ed.getLang('name', 'Name') + '" />' +
                '   </div>' +
                '   <div class="mceToolbarItem">' +
                '       <input type="text" name="' + ed.id + '_attribs_value[]" aria-label="' + ed.getLang('value', 'Value') + '" placeholder="' + ed.getLang('value', 'Value') + '" />' +
                '   </div>' +
                '</div>';

            var ctrl = cm.createPanelButton('attribs', {
                title: 'xhtmlxtras.attribs_desc',
                cmd: 'mceAttributes',
                class: 'mce_attribs',
                buttons: [{
                    title: ed.getLang('common.insert', 'Insert'),
                    id: 'insert',
                    onclick: function (e) {
                        updateAttributes();
                        return true;
                    },
                    classes: 'mceButtonPrimary'
                }],
                html: html
            });

            function updateAttributes() {
                var name = DOM.getValue(ed.id + '_attribs_name');
                var value = DOM.getValue(ed.id + '_attribs_value');

                if (name) {
                    var node = ed.selection.getNode();

                    if (node && node !== ed.getBody()) {
                        ed.dom.setAttrib(node, name, value);
                    }
                }

                ctrl.hideMenu();
            }

            /*ctrl.onRenderMenu.add(function (c, m) {
                // patch in onselect for dropmenu
                m.settings.onselect = function () {
                    updateAttributes();
                };

                m.add({
                    html: html,
                    class: 'mceAttribsMenu',
                    onclick: function (e) {
                        var node = e.target, name = '', value = '';

                        if (node.nodeName !== "BUTTON") {
                            node = DOM.getParent(e.target, 'BUTTON');

                            if (node && !DOM.hasClass(node, 'mceButtonDisabled')) {

                                if (DOM.hasClass(node, 'mceButtonAttribs')) {
                                    updateAttributes();
                                }
                            }
                        }
                    }
                });

                m.onShowMenu.add(function () {
                    // focus input after short timeout
                    window.setTimeout(function () {
                        DOM.get(ed.id + '_attribs_name').focus();
                    }, 10);

                    // re-set values
                    DOM.setValue(ed.id + '_attribs_name', '');
                    DOM.setValue(ed.id + '_attribs_value', '');
                });
            });*/

            return ctrl;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('xhtmlxtras', tinymce.plugins.XHTMLXtrasPlugin);
})();
