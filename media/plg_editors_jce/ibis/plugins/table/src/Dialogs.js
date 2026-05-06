/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

import { languageValues } from './Languages.js';
import { insertTableHtml, updateRows, updateCells } from './TableUtils.js';

var DOM = ibis.DOM,
    Event = ibis.dom.Event,
    each = ibis.each,
    extend = ibis.extend;

export function showTableDialog(ed, isBasicDialog) {
    var cm = ed.controlManager, tableForm = cm.createForm('table_std_form'), advancedForm = cm.createForm('table_advanced_form');

    var colsCtrl = cm.createTextBox('table_cols', {
        label: ed.getLang('table.cols', 'Columns'),
        name: 'cols',
        subtype: 'number',
        attributes: {
            step: 1,
            min: 1
        },
        value: ed.getParam('table_default_cols', 2)
    });

    tableForm.add(colsCtrl);

    var rowCtrl = cm.createTextBox('table_rows', {
        label: ed.getLang('table.rows', 'Rows'),
        name: 'rows',
        subtype: 'number',
        attributes: {
            step: 1,
            min: 1
        },
        value: ed.getParam('table_default_rows', 2)
    });

    tableForm.add(rowCtrl);

    var cellspacingCtrl = cm.createTextBox('table_cellspacing', {
        label: ed.getLang('table.cellspacing', 'Cell Spacing'),
        name: 'cellspacing',
        subtype: 'number',
        attributes: {
            step: 1,
            min: 1
        },
        value: ed.getParam('table_default_cellspacing', '')
    });

    tableForm.add(cellspacingCtrl);

    var cellpaddingCtrl = cm.createTextBox('table_cellpadding', {
        label: ed.getLang('table.cellpadding', 'Cell Padding'),
        name: 'cellpadding',
        subtype: 'number',
        attributes: {
            step: 1,
            min: 1
        },
        value: ed.getParam('table_default_cellpadding', '')
    });

    tableForm.add(cellpaddingCtrl);

    var widthCtrl = cm.createTextBox('table_width', {
        label: ed.getLang('table.width', 'Width'),
        name: 'width',
        value: ed.getParam('table_default_width', '')
    });

    tableForm.add(widthCtrl);

    var heightCtrl = cm.createTextBox('table_height', {
        label: ed.getLang('table.height', 'Height'),
        name: 'height',
        value: ed.getParam('table_default_height', '')
    });

    tableForm.add(heightCtrl);

    var stylesList = cm.createStylesBox('table_classes', {
        label: ed.getLang('table.classes', 'Classes'),
        onselect: function (v) { },
        name: 'classes',
        styles: ed.getParam('table_classes_custom', [])
    });

    tableForm.add(stylesList);

    var captionCtrl = cm.createCheckBox('table_caption', {
        label: ed.getLang('table.caption', 'Caption'),
        name: 'caption',
        label_position: 'before'
    });

    tableForm.add(captionCtrl);

    var idCtrl = cm.createTextBox('table_id', {
        label: ed.getLang('table.id', 'ID'),
        name: 'id',
        value: ed.getParam('table_default_id', '')
    });

    var summaryCtrl = cm.createTextBox('table_summary', {
        label: ed.getLang('table.summary', 'Summary'),
        name: 'summary',
        value: ed.getParam('table_default_summary', '')
    });

    var styleCtrl = cm.createTextBox('table_style', {
        label: ed.getLang('table.style', 'Style'),
        name: 'style',
        value: ed.getParam('table_default_style', '')
    });

    var langListCtrl = cm.createListBox('table_lang', {
        label: ed.getLang('attributes.label_lang', 'Language'),
        onselect: function (v) { },
        name: 'lang',
        filter: true
    });

    langListCtrl.add('--', '');

    each(languageValues, function (value, name) {
        langListCtrl.add(name, value);
    });

    var dirListCtrl = cm.createListBox('table_dir', {
        label: ed.getLang('attributes.label_dir', 'Text Direction'),
        onselect: function (v) { },
        name: 'dir'
    });

    dirListCtrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each(['ltr', 'rtl'], function (value) {
        dirListCtrl.add(ed.getLang('attributes.label_dir_' + value, value), value);
    });

    var frameCtrl = cm.createListBox('table_frame', {
        label: ed.getLang('table.frame', 'Frame'),
        onselect: function (v) { },
        name: 'frame'
    });

    frameCtrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each(['void', 'above', 'below', 'hsides', 'vsides', 'box', 'border'], function (value) {
        frameCtrl.add(ed.getLang('table.frame_' + value, value), value);
    });

    var rulesCtrl = cm.createListBox('table_rules', {
        label: ed.getLang('table.rules', 'Rules'),
        onselect: function (v) { },
        name: 'rules'
    });

    rulesCtrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each(['none', 'groups', 'rows', 'cols', 'all'], function (value) {
        rulesCtrl.add(ed.getLang('table.rules_' + value, value), value);
    });

    var backgroundImageCtrl = cm.createUrlBox('table_background_image', {
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
                        var src = data[0].url;
                        backgroundImageCtrl.value(src);

                        window.setTimeout(function () {
                            backgroundImageCtrl.focus();
                        }, 10);
                    }
                },
                filter: 'images',
                value: backgroundImageCtrl.value()
            });
        }
    });

    var backgroundColorCtrl = cm.createTextBox('table_background_color', {
        label: ed.getLang('table.background_color', 'Background Color'),
        name: 'background_color',
        value: ed.getParam('table_default_background_color', ''),
        subtype: 'color',
        colorpicker: function () {
            var value = this.value();
            var btn = DOM.get(this.id + '_color');

            ed.settings.color_picker_callback(function (color) {
                backgroundColorCtrl.value(color);

                btn.style.backgroundColor = color;

            }, value);
        }
    });

    advancedForm.add(idCtrl);
    advancedForm.add(summaryCtrl);
    advancedForm.add(styleCtrl);
    advancedForm.add(langListCtrl);
    advancedForm.add(dirListCtrl);
    advancedForm.add(frameCtrl);
    advancedForm.add(rulesCtrl);

    advancedForm.add(backgroundImageCtrl);
    advancedForm.add(backgroundColorCtrl);

    var tabs = cm.createTabs('table_tabs');

    tabs.add({
        id: 'table_tab',
        title: 'Table',
        items: [tableForm]
    });

    if (!isBasicDialog) {
        tabs.add({
            id: 'advanced_tab',
            title: 'Advanced',
            items: [advancedForm]
        });
    }

    // Register commands
    ed.addCommand('mceInsertTable', function () {
        ed.windowManager.open({
            title: ed.getLang('table.desc', 'Table'),
            items: [tabs],
            size: 'mce-modal-landscape-medium',
            open: function () {
                var label = ed.getLang('insert', 'Insert'), elm = ed.dom.getParent(ed.selection.getNode(), "table");

                var width, height, rows, cols, caption;

                var classes = ed.getParam('table_classes', '');

                classes.trim().split(' ').filter(function (cls) {
                    return cls.trim() !== '';
                });

                var data = {
                    classes: classes
                };

                if (elm) {
                    label = ed.getLang('update', 'Update');

                    var rowsAr = elm.rows, rows = rowsAr.length;
                    var cols = 0;

                    for (var i = 0; i < rows; i++) {
                        if (rowsAr[i].cells.length > cols) {
                            cols = rowsAr[i].cells.length;
                        }
                    }

                    caption = elm.getElementsByTagName('caption').length > 0;

                    var styles = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                    width = styles.width || elm.width || '';
                    height = styles.height || elm.height || '';

                    // remove px value from width and height
                    width = width.replace('px', '');
                    height = height.replace('px', '');

                    classes = ed.dom.getAttrib(elm, 'class');

                    // clean
                    classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                        return cls.trim() !== '';
                    });

                    var backgroundColor = styles['background-color'] || '';
                    var backgroundImage = styles['background-image'] || '';

                    // remove url() from backgroundImage
                    backgroundImage = backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

                    // remove them from styles and serialize
                    each(['background-color', 'background-image', 'width', 'height'], function (key) {
                        delete styles[key];
                    });

                    styles = ed.dom.serializeStyle(styles);

                    extend(data, {
                        cellspacing: elm.cellSpacing || '',
                        cellpadding: elm.cellPadding || '',
                        width: width,
                        height: height,
                        classes: classes,
                        caption: caption,
                        style: styles,
                        background_color: backgroundColor,
                        background_image: backgroundImage
                    });

                    window.setTimeout(function () {
                        rowCtrl.setDisabled(true);
                        colsCtrl.setDisabled(true);
                    }, 10);
                }

                tabs.update(data);

                DOM.setHTML(this.id + '_insert', label);
            },
            buttons: [
                {
                    title: ed.getLang('common.cancel', 'Cancel'),
                    id: 'cancel'
                },
                {
                    title: ed.getLang('insert', 'Insert'),
                    id: 'insert',
                    onsubmit: function (e) {
                        var data = tabs.submit();

                        // add px to width if it is an integer
                        if (data.width && !isNaN(data.width)) {
                            data.width += 'px';
                        }

                        // add px to height if it is an integer
                        if (data.height && !isNaN(data.height)) {
                            data.height += 'px';
                        }

                        var args = {
                            cellspacing: data.cellspacing,
                            cellpadding: data.cellpadding,
                            style: {
                                width: data.width,
                                height: data.height
                            },
                            class: data.classes
                        };

                        if (data.background_color) {
                            args.style.backgroundColor = data.background_color;
                        }

                        if (data.background_image) {
                            args.style.backgroundImage = 'url(' + data.background_image + ')';
                        }

                        var elm = ed.dom.getParent(ed.selection.getNode(), "table");

                        if (elm) {
                            var styles = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                            extend(styles, args.style);

                            args.style = ed.dom.serializeStyle(styles);

                            ed.dom.setAttribs(elm, args);

                            if (data.caption) {
                                if (!elm.getElementsByTagName('caption').length) {
                                    var capEl = elm.ownerDocument.createElement('caption');
                                    capEl.innerHTML = '<br data-mce-bogus="1"/>';

                                    elm.insertBefore(capEl, elm.firstChild);
                                }
                            } else {
                                var caption = elm.getElementsByTagName('caption');

                                if (caption.length) {
                                    elm.removeChild(caption[0]);
                                }
                            }

                        } else {
                            var html = '';

                            if (data.caption) {
                                html += '<caption><br data-mce-bogus="1" /></caption>';
                            }

                            for (var y = 0; y < data.rows; y++) {
                                html += "<tr>";

                                for (var x = 0; x < data.cols; x++) {
                                    html += '<td>&nbsp;</td>';
                                }
                                html += "</tr>";
                            }

                            args.style = ed.dom.serializeStyle(args.style);

                            var tableHTML = ed.dom.createHTML('table', args, html);

                            insertTableHtml(ed, tableHTML);
                        }

                        ed.addVisual();

                        Event.cancel(e);
                    },
                    classes: 'primary',
                    scope: self
                }
            ]
        });
    });
}

