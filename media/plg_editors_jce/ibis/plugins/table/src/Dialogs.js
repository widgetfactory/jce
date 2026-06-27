/**
* Copyright (c) 2009–2026 Ryan Demmer. All rights reserved.
 * Copyright (c) Moxiecode Systems AB. All rights reserved.
 * Copyright (c) 1999–2015 Ephox Corp. All rights reserved.
 * @note    Forked or includes code from TinyMCE 3.x/4.x/5.x (originally under LGPL 2.1) and relicensed under GPL v2+ per LGPL 2.1 § 3.
 * Licensed under the GNU General Public License version 2 or later (GPL v2+):
 * https://www.gnu.org/licenses/gpl-2.0.html
 */

import { insertTableHtml, updateRows, updateCells } from './TableUtils.js';
import {
    createIdCtrl, createStyleCtrl, createLangListCtrl, createDirListCtrl,
    createClassesCtrl, createAlignCtrl, createBackgroundColorCtrl, createBackgroundImageCtrl,
    createBorderCtrl
} from './Controls.js';

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

    var alignCtrl = createAlignCtrl(cm, 'table', ed);

    tableForm.add(alignCtrl);

    var stylesList = createClassesCtrl(cm, 'table', ed);

    tableForm.add(stylesList);

    var captionCtrl = cm.createCheckBox('table_caption', {
        label: ed.getLang('table.caption', 'Caption'),
        name: 'caption',
        label_position: 'before'
    });

    tableForm.add(captionCtrl);

    var idCtrl = createIdCtrl(cm, 'table', ed, ed.getParam('table_default_id', ''));

    var summaryCtrl = cm.createTextBox('table_summary', {
        label: ed.getLang('table.summary', 'Summary'),
        name: 'summary',
        value: ed.getParam('table_default_summary', '')
    });

    var styleCtrl = createStyleCtrl(cm, 'table', ed, ed.getParam('table_default_style', ''));

    var langListCtrl = createLangListCtrl(cm, 'table', ed);

    var dirListCtrl = createDirListCtrl(cm, 'table', ed);

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

    var backgroundImageCtrl = createBackgroundImageCtrl(cm, 'table', ed);

    var backgroundColorCtrl = createBackgroundColorCtrl(cm, 'table', ed, ed.getParam('table_default_background_color', ''));

    var borderCtrl = createBorderCtrl(cm, 'table', ed);

    advancedForm.add(idCtrl);
    advancedForm.add(summaryCtrl);
    advancedForm.add(styleCtrl);
    advancedForm.add(langListCtrl);
    advancedForm.add(dirListCtrl);
    advancedForm.add(frameCtrl);
    advancedForm.add(rulesCtrl);
    advancedForm.add(backgroundImageCtrl);
    advancedForm.add(backgroundColorCtrl);
    advancedForm.add(borderCtrl);

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
                    classes: classes,
                    cellspacing: ed.getParam('table_default_cellspacing', ''),
                    cellpadding: ed.getParam('table_default_cellpadding', ''),
                    width: ed.getParam('table_default_width', ''),
                    height: ed.getParam('table_default_height', '')
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
                    var border = styles.border || '';

                    // remove url() from backgroundImage
                    backgroundImage = backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

                    var marginLeft = styles['margin-left'] || '';
                    var marginRight = styles['margin-right'] || '';
                    var align = '';

                    if (marginLeft === 'auto' && marginRight === 'auto') {
                        align = 'center';
                    } else if (marginLeft === 'auto') {
                        align = 'right';
                    } else if (marginRight === 'auto') {
                        align = 'left';
                    }

                    // remove managed properties before passing remainder to style field
                    each(['background-color', 'background-image', 'width', 'height', 'border', 'margin-left', 'margin-right'], function (key) {
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
                        align: align,
                        style: styles,
                        background_color: backgroundColor,
                        background_image: backgroundImage,
                        border: border
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

                        var styleObj = ed.dom.parseStyle(data.style || '');

                        styleObj.width = data.width || '';
                        styleObj.height = data.height || '';

                        if (data.background_color) {
                            styleObj['background-color'] = data.background_color;
                        } else {
                            delete styleObj['background-color'];
                        }

                        if (data.background_image) {
                            styleObj['background-image'] = 'url(' + data.background_image + ')';
                        } else {
                            delete styleObj['background-image'];
                        }

                        if (data.border) {
                            styleObj.border = data.border;
                        } else {
                            delete styleObj.border;
                        }

                        if (data.align === 'center') {
                            styleObj['margin-left'] = 'auto';
                            styleObj['margin-right'] = 'auto';
                        } else if (data.align === 'right') {
                            styleObj['margin-left'] = 'auto';
                            styleObj['margin-right'] = '0';
                        } else if (data.align === 'left') {
                            styleObj['margin-left'] = '0';
                            styleObj['margin-right'] = 'auto';
                        }

                        var args = {
                            cellspacing: data.cellspacing,
                            cellpadding: data.cellpadding,
                            style: styleObj,
                            class: data.classes
                        };

                        var elm = ed.dom.getParent(ed.selection.getNode(), "table");

                        if (elm) {
                            var styles = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                            delete styles['margin-left'];
                            delete styles['margin-right'];

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

    var stylesList = createClassesCtrl(cm, 'table_row', ed);

    form.add(stylesList);

    var alignCtrl = createAlignCtrl(cm, 'table_row', ed);

    form.add(alignCtrl);

    var actionCtrl = cm.createListBox('table_row_action', {
        label: ed.getLang('table.action', 'Update'),
        name: 'action',
        onselect: function () { },
        value: 'current'
    });

    each([
        { title: ed.getLang('table.action_current_row', 'Update Current Row'), value: 'current' },
        { title: ed.getLang('table.action_odd_rows', 'Update Odd Rows'), value: 'odd' },
        { title: ed.getLang('table.action_even_rows', 'Update Even Rows'), value: 'even' },
        { title: ed.getLang('table.action_all_rows', 'Update All Rows'), value: 'all' }
    ], function (item) {
        actionCtrl.add(item.title, item.value);
    });

    var idCtrl = createIdCtrl(cm, 'table_row', ed);

    var langListCtrl = createLangListCtrl(cm, 'table_row', ed);

    var dirListCtrl = createDirListCtrl(cm, 'table_row', ed);

    var rowStyleCtrl = createStyleCtrl(cm, 'table_row', ed);

    var rowBackgroundColorCtrl = createBackgroundColorCtrl(cm, 'table_row', ed);

    var rowBorderCtrl = createBorderCtrl(cm, 'table_row', ed);

    advancedForm.add(idCtrl);
    advancedForm.add(rowStyleCtrl);
    advancedForm.add(langListCtrl);
    advancedForm.add(dirListCtrl);
    advancedForm.add(rowBackgroundColorCtrl);
    advancedForm.add(rowBorderCtrl);

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
            size: 'mce-modal-landscape-medium',
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

                var styles = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                var backgroundColor = styles['background-color'] || '';
                var align = styles['text-align'] || '';
                var border = styles.border || '';

                // strip managed properties before passing remainder to style field
                each(['height', 'text-align', 'background-color', 'border'], function (key) {
                    delete styles[key];
                });

                tabs.update({
                    rowtype: rowtype,
                    height: height,
                    classes: classes,
                    align: align,
                    action: 'current',
                    style: ed.dom.serializeStyle(styles),
                    background_color: backgroundColor,
                    border: border,
                    id: ed.dom.getAttrib(elm, 'id') || '',
                    lang: ed.dom.getAttrib(elm, 'lang') || '',
                    dir: ed.dom.getAttrib(elm, 'dir') || ''
                });

                DOM.setHTML(this.id + '_insert', label);

                actionCtrl.insertBefore(DOM.get(this.id + '_cancel'));
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

                        // start from user's raw style input, layer managed properties on top
                        var styleObj = ed.dom.parseStyle(data.style || '');

                        // add px to height if it is an integer
                        if (data.height && !isNaN(data.height)) {
                            data.height += 'px';
                        }

                        styleObj.height = data.height || '';

                        if (data.align) {
                            styleObj['text-align'] = data.align;
                        } else {
                            delete styleObj['text-align'];
                        }

                        if (data.background_color) {
                            styleObj['background-color'] = data.background_color;
                        } else {
                            delete styleObj['background-color'];
                        }

                        if (data.border) {
                            styleObj.border = data.border;
                        } else {
                            delete styleObj.border;
                        }

                        // Apply advanced attributes before updateRows so they are
                        // preserved if the row is cloned during a rowtype change
                        ed.dom.setAttrib(elm, 'id', data.id || '');
                        ed.dom.setAttrib(elm, 'lang', data.lang || '');
                        ed.dom.setAttrib(elm, 'dir', data.dir || '');

                        var args = {
                            style: ed.dom.serializeStyle(styleObj),
                            rowtype: data.rowtype,
                            action: data.action || 'current',
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

    var stylesList = createClassesCtrl(cm, 'table_cell', ed);

    form.add(stylesList);

    var alignCtrl = createAlignCtrl(cm, 'table_cell', ed);

    form.add(alignCtrl);

    var valignCtrl = cm.createListBox('table_cell_valign', {
        label: ed.getLang('table.valign', 'Vertical Alignment'),
        name: 'valign',
        onselect: function () { }
    });

    valignCtrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each(['top', 'middle', 'bottom'], function (value) {
        var label = value === 'middle' ? 'Center' : value.charAt(0).toUpperCase() + value.slice(1);
        valignCtrl.add(ed.getLang('table.valign_' + value, label), value);
    });

    form.add(valignCtrl);

    var scopeCtrl = cm.createListBox('table_cell_scope', {
        label: ed.getLang('table.scope', 'Scope'),
        name: 'scope',
        onselect: function () { }
    });

    scopeCtrl.add(ed.getLang('common.not_set', '-- Not set --'), '');

    each([
        { title: ed.getLang('table.scope_col', 'Column'), value: 'col' },
        { title: ed.getLang('table.scope_row', 'Row'), value: 'row' },
        { title: ed.getLang('table.scope_colgroup', 'Column Group'), value: 'colgroup' },
        { title: ed.getLang('table.scope_rowgroup', 'Row Group'), value: 'rowgroup' }
    ], function (item) {
        scopeCtrl.add(item.title, item.value);
    });

    form.add(scopeCtrl);

    var actionCtrl = cm.createListBox('table_cell_action', {
        label: ed.getLang('table.action', 'Update'),
        name: 'action',
        onselect: function () { },
        value: 'current'
    });

    each([
        { title: ed.getLang('table.action_current_cell', 'Update Current Cell'), value: 'current' },
        { title: ed.getLang('table.action_all_cells_row', 'Update All Cells in Row'), value: 'row' },
        { title: ed.getLang('table.action_all_cells_table', 'Update All Cells in Table'), value: 'table' }
    ], function (item) {
        actionCtrl.add(item.title, item.value);
    });

    var idCtrl = createIdCtrl(cm, 'table_cell', ed);

    var langListCtrl = createLangListCtrl(cm, 'table_cell', ed);

    var dirListCtrl = createDirListCtrl(cm, 'table_cell', ed);

    var backgroundColorCtrl = createBackgroundColorCtrl(cm, 'table_cell', ed);

    var cellStyleCtrl = createStyleCtrl(cm, 'table_cell', ed);

    var cellBackgroundImageCtrl = createBackgroundImageCtrl(cm, 'table_cell', ed);

    var cellBorderCtrl = createBorderCtrl(cm, 'table_cell', ed);

    advancedForm.add(idCtrl);
    advancedForm.add(cellStyleCtrl);
    advancedForm.add(langListCtrl);
    advancedForm.add(dirListCtrl);
    advancedForm.add(backgroundColorCtrl);
    advancedForm.add(cellBackgroundImageCtrl);
    advancedForm.add(cellBorderCtrl);

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
            size: 'mce-modal-landscape-medium',
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

                var backgroundColor = styles['background-color'] || '';
                var backgroundImage = (styles['background-image'] || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                var border = styles.border || '';

                // strip managed properties before passing remainder to style field
                each(['width', 'height', 'text-align', 'vertical-align', 'background-color', 'background-image', 'border'], function (key) {
                    delete styles[key];
                });

                tabs.update({
                    celltype: celltype,
                    width: width,
                    height: height,
                    classes: classes,
                    align: styles['text-align'] || '',
                    valign: styles['vertical-align'] || '',
                    scope: ed.dom.getAttrib(elm, 'scope') || '',
                    action: 'current',
                    style: ed.dom.serializeStyle(styles),
                    id: ed.dom.getAttrib(elm, 'id') || '',
                    lang: ed.dom.getAttrib(elm, 'lang') || '',
                    dir: ed.dom.getAttrib(elm, 'dir') || '',
                    background_color: backgroundColor,
                    background_image: backgroundImage,
                    border: border
                });

                DOM.setHTML(this.id + '_insert', label);

                 actionCtrl.insertBefore(DOM.get(this.id + '_cancel'));
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

                        // start from user's raw style input, layer managed properties on top
                        var styleObj = ed.dom.parseStyle(data.style || '');

                        // add px to width if it is an integer
                        if (data.width && !isNaN(data.width)) {
                            data.width += 'px';
                        }

                        // add px to height if it is an integer
                        if (data.height && !isNaN(data.height)) {
                            data.height += 'px';
                        }

                        styleObj.width = data.width || '';
                        styleObj.height = data.height || '';

                        if (data.background_color) {
                            styleObj['background-color'] = data.background_color;
                        } else {
                            delete styleObj['background-color'];
                        }

                        if (data.background_image) {
                            styleObj['background-image'] = 'url(' + data.background_image + ')';
                        } else {
                            delete styleObj['background-image'];
                        }

                        if (data.border) {
                            styleObj.border = data.border;
                        } else {
                            delete styleObj.border;
                        }

                        if (data.align) {
                            styleObj['text-align'] = data.align;
                        } else {
                            delete styleObj['text-align'];
                        }

                        if (data.valign) {
                            styleObj['vertical-align'] = data.valign;
                        } else {
                            delete styleObj['vertical-align'];
                        }

                        // Apply advanced attributes before updateCells so they are
                        // preserved if the cell is recreated during a celltype change
                        ed.dom.setAttrib(elm, 'id', data.id || '');
                        ed.dom.setAttrib(elm, 'lang', data.lang || '');
                        ed.dom.setAttrib(elm, 'dir', data.dir || '');
                        ed.dom.setAttrib(elm, 'scope', data.scope || '');

                        var args = {
                            style: ed.dom.serializeStyle(styleObj),
                            celltype: data.celltype,
                            action: data.action || 'current',
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
