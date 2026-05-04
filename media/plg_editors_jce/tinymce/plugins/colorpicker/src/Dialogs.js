/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

import { hexColors, namedColors } from './Colors.js';

var each = tinymce.each, DOM = tinymce.DOM;
var Color = tinymce.util.Color;

tinymce.create('tinymce.ui.ColorGrid:tinymce.ui.Control', {
    ColorGrid: function (id, s, ed) {
        this._super(id, s, ed);
        this.type = 'colorgrid';
        this.classPrefix = 'mceColorGrid';
    },
    renderHTML: function () {
        var self = this, s = self.settings, h = '<div id="' + self.id + '" class="mceColorGrid">';
        
        each(s.colors, function (item) {
            h += '<span role="option" title="' + item.text + '" data-mce-color="' + item.value + '" style="background-color:' + item.value + '"></span>';
        });
        
        return h + '</div>';
    },
    postRender: function () {
        var self = this, s = self.settings;

        if (s.onclick) {
            DOM.bind(self.id, 'click', function (e) {
                var val = e.target.getAttribute('data-mce-color');
                if (val) {
                    s.onclick(val);
                }
            });
        }

        if (s.onmouseover) {
            DOM.bind(self.id, 'mouseover', function (e) {
                var val = e.target.getAttribute('data-mce-color');
                if (val) {
                    s.onmouseover(val);
                }
            });
        }
    }
});

function namedToHex(value) {
    var color = '';
    each(namedColors, function (name, hex) {
        if (name.toLowerCase() === value.toLowerCase()) {
            color = hex;
            return false;
        }
    });
    return color;
}

function getStylesheetColors(ed) {
    var colorMap = {}, colors = [], hex, rgb, clr = '';

    var hexRe = /#[0-9a-f]{3,6}/gi,
        rgbRe = new RegExp('rgb\\s*\\(\\s*([0-9]+).*,\\s*([0-9]+).*,\\s*([0-9]+).*\\)', 'gi');

    function addColor(s) {
        if (!s) {
            return;
        }

        colorMap[s] = s;
    }

    function parseCSS(s) {
        each(s.cssRules || s.rules, function (r) {
            switch (r.type || 1) {
                case 1:
                    var css = r.cssText || r.style.cssText;
                    if (css) {
                        hex = css.match(hexRe);
                        rgb = css.match(rgbRe);
                        if (rgb) {
                            clr = new Color(rgb[0]).toHex();
                        }
                        if (hex) {
                            clr = new Color(hex[0]).toHex();
                        }
                        addColor(clr);
                    }
                    break;
                case 3:
                    if (r.href && r.href.indexOf('://') !== -1) {
                        return;
                    }
                    parseCSS(r.styleSheet);
                    break;
            }
        });
    }

    try {
        each(ed.getDoc().styleSheets, function (styleSheet) {
            parseCSS(styleSheet);
        });
    } catch (e) {
        // ignore
    }

    each(colorMap, function (value) {
        colors.push(value);
    });

    return colors;
}