export function showRowDialog(ed, isBasicDialog) {
    var cm = ed.controlManager, form = cm.createForm('table_row_form'), advancedForm = cm.createForm('table_row_advanced_form');

    var rowtypeCtrl = cm.createListBox('table_row_type', {
        label: ed.getLang('table.rowtype', 'Row Type'),
        name: 'rowtype',
        onselect: function () { }
    });

    var items = [
        { title: ed.getLang('table.thead', 'Header'), value: 'thead' },
        { title: ed.getLang('table.tbody', 'Body'), value: 'tbody' },
        { title: ed.getLang('table.tfoot', 'Footer'), value: 'tfoot' }
    ];

    each(items, function (item) {
        rowtypeCtrl.add(item.title, item.value);
    });

    form.add(rowtypeCtrl);

    var heightCtrl = cm.createTextBox('table_row_height', {
        label: ed.getLang('table.height', 'Height'),
        name: 'height'
    });

    form.add(heightCtrl);

    var stylesList = cm.createStylesBox('table_row_classes', {
        label: ed.getLang('table.classes', 'Classes'),
        onselect: function (v) { },
        name: 'classes',
        styles: ed.getParam('table_classes_custom', [])
    });

    form.add(stylesList);

    var idCtrl = cm.createTextBox('table_row_id', {
        label: ed.getLang('table.id', 'ID'),
        name: 'id'
    });

    var langListCtrl = cm.createListBox('table_row_lang', {
        label: ed.getLang('attributes.label_lang', 'Language'),
        onselect: function (v) { },
        name: 'lang',
        filter: true
    });

    langListCtrl.add('--', '');

    each(languageValues, function (value, name) {
        langListCtrl.add(name, value);
    });

    var dirListCtrl = cm.createListBox('table_row_dir', {
        label: ed.getLang('attributes.label_dir', 'Text Direction'),
        onselect: function (v) { },
        name: 'dir'
    });

    dirListCtrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each(['ltr', 'rtl'], function (value) {
        dirListCtrl.add(ed.getLang('attributes.label_dir_' + value, value), value);
    });

    advancedForm.add(idCtrl);
    advancedForm.add(langListCtrl);
    advancedForm.add(dirListCtrl);

    var tabs = cm.createTabs('table_row_tabs');

    tabs.add({
        id: 'table_row_tab',
        title: ed.getLang('table.row_desc', 'Row'),
        items: [form]
    });

    if (!isBasicDialog) {
        tabs.add({
            id: 'table_row_advanced_tab',
            title: ed.getLang('table.advanced', 'Advanced'),
            items: [advancedForm]
        });
    }

    // Register commands
    ed.addCommand('mceTableRowProps', function () {
        ed.windowManager.open({
            title: ed.getLang('table.row_desc', 'Table Rows'),
            items: [tabs],
            size: 'mce-modal-landscape-small',
            open: function () {
                var label = ed.getLang('insert', 'Insert'), elm = ed.dom.getParent(ed.selection.getStart(), "tr");

                // Get table row data
                var rowtype = elm.parentNode.nodeName.toLowerCase(), height = '';

                if (elm) {
                    label = ed.getLang('update', 'Update');
                    height = elm.style.height || elm.height || '';
                }

                // remove px from height
                if (height.indexOf('px') !== -1) {
                    height = height.replace('px', '');
                }

                var classes = ed.dom.getAttrib(elm, 'class');

                // clean
                classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                    return cls.trim() !== '';
                });

                tabs.update({
                    rowtype: rowtype,
                    height: height,
                    classes: classes,
                    id: ed.dom.getAttrib(elm, 'id') || '',
                    lang: ed.dom.getAttrib(elm, 'lang') || '',
                    dir: ed.dom.getAttrib(elm, 'dir') || ''
                });

                DOM.setHTML(this.id + '_insert', label);
            },
            buttons: [
                {
                    title: ed.getLang('common.cancel', 'Cancel'),
                    id: 'cancel'
                },
                {
                    title: ed.getLang('insert', 'Insert'),
                    id: 'insert',
                    onsubmit: function (e) {
                        var data = tabs.submit();

                        var elm = ed.dom.getParent(ed.selection.getStart(), "tr");
                        var selected = ed.dom.select('td.mceSelected,th.mceSelected', elm);

                        data.action = selected.length ? 'all' : 'insert';

                        data.style = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                        // add px to height if it is an integer
                        if (data.height && !isNaN(data.height)) {
                            data.height += 'px';
                        }

                        data.style.height = data.height;

                        // Apply advanced attributes before updateRows so they are
                        // preserved if the row is cloned during a rowtype change
                        ed.dom.setAttrib(elm, 'id', data.id || '');
                        ed.dom.setAttrib(elm, 'lang', data.lang || '');
                        ed.dom.setAttrib(elm, 'dir', data.dir || '');

                        var args = {
                            style: ed.dom.serializeStyle(data.style),
                            rowtype: data.rowtype,
                            action: data.action,
                            class: data.classes
                        };

                        updateRows(ed, args);

                        Event.cancel(e);
                    },
                    classes: 'primary',
                    scope: self
                }
            ]
        });
    });
}

