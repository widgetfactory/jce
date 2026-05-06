/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*global ibis:true */

(function () {
    ibis.PluginManager.add('colorpicker', function (ed) {
        var each = ibis.each, DOM = ibis.DOM, Color = ibis.util.Color;
        var cm;

        ed.onPreInit.add(function () {
            cm = ed.controlManager;
        });

        var hexColors = [
            "#000000", "#000033", "#000066", "#000099", "#0000cc", "#0000ff", "#330000", "#330033",
            "#330066", "#330099", "#3300cc", "#3300ff", "#660000", "#660033", "#660066", "#660099",
            "#6600cc", "#6600ff", "#990000", "#990033", "#990066", "#990099", "#9900cc", "#9900ff",
            "#cc0000", "#cc0033", "#cc0066", "#cc0099", "#cc00cc", "#cc00ff", "#ff0000", "#ff0033",
            "#ff0066", "#ff0099", "#ff00cc", "#ff00ff", "#003300", "#003333", "#003366", "#003399",
            "#0033cc", "#0033ff", "#333300", "#333333", "#333366", "#333399", "#3333cc", "#3333ff",
            "#663300", "#663333", "#663366", "#663399", "#6633cc", "#6633ff", "#993300", "#993333",
            "#993366", "#993399", "#9933cc", "#9933ff", "#cc3300", "#cc3333", "#cc3366", "#cc3399",
            "#cc33cc", "#cc33ff", "#ff3300", "#ff3333", "#ff3366", "#ff3399", "#ff33cc", "#ff33ff",
            "#006600", "#006633", "#006666", "#006699", "#0066cc", "#0066ff", "#336600", "#336633",
            "#336666", "#336699", "#3366cc", "#3366ff", "#666600", "#666633", "#666666", "#666699",
            "#6666cc", "#6666ff", "#996600", "#996633", "#996666", "#996699", "#9966cc", "#9966ff",
            "#cc6600", "#cc6633", "#cc6666", "#cc6699", "#cc66cc", "#cc66ff", "#ff6600", "#ff6633",
            "#ff6666", "#ff6699", "#ff66cc", "#ff66ff", "#009900", "#009933", "#009966", "#009999",
            "#0099cc", "#0099ff", "#339900", "#339933", "#339966", "#339999", "#3399cc", "#3399ff",
            "#669900", "#669933", "#669966", "#669999", "#6699cc", "#6699ff", "#999900", "#999933",
            "#999966", "#999999", "#9999cc", "#9999ff", "#cc9900", "#cc9933", "#cc9966", "#cc9999",
            "#cc99cc", "#cc99ff", "#ff9900", "#ff9933", "#ff9966", "#ff9999", "#ff99cc", "#ff99ff",
            "#00cc00", "#00cc33", "#00cc66", "#00cc99", "#00cccc", "#00ccff", "#33cc00", "#33cc33",
            "#33cc66", "#33cc99", "#33cccc", "#33ccff", "#66cc00", "#66cc33", "#66cc66", "#66cc99",
            "#66cccc", "#66ccff", "#99cc00", "#99cc33", "#99cc66", "#99cc99", "#99cccc", "#99ccff",
            "#cccc00", "#cccc33", "#cccc66", "#cccc99", "#cccccc", "#ccccff", "#ffcc00", "#ffcc33",
            "#ffcc66", "#ffcc99", "#ffcccc", "#ffccff", "#00ff00", "#00ff33", "#00ff66", "#00ff99",
            "#00ffcc", "#00ffff", "#33ff00", "#33ff33", "#33ff66", "#33ff99", "#33ffcc", "#33ffff",
            "#66ff00", "#66ff33", "#66ff66", "#66ff99", "#66ffcc", "#66ffff", "#99ff00", "#99ff33",
            "#99ff66", "#99ff99", "#99ffcc", "#99ffff", "#ccff00", "#ccff33", "#ccff66", "#ccff99",
            "#ccffcc", "#ccffff", "#ffff00", "#ffff33", "#ffff66", "#ffff99", "#ffffcc", "#ffffff"
        ];

        var namedColors = {
            '#F0F8FF': 'AliceBlue',
            '#FAEBD7': 'AntiqueWhite',
            '#7FFFD4': 'Aquamarine',
            '#F0FFFF': 'Azure',
            '#F5F5DC': 'Beige',
            '#FFE4C4': 'Bisque',
            '#000000': 'Black',
            '#FFEBCD': 'BlanchedAlmond',
            '#0000FF': 'Blue',
            '#8A2BE2': 'BlueViolet',
            '#A52A2A': 'Brown',
            '#DEB887': 'BurlyWood',
            '#5F9EA0': 'CadetBlue',
            '#7FFF00': 'Chartreuse',
            '#D2691E': 'Chocolate',
            '#FF7F50': 'Coral',
            '#6495ED': 'CornflowerBlue',
            '#FFF8DC': 'Cornsilk',
            '#DC143C': 'Crimson',
            '#00008B': 'DarkBlue',
            '#008B8B': 'DarkCyan',
            '#B8860B': 'DarkGoldenRod',
            '#A9A9A9': 'DarkGray',
            '#006400': 'DarkGreen',
            '#BDB76B': 'DarkKhaki',
            '#8B008B': 'DarkMagenta',
            '#556B2F': 'DarkOliveGreen',
            '#FF8C00': 'Darkorange',
            '#9932CC': 'DarkOrchid',
            '#8B0000': 'DarkRed',
            '#E9967A': 'DarkSalmon',
            '#8FBC8F': 'DarkSeaGreen',
            '#483D8B': 'DarkSlateBlue',
            '#2F4F4F': 'DarkSlateGrey',
            '#00CED1': 'DarkTurquoise',
            '#9400D3': 'DarkViolet',
            '#FF1493': 'DeepPink',
            '#00BFFF': 'DeepSkyBlue',
            '#696969': 'DimGrey',
            '#1E90FF': 'DodgerBlue',
            '#B22222': 'FireBrick',
            '#FFFAF0': 'FloralWhite',
            '#228B22': 'ForestGreen',
            '#DCDCDC': 'Gainsboro',
            '#F8F8FF': 'GhostWhite',
            '#FFD700': 'Gold',
            '#DAA520': 'GoldenRod',
            '#808080': 'Grey',
            '#008000': 'Green',
            '#ADFF2F': 'GreenYellow',
            '#F0FFF0': 'HoneyDew',
            '#FF69B4': 'HotPink',
            '#CD5C5C': 'IndianRed',
            '#4B0082': 'Indigo',
            '#FFFFF0': 'Ivory',
            '#F0E68C': 'Khaki',
            '#E6E6FA': 'Lavender',
            '#FFF0F5': 'LavenderBlush',
            '#7CFC00': 'LawnGreen',
            '#FFFACD': 'LemonChiffon',
            '#ADD8E6': 'LightBlue',
            '#F08080': 'LightCoral',
            '#E0FFFF': 'LightCyan',
            '#FAFAD2': 'LightGoldenRodYellow',
            '#D3D3D3': 'LightGrey',
            '#90EE90': 'LightGreen',
            '#FFB6C1': 'LightPink',
            '#FFA07A': 'LightSalmon',
            '#20B2AA': 'LightSeaGreen',
            '#87CEFA': 'LightSkyBlue',
            '#778899': 'LightSlateGrey',
            '#B0C4DE': 'LightSteelBlue',
            '#FFFFE0': 'LightYellow',
            '#00FF00': 'Lime',
            '#32CD32': 'LimeGreen',
            '#FAF0E6': 'Linen',
            '#FF00FF': 'Magenta',
            '#800000': 'Maroon',
            '#66CDAA': 'MediumAquaMarine',
            '#0000CD': 'MediumBlue',
            '#BA55D3': 'MediumOrchid',
            '#9370D8': 'MediumPurple',
            '#3CB371': 'MediumSeaGreen',
            '#7B68EE': 'MediumSlateBlue',
            '#00FA9A': 'MediumSpringGreen',
            '#48D1CC': 'MediumTurquoise',
            '#C71585': 'MediumVioletRed',
            '#191970': 'MidnightBlue',
            '#F5FFFA': 'MintCream',
            '#FFE4E1': 'MistyRose',
            '#FFE4B5': 'Moccasin',
            '#FFDEAD': 'NavajoWhite',
            '#000080': 'Navy',
            '#FDF5E6': 'OldLace',
            '#808000': 'Olive',
            '#6B8E23': 'OliveDrab',
            '#FFA500': 'Orange',
            '#FF4500': 'OrangeRed',
            '#DA70D6': 'Orchid',
            '#EEE8AA': 'PaleGoldenRod',
            '#98FB98': 'PaleGreen',
            '#AFEEEE': 'PaleTurquoise',
            '#D87093': 'PaleVioletRed',
            '#FFEFD5': 'PapayaWhip',
            '#FFDAB9': 'PeachPuff',
            '#CD853F': 'Peru',
            '#FFC0CB': 'Pink',
            '#DDA0DD': 'Plum',
            '#B0E0E6': 'PowderBlue',
            '#800080': 'Purple',
            '#FF0000': 'Red',
            '#BC8F8F': 'RosyBrown',
            '#4169E1': 'RoyalBlue',
            '#8B4513': 'SaddleBrown',
            '#FA8072': 'Salmon',
            '#F4A460': 'SandyBrown',
            '#2E8B57': 'SeaGreen',
            '#FFF5EE': 'SeaShell',
            '#A0522D': 'Sienna',
            '#C0C0C0': 'Silver',
            '#87CEEB': 'SkyBlue',
            '#6A5ACD': 'SlateBlue',
            '#708090': 'SlateGrey',
            '#FFFAFA': 'Snow',
            '#00FF7F': 'SpringGreen',
            '#4682B4': 'SteelBlue',
            '#D2B48C': 'Tan',
            '#008080': 'Teal',
            '#D8BFD8': 'Thistle',
            '#FF6347': 'Tomato',
            '#40E0D0': 'Turquoise',
            '#EE82EE': 'Violet',
            '#F5DEB3': 'Wheat',
            '#FFFFFF': 'White',
            '#F5F5F5': 'WhiteSmoke',
            '#FFFF00': 'Yellow',
            '#9ACD32': 'YellowGreen'
        };

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

        function getStylesheetColors() {
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

        // Reusable color grid control for web/named/custom tabs
        ibis.create('ibis.ui.ColorGrid:ibis.ui.Control', {
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

        function showDialog(callback, value) {
            // RGB tab
            var rgbLayout = cm.createLayout('colorpicker_rgb_layout');

            var rgbForm = cm.createForm('colorpicker_rgb_form');

            var colorPickerCtrl = new ibis.ui.ColorPicker('colorpicker_picker', {}, ed);
            colorPickerCtrl.onChange = new ibis.util.Dispatcher(colorPickerCtrl);
            rgbLayout.add(colorPickerCtrl);

            var rCtrl = cm.createTextBox('colorpicker_r', { name: 'r', label: 'R', subtype: 'number', size: 5, min: 0, max: 255, value: '0' });
            rgbForm.add(rCtrl);

            var gCtrl = cm.createTextBox('colorpicker_g', { name: 'g', label: 'G', subtype: 'number', size: 5, min: 0, max: 255, value: '0' });
            rgbForm.add(gCtrl);

            var bCtrl = cm.createTextBox('colorpicker_b', { name: 'b', label: 'B', subtype: 'number', size: 5, min: 0, max: 255, value: '0' });
            rgbForm.add(bCtrl);

            // Hex value control (shown below tabs)
            var hexCtrl = cm.createTextBox('colorpicker_hex', { name: 'hex', label: '#', size: 7 });

            var hexForm = cm.createForm('colorpicker_hex_form', {
                class: 'mceColorPickerHex'
            });
            
            hexForm.add(hexCtrl);

            // Web tab
            var webForm = cm.createForm('colorpicker_web_form');
            var webColors = [];

            each(hexColors, function (c) {
                webColors.push({ value: c, text: c });
            });

            webForm.add(new ibis.ui.ColorGrid('colorpicker_web_grid', {
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

            var namedLabelCtrl = cm.createTextBox('colorpicker_named_label', { name: 'named_label', value: '', attributes : { readonly : true } });

            namedForm.add(new ibis.ui.ColorGrid('colorpicker_named_grid', {
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
            tabs.add({ id: 'colorpicker_tab_rgb', title: 'RGB', items: [rgbLayout, rgbForm], class: 'mceColorRgb' });
            tabs.add({ id: 'colorpicker_tab_web', title: 'Web', items: [webForm] });
            tabs.add({ id: 'colorpicker_tab_named', title: 'Named', items: [namedForm] });

            // Optional stylesheet / custom tab
            var stylesheetColors = getStylesheetColors();
            var customColors = ed.settings.colorpicker_custom_colors || [];

            if (stylesheetColors.length || customColors.length) {
                var customForm = cm.createForm('colorpicker_custom_form');

                if (stylesheetColors.length) {
                    var sheetList = [];

                    each(stylesheetColors, function (c) {
                        sheetList.push({ value: c, text: c });
                    });

                    customForm.add(new ibis.ui.ColorGrid('colorpicker_sheet_grid', {
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

                    customForm.add(new ibis.ui.ColorGrid('colorpicker_custom_grid', {
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
                items: [tabs, hexForm],
                classes: 'colorpicker-window',
                size: 'mce-modal-square-small',
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

        if (!ed.settings.color_picker_callback) {
            ed.settings.color_picker_callback = function (callback, value) {
                showDialog(callback, value);
            };
        }

        ed.addCommand('mceColorPicker', function (ui, value) {
            showDialog(value.callback, value.color);
        });
    });
})();