export function showDialog(ed, callback, value) {
    var cm = ed.controlManager;

    // RGB tab — colorpicker left, r/g/b form right (flex row via Layout)
    var rgbLayout = cm.createLayout('colorpicker_rgb_layout', { 'class': 'colorpicker-rgb' });

    var colorPickerCtrl = new tinymce.ui.ColorPicker('colorpicker_picker', {}, ed);
    colorPickerCtrl.onChange = new tinymce.util.Dispatcher(colorPickerCtrl);
    rgbLayout.add(colorPickerCtrl);

    var rgbForm = cm.createForm('colorpicker_rgb_form');

    var rCtrl = cm.createTextBox('colorpicker_r', { name: 'r', label: 'R', subtype: 'number', size: 5, min: 0, max: 255, value: '0' });
    rgbForm.add(rCtrl);

    var gCtrl = cm.createTextBox('colorpicker_g', { name: 'g', label: 'G', subtype: 'number', size: 5, min: 0, max: 255, value: '0' });
    rgbForm.add(gCtrl);

    var bCtrl = cm.createTextBox('colorpicker_b', { name: 'b', label: 'B', subtype: 'number', size: 5, min: 0, max: 255, value: '0' });
    rgbForm.add(bCtrl);

    rgbLayout.add(rgbForm);

    // Hex value control (shown below tabs)
    var hexCtrl = cm.createTextBox('colorpicker_hex', { name: 'hex', label: '#', size: 7 });

    // Web tab
    var webForm = cm.createForm('colorpicker_web_form');
    var webColors = [];
    each(hexColors, function (c) {
        webColors.push({ value: c, text: c });
    });
    webForm.add(new tinymce.ui.ColorGrid('colorpicker_web_grid', {
        colors: webColors,
        onclick: function (val) {
            callback(val); win.close();
        },
        onmouseover: function (val) {
            hexCtrl.value(val.replace('#', ''));
        }
    }, ed));

    // Named tab
    var namedForm = cm.createForm('colorpicker_named_form');
    var namedList = [];
    each(namedColors, function (name, hex) {
        namedList.push({ value: hex, text: name });
    });
    var namedLabelCtrl = cm.createTextBox('colorpicker_named_label', { name: 'named_label', disabled: true, value: '' });
    namedForm.add(new tinymce.ui.ColorGrid('colorpicker_named_grid', {
        colors: namedList,
        onclick: function (val) {
            callback(val); win.close();
        },
        onmouseover: function (val) {
            hexCtrl.value(val.replace('#', ''));
            namedLabelCtrl.value(namedColors[val] || '');
        }
    }, ed));
    namedForm.add(namedLabelCtrl);

    // Tabs
    var tabs = cm.createTabs('colorpicker_tabs');
    tabs.add({ id: 'colorpicker_tab_rgb', title: 'RGB', items: [rgbLayout] });
    tabs.add({ id: 'colorpicker_tab_web', title: 'Web', items: [webForm] });
    tabs.add({ id: 'colorpicker_tab_named', title: 'Named', items: [namedForm] });

    // Optional stylesheet / custom tab
    var stylesheetColors = getStylesheetColors(ed);
    var customColors = ed.settings.colorpicker_custom_colors || [];

    if (stylesheetColors.length || customColors.length) {
        var customForm = cm.createForm('colorpicker_custom_form');

        if (stylesheetColors.length) {
            var sheetList = [];
            each(stylesheetColors, function (c) {
                sheetList.push({ value: c, text: c });
            });
            customForm.add(new tinymce.ui.ColorGrid('colorpicker_sheet_grid', {
                colors: sheetList,
                onclick: function (val) {
                    callback(val); win.close();
                },
                onmouseover: function (val) {
                    hexCtrl.value(val.replace('#', ''));
                }
            }, ed));
        }

        if (customColors.length) {
            var customList = [];
            each(customColors, function (c) {
                customList.push({ value: c, text: c });
            });
            customForm.add(new tinymce.ui.ColorGrid('colorpicker_custom_grid', {
                colors: customList,
                onclick: function (val) {
                    callback(val); win.close();
                },
                onmouseover: function (val) {
                    hexCtrl.value(val.replace('#', ''));
                }
            }, ed));
        }

        tabs.add({ id: 'colorpicker_tab_custom', title: 'Custom', items: [customForm] });
    }

    // colorpicker onChange → sync r/g/b + hex
    colorPickerCtrl.onChange.add(function (ctrl) {
        var rgb = ctrl.rgb();
        rCtrl.value(rgb.r);
        gCtrl.value(rgb.g);
        bCtrl.value(rgb.b);
        hexCtrl.value(ctrl.value().substr(1));
    });

    function updateFromRgb() {
        var rgb = { r: parseInt(rCtrl.value(), 10) || 0, g: parseInt(gCtrl.value(), 10) || 0, b: parseInt(bCtrl.value(), 10) || 0 };
        var hex = new Color(rgb).toHex();
        colorPickerCtrl.value(hex);
        hexCtrl.value(hex.substr(1));
    }

    function updateFromHex() {
        var hex = '#' + hexCtrl.value();
        var color = new Color(hex), rgb = color.toRgb();
        colorPickerCtrl.value(color.toHex());
        rCtrl.value(rgb.r);
        gCtrl.value(rgb.g);
        bCtrl.value(rgb.b);
    }

    var win = ed.windowManager.open({
        title: ed.getLang('colorpicker.title', 'Color'),
        items: [tabs, hexCtrl],
        classes: 'colorpicker-window',
        size: 'square-small',
        open: function () {
            var initColor = value || '#000000';
            if (initColor && !/^#/.test(initColor)) {
                initColor = namedToHex(initColor) || '#000000';
            }
            var color = new Color(initColor), rgb = color.toRgb();
            rCtrl.value(rgb.r);
            gCtrl.value(rgb.g);
            bCtrl.value(rgb.b);
            hexCtrl.value(color.toHex().substr(1));
            colorPickerCtrl.value(color.toHex());

            DOM.bind(rCtrl.id, 'change', updateFromRgb);
            DOM.bind(gCtrl.id, 'change', updateFromRgb);
            DOM.bind(bCtrl.id, 'change', updateFromRgb);
            DOM.bind(hexCtrl.id, 'change', updateFromHex);
        },
        close: function () {
            tabs.destroy();
        },
        buttons: [
            {
                title: ed.getLang('colorpicker.insert', 'Ok'),
                id: 'insert',
                classes: 'primary',
                onsubmit: function () {
                    callback('#' + hexCtrl.value());
                }
            },
            {
                title: ed.getLang('colorpicker.cancel', 'Cancel'),
                id: 'cancel'
            }
        ]
    });
}
