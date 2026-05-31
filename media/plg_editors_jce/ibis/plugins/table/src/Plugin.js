/**
* Copyright (c) 2009–2026 Ryan Demmer. All rights reserved.
 * Copyright (c) Moxiecode Systems AB. All rights reserved.
 * Copyright (c) 1999–2015 Ephox Corp. All rights reserved.
 * @note    Forked or includes code from TinyMCE 3.x/4.x/5.x (originally under LGPL 2.1) and relicensed under GPL v2+ per LGPL 2.1 § 3.
 * Licensed under the GNU General Public License version 2 or later (GPL v2+):
 * https://www.gnu.org/licenses/gpl-2.0.html
 */

import { TableGrid, getSpanVal } from './TableGrid.js';
import { mergeTableCells, insertTableHtml } from './TableUtils.js';
import { showTableDialog, showRowDialog, showCellDialog } from './Dialogs.js';

var DOM = ibis.DOM,
    Event = ibis.dom.Event,
    each = ibis.each,
    VK = ibis.VK,
    TreeWalker = ibis.dom.TreeWalker,
    Delay = ibis.util.Delay;

ibis.PluginManager.add('table', function (ed, url) {
    var winMan, clipboardRows, hasCellSelection = true; // Might be selected cells on reload

    // Register buttons
    ed.addButton('table', 'table.desc', 'mceInsertTable', true);

    if (ed.getParam('table_buttons', 1)) {
        each([
            ['table', 'table.desc', 'mceInsertTable', true],
            ['delete_table', 'table.del', 'mceTableDelete'],
            ['delete_col', 'table.delete_col_desc', 'mceTableDeleteCol'],
            ['delete_row', 'table.delete_row_desc', 'mceTableDeleteRow'],
            ['col_after', 'table.col_after_desc', 'mceTableInsertColAfter'],
            ['col_before', 'table.col_before_desc', 'mceTableInsertColBefore'],
            ['row_after', 'table.row_after_desc', 'mceTableInsertRowAfter'],
            ['row_before', 'table.row_before_desc', 'mceTableInsertRowBefore'],
            ['row_props', 'table.row_desc', 'mceTableRowProps', true],
            ['cell_props', 'table.cell_desc', 'mceTableCellProps', true],
            ['split_cells', 'table.split_cells_desc', 'mceTableSplitCells', true],
            ['merge_cells', 'table.merge_cells_desc', 'mceTableMergeCells', true]
        ], function (c) {
            ed.addButton(c[0], {
                title: c[1],
                cmd: c[2],
                ui: c[3]
            });
        });
    }

    function createTableGrid(node) {
        var selection = ed.selection,
            tblElm = ed.dom.getParent(node || selection.getNode(), 'table');

        if (tblElm) {
            return new TableGrid(tblElm, ed.dom, selection, ed.settings);
        }
    }

    function cleanup(force) {
        // Restore selection possibilities
        ed.getBody().style.webkitUserSelect = '';

        if (force || hasCellSelection) {
            ed.dom.removeClass(ed.dom.select('td.mceSelected,th.mceSelected'), 'mceSelected');
            hasCellSelection = false;
        }
    }

    ed.onPreInit.add(function () {
        ed.onSetContent.add(function (ed, e) {
            cleanup(true);

            each(ed.dom.select('table'), function (table) {
                ed.dom.addClass(table, 'mce-item-table');

                // Ensure empty cells have a <br> to avoid empty cell issues
                each(ed.dom.select('td,th', table), function (cell) {
                    if (ed.dom.isEmpty(cell) || (!cell.firstElementChild && /^[\s\u00a0]+$/.test(cell.textContent))) {
                        cell.innerHTML = '<br data-mce-bogus="1" />';
                    }
                });
            });
        });

        ed.onPastePostProcess.add(function (ed, args) {
            var dom = ed.dom;

            // ensure internal table class is set
            dom.addClass(dom.select('table', args.node), 'mce-item-table');

            each(dom.select('td[valign]', args.node), function (elm) {
                // fix valign
                dom.setStyle(elm, 'vertical-align', elm.getAttribute('valign'));
                elm.removeAttribute('valign');
            });
        });

        if (ed.settings.table_merge_content_on_paste !== false) {
            ed.onPasteBeforeInsert.add(function (ed, o) {
                var dom = ed.dom, elm = o.node;

                if (o.internal && !elm) {
                    elm = ed.dom.create('div', {}, o.content);
                }

                if (!elm) {
                    return;
                }

                // Assuming this is the container of the pasted content
                var table = elm.firstChild;

                if (table && table.nodeName === 'TABLE') {
                    if (elm.childNodes.length === 1) {
                        var node = ed.selection.getNode(), targetCell = dom.getParent(node, 'td,th');

                        // Ensure an existing table and target cell are found
                        if (!targetCell) {
                            return;
                        }

                        if (mergeTableCells(ed, targetCell, table)) {
                            o.terminate = true;
                            ed.undoManager.add();
                        }
                    }
                }
            });
        }

        ed.onGetContent.add(function (ed, o) {
            if (!o.selection && !o.contextual) {
                return;
            }

            var sel = ed.selection;

            var table = ed.dom.getParent(sel.getStart(), 'table');

            if (table) {
                var rows = [];

                // get all table cells that are selected.
                each(table.rows, function (row) {
                    var cells = [];

                    each(row.cells, function (cell) {
                        if (ed.dom.hasClass(cell, 'mceSelected')) {
                            cells.push(cell);
                        }
                    });

                    if (cells.length) {
                        // If the number of selected table cells is equal to the total number of table cells, then return the whole row
                        if (cells.length === row.cells.length) {
                            rows.push(row);
                            // Otherwise, return only the selected cells
                        } else {
                            rows.push(cells);
                        }
                    }
                });

                if (rows.length) {
                    // if the entire table is selected, return the whole table
                    if (rows.length === table.rows.length) {
                        var tmp = table.cloneNode(true);
                        ed.dom.removeClass(ed.dom.select('td.mceSelected,th.mceSelected', tmp), 'mceSelected');

                        o.content = tmp.outerHTML;
                        return;
                    }

                    var content = rows.map(function (row) {
                        var cells = row.map(function (cell) {
                            var tmp = cell.cloneNode(true);
                            ed.dom.removeClass(tmp, 'mceSelected');

                            return tmp.outerHTML;
                        });

                        return '<tr>' + cells.join('') + '</tr>';
                    });

                    o.content = '<table>' + content.join('') + '</table>';
                }
            }
        });

        createDialogs();
        mergeDialog(ed);

        ed.serializer.addNodeFilter('td,th', function (nodes) {
            var pad = ed.getParam('table_pad_empty_cells', true);
            var i = nodes.length, node, fc;

            while (i--) {
                node = nodes[i];
                fc = node.firstChild;

                if (pad) {
                    if (!fc || (!fc.next && fc.name === 'br' && fc.attr('data-mce-bogus'))) {
                        node.empty();
                        var textNode = new ibis.html.Node('#text', 3);
                        textNode.value = '\u00a0';
                        node.append(textNode);
                    }
                } else {
                    if (fc && !fc.next && fc.type === 3 && fc.value === '\u00a0') {
                        node.empty();
                    }
                }
            }
        });

        if (!ed.getParam('table_pad_empty_cells', true)) {
            var elements = ed.schema.elements;

            if (elements.th) {
                elements.th.paddEmpty = false;
            }

            if (elements.td) {
                elements.td.paddEmpty = false;
            }
        }
    });

    ed.onPreProcess.add(function (ed, args) {
        var nodes, i, node, dom = ed.dom,
            value;

        if (ed.settings.schema === "html4") {
            nodes = dom.select('table,td,th,tr', args.node);

            i = nodes.length;

            while (i--) {
                node = nodes[i];
                dom.setAttrib(node, 'data-mce-style', '');
                // convert margin to aligh center
                if (dom.getStyle(node, 'margin-left') === "auto" && dom.getStyle(node, 'margin-right') === "auto") {
                    dom.setAttrib(node, 'align', 'center');
                    dom.setStyles(node, {
                        'margin-left': '',
                        'margin-right': ''
                    });
                }
                // convert float to align
                var flt = dom.getStyle(node, 'float');

                if (flt === "left" || flt === "right") {
                    dom.setAttrib(node, 'align', flt);
                    dom.setStyle(node, 'float', '');
                }

                // convert float to align
                var textAlign = dom.getStyle(node, 'text-align');

                if (textAlign) {
                    dom.setAttrib(node, 'align', textAlign);
                    dom.setStyle(node, 'text-align', '');
                }
            }
        }

        // Convert width and height attributes to styles
        nodes = dom.select('table, td, th', args.node);

        i = nodes.length;

        while (i--) {
            node = nodes[i];

            if ((value = dom.getAttrib(node, 'width'))) {
                dom.setStyle(node, 'width', value);
                dom.setAttrib(node, 'width', '');
            }

            if ((value = dom.getAttrib(node, 'height'))) {
                dom.setStyle(node, 'height', value);
                dom.setAttrib(node, 'height', '');
            }
        }
    });

    // Handle node change updates
    ed.onNodeChange.add(function (ed, cm, n) {
        var p, parent;

        n = ed.selection.getStart();
        p = ed.dom.getParent(n, 'td,th,caption');
        cm.setActive('table', n.nodeName === 'TABLE' || !!p);

        if (p) {
            parent = ed.dom.getParent(p, 'TABLE');
        }

        // Disable table tools if we are in caption
        if (p && p.nodeName === 'CAPTION') {
            p = 0;
        }

        var multiple = false;

        if (parent) {
            var selected = ed.dom.select('td.mceSelected,th.mceSelected', parent);

            if (selected.length > 1) {
                multiple = true;
            }
        }

        if (ed.getParam('table_buttons', 1)) {
            cm.setDisabled('delete_table', !p);
            cm.setDisabled('delete_col', !p);
            cm.setDisabled('delete_row', !p);
            cm.setDisabled('col_after', !p || multiple);
            cm.setDisabled('col_before', !p || multiple);
            cm.setDisabled('row_after', !p || multiple);
            cm.setDisabled('row_before', !p || multiple);
            cm.setDisabled('row_props', !p);
            cm.setDisabled('cell_props', !p);
            cm.setDisabled('split_cells', !p || multiple);
            cm.setDisabled('merge_cells', !multiple);

            cm.setDisabled('table_props', !p);
        }
    });

    // Select whole table if a table border is clicked
    ed.onClick.add(function (ed, e) {
        var n = e.target;

        if (e.altKey && ed.dom.is(n, 'td,th,caption')) {
            n = ed.dom.getParent(n, 'table');
        }

        if (n.nodeName == 'TABLE') {
            ed.selection.select(n);
            ed.nodeChanged();
        }
    });

    ed.onInit.add(function (ed) {
        var dom = ed.dom,
            tableGrid,
            resizing, dragging;

        winMan = ed.windowManager;

        if (ed.settings.schema === "html4") {
            // Remove all other alignments first
            ibis.each('left,center,right,full'.split(','), function (name) {
                var fmts = ed.formatter.get('align' + name);

                ibis.each(fmts, function (fmt) {
                    fmt.onformat = function (elm, fmt) {
                        if (/^(TABLE|TH|TD|TR)$/.test(elm.nodeName)) {
                            if (name === "full") {
                                name = "justify";
                            }

                            ed.dom.setAttrib(elm, 'align', name);
                        }
                    };
                });
            });
        }

        ed.onKeyUp.add(function (ed, e) {
            cleanup();
        });

        function isCellInTable(table, cell) {
            if (!table || !cell) {
                return false;
            }

            return table === dom.getParent(cell, 'table');
        }

        function fixDragSelection() {
            var startCell, startTable, lastMouseOverTarget;

            // Add cell selection logic
            ed.onMouseDown.add(function (ed, e) {
                if (e.button != 2) {
                    cleanup();

                    startCell = dom.getParent(e.target, 'td,th');
                    startTable = dom.getParent(startCell, 'table');
                }
            });

            dom.bind(ed.getDoc(), 'mouseover', function (e) {
                var sel, target = e.target,
                    currentCell;

                if (resizing || dragging) {
                    return;
                }

                // Fake mouse enter by keeping track of last mouse over
                if (target === lastMouseOverTarget) {
                    return;
                }

                lastMouseOverTarget = target;

                if (startTable && startCell) {
                    currentCell = dom.getParent(target, 'td,th');

                    if (!isCellInTable(startTable, currentCell)) {
                        currentCell = dom.getParent(startTable, 'td,th');
                    }

                    // Selection inside first cell is normal until we have expanted
                    if (startCell === currentCell && !hasCellSelection) {
                        return;
                    }

                    if (isCellInTable(startTable, currentCell)) {
                        e.preventDefault();

                        if (!tableGrid) {
                            tableGrid = createTableGrid(startTable);
                            tableGrid.setStartCell(startCell);
                            ed.getBody().style.webkitUserSelect = 'none';
                        }

                        tableGrid.setEndCell(currentCell);
                        hasCellSelection = true;

                        // Remove current selection
                        sel = ed.selection.getSel();

                        try {
                            if (sel.removeAllRanges) {
                                sel.removeAllRanges();
                            } else {
                                sel.empty();
                            }
                        } catch (ex) {
                            // IE9 might throw errors here
                        }
                    }
                }
            });

            ed.onMouseUp.add(function () {
                var rng, sel = ed.selection,
                    selectedCells, walker, node, lastNode;

                function setPoint(node, start) {
                    var walker = new TreeWalker(node, node);

                    do {
                        // Text node
                        if (node.nodeType == 3) {
                            if (start) {
                                rng.setStart(node, 0);
                            } else {
                                rng.setEnd(node, node.nodeValue.length);
                            }

                            return;
                        }

                        // BR element
                        if (node.nodeName == 'BR') {
                            if (start) {
                                rng.setStartBefore(node);
                            } else {
                                rng.setEndBefore(node);
                            }

                            return;
                        }
                    } while ((node = (start ? walker.next() : walker.prev())));
                }

                // Move selection to startCell
                if (startCell) {
                    if (tableGrid) {
                        ed.getBody().style.webkitUserSelect = '';
                    }

                    // Try to expand text selection as much as we can only Gecko supports cell selection
                    selectedCells = dom.select('td.mceSelected,th.mceSelected');

                    if (selectedCells.length > 0) {
                        var parent = dom.getParent(selectedCells[0], 'table');

                        // select the table if all cells are selected
                        /*var allCells = dom.select('td,th', parent);

                        if (selectedCells.length === allCells.length) {
                            sel.select(parent);

                            dom.removeClass(selectedCells, 'mceSelected');

                            ed.nodeChanged();

                            return;
                        }*/

                        rng = dom.createRng();
                        node = selectedCells[0];
                        rng.setStartBefore(node);
                        rng.setEndAfter(node);

                        setPoint(node, 1);
                        walker = new TreeWalker(node, parent);

                        do {
                            if (node.nodeName == 'TD' || node.nodeName == 'TH') {
                                if (!dom.hasClass(node, 'mceSelected')) {
                                    break;
                                }

                                lastNode = node;
                            }
                        } while ((node = walker.next()));

                        setPoint(lastNode);

                        sel.setRng(rng);
                    }

                    ed.nodeChanged();
                    startCell = tableGrid = startTable = lastMouseOverTarget = null;
                }
            });
        }

        /**
         * Fixed caret movement around tables on WebKit.
         */
        function moveWebKitSelection() {
            function eventHandler(e) {
                var key = e.keyCode;

                function handle(upBool, sourceNode) {
                    var siblingDirection = upBool ? 'previousSibling' : 'nextSibling';
                    var currentRow = ed.dom.getParent(sourceNode, 'tr');
                    var siblingRow = currentRow[siblingDirection];

                    if (siblingRow) {
                        moveCursorToRow(ed, sourceNode, siblingRow, upBool);
                        e.preventDefault();
                        return true;
                    }

                    var tableNode = ed.dom.getParent(currentRow, 'table');
                    var middleNode = currentRow.parentNode;
                    var parentNodeName = middleNode.nodeName.toLowerCase();
                    if (parentNodeName === 'tbody' || parentNodeName === (upBool ? 'tfoot' : 'thead')) {
                        var targetParent = getTargetParent(upBool, tableNode, middleNode, 'tbody');
                        if (targetParent !== null) {
                            return moveToRowInTarget(upBool, targetParent, sourceNode);
                        }
                    }

                    return escapeTable(upBool, currentRow, siblingDirection, tableNode);
                }

                function getTargetParent(upBool, topNode, secondNode, nodeName) {
                    var tbodies = ed.dom.select('>' + nodeName, topNode);
                    var position = tbodies.indexOf(secondNode);
                    if (upBool && position === 0 || !upBool && position === tbodies.length - 1) {
                        return getFirstHeadOrFoot(upBool, topNode);
                    } else if (position === -1) {
                        var topOrBottom = secondNode.tagName.toLowerCase() === 'thead' ? 0 : tbodies.length - 1;
                        return tbodies[topOrBottom];
                    }

                    return tbodies[position + (upBool ? -1 : 1)];
                }

                function getFirstHeadOrFoot(upBool, parent) {
                    var tagName = upBool ? 'thead' : 'tfoot';
                    var headOrFoot = ed.dom.select('>' + tagName, parent);
                    return headOrFoot.length !== 0 ? headOrFoot[0] : null;
                }

                function moveToRowInTarget(upBool, targetParent, sourceNode) {
                    var targetRow = getChildForDirection(targetParent, upBool);

                    if (targetRow) {
                        moveCursorToRow(ed, sourceNode, targetRow, upBool);
                    }

                    e.preventDefault();
                    return true;
                }

                function escapeTable(upBool, currentRow, siblingDirection, table) {
                    var tableSibling = table[siblingDirection];

                    if (tableSibling) {
                        moveCursorToStartOfElement(tableSibling);
                        return true;
                    }

                    var parentCell = ed.dom.getParent(table, 'td,th');

                    if (parentCell) {
                        return handle(upBool, parentCell, e);
                    }

                    var backUpSibling = getChildForDirection(currentRow, !upBool);
                    moveCursorToStartOfElement(backUpSibling);
                    e.preventDefault();
                    return false;
                }

                function getChildForDirection(parent, up) {
                    var child = parent && parent[up ? 'lastChild' : 'firstChild'];
                    // BR is not a valid table child to return in this case we return the table cell
                    return child && child.nodeName === 'BR' ? ed.dom.getParent(child, 'td,th') : child;
                }

                function moveCursorToStartOfElement(n) {
                    ed.selection.setCursorLocation(n, 0);
                }

                function isVerticalMovement() {
                    return key == VK.UP || key == VK.DOWN;
                }

                function isInTable(editor) {
                    var node = ed.selection.getNode();
                    var currentRow = ed.dom.getParent(node, 'tr');
                    return currentRow !== null;
                }

                function columnIndex(column) {
                    var colIndex = 0;
                    var c = column;
                    while (c.previousSibling) {
                        c = c.previousSibling;
                        colIndex = colIndex + getSpanVal(c, "colspan");
                    }
                    return colIndex;
                }

                function findColumn(rowElement, columnIndex) {
                    var c = 0,
                        r = 0;

                    each(rowElement.children, function (cell, i) {
                        c = c + getSpanVal(cell, "colspan");
                        r = i;
                        if (c > columnIndex) {
                            return false;
                        }
                    });
                    return r;
                }

                function moveCursorToRow(ed, node, row, upBool) {
                    var srcColumnIndex = columnIndex(ed.dom.getParent(node, 'td,th'));
                    var tgtColumnIndex = findColumn(row, srcColumnIndex);
                    var tgtNode = row.childNodes[tgtColumnIndex];
                    var rowCellTarget = getChildForDirection(tgtNode, upBool);
                    moveCursorToStartOfElement(rowCellTarget || tgtNode);
                }

                function shouldFixCaret(preBrowserNode) {
                    var newNode = ed.selection.getNode();
                    var newParent = ed.dom.getParent(newNode, 'td,th');
                    var oldParent = ed.dom.getParent(preBrowserNode, 'td,th');

                    return newParent && newParent !== oldParent && checkSameParentTable(newParent, oldParent);
                }

                function checkSameParentTable(nodeOne, NodeTwo) {
                    return ed.dom.getParent(nodeOne, 'TABLE') === ed.dom.getParent(NodeTwo, 'TABLE');
                }

                if (isVerticalMovement() && isInTable(ed)) {
                    var preBrowserNode = ed.selection.getNode();
                    Delay.setEditorTimeout(ed, function () {
                        if (shouldFixCaret(preBrowserNode)) {
                            handle(!e.shiftKey && key === VK.UP, preBrowserNode, e);
                        }
                    }, 0);
                }
            }

            ed.onKeyDown.add(function (e) {
                eventHandler(e);
            });
        }

        function fixBeforeTableCaretBug() {
            // Checks if the selection/caret is at the start of the specified block element
            function isAtStart(rng, par) {
                var doc = par.ownerDocument,
                    rng2 = doc.createRange(),
                    elm;

                rng2.setStartBefore(par);
                rng2.setEnd(rng.endContainer, rng.endOffset);

                elm = doc.createElement('body');
                elm.appendChild(rng2.cloneContents());

                // Check for text characters of other elements that should be treated as content
                return elm.innerHTML.replace(/<(br|img|object|embed|input|textarea)[^>]*>/gi, '-').replace(/<[^>]+>/g, '').length === 0;
            }

            // Fixes an bug where it's impossible to place the caret before a table in Gecko
            // this fix solves it by detecting when the caret is at the beginning of such a table
            // and then manually moves the caret infront of the table
            ed.onKeyDown.add(function (e) {
                var rng, table, dom = ed.dom;

                // On gecko it's not possible to place the caret before a table
                if (e.keyCode == 37 || e.keyCode == 38) {
                    rng = ed.selection.getRng();
                    table = dom.getParent(rng.startContainer, 'table');

                    if (table && ed.getBody().firstChild == table) {
                        if (isAtStart(rng, table)) {
                            rng = dom.createRng();

                            rng.setStartBefore(table);
                            rng.setEndBefore(table);

                            ed.selection.setRng(rng);

                            e.preventDefault();
                        }
                    }
                }
            });
        }

        // Fixes an issue on Gecko where it's impossible to place the caret behind a table
        // This fix will force a paragraph element after the table but only when the forced_root_block setting is enabled
        function fixTableCaretPos() {
            ed.dom.bind('KeyDown SetContent VisualAid', function () {
                var last;

                // Skip empty text nodes from the end
                for (last = ed.getBody().lastChild; last; last = last.previousSibling) {
                    if (last.nodeType == 3) {
                        if (last.nodeValue.length > 0) {
                            break;
                        }
                    } else if (last.nodeType == 1 && (last.tagName == 'BR' || !last.getAttribute('data-mce-bogus'))) {
                        break;
                    }
                }

                if (last && last.nodeName == 'TABLE') {
                    if (ed.settings.forced_root_block) {
                        ed.dom.add(
                            ed.getBody(),
                            ed.settings.forced_root_block,
                            ed.settings.forced_root_block_attrs,
                            '<br data-mce-bogus="1" />'
                        );
                    } else {
                        ed.dom.add(ed.getBody(), 'br', {
                            'data-mce-bogus': '1'
                        });
                    }
                }
            });

            ed.onPreProcess.add(function (ed, o) {
                var last = o.node.lastChild;

                if (last && (last.nodeName == "BR" || (last.childNodes.length == 1 &&
                    (last.firstChild.nodeName == 'BR' || last.firstChild.nodeValue == '\u00a0'))) &&
                    last.previousSibling && last.previousSibling.nodeName == "TABLE") {
                    ed.dom.remove(last);
                }
            });
        }

        // this nasty hack is here to work around some WebKit selection bugs.
        function fixTableCellSelection() {
            function tableCellSelected(ed, rng, n, currentCell) {
                // The decision of when a table cell is selected is somewhat involved.  The fact that this code is
                // required is actually a pointer to the root cause of this bug. A cell is selected when the start
                // and end offsets are 0, the start container is a text, and the selection node is either a TR (most cases)
                // or the parent of the table (in the case of the selection containing the last cell of a table).
                var TEXT_NODE = 3,
                    table = ed.dom.getParent(rng.startContainer, 'TABLE');
                var tableParent, allOfCellSelected, tableCellSelection;

                if (table) {
                    tableParent = table.parentNode;
                }

                allOfCellSelected = rng.startContainer.nodeType == TEXT_NODE &&
                    rng.startOffset === 0 &&
                    rng.endOffset === 0 &&
                    currentCell &&
                    (n.nodeName == "TR" || n == tableParent);

                tableCellSelection = (n.nodeName == "TD" || n.nodeName == "TH") && !currentCell;

                return allOfCellSelected || tableCellSelection;
            }

            function fixSelection() {
                var rng = ed.selection.getRng();
                var n = ed.selection.getNode();
                var currentCell = ed.dom.getParent(rng.startContainer, 'TD,TH');

                if (!tableCellSelected(ed, rng, n, currentCell)) {
                    return;
                }

                if (!currentCell) {
                    currentCell = n;
                }

                // Get the very last node inside the table cell
                var end = currentCell.lastChild;
                while (end.lastChild) {
                    end = end.lastChild;
                }

                // Select the entire table cell. Nothing outside of the table cell should be selected.
                if (end.nodeType == 3) {
                    rng.setEnd(end, end.data.length);
                    ed.selection.setRng(rng);
                }
            }

            ed.onKeyDown.add(function () {
                fixSelection();
            });

            ed.onMouseDown.add(function (e) {
                if (e.button != 2) {
                    fixSelection();
                }
            });
        }

        /**
         * Delete table if all cells are selected.
         */
        function deleteTable() {
            function placeCaretInCell(cell) {
                ed.selection.select(cell, true);
                ed.selection.collapse(true);
            }

            function paddCell(cell) {
                if (!cell.hasChildNodes()) {
                    cell.innerHTML = '<br data-mce-bogus="1" />';
                }
            }

            function clearCell(cell) {
                ed.dom.empty(cell);
                paddCell(cell);
            }

            ed.onKeyDown.add(function (e) {
                if ((e.keyCode == VK.DELETE || e.keyCode == VK.BACKSPACE) && !e.isDefaultPrevented()) {
                    var table, tableCells, selectedTableCells, cell;

                    table = ed.dom.getParent(ed.selection.getStart(), 'table');
                    if (table) {
                        tableCells = ed.dom.select('td,th', table);
                        selectedTableCells = ibis.grep(tableCells, function (cell) {
                            return !!ed.dom.getAttrib(cell, 'data-mce-selected');
                        });

                        if (selectedTableCells.length === 0) {
                            // If caret is within an empty table cell then empty it for real
                            cell = ed.dom.getParent(ed.selection.getStart(), 'td,th');
                            if (ed.selection.isCollapsed() && cell && ed.dom.isEmpty(cell)) {
                                e.preventDefault();
                                clearCell(cell);
                                placeCaretInCell(cell);
                            }

                            return;
                        }

                        e.preventDefault();

                        ed.undoManager.add();

                        if (tableCells.length == selectedTableCells.length) {
                            ed.execCommand('mceTableDelete');
                        } else {
                            ibis.each(selectedTableCells, clearCell);
                            placeCaretInCell(selectedTableCells[0]);
                        }
                    }
                }
            });
        }

        /**
         * When caption is empty and we continue to delete, caption gets deleted along with the contents.
         * So, we take over delete operation (both forward and backward) and once caption is empty, we do
         * prevent it from disappearing.
         */
        function handleDeleteInCaption() {
            var isTableCaptionNode = function (node) {
                return node && node.nodeName == 'CAPTION' && node.parentNode.nodeName == 'TABLE';
            };

            var restoreCaretPlaceholder = function (node, insertCaret) {
                var rng = ed.selection.getRng();
                var caretNode = node.ownerDocument.createTextNode('\u00a0');

                // we could always append it, but caretNode somehow gets appended before caret,
                // rather then after it, effectively preventing backspace deletion
                if (rng.startOffset) {
                    node.insertBefore(caretNode, node.firstChild);
                } else {
                    node.appendChild(caretNode);
                }

                if (insertCaret) {
                    // put the caret into the placeholder
                    ed.selection.select(caretNode, true);
                    ed.selection.collapse(true);
                }
            };

            var deleteBtnPressed = function (e) {
                return (e.keyCode == VK.DELETE || e.keyCode == VK.BACKSPACE) && !e.isDefaultPrevented();
            };

            var getSingleChildNode = function (node) {
                return node.firstChild === node.lastChild && node.firstChild;
            };

            var isTextNode = function (node) {
                return node && node.nodeType === 3;
            };

            var getSingleChr = function (node) {
                var childNode = getSingleChildNode(node);
                return isTextNode(childNode) && childNode.data.length === 1 ? childNode.data : null;
            };

            var hasNoCaretPlaceholder = function (node) {
                var childNode = getSingleChildNode(node);
                var chr = getSingleChr(node);
                return childNode && !isTextNode(childNode) || chr && !isNBSP(chr);
            };

            var isEmptyNode = function (node) {
                return ed.dom.isEmpty(node) || isNBSP(getSingleChr(node));
            };

            var isNBSP = function (chr) {
                return chr === '\u00a0';
            };

            ed.onKeyDown.add(function (e) {
                if (!deleteBtnPressed(e)) {
                    return;
                }

                var container = ed.dom.getParent(ed.selection.getStart(), 'caption');

                if (!isTableCaptionNode(container)) {
                    return;
                }

                // in IE caption collapses if caret placeholder is deleted (and it is very much possible)
                if (ibis.isIE) {
                    if (!ed.selection.isCollapsed()) {
                        // if the whole contents are selected, caret placeholder will be deleted too
                        // and we take over delete operation here to restore it if this happens
                        ed.undoManager.add();

                        ed.execCommand('Delete');
                        if (isEmptyNode(container)) {
                            // caret springs off from the caption (to the first td), we need to bring it back as well
                            restoreCaretPlaceholder(container, true);
                        }

                        e.preventDefault();
                    } else if (hasNoCaretPlaceholder(container)) {
                        // if caret placeholder got accidentally deleted and caption will collapse
                        // after this operation, we need to put placeholder back
                        restoreCaretPlaceholder(container);
                    }
                }

                // TODO:
                // 1. in Chrome it is easily possible to select beyond the boundaries of the caption,
                // currently this results in removal of the contents with the whole caption as well;
                // 2. we could take over delete operation to address this, but then we will need to adjust
                // the selection, otherwise delete operation will remove first row of the table too;
                // 3. current behaviour is logical, so it has sense to leave it like that, until a better
                // solution

                if (isEmptyNode(container)) {
                    e.preventDefault();
                }
            });
        }

        deleteTable();
        handleDeleteInCaption();

        fixDragSelection();

        if (ibis.isWebKit) {
            moveWebKitSelection();
            fixTableCellSelection();
        }

        if (ibis.isGecko) {
            fixBeforeTableCaretBug();
            fixTableCaretPos();
        }

        if (ibis.isIE > 9 || ibis.isIE12) {
            fixBeforeTableCaretBug();
            fixTableCaretPos();
        }

        // Add context menu
        if (ed && ed.plugins.contextmenu) {
            ed.plugins.contextmenu.onContextMenu.add(function (th, m, e) {
                var sm;
                //var el = ed.selection.getNode() || ed.getBody();

                if (ed.dom.getParent(e, 'td') || ed.dom.getParent(e, 'th') || ed.dom.select('td.mceSelected,th.mceSelected').length) {
                    m.add({
                        title: 'table.desc',
                        icon: 'table',
                        cmd: 'mceInsertTable',
                        value: {
                            action: 'insert'
                        }
                    });
                    m.add({
                        title: 'table.props_desc',
                        icon: 'table_props',
                        cmd: 'mceInsertTable'
                    });
                    m.add({
                        title: 'table.del',
                        icon: 'delete_table',
                        cmd: 'mceTableDelete'
                    });
                    m.addSeparator();

                    // Cell menu
                    sm = m.addMenu({
                        title: 'table.cell'
                    });
                    sm.add({
                        title: 'table.cell_desc',
                        icon: 'cell_props',
                        cmd: 'mceTableCellProps'
                    });
                    sm.add({
                        title: 'table.split_cells_desc',
                        icon: 'split_cells',
                        cmd: 'mceTableSplitCells'
                    });
                    sm.add({
                        title: 'table.merge_cells_desc',
                        icon: 'merge_cells',
                        cmd: 'mceTableMergeCells'
                    });

                    // Row menu
                    sm = m.addMenu({
                        title: 'table.row'
                    });
                    sm.add({
                        title: 'table.row_desc',
                        icon: 'row_props',
                        cmd: 'mceTableRowProps'
                    });
                    sm.add({
                        title: 'table.row_before_desc',
                        icon: 'row_before',
                        cmd: 'mceTableInsertRowBefore'
                    });
                    sm.add({
                        title: 'table.row_after_desc',
                        icon: 'row_after',
                        cmd: 'mceTableInsertRowAfter'
                    });
                    sm.add({
                        title: 'table.delete_row_desc',
                        icon: 'delete_row',
                        cmd: 'mceTableDeleteRow'
                    });
                    sm.addSeparator();
                    sm.add({
                        title: 'table.cut_row_desc',
                        icon: 'cut',
                        cmd: 'mceTableCutRow'
                    });
                    sm.add({
                        title: 'table.copy_row_desc',
                        icon: 'copy',
                        cmd: 'mceTableCopyRow'
                    });
                    sm.add({
                        title: 'table.paste_row_before_desc',
                        icon: 'paste',
                        cmd: 'mceTablePasteRowBefore'
                    }).setDisabled(!clipboardRows);
                    sm.add({
                        title: 'table.paste_row_after_desc',
                        icon: 'paste',
                        cmd: 'mceTablePasteRowAfter'
                    }).setDisabled(!clipboardRows);

                    // Column menu
                    sm = m.addMenu({
                        title: 'table.col'
                    });

                    sm.add({
                        title: 'table.col_before_desc',
                        icon: 'col_before',
                        cmd: 'mceTableInsertColBefore'
                    });
                    sm.add({
                        title: 'table.col_after_desc',
                        icon: 'col_after',
                        cmd: 'mceTableInsertColAfter'
                    });
                    sm.add({
                        title: 'table.delete_col_desc',
                        icon: 'delete_col',
                        cmd: 'mceTableDeleteCol'
                    });

                } else {
                    m.add({
                        title: 'table.desc',
                        icon: 'table',
                        cmd: 'mceInsertTable'
                    });
                }
            });
        }
    });

    var url = ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=table';

    // Register action commands
    each({
        mceTableSplitCells: function (grid) {
            grid.split();
        },
        mceTableInsertRowBefore: function (grid) {
            grid.insertRow(true);
        },
        mceTableInsertRowAfter: function (grid) {
            grid.insertRow();
        },
        mceTableInsertColBefore: function (grid) {
            grid.insertCol(true);
        },
        mceTableInsertColAfter: function (grid) {
            grid.insertCol();
        },
        mceTableDeleteCol: function (grid) {
            grid.deleteCols();
        },
        mceTableDeleteRow: function (grid) {
            grid.deleteRows();
        },
        mceTableCutRow: function (grid) {
            clipboardRows = grid.cutRows();
        },
        mceTableCopyRow: function (grid) {
            clipboardRows = grid.copyRows();
        },
        mceTablePasteRowBefore: function (grid) {
            grid.pasteRows(clipboardRows, true);
        },
        mceTablePasteRowAfter: function (grid) {
            grid.pasteRows(clipboardRows);
        },
        mceTableDelete: function (grid) {
            grid.deleteTable();
        }
    }, function (func, name) {
        ed.addCommand(name, function () {
            var grid = createTableGrid();

            if (grid) {
                func(grid);
                ed.execCommand('mceRepaint');
                cleanup();
            }
        });
    });

    // Register dialog commands
    each({
        mceInsertTable: function (val) {
            winMan.open({
                url: url,
                size: 'mce-modal-landscape-xlarge'
            }, {
                plugin_url: url,
                action: val ? val.action : 0,
                layout: "table"
            });
        },
        mceTableRowProps: function () {
            winMan.open({
                url: url + '&slot=row',
                size: 'mce-modal-landscape-xlarge'
            }, {
                plugin_url: url,
                layout: "row"
            });
        },
        mceTableCellProps: function () {
            winMan.open({
                url: url + '&slot=cell',
                size: 'mce-modal-landscape-xlarge'
            }, {
                plugin_url: url,
                layout: "cell"
            });
        }

    }, function (func, name) {
        ed.addCommand(name, function (ui, val) {
            func(val);
        });

    });

    // Enable tab key cell navigation
    if (ed.settings.table_tab_navigation !== false) {
        ed.onKeyDown.add(function (ed, e) {
            var cellElm, grid, delta;

            if (e.keyCode == 9) {
                cellElm = ed.dom.getParent(ed.selection.getStart(), 'th,td');

                if (cellElm) {
                    e.preventDefault();

                    grid = createTableGrid();
                    delta = e.shiftKey ? -1 : 1;

                    ed.undoManager.add();

                    if (!grid.moveRelIdx(cellElm, delta) && delta > 0) {
                        grid.insertRow();
                        grid.refresh();
                        grid.moveRelIdx(cellElm, delta);
                    }
                }
            }
        });
    }

    function mergeDialog(ed) {
        var cm = ed.controlManager, form = cm.createForm('table_merge_form');

        var colsCtrl = cm.createTextBox('table_merge_cols', {
            label: ed.getLang('table.cols', 'Columns'),
            name: 'cols',
            subtype: 'number',
            value: 1
        });

        form.add(colsCtrl);

        var rowsCtrl = cm.createTextBox('table_merge_rows', {
            label: ed.getLang('table.rows', 'Rows'),
            name: 'rows',
            subtype: 'number',
            value: 1
        });

        form.add(rowsCtrl);

        // Register commands
        ed.addCommand('mceTableMergeCells', function () {
            var grid = createTableGrid(), cell = ed.dom.getParent(ed.selection.getNode(), 'th,td');

            if (ed.dom.select('td.mceSelected,th.mceSelected').length) {
                grid.merge();

                ed.execCommand('mceRepaint');
                cleanup();
                return;
            }

            ed.windowManager.open({
                title: ed.getLang('table.merge_cells_desc', 'Merge Cells'),
                items: [form],
                size: 'mce-modal-landscape-small',
                open: function () {
                    var rowSpan = 1, colSpan = 1;

                    if (cell) {
                        rowSpan = cell.rowSpan;
                        colSpan = cell.colSpan;
                    }

                    colsCtrl.value(colSpan);
                    rowsCtrl.value(rowSpan);
                },
                buttons: [
                    {
                        title: ed.getLang('common.cancel', 'Cancel'),
                        id: 'cancel'
                    },
                    {
                        title: ed.getLang('update', 'Update'),
                        id: 'insert',
                        onsubmit: function (e) {
                            var data = form.submit();

                            grid.merge(cell, data.cols, data.rows);

                            ed.execCommand('mceRepaint');
                            cleanup();

                            Event.cancel(e);
                        },
                        classes: 'primary',
                        scope: self
                    }
                ]
            });
        });
    }

    function createDialogs() {
        var isMobile = window.matchMedia("(max-width: 600px)").matches;

        // use basic dialog if set in param or device screen size < 768px
        var isBasicDialog = ed.getParam('table_basic_dialog', false) || isMobile;

        showTableDialog(ed, isBasicDialog);
        showRowDialog(ed, isBasicDialog);
        showCellDialog(ed, isBasicDialog);
    }

    /**
     * Create Grid Control
     */
    this.createControl = function (n, cm) {
        function createMenuGrid(cols, rows) {
            var html = '<table role="presentation" class="mceTableSplitMenu"><tbody>';

            for (var i = 0; i < rows; i++) {
                html += '<tr>';

                for (var x = 0; x < cols; x++) {
                    html += '<td><a href="#"></a></td>';
                }

                html += '</tr>';
            }

            html += '</tbody>';
            html += '<tfoot><tr><td colspan="' + rows + '" class="mceTableGridCount">&nbsp;</td></tr></tfoot>';
            html += '</table>';

            return html;
        }

        function menuGridMouseOver(e) {
            var el = e.target;

            // might be <a> in table cell
            if (el.nodeName !== "TD") {
                el = el.parentNode;
            }
            // get tbody
            var tbody = DOM.getParent(el, 'tbody');

            // might be in footer, so return
            if (!tbody) {
                return;
            }
            // get all table rows
            var rows = tbody.childNodes;

            var row = el.parentNode,
                i, z;
            var x = ibis.inArray(row.childNodes, el),
                y = ibis.inArray(rows, row);

            if (x < 0 || y < 0) {
                return;
            }

            for (i = 0; i < rows.length; i++) {
                var cells = rows[i].childNodes;

                for (z = 0; z < cells.length; z++) {
                    if (z > x || i > y) {
                        DOM.removeClass(cells[z], 'selected');
                    } else {
                        DOM.addClass(cells[z], 'selected');
                    }
                }
            }

            DOM.setHTML(DOM.select('td.mceTableGridCount', n), (y + 1) + ' x ' + (x + 1));
        }

        function menuGridClick(e) {
            var el = e.target,
                bookmark = 0;

            if (el.nodeName !== "TD") {
                el = el.parentNode;
            }

            var table = DOM.getParent(el, 'table');

            var styles = [];
            var width = ed.getParam('table_default_width');

            if (/^[0-9\.]+$/.test(width)) {
                width += 'px';
            }

            // add width
            if (width) {
                styles.push('width:' + width);
            }

            var height = ed.getParam('table_default_height');

            if (/^[0-9\.]+$/.test(height)) {
                height += 'px';
            }

            // add height
            if (height) {
                styles.push('height:' + height);
            }

            var border = ed.getParam('table_default_border', '');

            // any value border will always be 1 in html5
            if (ed.settings.schema == 'html5' && ed.settings.validate) {
                if (border) {
                    border = 1;
                }
            }

            var html = '<table';

            if (border != '') {
                html += ' border="' + border + '"';
            }

            var align = ed.getParam('table_default_align', '');
            var classes = ed.getParam('table_classes', '');

            if (align != '' && ed.settings.schema === "html4") {
                html += ' align="' + align + '"';
            }

            if (align != '' && ed.settings.schema !== "html4") {
                if (align === "center") {
                    styles.push('margin-left: auto');
                    styles.push('margin-right: auto');
                } else {
                    styles.push('float: ' + align);
                }
            }

            if (classes) {
                html += ' class="' + classes + '"';
            }

            if (styles.length) {
                html += ' style="' + styles.join(';') + ';"';
            }
            html += '>';

            var rows = ibis.grep(DOM.select('tr', table), function (row) {
                return DOM.select('td.selected', row).length;
            });

            for (var y = 0; y < rows.length; y++) {
                html += "<tr>";

                var cols = DOM.select('td.selected', rows[y]).length;

                for (var x = 0; x < cols; x++) {
                    var fill = ed.settings.validate ? '<br data-mce-bogus="1"/>' : '&nbsp;';

                    html += '<td>' + fill + '</td>';
                }

                html += "</tr>";
            }
            html += "</table>";

            // restore bookmark
            if (bookmark) {
                ed.selection.moveToBookmark(bookmark);
                ed.focus();
                bookmark = 0;
            }

            insertTableHtml(ed, html);

            ed.addVisual();

            Event.cancel(e); // Prevent IE auto save warning

            return true;
        }

        if (n === "table_insert") {
            var c = cm.createSplitButton('table_insert', {
                title: 'table.desc',
                cmd: 'mceInsertTable',
                'class': 'mce_table'
            });

            c.onRenderMenu.add(function (c, m) {
                var sb, tm, sm;

                if (!ed.getParam('table_buttons', 1)) {
                    tm = m.addMenu({
                        title: 'table.desc',
                        icon: 'table',
                        cmd: 'mceInsertTable'
                    });
                    sb = tm.add({
                        "onmouseover": menuGridMouseOver,
                        "onclick": menuGridClick,
                        html: createMenuGrid(8, 8)
                    });
                } else {
                    sb = m.add({
                        "onmouseover": menuGridMouseOver,
                        "onclick": menuGridClick,
                        html: createMenuGrid(8, 8)
                    });
                }

                m.onShowMenu.add(function () {
                    var n = DOM.get(sb.id);

                    if (n) {
                        DOM.removeClass(DOM.select('.mceTableSplitMenu td', n), 'selected');
                        DOM.setHTML(DOM.select('.mceTableSplitMenu .mceTableGridCount', n), '&nbsp;');
                    }

                    var se = ed.selection,
                        el = se.getNode(),
                        n, p = DOM.getParent(el, 'table');

                    ibis.walk(m, function (o) {
                        if (o === sb || o === tm) {
                            return false;
                        }

                        if (o.settings.cmd) {
                            o.setDisabled(!p);
                        }

                    }, 'items', m);
                });

                if (!ed.getParam('table_buttons', 1)) {

                    m.add({
                        title: 'table.del',
                        icon: 'delete_table',
                        cmd: 'mceTableDelete'
                    });

                    m.addSeparator();

                    // Cell menu
                    sm = m.addMenu({
                        title: 'table.cell'
                    });
                    sm.add({
                        title: 'table.cell_desc',
                        icon: 'cell_props',
                        cmd: 'mceTableCellProps'
                    });
                    sm.add({
                        title: 'table.split_cells_desc',
                        icon: 'split_cells',
                        cmd: 'mceTableSplitCells'
                    });
                    sm.add({
                        title: 'table.merge_cells_desc',
                        icon: 'merge_cells',
                        cmd: 'mceTableMergeCells'
                    });

                    // Row menu
                    sm = m.addMenu({
                        title: 'table.row'
                    });
                    sm.add({
                        title: 'table.row_desc',
                        icon: 'row_props',
                        cmd: 'mceTableRowProps'
                    });
                    sm.add({
                        title: 'table.row_before_desc',
                        icon: 'row_before',
                        cmd: 'mceTableInsertRowBefore'
                    });
                    sm.add({
                        title: 'table.row_after_desc',
                        icon: 'row_after',
                        cmd: 'mceTableInsertRowAfter'
                    });
                    sm.add({
                        title: 'table.delete_row_desc',
                        icon: 'delete_row',
                        cmd: 'mceTableDeleteRow'
                    });

                    sm.addSeparator();

                    sm.add({
                        title: 'table.cut_row_desc',
                        icon: 'cut',
                        cmd: 'mceTableCutRow'
                    });
                    sm.add({
                        title: 'table.copy_row_desc',
                        icon: 'copy',
                        cmd: 'mceTableCopyRow'
                    });
                    sm.add({
                        title: 'table.paste_row_before_desc',
                        icon: 'paste',
                        cmd: 'mceTablePasteRowBefore'
                    });
                    sm.add({
                        title: 'table.paste_row_after_desc',
                        icon: 'paste',
                        cmd: 'mceTablePasteRowAfter'
                    });

                    // Column menu
                    sm = m.addMenu({
                        title: 'table.col'
                    });
                    sm.add({
                        title: 'table.col_before_desc',
                        icon: 'col_before',
                        cmd: 'mceTableInsertColBefore'
                    });
                    sm.add({
                        title: 'table.col_after_desc',
                        icon: 'col_after',
                        cmd: 'mceTableInsertColAfter'
                    });
                    sm.add({
                        title: 'table.delete_col_desc',
                        icon: 'delete_col',
                        cmd: 'mceTableDeleteCol'
                    });

                }
            });

            return c;
        }

        return null;
    };
});
