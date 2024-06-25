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
(function () {
    var each = tinymce.each;

    var fonts = "Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats";

    tinymce.PluginManager.add('fontselect', function (ed, url) {

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

        this.createControl = function (n, cf) {
            if (n === "fontselect") {
                return createFontSelect();
            }
        };

        function createFontSelect() {
            var ctrl;

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
                }
            });

            each(ed.getParam('fontselect_fonts', fonts, 'hash'), function (v, k) {
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
})();