export function showCellDialog(ed, isBasicDialog) {
    var cm = ed.controlManager, form = cm.createForm('table_cell_form'), advancedForm = cm.createForm('table_cell_advanced_form');

    var celltypeCtrl = cm.createListBox('table_cell_type', {
        label: ed.getLang('table.celltype', 'Cell Type'),
        name: 'celltype',
        onselect: function () { }
    });

    var items = [
        { title: ed.getLang('table.th', 'Header'), value: 'th' },
        { title: ed.getLang('table.td', 'Data'), value: 'td' }
    ];

    each(items, function (item) {
        celltypeCtrl.add(item.title, item.value);
    });

    form.add(celltypeCtrl);

    var widthCtrl = cm.createTextBox('table_cell_width', {
        label: ed.getLang('table.width', 'Width'),
        name: 'width'
    });

    form.add(widthCtrl);

    var heightCtrl = cm.createTextBox('table_cell_height', {
        label: ed.getLang('table.height', 'Height'),
        name: 'height'
    });

    form.add(heightCtrl);

    var stylesList = cm.createStylesBox('table_cell_classes', {
        label: ed.getLang('table.classes', 'Classes'),
        onselect: function (v) { },
        name: 'classes',
        styles: ed.getParam('table_classes_custom', [])
    });

    form.add(stylesList);

    var idCtrl = cm.createTextBox('table_cell_id', {
        label: ed.getLang('table.id', 'ID'),
        name: 'id'
    });

    var langListCtrl = cm.createListBox('table_cell_lang', {
        label: ed.getLang('attributes.label_lang', 'Language'),
        onselect: function (v) { },
        name: 'lang',
        filter: true
    });

    langListCtrl.add('--', '');

    each(languageValues, function (value, name) {
        langListCtrl.add(name, value);
    });

    var dirListCtrl = cm.createListBox('table_cell_dir', {
        label: ed.getLang('attributes.label_dir', 'Text Direction'),
        onselect: function (v) { },
        name: 'dir'
    });

    dirListCtrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each(['ltr', 'rtl'], function (value) {
        dirListCtrl.add(ed.getLang('attributes.label_dir_' + value, value), value);
    });

    var backgroundColorCtrl = cm.createTextBox('table_cell_background_color', {
        label: ed.getLang('table.background_color', 'Background Color'),
        name: 'background_color',
        subtype: 'color'
    });

    advancedForm.add(idCtrl);
    advancedForm.add(langListCtrl);
    advancedForm.add(dirListCtrl);
    advancedForm.add(backgroundColorCtrl);

    var tabs = cm.createTabs('table_cell_tabs');

    tabs.add({
        id: 'table_cell_tab',
        title: ed.getLang('table.cell', 'Cell'),
        items: [form]
    });

    if (!isBasicDialog) {
        tabs.add({
            id: 'table_cell_advanced_tab',
            title: ed.getLang('table.advanced', 'Advanced'),
            items: [advancedForm]
        });
    }

    // Register commands
    ed.addCommand('mceTableCellProps', function () {
        ed.windowManager.open({
            title: ed.getLang('table.cell_desc', 'Table Cells'),
            items: [tabs],
            size: 'mce-modal-landscape-small',
            open: function () {
                var label = ed.getLang('insert', 'Insert'), elm = ed.dom.getParent(ed.selection.getStart(), "td,th");

                // Get table cell data
                var celltype = elm.nodeName.toLowerCase(), width = '', height = '';

                var styles = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                if (elm) {
                    label = ed.getLang('update', 'Update');

                    width = styles.width || '';
                    height = styles.height || '';
                }

                // remove px from width
                width = width.replace('px', '');

                // remove px from height
                height = height.replace('px', '');

                var classes = ed.dom.getAttrib(elm, 'class');

                // clean
                classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                    return cls.trim() !== '';
                });

                tabs.update({
                    celltype: celltype,
                    width: width,
                    height: height,
                    classes: classes,
                    id: ed.dom.getAttrib(elm, 'id') || '',
                    lang: ed.dom.getAttrib(elm, 'lang') || '',
                    dir: ed.dom.getAttrib(elm, 'dir') || '',
                    background_color: styles['background-color'] || ''
                });

                DOM.setHTML(this.id + '_insert', label);
            },
            buttons: [
                {
                    title: ed.getLang('common.cancel', 'Cancel'),
                    id: 'cancel'
                },
                {
                    title: ed.getLang('insert', 'Insert'),
                    id: 'insert',
                    onsubmit: function (e) {
                        var data = tabs.submit();

                        var elm = ed.dom.getParent(ed.selection.getStart(), "td,th");

                        data.style = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                        // add px to width if it is an integer
                        if (data.width && !isNaN(data.width)) {
                            data.width += 'px';
                        }

                        // add px to height if it is an integer
                        if (data.height && !isNaN(data.height)) {
                            data.height += 'px';
                        }

                        data.style.width = data.width;
                        data.style.height = data.height;
                        data.style['background-color'] = data.background_color || '';

                        // Apply advanced attributes before updateCells so they are
                        // preserved if the cell is recreated during a celltype change
                        ed.dom.setAttrib(elm, 'id', data.id || '');
                        ed.dom.setAttrib(elm, 'lang', data.lang || '');
                        ed.dom.setAttrib(elm, 'dir', data.dir || '');

                        var args = {
                            style: ed.dom.serializeStyle(data.style),
                            celltype: data.celltype,
                            class: data.classes
                        };

                        updateCells(ed, args);

                        Event.cancel(e);
                    },
                    classes: 'primary',
                    scope: self
                }
            ]
        });
    });
}
