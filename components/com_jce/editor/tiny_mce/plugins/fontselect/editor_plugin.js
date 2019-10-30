/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each;

    tinymce.create('tinymce.plugins.FontSelectPlugin', {

        fonts: "Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats",

        init: function (ed, url) {
            var self = this;
            this.editor = ed;

            ed.onNodeChange.add(function (ed, cm, n, collapsed, o) {
                var c = cm.get('fontselect'), fv;

                if (c && n) {
                    each(o.parents, function (n) {
                        if (n.style) {
                            fv = n.style.fontFamily || ed.dom.getStyle(n, 'fontFamily');

                            fv = fv.replace(/[\"\']+/g, '').replace(/^([^,]+).*/, '$1').toLowerCase();

                            c.select(function (v) {
                                return v.replace(/^([^,]+).*/, '$1').toLowerCase() === fv;
                            });

                            if (fv) {
                                return false;
                            }
                        }
                    });
                }
            });
        },
        
        createControl: function (n, cf) {
            var ed = this.editor;

            if (n === "fontselect") {
                return this._createFontSelect();
            }
        },

        _createFontSelect: function () {
            var ctrl, self = this, ed = self.editor;

            ctrl = ed.controlManager.createListBox('fontselect', {
                title: 'advanced.fontdefault',
                max_height: 384,
                onselect: function (v) {
                    var cur = ctrl.items[ctrl.selectedIndex];

                    if (!v && cur) {
                        ed.execCommand('FontName', false, cur.value);
                        return;
                    }

                    ed.execCommand('FontName', false, v);

                    // Fake selection, execCommand will fire a nodeChange and update the selection
                    ctrl.select(function (sv) {
                        return v == sv;
                    });

                    if (cur && cur.value == v) {
                        ctrl.select(null);
                    }

                    return false; // No auto select
                }
            });

            each(ed.getParam('fontselect_fonts', self.fonts, 'hash'), function (v, k) {
                if (/\d/.test(v)) {
                    v = "'" + v + "'";
                }
                ctrl.add(ed.translate(k), v, {
                    style: v.indexOf('dings') == -1 ? 'font-family:' + v : ''
                });
            });

            return ctrl;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('fontselect', tinymce.plugins.FontSelectPlugin);
})();
