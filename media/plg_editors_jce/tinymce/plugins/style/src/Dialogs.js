/**
 * @package     JCE
 * @copyright   Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

import { stylesToData, dataToStyles } from './CssUtils.js';
import './MeasurementBox.js';

var DOM = tinymce.DOM,
    Event = tinymce.dom.Event,
    each = tinymce.each;

var UNITS = ['px', 'em', 'rem', '%', 'pt', 'cm', 'mm', 'in', 'ex', 'vh', 'vw'];
var BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];

export function showStyleDialog(ed) {
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
        colorpicker: function () {
            var self = this, value = self.value();
            var btn = DOM.get(this.id + '_color');

            ed.settings.color_picker_callback(function (color) {
                self.value(color);
                btn.style.backgroundColor = color;
            }, value);
        },
        onchange: function () {
            var isNone = this.value();

            textDecUnderline.setDisabled(isNone);
            textDecOverline.setDisabled(isNone);
            textDecLinethrough.setDisabled(isNone);
            textDecBlink.setDisabled(isNone);
        }
    }));

    var textDecorationForm = cm.createForm('style_text_decoration_form', {
        class: 'mceFlexWidth25'
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
        subtype: 'color',
        colorpicker: function () {
            var self = this, value = self.value();
            var btn = DOM.get(this.id + '_color');

            ed.settings.color_picker_callback(function (color) {
                self.value(color);
                btn.style.backgroundColor = color;
            }, value);
        }
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
            subtype: 'color',
            colorpicker: function () {
                var self = this, value = self.value();
                var btn = DOM.get(this.id + '_color');

                ed.settings.color_picker_callback(function (color) {
                    self.value(color);
                    btn.style.backgroundColor = color;
                }, value);
            }
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

    var placementForm = cm.createForm('style_placement_form', {
        label: ed.getLang('style.placement', 'Placement')
    });

    var placement = fourSides('placement', function (id, name, label) {
        return measureBox(id, name, label);
    });

    addFourToForm(placementForm, placement);

    var clipForm = cm.createForm('style_clip_form', {
        label: ed.getLang('style.clip', 'Clip')
    });

    var clip = fourSides('clip', function (id, name, label) {
        return measureBox(id, name, label);
    });

    addFourToForm(clipForm, clip);

    var posLayout = cm.createLayout('style_position_layout', {
        class: 'mceGridLayout'
    });

    posLayout.add(placementForm);
    posLayout.add(clipForm);

    // ── Tabs ─────────────────────────────────────────────────────────────────
    var tabs = cm.createTabs('style_tabs');
    tabs.add({ id: 'style_tab_text', title: ed.getLang('style.tab_text', 'Text'), items: [textForm] });
    tabs.add({ id: 'style_tab_bg', title: ed.getLang('style.tab_background', 'Background'), items: [bgForm] });
    tabs.add({ id: 'style_tab_block', title: ed.getLang('style.tab_block', 'Block'), items: [blockForm] });
    tabs.add({
        id: 'style_tab_box', title: ed.getLang('style.tab_box', 'Box'), items: [
            boxStyleForm,
            boxSpacingLayout
        ]
    });

    tabs.add({
        id: 'style_tab_border', title: ed.getLang('style.tab_border', 'Border'), class: 'mceGridLayout', items: [
            borderStyleForm,
            borderWidthForm,
            borderColorForm
        ]
    });

    tabs.add({ id: 'style_tab_list', title: ed.getLang('style.tab_list', 'List'), items: [listForm] });
    tabs.add({
        id: 'style_tab_pos', title: ed.getLang('style.tab_positioning', 'Positioning'), items: [
            posForm,
            posLayout
        ]
    });

    // ── Apply / collect helpers ───────────────────────────────────────────────
    var applyActionIsInsert = ed.getParam('style_insert_span', false);
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

            console.log(nodes, ed.dom.serializeStyle(newStyles));

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
