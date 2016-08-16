/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function() {
    var DOM = tinymce.DOM, Event = tinymce.dom.Event, extend = tinymce.extend, each = tinymce.each, Cookie = tinymce.util.Cookie, explode = tinymce.explode;

    tinymce.create('tinymce.plugins.FontSelectPlugin', {

        fonts : "Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats",

        init: function(ed, url) {
            var self = this;
            this.editor = ed;

            ed.onNodeChange.add(function(ed, cm, n) {
                var c = cm.get('fontselect'), fn;

                // select font
                if (c && n.style) {
                    if (!fn && n.style.fontFamily) {
                        fn = n.style.fontFamily.replace(/[\"\']+/g, '').replace(/^([^,]+).*/, '$1').toLowerCase();
                    }

                    c.select(function(v) {
                        return v.replace(/^([^,]+).*/, '$1').toLowerCase() == fn;
                    });
                }
            });
        },
        createControl: function(n, cf) {
            var ed = this.editor;

            switch (n) {
                case "fontselect":

                    return this._createFontSelect();

                    break;
            }
        },
        _createFontSelect: function() {
            var c, self = this, ed = self.editor;

            c = ed.controlManager.createListBox('fontselect', {
                title: 'advanced.fontdefault',
                onselect: function(v) {
                    var cur = c.items[c.selectedIndex];

                    if (!v && cur) {
                        ed.execCommand('FontName', false, cur.value);
                        return;
                    }

                    ed.execCommand('FontName', false, v);

                    // Fake selection, execCommand will fire a nodeChange and update the selection
                    c.select(function(sv) {
                        return v == sv;
                    });

                    if (cur && cur.value == v) {
                        c.select(null);
                    }

                    return false; // No auto select
                }
            });

            if (c) {
                each(ed.getParam('fontselect_fonts', self.fonts, 'hash'), function(v, k) {
                    if (/\d/.test(v)) {
                        v = "'" + v + "'";
                    }
                    c.add(ed.translate(k), v, {
                        style: v.indexOf('dings') == -1 ? 'font-family:' + v : ''
                    });
                });
            }

            return c;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('fontselect', tinymce.plugins.FontSelectPlugin);
})();
