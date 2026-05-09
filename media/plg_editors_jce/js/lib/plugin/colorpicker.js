/* eslint-disable consistent-this */
/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global ibisPopup, jQuery */

(function ($) {
    var ColorPicker = function (element, options) {
        this.options = $.extend(this.options, options);

        this.element = element;

        this._init();
    };

    ColorPicker.prototype = {
        options: {
            color: '#FFFFFF',
            detail: 50,
            speed: 200,
            //template_colors: '',
            'stylesheets': [],
            custom_colors: '',
            forcedHighContrastMode: false,
            labels: {
                picker: 'Picker',
                title: 'Color Picker',
                //palette_tab 	: 'Palette',
                palette: 'Web Colors',
                // named_tab 	: 'Named',
                named: 'Named Colors',
                //template_tab 	: 'Template',
                template: 'Template Colors',
                custom: 'Custom Colors',
                color: 'Color',
                apply: 'Apply',
                name: 'Name'
            },
            dialog: false,
            parent: 'body'
        },

        _strhex: "0123456789abcdef",
        /**
         * Array of Web Color values
         */
        _colors: [
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
        ],
        /**
         * Array of named color values
         */
        _named: {
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
        },
        _translate: function (s, d) {
            var o = this.options;

            var v = o.labels[s] || d || '';

            if (typeof ibisPopup !== 'undefined') {
                v = ibisPopup.getLang('colorpicker.' + s, v);
            }

            return v;
        },
        /**
         * Initialise the plugin
         * @param {Object} trigger Trigger element that launches the colorpicker
         * @param {Object} input Input element that contains the hex value
         * @param {Object} options Options object
         */
        _init: function () {
            var self = this;

            // get stylesheet colors
            this._getStylesheetColors();

            // as a dialog, eg: from the editor font color etc.
            if (this.options.dialog) {
                // tabs already created
                if ($('#tab-content .colorpicker_generated').length) {
                    return;
                }

                var color = $(this.element).val() || '#000000';

                // named color
                if (!/\d/.test(color)) {
                    color = this._namedToHex(color);
                }

                // convert color
                if (/rgb/.test(color)) {
                    color = this._rgbToHex(color);
                }

                if (color && color.indexOf('#') === -1) {
                    color = '#' + color;
                }

                // update element
                $(this.element).val(color);

                $('#colorpicker_color').on('change', function () {
                    var v = this.value;

                    if (v.substr(0, 1) === "#") {
                        v = v.substring(1);
                    }

                    // set wheel colour
                    if (self._wheel) {
                        self._wheel.setColor('#' + v);
                    }

                    this.value = v;
                }).trigger('change');

                this._createTabs();

                $('#colorpicker_insert').on('click', function (e) {
                    e.preventDefault();
                    self._insert();
                });

                // set wheel colour
                if (self._wheel) {
                    self._wheel.setColor(color);
                }

            } else {
                if (this.options.widget) {
                    this.widget = $(this.options.widget);
                } else {
                    this.widget = $(this.element).parent().find('.colorpicker_widget');

                    if (!this.widget.length) {
                        this.widget = $('<span class="colorpicker_widget"></span>').insertAfter(this.element);
                    }
                }

                $(this.widget).css('background-color', $(this.element).val() || '#000000').tips({
                    trigger: 'click',
                    position: 'center right',
                    content: '<div id="colorpicker" title="Color Picker">' + self._getContent() + '</div>',
                    className: 'wf-colorpicker',
                    opacity: 1,
                    parent: this.options.parent
                }).on('tooltip:show', function () {
                    var color = $(self.element).val() || '#000000';

                    // convert color
                    if (/rgb/.test(color)) {
                        color = this._rgbToHex(color);
                    }

                    if (color.substr(0, 1) !== "#") {
                        color = '#' + color;
                    }

                    // tabs already created
                    if ($('#tab-content .colorpicker_generated').length) {
                        return;
                    }

                    // translate labels
                    $('#colorpicker_tabs').html(function (i, h) {
                        return h.replace(/\{#(\w+)\}/gi, function (a, b) {
                            return self._translate(b);
                        });
                    });

                    $('#colorpicker').append(
                        '<div class="modal-footer uk-modal-footer">' +
                        '<div id="colorpicker_preview">' +
                        '<div id="colorpicker_preview_text" class="uk-form-icon uk-form-icon-both">' +
                        '<i class="uk-icon-hashtag"></i>' +
                        '<input type="text" id="colorpicker_color" size="8" maxlength="8" value="' + color.substring(1) + '" aria-required="true" />' +
                        '<span class="uk-icon-none" id="colorpicker_preview_color" style="background-color: rgb(0, 0, 0);"></span>' +
                        '</div>' +
                        '</div>' +
                        '<button type="button" class="btn btn-primary uk-button uk-button-primary" id="colorpicker_insert"><i class="uk-icon-check"></i>' + self._translate('apply', 'Apply') + '</button>' +
                        '</div>'
                    );

                    $('#colorpicker_preview_color').css('background-color', color);

                    $('#colorpicker_color').on('change', function () {
                        var v = this.value;

                        if (v.substr(0, 1) === "#") {
                            v = v.substring(1);
                        }

                        // set wheel colour
                        if (self._wheel) {
                            self._wheel.setColor('#' + v);
                        }

                        this.value = v;
                    }).trigger('change');

                    $('#colorpicker_insert').on('click', function (e) {
                        e.preventDefault();
                        self._insert();
                    });

                    // create tabs
                    self._createTabs();

                    // set wheel colour
                    if (self._wheel) {
                        self._wheel.setColor(color);
                    }
                });
            }
        },
        _getContent: function () {
            var h = '',
                o = this.options;

            h += '<div id="colorpicker_tabs" class="uk-tabs">';
            h += '<ul class="nav nav-tabs uk-tab">';
            h += '<li><a href="#colorpicker_picker" aria-controls="colorpicker_picker" class="active">{#picker}</a></li>';
            h += '<li><a href="#colorpicker_web" aria-controls="colorpicker_web">{#palette}</a></li>';
            h += '<li><a href="#colorpicker_named" aria-controls="colorpicker_named">{#named}</a></li>';

            // add template / custom colours
            if (o.stylesheets.length) {
                h += '<li><a href="#colorpicker_template" aria-controls="colorpicker_template">{#template}</a></li>';
            }

            h += '</ul>';
            h += '<div class="tab-content uk-switcher uk-tabs-panel">';
            h += '<div id="colorpicker_picker" data-type="picker" class="tab-pane"></div>';
            h += '<div id="colorpicker_web" data-type="web" class="tab-pane"></div>';
            h += '<div id="colorpicker_named" data-type="named" class="tab-pane"></div>';

            // add stylesheet colours
            if (o.stylesheets.length) {
                h += '<div id="colorpicker_template" data-type="template" class="tab-pane"></div>';
            }
            h += '</div>';
            h += '</div>';

            return h;
        },
        _createTabs: function () {
            var self = this;

            $('#colorpicker_tabs').on('tabs.activate', function (e, tab, panel) {
                var type = $(panel).data('type');

                self['_create' + type].call(self, $(panel));

                $('#colorpicker_insert').css('visibility', function () {
                    if (type === "picker") {
                        return "visible";
                    }

                    return "hidden";
                });
            }).tabs();

            // create initial picker from visible tab
            var $tab = $('.uk-tab > li:visible', '#colorpicker_tabs').first();

            // ...otherwise use "picker" as default
            if (!$tab.length) {
                $tab = $('.uk-tab > li', '#colorpicker_tabs').first();
            }

            // initialize with click
            $tab.addClass('active uk-active').trigger('click');
        },
        /**
         * Close colorpicker on 'blur'
         * @param {Object} e
         */
        _blur: function (e) {
            if (e) {
                if (e.target == this.picker || e.target == this.picker.colorpicker) {
                    return false;
                }
                var matched = false;

                $(this.picker.colorpicker).find('*').each(function () {
                    if (this == e.target) {
                        matched = true;
                        return false;
                    }
                });

                if (!matched) {
                    this.close();
                }
            }
        },
        /**
         * Close the colorpicker
         */
        _close: function () {
            $(this.widget).trigger('tooltip:close');

            $(this.element).trigger('colorpicker:close');
        },
        /**
         * Insert selected colorpicker value
         */
        _insert: function () {
            var color = $('#colorpicker_color').val();

            if (color.substr(0, 1) !== "#") {
                color = '#' + color;
            }

            $(this.element).trigger('colorpicker:insert', color);

            if (color) {
                $(this.element).val(color).removeClass('placeholder').trigger('change');
                $(this.widget).css('background-color', color);
            }

            this._close();
        },

        _namedToHex: function (value) {
            var color = '';

            $.each(this._named, function (name, hex) {
                if (name.toLowerCase() === value.toLowerCase()) {
                    color = hex;
                    return true;
                }
            });

            return color;
        },
        /**
         * Convert RGB color value to Hex value
         * @author Moxiecode
         * @copyright Copyright (C) 2004-2009, Moxiecode Systems AB, All rights reserved.
         * @param {String} c RGB Color
         */
        _rgbToHex: function (c) {
            var r, g, b, re = new RegExp("rgb\\s*\\(\\s*([0-9]+).*,\\s*([0-9]+).*,\\s*([0-9]+).*\\)", "gi");

            if (!c) {
                return c;
            }

            var rgb = c.replace(re, "$1,$2,$3").split(',');
            if (rgb.length == 3) {
                r = parseInt(rgb[0]).toString(16);
                g = parseInt(rgb[1]).toString(16);
                b = parseInt(rgb[2]).toString(16);

                r = r.length == 1 ? '0' + r : r;
                g = g.length == 1 ? '0' + g : g;
                b = b.length == 1 ? '0' + b : b;

                return "#" + r + g + b;
            }

            return c;
        },
        /**
         * Convert Hex color value to RGB value
         * @author Moxiecode
         * @copyright Copyright (C) 2004-2009, Moxiecode Systems AB, All rights reserved.
         * @param {String} c Hex Color
         */
        _hexToRGB: function (c) {
            var r, g, b;

            if (c.indexOf('#') != -1) {
                c = c.replace(new RegExp('[^0-9A-F]', 'gi'), '');

                r = parseInt(c.substring(0, 2), 16);
                g = parseInt(c.substring(2, 4), 16);
                b = parseInt(c.substring(4, 6), 16);

                return {
                    r: r,
                    g: g,
                    b: b
                };
            }

            return null;
        },
        /**
         * Generate Picker
         * @param {Object} parent DIV element to insert picker code into
         */
        _createpicker: function (parent) {
            var self = this;

            if ($(parent).hasClass('colorpicker_generated')) {
                return;
            }

            var $parent = $(parent);
            var pid = $parent.attr('id') || 'colorpicker_picker';
            var svId = pid + '-sv', svpId = pid + '-svp', hId = pid + '-h', hpId = pid + '-hp';

            var stops = '#ff0000,#ff0080,#ff00ff,#8000ff,#0000ff,#0080ff,#00ffff,#00ff80,#00ff00,#80ff00,#ffff00,#ff8000,#ff0000';

            var html = '<div class="mceColorPicker">' +
                '<div id="' + svId + '" class="mceColorPicker-sv">' +
                '<div class="mceColorPicker-overlay1">' +
                '<div class="mceColorPicker-overlay2">' +
                '<div id="' + svpId + '" class="mceColorPicker-selector1">' +
                '<div class="mceColorPicker-selector2"></div>' +
                '</div></div></div></div>' +
                '<div id="' + hId + '" class="mceColorPicker-h" style="background:linear-gradient(to bottom,' + stops + ');">' +
                '<div id="' + hpId + '" class="mceColorPicker-h-marker"></div>' +
                '</div></div>';

            $parent.html(html).addClass('colorpicker_generated');

            var color = new ibis.util.Color();
            var hsv;

            var $svRoot = $('#' + svId);
            var $svPoint = $('#' + svpId);
            var $hRoot = $('#' + hId);
            var $hPoint = $('#' + hpId);

            function getPos($elm, e) {
                var offset = $elm.offset();
                var x = Math.max(0, Math.min((e.pageX - offset.left) / $elm.width(), 1));
                var y = Math.max(0, Math.min((e.pageY - offset.top) / $elm.height(), 1));
                return { x: x, y: y };
            }

            function repaint() {
                hsv = color.toHsv();
                $hPoint.css('top', ((360 - hsv.h) / 360 * 100) + '%');
                $svPoint.css({ left: hsv.s + '%', top: (100 - hsv.v) + '%' });
                $svRoot.css('background-color', new ibis.util.Color({ s: 100, v: 100, h: hsv.h }).toHex());
            }

            function updateSV(e) {
                var pos = getPos($svRoot, e);
                hsv.s = pos.x * 100;
                hsv.v = (1 - pos.y) * 100;
                color.parse({ h: hsv.h, s: hsv.s, v: hsv.v });
                $svPoint.css({ left: hsv.s + '%', top: (100 - hsv.v) + '%' });
                $svRoot.css('background-color', new ibis.util.Color({ s: 100, v: 100, h: hsv.h }).toHex());
                self._showColor(color.toHex());
            }

            function updateHue(e) {
                var pos = getPos($hRoot, e);
                hsv = color.toHsv();
                hsv.h = (1 - pos.y) * 360;
                color.parse({ h: hsv.h, s: hsv.s, v: hsv.v });
                $hPoint.css('top', ((360 - hsv.h) / 360 * 100) + '%');
                $svRoot.css('background-color', new ibis.util.Color({ s: 100, v: 100, h: hsv.h }).toHex());
                self._showColor(color.toHex());
            }

            function makeDraggable($elm, onDrag) {
                $elm.on('mousedown', function (e) {
                    onDrag(e);
                    $(document).on('mousemove.colorpicker', onDrag).on('mouseup.colorpicker', function () {
                        $(document).off('mousemove.colorpicker mouseup.colorpicker');
                    });
                    e.preventDefault();
                });
            }

            makeDraggable($svRoot, updateSV);
            makeDraggable($hRoot, updateHue);

            self._wheel = {
                setColor: function (hex) {
                    color.parse(hex);
                    repaint();
                }
            };

            var initColor = $('#colorpicker_color').val() || '#000000';

            if (initColor.charAt(0) !== '#') {
                initColor = '#' + initColor;
            }
            
            self._wheel.setColor(initColor);
        },
        /**
         * Generate Web Color blocks
         * @param {Object} parent DIV element to append code to
         */
        _createweb: function (parent) {
            var self = this,
                h = '';

            if ($(parent).hasClass('colorpicker_generated')) {
                return;
            }

            h += '<div role="listbox" aria-labelledby="colorpicker_web" tabindex="0">';
            h += '<ul>';

            $.each(this._colors, function (i, v) {
                h += '<li style="background-color:' + v + '"><span class="colorpicker_webblock" role="option" aria-labelledby="web_colors_' + i + '" title="' + v + '"></span></li>';
                if (self.options.forcedHighContrastMode) {
                    h += '<canvas class="mceColorSwatch" data-color="' + v + '"></canvas>';
                }
                h += '<span class="mceVoiceLabel" id="web_colors_' + i + '">' + v.toUpperCase() + '</span>';

                if ((i + 1) % 18 == 0) {
                    // h += '</ul><ul>';
                }
            });

            h += '</ul></div>';

            $(parent).append(h).append('<br style="clear:both;" />').addClass('colorpicker_generated');

            $('span.colorpicker_webblock', parent).on('click', function () {
                self._insert();
            }).on('mouseover', function () {
                self._showColor($(this).attr('title'));
            });

            this._paintCanvas(parent);
        },
        /**
         * Generate Named Color blocks
         * @param {Object} parent DIV element to append code to
         */
        _createnamed: function (parent) {
            var self = this,
                h = '',
                i = 0;

            if ($(parent).hasClass('colorpicker_generated')) {
                return;
            }

            h += '<div role="listbox" aria-labelledby="colorpicker_named" tabindex="0">';
            h += '<ul>';

            $.each(this._named, function (k, v) {
                h += '<li style="background-color:' + k + '"><span class="colorpicker_namedblock" aria-labelledby="named_colors_' + k + '" title="' + self._translate(k.replace(/[^\w]/g, ''), v) + '"></span></li>';
                if (self.options.forcedHighContrastMode) {
                    h += '<canvas class="mceColorSwatch" data-color="' + v + '"></canvas>';
                }
                h += '<span class="mceVoiceLabel" id="named_colors_' + k + '">' + v.toUpperCase() + '</span>';

                if ((i + 1) % 18 == 0) {
                    //h += '</ul><ul>';
                }
                i++;
            });

            h += '</ul></div>';

            $(parent).append(h).append('<br style="clear:both;" />').addClass('colorpicker_generated').append('<div id="colorpicker_colorname">' + this.options.labels.name + '</div>');

            $('span.colorpicker_namedblock', parent).on('click', function () {
                self._insert();
            }).on('mouseover', function () {
                self._showColor($(this).parent('li').css('background-color'), $(this).attr('title'));
            });

            this._paintCanvas(parent);
        },
        /**
         * Generate Template Color blocks
         * @param {Object} el DIV element to append code to
         */
        _createtemplate: function (parent) {
            var self = this,
                h = '';

            if ($(parent).hasClass('colorpicker_generated')) {
                return;
            }

            if (this.template_colors) {
                var templateColors = this.template_colors;

                if (typeof this.template_colors === 'string') {
                    templateColors = templateColors.split(',');
                }

                h += '<div role="listbox" aria-labelledby="colorpicker_template_label" tabindex="0">';
                h += '<ul>';

                $.each(templateColors, function (i, v) {
                    if (v.length == 4) {
                        v = v + v.substr(1);
                    }

                    h += '<li style="background-color:' + v + '"><span class="colorpicker_templateblock" aria-labelledby="template_colors_' + i + '" title="' + v + '"></span></li>';
                    if (self.options.forcedHighContrastMode) {
                        h += '<canvas class="mceColorSwatch" data-color="' + v + '"></canvas>';
                    }
                    h += '<span class="mceVoiceLabel" id="template_colors_' + i + '">' + v.toUpperCase() + '</span>';
                    if ((i + 1) % 18 == 0) {
                        //h += '</ul><ul>';
                    }
                });

                h += '</ul></div>';

                $(parent).append(h);
            }
            if (this.options.custom_colors) {
                var h = '';

                $(parent).append('<p id="colorpicker_custom_label">' + this.options.labels.custom + '</p>');

                var customColors = this.options.custom_colors.split(',');

                h += '<div role="listbox" aria-labelledby="colorpicker_custom_label" tabindex="0">';
                h += '<ul>';

                $.each(customColors, function (i, v) {
                    if (v.length == 4) {
                        v = v + v.replace('#', '');
                    }
                    h += '<li style="background-color:' + v + '"><span class="colorpicker_templateblock" aria-labelledby="custom_colors_' + i + '" title="' + v + '"></span></li>';
                    if (self.options.forcedHighContrastMode) {
                        h += '<canvas class="mceColorSwatch" data-color="' + v + '"></canvas>';
                    }
                    h += '<span class="mceVoiceLabel" style="display:none;" id="custom_colors_' + i + '">' + v.toUpperCase() + '</span>';
                    if ((i + 1) % 18 == 0) {
                        h += '</ul><ul>';
                    }
                });

                h += '</div>';

                $(parent).append(h);

                this._paintCanvas(parent);
            }

            $(parent).addClass('colorpicker_generated');

            $('span.colorpicker_templateblock', parent).on('click', function () {
                self._insert();
            }).on('mouseover', function () {
                self._showColor($(this).attr('title'));
            });

        },
        /**
         * Update name, color preview and color value
         * @param {Object} color Color hex value
         * @param {Object} name Color name
         */
        _showColor: function (color, name) {
            if (name) {
                $("#colorpicker_colorname").html(this.options.labels.name + ': ' + name);
            }

            color = color.toLowerCase();

            if (/rgb/.test(color)) {
                color = this._rgbToHex(color);
            }

            $("#colorpicker_preview_color").css('background-color', color);

            $("#colorpicker_color").val(color.replace('#', ''));
        },
        /**
         * Update color value and bcakground color preview
         * @param {Object} color Hex value
         */
        _changeFinalColor: function (color) {
            if (!/#/.test(color)) {
                color = this._rgbToHex(color);
            }

            color = color.toLowerCase();

            $('#colorpicker_preview').css('background-color', color);
            $('#colorpicker_color').val(color.replace('#', ''));
        },
        _paintCanvas: function (el) {
            $('canvas.mceColorSwatch', el).each(function () {
                var $canvas = $(this).get(0), context;

                if ($canvas.getContext && (context = $canvas.getContext("2d"))) {
                    context.fillStyle = $canvas.getAttribute('data-color');
                    context.fillRect(0, 0, 10, 10);
                }
            });

        },
        _sort_colors: function (colors) {

            var sorted = [],
                s = [];

            $.each(colors, function (x, color) {
                color = color.replace('#', '').toLowerCase();

                if (color.length == 6) {
                    var condensed = '';
                    $.each(color.split(''), function (i, c) {
                        if (i % 2 == 0) {
                            condensed += c;
                        }
                    });

                    var color_str = condensed;
                }
                var v = 0;

                $.each(color_str.split(''), function (i, c) {
                    v += parseInt(c, 16);
                });

                if (color) {
                    sorted[v + x] = '#' + color;
                }
            });

            $.each(sorted, function (i, c) {
                if (c) {
                    s.push(c);
                }
            });

            return s;
        },
        _getStylesheetColors: function () {
            var self = this,
                o = this.options,
                colors = [],
                hex, rgb;
            var hexRe = /#[0-9a-f]{3,6}/gi,
                rgbRe = new RegExp("rgb\\s*\\(\\s*([0-9]+).*,\\s*([0-9]+).*,\\s*([0-9]+).*\\)", "gi");

            function addColor(s) {
                if ($.inArray(s, colors) == -1) {
                    colors.push(s);
                }
            }

            function parseCSS(s) {
                // IE style imports

                if (s.imports) {
                    $.each(s.imports, function (i, r) {
                        parseCSS(r);
                    });
                }

                $.each(s.cssRules || s.rules, function (i, r) {
                    // Real type or fake it on IE
                    switch (r.type || 1) {
                        // Rule
                        case 1:
                            var css = r.cssText || r.style.cssText;

                            if (css) {
                                hex = css.match(hexRe);
                                rgb = css.match(rgbRe);

                                if (rgb) {
                                    addColor(self._rgbToHex(rgb[0]));
                                }

                                if (hex) {
                                    addColor(hex[0]);
                                }
                            }

                            break;

                        // Import
                        case 3:
                            // only local imports
                            if (r.href.indexOf('://') != -1) {
                                return;
                            }

                            parseCSS(r.styleSheet);
                            break;
                    }
                });
            }

            function processStyleSheets(stylesheets) {
                try {
                    $.each(stylesheets, function (i, s) {
                        parseCSS(s);
                    });
                } catch (ex) {
                    // Ignore
                }

                //return self._sort_colors(colors);
                return colors;
            }

            // list of css files
            if (typeof o.stylesheets[0] === 'string') {
                var doc, el, ifr;

                // only do this once
                if (document.getElementById('stylsheets_iframe')) {
                    return;
                }

                var h = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge">';

                $.each(o.stylesheets, function (i, s) {
                    h += '<link href="' + s + '" rel="stylesheet" type="text/css" />';
                });

                h += '</head><body></body></html>';

                ifr = document.createElement('iframe');

                $(ifr).attr({
                    'src': 'javascript:""',
                    'id': 'stylsheets_iframe'
                }).hide().appendTo('body').on('load', function (e) {
                    el = e.target, doc = el.contentWindow.document;

                    if (doc && doc.styleSheets) {
                        self.template_colors = processStyleSheets(doc.styleSheets);
                    }

                    $(ifr).remove();
                });
                // get document
                doc = ifr.contentWindow.document;
                // write document html
                if (doc) {
                    doc.open();
                    doc.write(h);
                    doc.close();
                }
            } else {
                this.template_colors = processStyleSheets(o.stylesheets);
            }
        }
    };

    $.fn.colorpicker = function (options) {
        return this.each(function () {
            // eslint-disable-next-line no-unused-vars
            var inst = new ColorPicker(this, options);
        });
    };
})(jQuery);
