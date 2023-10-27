/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2023 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each;

    tinymce.create('tinymce.plugins.FontSizeSelectPlugin', {
        // default font sizes
        sizes: [8, 10, 12, 14, 18, 24, 36],

        init: function (ed, url) {
            var self = this;
            this.editor = ed;

            var s = ed.settings;

            // Setup default font_size_style_values
            if (!s.font_size_style_values) {
                s.font_size_style_values = "8pt,10pt,12pt,14pt,18pt,24pt,36pt";
            }

            s.theme_font_sizes = ed.getParam('fontsizeselect_font_sizes', '8pt,10pt,12pt,14pt,18pt,24pt,36pt');

            if (tinymce.is(s.theme_font_sizes, 'string')) {
                s.font_size_style_values = tinymce.explode(s.font_size_style_values);
                s.font_size_classes = tinymce.explode(s.font_size_classes || '');

                // Parse string value
                var o = {};
                ed.settings.theme_font_sizes = s.theme_font_sizes;
                each(ed.getParam('theme_font_sizes', '', 'hash'), function (v, k) {
                    var cl;

                    if (k == v && v >= 1 && v <= 7) {
                        k = v + ' (' + self.sizes[v - 1] + 'pt)';
                        cl = s.font_size_classes[v - 1];
                        v = s.font_size_style_values[v - 1] || (self.sizes[v - 1] + 'pt');
                    }

                    if (/^\s*\./.test(v)) {
                        cl = v.replace(/\./g, '');
                    }

                    o[k] = cl ? {
                        'class': cl
                    } : {
                        fontSize: v
                    };
                });

                s.theme_font_sizes = o;
            }

            ed.onNodeChange.add(function (ed, cm, n, collapsed, o) {
                var c = cm.get('fontsizeselect'), fv, cl;

                if (c && n) {
                    each(o.parents, function (n) {
                        if (n.style) {
                            fv = n.style.fontSize || ed.dom.getStyle(n, 'fontSize'),
                                cl = ed.dom.getAttrib(n, 'class', '');

                            c.select(function (v) {
                                if (v.fontSize && v.fontSize === fv) {
                                    return true;
                                }

                                if (v['class'] && v['class'] === cl) {
                                    return true;
                                }
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
            if (n === "fontsizeselect") {
                return this._createSizeFontSelect();
            }
        },

        _createSizeFontSelect: function () {
            var self = this,
                ed = self.editor,
                c, i = 0;

            c = ed.controlManager.createListBox('fontsizeselect', {
                title: 'advanced.font_size',
                onselect: function (v) {
                    var cur = c.items[c.selectedIndex];

                    if (!v && cur) {
                        cur = cur.value;

                        if (cur['class']) {
                            ed.formatter.toggle('fontsize_class', {
                                value: cur['class']
                            });
                            ed.undoManager.add();
                            ed.nodeChanged();
                        } else {
                            ed.execCommand('FontSize', false, cur.fontSize);
                        }

                        return;
                    }

                    if (v['class']) {
                        ed.focus();
                        ed.undoManager.add();
                        ed.formatter.toggle('fontsize_class', {
                            value: v['class']
                        });
                        ed.undoManager.add();
                        ed.nodeChanged();
                    } else {
                        ed.execCommand('FontSize', false, v.fontSize);
                    }

                    // Fake selection, execCommand will fire a nodeChange and update the selection
                    c.select(function (sv) {
                        return v == sv;
                    });

                    if (cur && (cur.value.fontSize == v.fontSize || cur.value['class'] && cur.value['class'] == v['class'])) {
                        c.select(null);
                    }
                }
            });

            if (c) {
                each(ed.settings.theme_font_sizes, function (v, k) {
                    var fz = v.fontSize;

                    if (fz >= 1 && fz <= 7) {
                        fz = self.sizes[parseInt(fz, 10) - 1] + 'pt';
                    }

                    var lh = Math.max(32, parseInt(fz, 10));

                    c.add(k, v, {
                        'style': 'font-size:' + fz + ';line-height:' + lh + 'px',
                        'class': 'mceFontSize' + (i++) + (' ' + (v['class'] || ''))
                    });
                });
            }

            return c;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('fontsizeselect', tinymce.plugins.FontSizeSelectPlugin);
})();