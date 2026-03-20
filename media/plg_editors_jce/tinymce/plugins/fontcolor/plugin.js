/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2025 Ryan Demmer. All rights reserved.
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

    var colors = '000000,993300,333300,003300,003366,000080,333399,333333,800000,FF6600,808000,008000,008080,0000FF,666699,808080,FF0000,FF9900,99CC00,339966,33CCCC,3366FF,800080,999999,FF00FF,FFCC00,FFFF00,00FF00,00FFFF,00CCFF,993366,FFFFFF,FF99CC,FFCC99,FFFF99,CCFFCC,CCFFFF,99CCFF,CC99FF';

    tinymce.PluginManager.add('fontcolor', function (ed, url) {

        ed.onNodeChange.add(function (ed, cm, n, collapsed, o) {
            var c;

            function updateColor(controlId, color) {
                if ((c = cm.get(controlId))) {
                    if (!color) {
                        color = c.settings.default_color;
                    }
                    if (color !== c.value) {
                        c.displayColor(color);
                    }
                }
            }

            var fc, bc;

            each(o.parents, function (n) {
                if (n.style) {

                    if (n.style.color) {
                        updateColor('forecolor', n.style.color);
                        fc = true;
                    }

                    if (n.style.backgroundColor) {
                        updateColor('backcolor', n.style.backgroundColor);
                        bc = true;
                    }

                    // break when complete
                    if (fc && bc) {
                        return false;
                    }
                }
            });
        });

        this.createControl = function (n) {
            if (n === "forecolor") {
                return createForeColorMenu();
            }

            if (n === "backcolor") {
                return createBackColorMenu();
            }
        };

        function createForeColorMenu() {
            var c, s = ed.settings,
                o = {},
                v;

            o.more_colors_func = function () {
                ed.execCommand('mceColorPicker', false, {
                    color: c.value,
                    func: function (co) {
                        c.setColor(co);
                    }
                });
            };

            v = s.fontcolor_foreground_colors || '';

            if (v) {
                o.colors = v.replace('$default', colors);
            }

            o.default_color = s.fontcolor_foreground_color || '#000000';

            o.title = 'advanced.forecolor_desc';

            var applyColor = function (color) {
                if (!color) {
                    return ed.formatter.remove('forecolor');
                }

                ed.formatter.apply('forecolor', {
                    'value': color
                });

                ed.undoManager.add();
                ed.nodeChanged();
            };

            o.onselect = function (val) {
                applyColor(val);
            };

            o.onclick = function (e, val) {
                applyColor(val);
            };

            o.scope = this;

            c = ed.controlManager.createColorSplitButton('forecolor', o);

            return c;
        }

        function createBackColorMenu() {
            var c, s = ed.settings,
                o = {},
                v;

            o.more_colors_func = function () {
                ed.execCommand('mceColorPicker', false, {
                    color: c.value,
                    func: function (co) {
                        c.setColor(co);
                    }
                });
            };

            v = s.fontcolor_background_colors || '';

            if (v) {
                o.colors = v.replace('$default', colors);
            }

            o.default_color = s.fontcolor_background_color || '#FFFF00';

            o.title = 'advanced.backcolor_desc';

            var applyColor = function (color) {
                if (!color) {
                    return ed.formatter.remove('hilitecolor');
                }

                ed.formatter.apply('hilitecolor', {
                    'value': color
                });

                ed.undoManager.add();
                ed.nodeChanged();
            };

            o.onselect = function (val) {
                applyColor(val);
            };

            o.onclick = function (e, val) {
                applyColor(val);
            };

            o.scope = this;

            c = ed.controlManager.createColorSplitButton('backcolor', o);

            return c;
        }
    });
})();