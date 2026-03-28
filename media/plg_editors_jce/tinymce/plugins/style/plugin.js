(function () {
    'use strict';

    /* eslint-disable */

    /* eslint-disable dot-notation */
    /**
     * @package     JCE
     * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
     * @license     GNU General Public License version 2 or later; see LICENSE.txt
     */

    /**
     * Parse an element's computed style object into a flat form-data object
     * suitable for populating the dialog controls via tabs.update(data).
     *
     * @param {Object} styles  Parsed CSS properties (from ed.dom.parseStyle)
     * @param {Object} ed      The TinyMCE editor instance
     * @returns {Object}
     */
    function stylesToData(styles, ed) {
        var data = {};

        // ── Text ────────────────────────────────────────────────────────────────
        data.font_family = styles['font-family'] || '';
        data.font_size = styles['font-size'] || '';
        data.font_style = styles['font-style'] || '';
        data.font_weight = styles['font-weight'] || '';
        data.font_variant = styles['font-variant'] || '';
        data.text_transform = styles['text-transform'] || '';
        data.line_height = styles['line-height'] || '';
        data.color = styles['color'] ? ed.dom.toHex(styles['color']) : '';

        var dec = styles['text-decoration'] || '';
        data.text_dec_underline = /underline/i.test(dec);
        data.text_dec_overline = /overline/i.test(dec);
        data.text_dec_linethrough = /line-through/i.test(dec);
        data.text_dec_blink = /blink/i.test(dec);
        data.text_dec_none = /\bnone\b/i.test(dec);

        // ── Background ──────────────────────────────────────────────────────────
        data.background_color = styles['background-color'] ? ed.dom.toHex(styles['background-color']) : '';
        var bgImg = styles['background-image'] || '';
        data.background_image = bgImg.replace(/url\(["']?([^"')]+)["']?\)/i, '$1');
        data.background_repeat = styles['background-repeat'] || '';
        data.background_attachment = styles['background-attachment'] || '';
        var bgPosParts = (styles['background-position'] || '').split(/\s+/);
        data.background_position_h = bgPosParts[0] || '';
        data.background_position_v = bgPosParts[1] || '';

        // ── Block ────────────────────────────────────────────────────────────────
        data.word_spacing = styles['word-spacing'] || '';
        data.letter_spacing = styles['letter-spacing'] || '';
        data.vertical_align = styles['vertical-align'] || '';
        data.text_align = styles['text-align'] || '';
        data.text_indent = styles['text-indent'] || '';
        data.white_space = styles['white-space'] || '';
        data.display = styles['display'] || '';

        // ── Box ──────────────────────────────────────────────────────────────────
        data.width = styles['width'] || '';
        data.height = styles['height'] || '';
        data.float = styles['float'] || styles['css-float'] || '';
        data.clear = styles['clear'] || '';

        // padding / margin: shorthand → four sides
        function fourSideData(prefix, prop) {
            var shorthand = styles[prop] || '';
            var t = styles[prop + '-top'] || shorthand;
            var r = styles[prop + '-right'] || shorthand;
            var b = styles[prop + '-bottom'] || shorthand;
            var l = styles[prop + '-left'] || shorthand;
            data[prefix + '_same'] = t !== '' && t === r && r === b && b === l;
            data[prefix + '_top'] = t;
            data[prefix + '_right'] = r;
            data[prefix + '_bottom'] = b;
            data[prefix + '_left'] = l;
        }

        fourSideData('padding', 'padding');
        fourSideData('margin', 'margin');

        // ── Border ───────────────────────────────────────────────────────────────
        function borderSideData(prefix, prop) {
            var shorthand = styles['border-' + prop] || '';
            var t = styles['border-top-' + prop] || shorthand;
            var r = styles['border-right-' + prop] || shorthand;
            var b = styles['border-bottom-' + prop] || shorthand;
            var l = styles['border-left-' + prop] || shorthand;
            if (prop === 'color') {
                t = t ? ed.dom.toHex(t) : '';
                r = r ? ed.dom.toHex(r) : '';
                b = b ? ed.dom.toHex(b) : '';
                l = l ? ed.dom.toHex(l) : '';
            }
            data[prefix + '_same'] = t !== '' && t === r && r === b && b === l;
            data[prefix + '_top'] = t;
            data[prefix + '_right'] = r;
            data[prefix + '_bottom'] = b;
            data[prefix + '_left'] = l;
        }

        borderSideData('border_style', 'style');
        borderSideData('border_width', 'width');
        borderSideData('border_color', 'color');

        // ── List ─────────────────────────────────────────────────────────────────
        data.list_style_type = styles['list-style-type'] || '';
        data.list_style_position = styles['list-style-position'] || '';
        var lstImg = styles['list-style-image'] || '';
        data.list_style_image = lstImg.replace(/url\(["']?([^"')]+)["']?\)/i, '$1');

        // ── Positioning ──────────────────────────────────────────────────────────
        data.position = styles['position'] || '';
        data.visibility = styles['visibility'] || '';
        data.z_index = styles['z-index'] || '';
        data.overflow = styles['overflow'] || '';

        var pt = styles['top'] || '', pr = styles['right'] || '',
            pb = styles['bottom'] || '', pl = styles['left'] || '';
        data.placement_same = pt !== '' && pt === pr && pr === pb && pb === pl;
        data.placement_top = pt; data.placement_right = pr;
        data.placement_bottom = pb; data.placement_left = pl;

        // clip: rect(top right bottom left)
        var clip = styles['clip'] || '';
        var cm = clip.match(/rect\(([^)]+)\)/);
        var cv = ['', '', '', ''];
        if (cm) {
            cv = cm[1].replace(/,/g, ' ').trim().split(/\s+/);

            while (cv.length < 4) {
                cv.push('');
            }

            cv = cv.map(function (v) {
                return v === 'auto' ? '' : v;
            });
        }
        data.clip_same = cv[0] !== '' && cv[0] === cv[1] && cv[1] === cv[2] && cv[2] === cv[3];
        data.clip_top = cv[0]; data.clip_right = cv[1];
        data.clip_bottom = cv[2]; data.clip_left = cv[3];

        return data;
    }

    /**
     * Build a CSS properties object from a flat form-data object returned by
     * tabs.submit().
     *
     * @param {Object} data  Form field values
     * @returns {Object}     CSS key→value pairs
     */
    function dataToStyles(data) {
        var styles = {};

        function set(prop, val) {
            if (val) {
                styles[prop] = val;
            }
        }

        function setColor(prop, val) {
            if (val && val !== '#') {
                styles[prop] = val;
            }
        }

        // ── Text ────────────────────────────────────────────────────────────────
        set('font-family', data.font_family);
        set('font-size', data.font_size);
        set('font-style', data.font_style);
        set('font-weight', data.font_weight);
        set('font-variant', data.font_variant);
        set('text-transform', data.text_transform);
        set('line-height', data.line_height);
        setColor('color', data.color);

        if (data.text_dec_none) {
            styles['text-decoration'] = 'none';
        } else {
            var dec = [];

            if (data.text_dec_underline) {
                dec.push('underline');
            }

            if (data.text_dec_overline) {
                dec.push('overline');
            }

            if (data.text_dec_linethrough) {
                dec.push('line-through');
            }

            if (data.text_dec_blink) {
                dec.push('blink');
            }

            if (dec.length) {
                styles['text-decoration'] = dec.join(' ');
            }
        }

        // ── Background ──────────────────────────────────────────────────────────
        setColor('background-color', data.background_color);

        if (data.background_image) {
            styles['background-image'] = 'url(' + data.background_image + ')';
        }

        set('background-repeat', data.background_repeat);
        set('background-attachment', data.background_attachment);

        if (data.background_position_h || data.background_position_v) {
            styles['background-position'] = (data.background_position_h || '0%') + ' ' + (data.background_position_v || '0%');
        }

        // ── Block ────────────────────────────────────────────────────────────────
        set('word-spacing', data.word_spacing);
        set('letter-spacing', data.letter_spacing);
        set('vertical-align', data.vertical_align);
        set('text-align', data.text_align);
        set('text-indent', data.text_indent);
        set('white-space', data.white_space);
        set('display', data.display);

        // ── Box ──────────────────────────────────────────────────────────────────
        set('width', data.width);
        set('height', data.height);
        set('float', data.float);
        set('clear', data.clear);

        function fourSide(prop, sameKey, tKey, rKey, bKey, lKey, isColor) {
            var fn = set;
            var t = data[tKey], r = data[rKey], b = data[bKey], l = data[lKey];
            if (t || r || b || l) {
                if (data[sameKey]) {
                    fn(prop, t);
                } else {
                    fn(prop + '-top', t);
                    fn(prop + '-right', r);
                    fn(prop + '-bottom', b);
                    fn(prop + '-left', l);
                }
            }
        }

        fourSide('padding', 'padding_same', 'padding_top', 'padding_right', 'padding_bottom', 'padding_left');
        fourSide('margin', 'margin_same', 'margin_top', 'margin_right', 'margin_bottom', 'margin_left');

        // ── Border ───────────────────────────────────────────────────────────────
        function borderFour(prop, sameKey, tKey, rKey, bKey, lKey, isColor) {
            var fn = isColor ? setColor : set;
            var t = data[tKey], r = data[rKey], b = data[bKey], l = data[lKey];
            if (t || r || b || l) {
                if (data[sameKey]) {
                    fn('border-' + prop, t);
                } else {
                    fn('border-top-' + prop, t);
                    fn('border-right-' + prop, r);
                    fn('border-bottom-' + prop, b);
                    fn('border-left-' + prop, l);
                }
            }
        }

        borderFour('style', 'border_style_same', 'border_style_top', 'border_style_right', 'border_style_bottom', 'border_style_left');
        borderFour('width', 'border_width_same', 'border_width_top', 'border_width_right', 'border_width_bottom', 'border_width_left');
        borderFour('color', 'border_color_same', 'border_color_top', 'border_color_right', 'border_color_bottom', 'border_color_left', true);

        // ── List ─────────────────────────────────────────────────────────────────
        set('list-style-type', data.list_style_type);
        set('list-style-position', data.list_style_position);

        if (data.list_style_image) {
            styles['list-style-image'] = 'url(' + data.list_style_image + ')';
        }

        // ── Positioning ──────────────────────────────────────────────────────────
        set('position', data.position);
        set('visibility', data.visibility);
        set('z-index', data.z_index);
        set('overflow', data.overflow);

        var pt = data.placement_top, pr = data.placement_right,
            pb = data.placement_bottom, pl = data.placement_left;

        if (pt || pr || pb || pl) {
            if (data.placement_same) {
                set('top', pt); set('right', pt); set('bottom', pt); set('left', pt);
            } else {
                set('top', pt); set('right', pr); set('bottom', pb); set('left', pl);
            }
        }

        var ct = data.clip_top, cr = data.clip_right,
            cb = data.clip_bottom, cl = data.clip_left;

        if (ct || cr || cb || cl) {
            if (data.clip_same) {
                cr = ct; cb = ct; cl = ct;
            }
            ct = ct || 'auto'; cr = cr || 'auto'; cb = cb || 'auto'; cl = cl || 'auto';

            if (ct !== 'auto' || cr !== 'auto' || cb !== 'auto' || cl !== 'auto') {
                styles['clip'] = 'rect(' + ct + ' ' + cr + ' ' + cb + ' ' + cl + ')';
            }
        }

        return styles;
    }

    /**
     * @package     JCE
     * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
     * @license     GNU General Public License version 2 or later; see LICENSE.txt
     */

    var DOM$1 = tinymce.DOM,
        Event$1 = tinymce.dom.Event,
        Dispatcher = tinymce.util.Dispatcher,
        each$1 = tinymce.each,
        extend = tinymce.extend;

    /**
     * A compound control combining a text input with a unit <select>.
     * Returns/accepts a full CSS measurement string: "10px", "2em", "auto", etc.
     *
     * @class tinymce.ui.MeasurementBox
     * @extends tinymce.ui.Control
     */
    tinymce.create('tinymce.ui.MeasurementBox:tinymce.ui.Control', {

        MeasurementBox: function (id, s, ed) {
            s = extend({
                'class': '',
                units: ['px', 'em', 'rem', '%', 'pt', 'cm', 'mm', 'in', 'ex', 'vh', 'vw'],
                default_unit: 'px'
            }, s);

            this._super(id, s, ed);

            this.onChange = new Dispatcher(this);
            this.onPostRender = new Dispatcher(this);
            this.classPrefix = 'mceMeasurementBox';
        },

        // Parse "10px" → {num:"10", unit:"px"};  keyword → {num:"auto", unit:""}
        _parse: function (val) {
            if (!val) {
                return { num: '', unit: this.settings.default_unit };
            }
            var m = /^(-?[0-9.]+)(.*)$/.exec(val);

            if (m) {
                return { num: m[1], unit: m[2] || this.settings.default_unit };
            }

            return { num: val, unit: '' };
        },

        value: function (val) {
            if (!arguments.length) {
                var num = DOM$1.getValue(this.id) || '';
                var unit = DOM$1.getValue(this.id + '_unit') || '';

                if (!num) {
                    return '';
                }

                return /^-?[0-9.]/.test(num) ? num + unit : num;
            }

            var p = this._parse(val);
            DOM$1.setValue(this.id, p.num);
            DOM$1.setValue(this.id + '_unit', p.unit);
        },

        renderHTML: function () {
            var s = this.settings, prefix = this.classPrefix;

            var inputAttribs = {
                type: 'text',
                id: this.id,
                'class': 'mceTextBox ' + prefix + 'Input ' + (s['class'] || ''),
                tabindex: 0
            };

            if (s.attributes) {
                inputAttribs = extend(inputAttribs, s.attributes);
            }

            var html = DOM$1.createHTML('input', inputAttribs);

            var sel = '<select id="' + this.id + '_unit" class="' + prefix + 'Unit" tabindex="0">';
            sel += '<option value=""></option>';
            each$1(s.units, function (unit) {
                sel += '<option value="' + unit + '">' + unit + '</option>';
            });
            sel += '</select>';

            return DOM$1.createHTML('span', { 'class': prefix }, html + sel);
        },

        postRender: function () {
            var self = this, s = this.settings;

            if (typeof s.value !== 'undefined') {
                this.value(s.value);
            }

            if (s.onchange && typeof s.onchange === 'function') {
                this.onChange.add(s.onchange);
            }

            Event$1.add(this.id, 'change', function () {
                self.onChange.dispatch(self, DOM$1.get(self.id));
            });

            Event$1.add(this.id + '_unit', 'change', function () {
                self.onChange.dispatch(self, DOM$1.get(self.id));
            });

            this.onPostRender.dispatch(this, DOM$1.get(this.id));
        },

        setDisabled: function (state) {
            this._super(state);
            var el = DOM$1.get(this.id), sel = DOM$1.get(this.id + '_unit');

            if (el) {
                el.disabled = state;
            }

            if (sel) {
                sel.disabled = state;
            }
        },

        destroy: function () {
            this._super();
            Event$1.clear(this.id);
            Event$1.clear(this.id + '_unit');
        }
    });

    /**
     * Factory method on ControlManager — creates a MeasurementBox and registers
     * it with the editor's control registry.
     */
    tinymce.ControlManager.prototype.createMeasurementBox = function (id, s) {
        var self = this, ed = self.editor, c;

        id = self.prefix + id;
        c = self.get(id);

        if (c) {
            return c;
        }

        s.label = ed.translate(s.label);
        s.scope = s.scope || ed;
        s = extend({ 'class': 'mce_' + id, scope: s.scope, control_manager: self }, s);

        c = new tinymce.ui.MeasurementBox(id, s, ed);
        return self.add(c);
    };

    /**
     * @package     JCE
     * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
     * @license     GNU General Public License version 2 or later; see LICENSE.txt
     */


    var DOM = tinymce.DOM,
        Event = tinymce.dom.Event,
        each = tinymce.each;

    var UNITS = ['px', 'em', 'rem', '%', 'pt', 'cm', 'mm', 'in', 'ex', 'vh', 'vw'];
    var BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];

    function showStyleDialog(ed) {
        var cm = ed.controlManager;

        // ── Control helpers ──────────────────────────────────────────────────────

        function listBox(id, name, label, values) {
            var ctrl = cm.createListBox(id, {
                label: ed.getLang('style.' + label, label),
                name: name,
                onselect: function () { }
            });

            ctrl.add('', '');

            each(values, function (v) {
                var title = typeof v === 'object' ? v.title : v;
                var value = typeof v === 'object' ? v.value : v;
                ctrl.add(title, value);
            });

            return ctrl;
        }

        function measureBox(id, name, label, defaultUnit) {
            return cm.createMeasurementBox(id, {
                label: ed.getLang('style.' + label, label),
                name: name,
                units: UNITS,
                default_unit: defaultUnit || 'px'
            });
        }

        // Four-sided group: "Same for all" checkbox + top/right/bottom/left controls.
        function fourSides(prefix, makeCtrl) {
            var topCtrl = makeCtrl('style_' + prefix + '_top', prefix + '_top', 'Top');
            var rightCtrl = makeCtrl('style_' + prefix + '_right', prefix + '_right', 'Right');
            var bottomCtrl = makeCtrl('style_' + prefix + '_bottom', prefix + '_bottom', 'Bottom');
            var leftCtrl = makeCtrl('style_' + prefix + '_left', prefix + '_left', 'Left');

            var sameCtrl = cm.createCheckBox('style_' + prefix + '_same', {
                label: ed.getLang('style.same', 'Same for all'),
                name: prefix + '_same',
                onchange: function () {
                    var same = this.value();

                    console.log(rightCtrl);

                    rightCtrl.setDisabled(same);
                    bottomCtrl.setDisabled(same);
                    leftCtrl.setDisabled(same);
                }
            });

            return { same: sameCtrl, top: topCtrl, right: rightCtrl, bottom: bottomCtrl, left: leftCtrl };
        }

        function addFourToForm(form, group) {
            form.add(group.same);
            form.add(group.top);
            form.add(group.right);
            form.add(group.bottom);
            form.add(group.left);
        }

        // ── Tab 1: Text ──────────────────────────────────────────────────────────
        var textForm = cm.createForm('style_text_form');

        textForm.add(cm.createTextBox('style_font_family', {
            label: ed.getLang('style.font_family', 'Font Family'),
            name: 'font_family'
        }));

        textForm.add(measureBox('style_font_size', 'font_size', 'Font Size'));

        textForm.add(listBox('style_font_weight', 'font_weight', 'Font Weight',
            ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900']));

        textForm.add(listBox('style_font_style', 'font_style', 'Font Style', ['normal', 'italic', 'oblique']));

        textForm.add(listBox('style_font_variant', 'font_variant', 'Font Variant', ['normal', 'small-caps']));

        textForm.add(listBox('style_text_transform', 'text_transform', 'Text Case',
            ['none', 'capitalize', 'uppercase', 'lowercase']));

        textForm.add(measureBox('style_line_height', 'line_height', 'Line Height', 'em'));

        var textDecUnderline = cm.createCheckBox('style_text_dec_underline', { label: ed.getLang('style.underline', 'Underline'), name: 'text_dec_underline' });
        var textDecOverline = cm.createCheckBox('style_text_dec_overline', { label: ed.getLang('style.overline', 'Overline'), name: 'text_dec_overline' });
        var textDecLinethrough = cm.createCheckBox('style_text_dec_linethrough', { label: ed.getLang('style.linethrough', 'Line Through'), name: 'text_dec_linethrough' });
        var textDecBlink = cm.createCheckBox('style_text_dec_blink', { label: ed.getLang('style.blink', 'Blink'), name: 'text_dec_blink' });
        var textDecNone = cm.createCheckBox('style_text_dec_none', { label: ed.getLang('style.none', 'None'), name: 'text_dec_none' });

        textForm.add(cm.createTextBox('style_color', {
            label: ed.getLang('style.color', 'Color'),
            name: 'color',
            subtype: 'color',
            onchange: function () {
                var isNone = this.value();

                textDecUnderline.setDisabled(isNone);
                textDecOverline.setDisabled(isNone);
                textDecLinethrough.setDisabled(isNone);
                textDecBlink.setDisabled(isNone);
            }
        }));
        
        var textDecorationForm = cm.createForm('style_text_decoration_form', {
            class: 'mceGridLayout'
        });

        each([textDecUnderline, textDecOverline, textDecLinethrough, textDecBlink, textDecNone], function (c) {
            textDecorationForm.add(c);
        });

        var textDecorationLayout = cm.createLayout('style_text_decoration_layout', {
            label: ed.getLang('style.decoration', 'Decoration')
        });

        textDecorationLayout.add(textDecorationForm);

        textForm.add(textDecorationLayout);

        // ── Tab 2: Background ────────────────────────────────────────────────────
        var bgForm = cm.createForm('style_bg_form');

        bgForm.add(cm.createTextBox('style_bg_color', {
            label: ed.getLang('style.background_color', 'Background Color'),
            name: 'background_color',
            subtype: 'color'
        }));

        var bgImageCtrl = cm.createUrlBox('style_bg_image', {
            label: ed.getLang('style.background_image', 'Background Image'),
            name: 'background_image',
            clear: true,
            picker: !!ed.getParam('style_file_browser', true),
            picker_label: 'browse',
            picker_icon: 'image',
            onpick: function () {
                ed.execCommand('mceFileBrowser', true, {
                    caller: 'style',
                    callback: function (selected, data) {
                        if (data && data.length) {
                            bgImageCtrl.value(data[0].url);
                        }
                    },
                    filter: 'images',
                    value: bgImageCtrl.value()
                });
            }
        });

        bgForm.add(bgImageCtrl);

        bgForm.add(listBox('style_bg_repeat', 'background_repeat', 'Repeat', ['no-repeat', 'repeat', 'repeat-x', 'repeat-y']));

        bgForm.add(listBox('style_bg_attachment', 'background_attachment', 'Attachment', ['fixed', 'scroll']));

        bgForm.add(cm.createTextBox('style_bg_pos_h', {
            label: ed.getLang('style.background_position_h', 'Horizontal Position'),
            name: 'background_position_h'
        }));

        bgForm.add(cm.createTextBox('style_bg_pos_v', {
            label: ed.getLang('style.background_position_v', 'Vertical Position'),
            name: 'background_position_v'
        }));

        // ── Tab 3: Block ─────────────────────────────────────────────────────────
        var blockForm = cm.createForm('style_block_form');

        blockForm.add(measureBox('style_word_spacing', 'word_spacing', 'Word Spacing', 'em'));

        blockForm.add(measureBox('style_letter_spacing', 'letter_spacing', 'Letter Spacing', 'em'));

        blockForm.add(listBox('style_vertical_align', 'vertical_align', 'Vertical Alignment',
            ['baseline', 'sub', 'super', 'top', 'text-top', 'middle', 'bottom', 'text-bottom']));

        blockForm.add(listBox('style_text_align', 'text_align', 'Text Align', ['left', 'right', 'center', 'justify']));

        blockForm.add(measureBox('style_text_indent', 'text_indent', 'Text Indent'));

        blockForm.add(listBox('style_white_space', 'white_space', 'Whitespace',
            ['normal', 'pre', 'pre-wrap', 'pre-line', 'nowrap']));

        blockForm.add(listBox('style_display', 'display', 'Display',
            ['inline', 'block', 'inline-block', 'list-item', 'none', 'table', 'inline-table', 'table-cell', 'flex', 'grid']));

        // ── Tab 4: Box ───────────────────────────────────────────────────────────
        var boxStyleForm = cm.createForm('style_box_form');

        boxStyleForm.add(measureBox('style_width', 'width', 'Width'));
        boxStyleForm.add(measureBox('style_height', 'height', 'Height'));
        boxStyleForm.add(listBox('style_float', 'float', 'Float', ['none', 'left', 'right']));
        boxStyleForm.add(listBox('style_clear', 'clear', 'Clear', ['none', 'left', 'right', 'both']));

        var boxPaddingForm = cm.createForm('style_box_padding_form', {
            label: ed.getLang('style.box_padding', 'Box Padding')
        });

        var padding = fourSides('padding', function (id, name, label) {
            return measureBox(id, name, label);
        });

        addFourToForm(boxPaddingForm, padding);

        var boxMarginForm = cm.createForm('style_box_margin_form', {
            label: ed.getLang('style.box_margin', 'Box Margin')
        });

        var margin = fourSides('margin', function (id, name, label) {
            return measureBox(id, name, label);
        });

        addFourToForm(boxMarginForm, margin);

        var boxSpacingLayout = cm.createLayout('style_box_spacing_layout', {
            class: 'mceGridLayout'
        });

        boxSpacingLayout.add(boxPaddingForm);
        boxSpacingLayout.add(boxMarginForm);

        // ── Tab 5: Border ────────────────────────────────────────────────────────
        var borderStyleForm = cm.createForm('border_style_form', {
            label: ed.getLang('style.border_style', 'Border Style')
        });

        var borderStyle = fourSides('border_style', function (id, name, label) {
            return listBox(id, name, label, BORDER_STYLES);
        });

        addFourToForm(borderStyleForm, borderStyle);

        var borderWidthForm = cm.createForm('border_width_form', {
            label: ed.getLang('style.border_width', 'Border Width')
        });

        var borderWidth = fourSides('border_width', function (id, name, label) {
            return measureBox(id, name, label);
        });

        addFourToForm(borderWidthForm, borderWidth);

        var borderColorForm = cm.createForm('border_color_form', {
            label: ed.getLang('style.border_color', 'Border Color')
        });

        var borderColor = fourSides('border_color', function (id, name, label) {
            return cm.createTextBox(id, {
                label: ed.getLang('style.' + label, label),
                name: name,
                subtype: 'color'
            });
        });

        addFourToForm(borderColorForm, borderColor);

        // ── Tab 6: List ──────────────────────────────────────────────────────────
        var listForm = cm.createForm('style_list_form');

        listForm.add(listBox('style_list_type', 'list_style_type', 'List Type',
            ['disc', 'circle', 'square', 'decimal', 'lower-roman', 'upper-roman', 'lower-alpha', 'upper-alpha', 'none']));
        listForm.add(listBox('style_list_position', 'list_style_position', 'Position', ['inside', 'outside']));

        var listImageCtrl = cm.createUrlBox('style_list_image', {
            label: ed.getLang('style.list_style_image', 'Bullet Image'),
            name: 'list_style_image',
            clear: true,
            picker: !!ed.getParam('style_file_browser', true),
            picker_label: 'browse',
            picker_icon: 'image',
            onpick: function () {
                ed.execCommand('mceFileBrowser', true, {
                    caller: 'style',
                    callback: function (selected, data) {
                        if (data && data.length) {
                            listImageCtrl.value(data[0].url);
                        }
                    },
                    filter: 'images',
                    value: listImageCtrl.value()
                });
            }
        });

        listForm.add(listImageCtrl);

        // ── Tab 7: Positioning ───────────────────────────────────────────────────
        var posForm = cm.createForm('style_pos_form');

        posForm.add(listBox('style_position', 'position', 'Position', ['static', 'relative', 'absolute', 'fixed']));

        posForm.add(listBox('style_visibility', 'visibility', 'Visibility', ['visible', 'hidden', 'inherit']));

        posForm.add(measureBox('style_pos_width', 'width', 'Width'));

        posForm.add(measureBox('style_pos_height', 'height', 'Height'));

        posForm.add(cm.createTextBox('style_z_index', {
            label: ed.getLang('style.z_index', 'Z-Index'),
            name: 'z_index',
            subtype: 'number'
        }));

        posForm.add(listBox('style_overflow', 'overflow', 'Overflow', ['visible', 'hidden', 'scroll', 'auto']));

        var placement = fourSides('placement', function (id, name, label) {
            return measureBox(id, name, label);
        });

        addFourToForm(posForm, placement);

        var clip = fourSides('clip', function (id, name, label) {
            return measureBox(id, name, label);
        });

        addFourToForm(posForm, clip);

        // ── Tabs ─────────────────────────────────────────────────────────────────
        var tabs = cm.createTabs('style_tabs');
        tabs.add({ id: 'style_tab_text', title: ed.getLang('style.tab_text', 'Text'), items: [textForm] });
        tabs.add({ id: 'style_tab_bg', title: ed.getLang('style.tab_background', 'Background'), items: [bgForm] });
        tabs.add({ id: 'style_tab_block', title: ed.getLang('style.tab_block', 'Block'), items: [blockForm] });
        tabs.add({ id: 'style_tab_box', title: ed.getLang('style.tab_box', 'Box'), items: [
            boxStyleForm,
            boxSpacingLayout
        ] });

        tabs.add({ id: 'style_tab_border', title: ed.getLang('style.tab_border', 'Border'), class: 'mceGridLayout', items: [
            borderStyleForm,
            borderWidthForm,
            borderColorForm
        ] });

        tabs.add({ id: 'style_tab_list', title: ed.getLang('style.tab_list', 'List'), items: [listForm] });
        tabs.add({ id: 'style_tab_pos', title: ed.getLang('style.tab_positioning', 'Positioning'), items: [posForm] });

        // ── Apply / collect helpers ───────────────────────────────────────────────
        var applyActionIsInsert = ed.getParam('edit_css_style_insert_span', false);
        var existingStyles = {};

        function collectStyles() {
            return dataToStyles(tabs.submit());
        }

        function applyStyles(newStyles) {
            if (applyActionIsInsert) {
                ed.formatter.register('plugin_style', { inline: 'span', styles: existingStyles });
                ed.formatter.remove('plugin_style');
                ed.formatter.register('plugin_style', { inline: 'span', styles: newStyles });
                ed.formatter.apply('plugin_style');
            } else {
                var applyToBlocks = ed.selection.getSelectedBlocks().length > 1;
                var nodes = applyToBlocks ? ed.selection.getSelectedBlocks() : ed.selection.getNode();
                ed.dom.setAttrib(nodes, 'style', ed.dom.serializeStyle(newStyles));
            }
            ed.undoManager.add();
            ed.nodeChanged();
        }

        // ── Open dialog ───────────────────────────────────────────────────────────
        ed.windowManager.open({
            title: ed.getLang('style.desc', 'CSS Style Properties'),
            items: [tabs],
            size: 'mce-modal-landscape-xlarge',
            close: function () {
                tabs.destroy();
            },
            open: function () {
                var self = this;

                // Gather existing styles from the current selection
                var blocks = ed.selection.getSelectedBlocks();

                if (blocks.length === 1) {
                    existingStyles = ed.dom.parseStyle(ed.selection.getNode().style.cssText);
                } else if (blocks.length > 1) {
                    existingStyles = {};
                    each(blocks, function (block) {
                        var parsed = ed.dom.parseStyle(ed.dom.getAttrib(block, 'style'));
                        each(parsed, function (val, key) {
                            if (!existingStyles[key]) {
                                existingStyles[key] = val;
                            }
                        });
                    });
                }

                var data = stylesToData(existingStyles, ed);
                tabs.update(data);

                // Re-sync disabled states for "same" groups after populate
                each([
                    [padding, data.padding_same],
                    [margin, data.margin_same],
                    [borderStyle, data.border_style_same],
                    [borderWidth, data.border_width_same],
                    [borderColor, data.border_color_same],
                    [placement, data.placement_same],
                    [clip, data.clip_same]
                ], function (pair) {
                    if (pair[1]) {
                        pair[0].right.setDisabled(true);
                        pair[0].bottom.setDisabled(true);
                        pair[0].left.setDisabled(true);
                    }
                });

                if (data.text_dec_none) {
                    textDecUnderline.setDisabled(true);
                    textDecOverline.setDisabled(true);
                    textDecLinethrough.setDisabled(true);
                    textDecBlink.setDisabled(true);
                }

                // "Apply as <span>" toggle in dialog footer
                var spanId = self.id + '_insert_span';

                var modalFooter = DOM.get(self.id + '_footer');
                var insertSpan = DOM.create('label', { 'class': 'mceStyleInsertSpan', 'for': spanId },
                    '<input type="checkbox" id="' + spanId + '"' + (applyActionIsInsert ? ' checked' : '') + '> ' +
                    ed.getLang('style.toggle_insert_span', 'Apply as &lt;span&gt;'));

                DOM.insertBefore(insertSpan, modalFooter.firstChild);

                Event.add(spanId, 'change', function () {
                    applyActionIsInsert = !!this.checked;
                });
            },
            buttons: [
                {
                    title: ed.getLang('common.cancel', 'Cancel'),
                    id: 'cancel'
                },
                {
                    title: ed.getLang('style.apply', 'Apply'),
                    id: 'apply',
                    onclick: function () {
                        applyStyles(collectStyles());
                    }
                },
                {
                    title: ed.getLang('update', 'Update'),
                    id: 'insert',
                    classes: 'primary',
                    onsubmit: function () {
                        applyStyles(collectStyles());
                    }
                }
            ]
        });
    }

    /**
     * @package     JCE
     * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
     * @license     GNU General Public License version 2 or later; see LICENSE.txt
     */


    tinymce.PluginManager.add('style', function (ed, url) {
        var isMobile = window.matchMedia('(max-width: 600px)').matches;

        if (isMobile) {
            return;
        }

        function isRootNode(node) {
            return node === ed.dom.getRoot();
        }

        ed.addCommand('mceStyleProps', function () {
            showStyleDialog(ed);
        });

        ed.addCommand('mceSetElementStyle', function (ui, v) {
            var node = ed.selection.getNode();
            if (node) {
                ed.dom.setAttrib(node, 'style', v);
                ed.execCommand('mceRepaint');
            }
        });

        ed.onNodeChange.add(function (ed, cm, n) {
            cm.setDisabled('style', isRootNode(n) || n.hasAttribute('data-mce-bogus'));
        });

        ed.addButton('style', {
            title: 'style.desc',
            cmd: 'mceStyleProps'
        });
    });

})();
