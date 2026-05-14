/**
 * Copyright (c) 2009–2026 Ryan Demmer. All rights reserved.
 * Licensed under the GNU General Public License version 2 or later (GPL v2+):
 * https://www.gnu.org/licenses/gpl-2.0.html
 */


import { languageValues } from './Languages.js';

var DOM = ibis.DOM,
    each = ibis.each;

export function createIdCtrl(cm, prefix, ed, value) {
    return cm.createTextBox(prefix + '_id', {
        label: ed.getLang('table.id', 'ID'),
        name: 'id',
        value: value || ''
    });
}

export function createStyleCtrl(cm, prefix, ed, value) {
    return cm.createTextBox(prefix + '_style', {
        label: ed.getLang('table.style', 'Style'),
        name: 'style',
        value: value || ''
    });
}

export function createLangListCtrl(cm, prefix, ed) {
    var ctrl = cm.createListBox(prefix + '_lang', {
        label: ed.getLang('attributes.label_lang', 'Language'),
        onselect: function () { },
        name: 'lang',
        filter: true
    });

    ctrl.add('--', '');

    each(languageValues, function (value, name) {
        ctrl.add(name, value);
    });

    return ctrl;
}

export function createDirListCtrl(cm, prefix, ed) {
    var ctrl = cm.createListBox(prefix + '_dir', {
        label: ed.getLang('attributes.label_dir', 'Text Direction'),
        onselect: function () { },
        name: 'dir'
    });

    ctrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each(['ltr', 'rtl'], function (value) {
        ctrl.add(ed.getLang('attributes.label_dir_' + value, value), value);
    });

    return ctrl;
}

export function createClassesCtrl(cm, prefix, ed) {
    return cm.createStylesBox(prefix + '_classes', {
        label: ed.getLang('table.classes', 'Classes'),
        onselect: function () { },
        name: 'classes',
        styles: ed.getParam('table_classes_custom', [])
    });
}

export function createAlignCtrl(cm, prefix, ed) {
    var ctrl = cm.createListBox(prefix + '_align', {
        label: ed.getLang('table.align', 'Alignment'),
        name: 'align',
        onselect: function () { }
    });

    ctrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each(['left', 'center', 'right'], function (value) {
        ctrl.add(ed.getLang('table.align_' + value, value.charAt(0).toUpperCase() + value.slice(1)), value);
    });

    return ctrl;
}

export function createBackgroundColorCtrl(cm, prefix, ed, value) {
    var ctrl = cm.createTextBox(prefix + '_background_color', {
        label: ed.getLang('table.background_color', 'Background Color'),
        name: 'background_color',
        value: value || '',
        subtype: 'color',
        colorpicker: function () {
            var current = this.value();
            var btn = DOM.get(this.id + '_color');

            ed.settings.color_picker_callback(function (color) {
                ctrl.value(color);
                btn.style.backgroundColor = color;
            }, current);
        }
    });

    return ctrl;
}

export function createBackgroundImageCtrl(cm, prefix, ed) {
    var ctrl = cm.createUrlBox(prefix + '_background_image', {
        label: ed.getLang('table.background_image', 'Background Image'),
        name: 'background_image',
        value: '',
        clear: true,
        picker: true,
        picker_label: 'browse',
        picker_icon: 'image',
        onpick: function () {
            ed.execCommand('mceFileBrowser', true, {
                caller: 'imagepro',
                callback: function (selected, data) {
                    if (data.length) {
                        ctrl.value(data[0].url);

                        window.setTimeout(function () {
                            ctrl.focus();
                        }, 10);
                    }
                },
                filter: 'images',
                value: ctrl.value()
            });
        }
    });

    return ctrl;
}
