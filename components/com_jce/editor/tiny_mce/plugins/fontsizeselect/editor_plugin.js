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

    tinymce.create('tinymce.plugins.FontSizeSelectPlugin', {
        // default font sizes
        sizes: [8, 10, 12, 14, 18, 24, 36],
        
        init: function(ed, url) {
            var self = this;
            this.editor = ed;
            
            var s = ed.settings;
            
            // Setup default font_size_style_values
            if (!s.font_size_style_values) {
                s.font_size_style_values = "8pt,10pt,12pt,14pt,18pt,24pt,36pt";
            }
            
            s.theme_advanced_font_sizes = ed.getParam('fontsizeselect_font_sizes', '8pt,10pt,12pt,14pt,18pt,24pt,36pt');

            if (tinymce.is(s.theme_advanced_font_sizes, 'string')) {
                s.font_size_style_values = tinymce.explode(s.font_size_style_values);
                s.font_size_classes = tinymce.explode(s.font_size_classes || '');

                // Parse string value
                var o = {};
                ed.settings.theme_advanced_font_sizes = s.theme_advanced_font_sizes;
                each(ed.getParam('theme_advanced_font_sizes', '', 'hash'), function(v, k) {
                    var cl;

                    if (k == v && v >= 1 && v <= 7) {
                        k = v + ' (' + self.sizes[v - 1] + 'pt)';
                        cl = s.font_size_classes[v - 1];
                        v = s.font_size_style_values[v - 1] || (t.sizes[v - 1] + 'pt');
                    }

                    if (/^\s*\./.test(v))
                        cl = v.replace(/\./g, '');

                    o[k] = cl ? {
                        'class': cl
                    } : {
                        fontSize: v
                    };
                });

                s.theme_advanced_font_sizes = o;
            }

            ed.onNodeChange.add(function(ed, cm, n) {
                var c = cm.get('fontsizeselect'), fn, s = ed.settings;

                if (c && n.style) {
                    var fz = n.style.fontSize, cl = n.className;

                    // Use computed style
                    if (s.theme_advanced_runtime_fontsize && !fz && !cl)
                        fz = ed.dom.getStyle(n, 'fontSize', true);

                    c.select(function(v) {
                        if (v.fontSize && v.fontSize === fz)
                            return true;

                        if (v['class'] && v['class'] === cl)
                            return true;
                    });
                }
            });
        },
        createControl: function(n, cf) {
            switch (n) {
                case "fontsizeselect":
                    return this._createSizeFontSelect();
                    break;
            }
        },
        
        _createSizeFontSelect: function() {
            var self = this, ed = self.editor, c, i = 0, cl = [];

            c = ed.controlManager.createListBox('fontsizeselect', {
                title: 'advanced.font_size',
                onselect: function(v) {
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
                    } else
                        ed.execCommand('FontSize', false, v.fontSize);

                    // Fake selection, execCommand will fire a nodeChange and update the selection
                    c.select(function(sv) {
                        return v == sv;
                    });

                    if (cur && (cur.value.fontSize == v.fontSize || cur.value['class'] && cur.value['class'] == v['class'])) {
                        c.select(null);
                    }

                    return false; // No auto select
                }
            });

            if (c) {
                each(ed.settings.theme_advanced_font_sizes, function(v, k) {
                    var fz = v.fontSize;

                    if (fz >= 1 && fz <= 7)
                        fz = self.sizes[parseInt(fz) - 1] + 'pt';

                    c.add(k, v, {
                        'style': 'font-size:' + fz,
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