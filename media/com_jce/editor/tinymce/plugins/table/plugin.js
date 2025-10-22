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

(function (tinymce) {
    var DOM = tinymce.DOM,
        Event = tinymce.dom.Event,
        each = tinymce.each,
        extend = tinymce.extend,
        VK = tinymce.VK,
        TreeWalker = tinymce.dom.TreeWalker,
        Delay = tinymce.util.Delay;

    function getSpanVal(td, name) {
        return parseInt(td.getAttribute(name) || 1, 10);
    }

    /**
     * Table Grid class.
     */
    function TableGrid(table, dom, selection, settings) {
        var grid, startPos, endPos, selectedCell, gridWidth;

        buildGrid();

        selectedCell = dom.getParent(selection.getStart(), 'th,td');

        if (selectedCell) {
            startPos = getPos(selectedCell);
            endPos = findEndPos();
            selectedCell = getCell(startPos.x, startPos.y);
        }

        function cloneNode(node, children) {
            node = node.cloneNode(children);
            node.removeAttribute('id');

            return node;
        }

        function buildGrid() {
            var startY = 0;

            grid = [];
            gridWidth = 0;

            each(['thead', 'tbody', 'tfoot'], function (part) {
                var rows = dom.select('> ' + part + ' tr', table);

                each(rows, function (tr, y) {
                    y += startY;

                    each(dom.select('> td, > th', tr), function (td, x) {
                        var x2, y2, rowspan, colspan;

                        // Skip over existing cells produced by rowspan
                        if (grid[y]) {
                            while (grid[y][x]) {
                                x++;
                            }
                        }

                        // Get col/rowspan from cell
                        rowspan = getSpanVal(td, 'rowspan');
                        colspan = getSpanVal(td, 'colspan');

                        // Fill out rowspan/colspan right and down
                        for (y2 = y; y2 < y + rowspan; y2++) {
                            if (!grid[y2]) {
                                grid[y2] = [];
                            }

                            for (x2 = x; x2 < x + colspan; x2++) {
                                grid[y2][x2] = {
                                    part: part,
                                    real: y2 == y && x2 == x,
                                    elm: td,
                                    rowspan: rowspan,
                                    colspan: colspan
                                };
                            }
                        }

                        gridWidth = Math.max(gridWidth, x + 1);
                    });
                });

                startY += rows.length;
            });
        }

        function getCell(x, y) {
            var row;

            row = grid[y];
            if (row) {
                return row[x];
            }
        }

        function setSpanVal(td, name, val) {
            if (td) {
                val = parseInt(val, 10);

                if (val === 1) {
                    td.removeAttribute(name, 1);
                } else {
                    td.setAttribute(name, val, 1);
                }
            }
        }

        function isCellSelected(cell) {
            return cell && (dom.hasClass(cell.elm, 'mceSelected') || cell == selectedCell);
        }

        function getSelectedRows() {
            var rows = [];

            each(table.rows, function (row) {
                each(row.cells, function (cell) {
                    if (dom.hasClass(cell, 'mceSelected') || cell == selectedCell.elm) {
                        rows.push(row);
                        return false;
                    }
                });
            });

            return rows;
        }

        function deleteTable() {
            var rng = dom.createRng();

            rng.setStartAfter(table);
            rng.setEndAfter(table);

            selection.setRng(rng);

            dom.remove(table);
        }

        function cloneCell(cell) {
            var formatNode, cloneFormats = {};

            if (settings.table_clone_elements) {
                cloneFormats = tinymce.makeMap((settings.table_clone_elements || 'strong em b i span font h1 h2 h3 h4 h5 h6 p div').toUpperCase(), /[ ,]/);
            }

            // Clone formats
            tinymce.walk(cell, function (node) {
                var curNode;

                if (node.nodeType == 3) {
                    each(dom.getParents(node.parentNode, null, cell).reverse(), function (node) {
                        if (!cloneFormats[node.nodeName]) {
                            return;
                        }

                        node = cloneNode(node, false);

                        if (!formatNode) {
                            formatNode = curNode = node;
                        } else if (curNode) {
                            curNode.appendChild(node);
                        }

                        curNode = node;
                    });

                    // Add something to the inner node
                    if (curNode) {
                        curNode.innerHTML = '<br data-mce-bogus="1" />';
                    }
                    return false;
                }
            }, 'childNodes');

            cell = cloneNode(cell, false);
            setSpanVal(cell, 'rowSpan', 1);
            setSpanVal(cell, 'colSpan', 1);

            if (formatNode) {
                cell.appendChild(formatNode);
            } else {
                if (!tinymce.isIE || tinymce.isIE11) {
                    cell.innerHTML = '<br data-mce-bogus="1" />';
                }
            }

            return cell;
        }

        function cleanup() {
            var rng = dom.createRng();

            // Empty rows
            each(dom.select('tr', table), function (tr) {
                if (tr.cells.length == 0) {
                    dom.remove(tr);
                }
            });

            // Empty table
            if (dom.select('tr', table).length == 0) {
                rng.setStartAfter(table);
                rng.setEndAfter(table);
                selection.setRng(rng);
                dom.remove(table);
                return;
            }

            // Empty header/body/footer
            each(dom.select('thead,tbody,tfoot', table), function (part) {
                if (part.rows.length == 0) {
                    dom.remove(part);
                }
            });

            // Restore selection to start position if it still exists
            buildGrid();

            // Restore the selection to the closest table position
            var row = grid[Math.min(grid.length - 1, startPos.y)];

            if (row) {
                selection.select(row[Math.min(row.length - 1, startPos.x)].elm, true);
                selection.collapse(true);
            }
        }

        function fillLeftDown(x, y, rows, cols) {
            var tr, x2, r, c, cell;

            tr = grid[y][x].elm.parentNode;
            for (r = 1; r <= rows; r++) {
                tr = dom.getNext(tr, 'tr');

                if (tr) {
                    // Loop left to find real cell
                    for (x2 = x; x2 >= 0; x2--) {
                        cell = grid[y + r][x2].elm;

                        if (cell.parentNode == tr) {
                            // Append clones after
                            for (c = 1; c <= cols; c++) {
                                dom.insertAfter(cloneCell(cell), cell);
                            }

                            break;
                        }
                    }

                    if (x2 == -1) {
                        // Insert nodes before first cell
                        for (c = 1; c <= cols; c++) {
                            tr.insertBefore(cloneCell(tr.cells[0]), tr.cells[0]);
                        }
                    }
                }
            }
        }

        function split() {
            each(grid, function (row, y) {
                each(row, function (cell, x) {
                    var colSpan, rowSpan, i;

                    if (isCellSelected(cell)) {
                        cell = cell.elm;
                        colSpan = getSpanVal(cell, 'colspan');
                        rowSpan = getSpanVal(cell, 'rowspan');

                        if (colSpan > 1 || rowSpan > 1) {
                            setSpanVal(cell, 'rowSpan', 1);
                            setSpanVal(cell, 'colSpan', 1);

                            // Insert cells right
                            for (i = 0; i < colSpan - 1; i++) {
                                dom.insertAfter(cloneCell(cell), cell);
                            }

                            fillLeftDown(x, y, rowSpan - 1, colSpan);
                        }
                    }
                });
            });
        }

        function merge(cell, cols, rows) {
            var startX, startY, endX, endY, x, y, startCell, endCell, cell, children, count, pos;

            // Use specified cell and cols/rows
            if (cell) {
                pos = getPos(cell);
                startX = pos.x;
                startY = pos.y;
                endX = startX + (cols - 1);
                endY = startY + (rows - 1);
            } else {
                startPos = endPos = null;

                // Calculate start/end pos by checking for selected cells in grid works better with context menu
                each(grid, function (row, y) {
                    each(row, function (cell, x) {
                        if (isCellSelected(cell)) {
                            if (!startPos) {
                                startPos = {
                                    x: x,
                                    y: y
                                };
                            }

                            endPos = {
                                x: x,
                                y: y
                            };
                        }
                    });
                });

                // Use selection
                startX = startPos.x;
                startY = startPos.y;
                endX = endPos.x;
                endY = endPos.y;
            }

            // Find start/end cells
            startCell = getCell(startX, startY);
            endCell = getCell(endX, endY);

            // Check if the cells exists and if they are of the same part for example tbody = tbody
            if (startCell && endCell && startCell.part == endCell.part) {
                // Split and rebuild grid
                split();
                buildGrid();

                // Set row/col span to start cell
                startCell = getCell(startX, startY).elm;
                setSpanVal(startCell, 'colSpan', (endX - startX) + 1);
                setSpanVal(startCell, 'rowSpan', (endY - startY) + 1);

                // Remove other cells and add it's contents to the start cell
                for (y = startY; y <= endY; y++) {
                    for (x = startX; x <= endX; x++) {
                        if (!grid[y] || !grid[y][x]) {
                            continue;
                        }

                        cell = grid[y][x].elm;

                        if (cell != startCell) {
                            // Move children to startCell
                            children = tinymce.grep(cell.childNodes);
                            each(children, function (node) {
                                startCell.appendChild(node);
                            });

                            // Remove bogus nodes if there is children in the target cell
                            if (children.length) {
                                children = tinymce.grep(startCell.childNodes);
                                count = 0;

                                // eslint-disable-next-line no-loop-func
                                each(children, function (node) {
                                    if (node.nodeName == 'BR' && dom.getAttrib(node, 'data-mce-bogus') && count++ < children.length - 1) {
                                        startCell.removeChild(node);
                                    }
                                });
                            }

                            // Remove cell
                            dom.remove(cell);
                        }
                    }
                }

                // Remove empty rows etc and restore caret location
                cleanup();
            }
        }

        function insertRow(before) {
            var posY, cell, lastCell, x, rowElm, newRow, newCell, otherCell, rowSpan;

            // Find first/last row
            each(grid, function (row, y) {
                each(row, function (cell, x) {
                    if (isCellSelected(cell)) {
                        cell = cell.elm;
                        rowElm = cell.parentNode;
                        newRow = cloneNode(rowElm, false);
                        posY = y;

                        if (before) {
                            return false;
                        }
                    }
                });

                if (before) {
                    return !posY;
                }
            });

            for (x = 0; x < grid[0].length; x++) {
                // Cell not found could be because of an invalid table structure
                if (!grid[posY][x]) {
                    continue;
                }

                cell = grid[posY][x].elm;

                if (cell != lastCell) {
                    if (!before) {
                        rowSpan = getSpanVal(cell, 'rowspan');
                        if (rowSpan > 1) {
                            setSpanVal(cell, 'rowSpan', rowSpan + 1);
                            continue;
                        }
                    } else {
                        // Check if cell above can be expanded
                        if (posY > 0 && grid[posY - 1][x]) {
                            otherCell = grid[posY - 1][x].elm;
                            rowSpan = getSpanVal(otherCell, 'rowSpan');
                            if (rowSpan > 1) {
                                setSpanVal(otherCell, 'rowSpan', rowSpan + 1);
                                continue;
                            }
                        }
                    }

                    // Insert new cell into new row
                    newCell = cloneCell(cell);
                    setSpanVal(newCell, 'colSpan', cell.colSpan);

                    newRow.appendChild(newCell);

                    lastCell = cell;
                }
            }

            if (newRow.hasChildNodes()) {
                if (!before) {
                    dom.insertAfter(newRow, rowElm);
                } else {
                    rowElm.parentNode.insertBefore(newRow, rowElm);
                }
            }
        }

        function insertCol(before) {
            var posX, lastCell;

            // Find first/last column
            each(grid, function (row, y) {
                each(row, function (cell, x) {
                    if (isCellSelected(cell)) {
                        posX = x;

                        if (before) {
                            return false;
                        }
                    }
                });

                if (before) {
                    return !posX;
                }
            });

            each(grid, function (row, y) {
                var cell, rowSpan, colSpan;

                if (!row[posX]) {
                    return;
                }

                cell = row[posX].elm;
                if (cell != lastCell) {
                    colSpan = getSpanVal(cell, 'colspan');
                    rowSpan = getSpanVal(cell, 'rowspan');

                    if (colSpan == 1) {
                        if (!before) {
                            dom.insertAfter(cloneCell(cell), cell);
                            fillLeftDown(posX, y, rowSpan - 1, colSpan);
                        } else {
                            cell.parentNode.insertBefore(cloneCell(cell), cell);
                            fillLeftDown(posX, y, rowSpan - 1, colSpan);
                        }
                    } else {
                        getSpanVal(cell, 'colSpan', cell.colSpan + 1);
                    }

                    lastCell = cell;
                }
            });
        }

        function deleteCols() {
            var cols = [];

            // Get selected column indexes
            each(grid, function (row, y) {
                each(row, function (cell, x) {
                    if (isCellSelected(cell) && tinymce.inArray(cols, x) === -1) {
                        each(grid, function (row) {
                            var cell = row[x].elm,
                                colSpan;

                            colSpan = getSpanVal(cell, 'colSpan');

                            if (colSpan > 1) {
                                setSpanVal(cell, 'colSpan', colSpan - 1);
                            } else {
                                dom.remove(cell);
                            }
                        });

                        cols.push(x);
                    }
                });
            });

            cleanup();
        }

        function deleteRows() {
            var rows;

            function deleteRow(tr) {
                var pos, lastCell;

                //var nextTr = dom.getNext(tr, 'tr');

                // Move down row spanned cells
                each(tr.cells, function (cell) {
                    var rowSpan = getSpanVal(cell, 'rowSpan');

                    if (rowSpan > 1) {
                        setSpanVal(cell, 'rowSpan', rowSpan - 1);
                        pos = getPos(cell);
                        fillLeftDown(pos.x, pos.y, 1, 1);
                    }
                });

                // Delete cells
                pos = getPos(tr.cells[0]);
                each(grid[pos.y], function (cell) {
                    var rowSpan;

                    cell = cell.elm;

                    if (cell != lastCell) {
                        rowSpan = getSpanVal(cell, 'rowSpan');

                        if (rowSpan <= 1) {
                            dom.remove(cell);
                        } else {
                            setSpanVal(cell, 'rowSpan', rowSpan - 1);
                        }

                        lastCell = cell;
                    }
                });
            }

            // Get selected rows and move selection out of scope
            rows = getSelectedRows();

            // Delete all selected rows
            each(rows.reverse(), function (tr) {
                deleteRow(tr);
            });

            cleanup();
        }

        function cutRows() {
            var rows = getSelectedRows();

            dom.remove(rows);
            cleanup();

            return rows;
        }

        function copyRows() {
            var rows = getSelectedRows();

            each(rows, function (row, i) {
                rows[i] = cloneNode(row, true);
            });

            return rows;
        }

        function pasteRows(rows, before) {
            // If we don't have any rows in the clipboard, return immediately
            if (!rows) {
                return;
            }

            var selectedRows = getSelectedRows(),
                targetRow = selectedRows[before ? 0 : selectedRows.length - 1],
                targetCellCount = targetRow.cells.length;

            // Calc target cell count
            each(grid, function (row) {
                var match;

                targetCellCount = 0;
                each(row, function (cell, x) {
                    if (cell.real) {
                        targetCellCount += cell.colspan;
                    }

                    if (cell.elm.parentNode == targetRow) {
                        match = 1;
                    }
                });

                if (match) {
                    return false;
                }
            });

            if (!before) {
                rows.reverse();
            }

            each(rows, function (row) {
                var cellCount = row.cells.length,
                    cell;

                // Remove col/rowspans
                for (var i = 0; i < cellCount; i++) {
                    cell = row.cells[i];
                    setSpanVal(cell, 'colSpan', 1);
                    setSpanVal(cell, 'rowSpan', 1);
                }

                // Needs more cells
                for (i = cellCount; i < targetCellCount; i++) {
                    row.appendChild(cloneCell(row.cells[cellCount - 1]));
                }

                // Needs less cells
                for (i = targetCellCount; i < cellCount; i++) {
                    dom.remove(row.cells[i]);
                }

                // Add before/after
                if (before) {
                    targetRow.parentNode.insertBefore(row, targetRow);
                } else {
                    dom.insertAfter(row, targetRow);
                }
            });

            // Remove current selection
            dom.removeClass(dom.select('td.mceSelected,th.mceSelected'), 'mceSelected');
        }

        function getPos(target) {
            var pos;

            each(grid, function (row, y) {
                each(row, function (cell, x) {
                    if (cell.elm == target) {
                        pos = {
                            x: x,
                            y: y
                        };
                        return false;
                    }
                });

                return !pos;
            });

            return pos;
        }

        function setStartCell(cell) {
            startPos = getPos(cell);
        }

        function findEndPos() {
            var maxX, maxY;

            maxX = maxY = 0;

            each(grid, function (row, y) {
                each(row, function (cell, x) {
                    var colSpan, rowSpan;

                    if (isCellSelected(cell)) {
                        cell = grid[y][x];

                        if (x > maxX) {
                            maxX = x;
                        }

                        if (y > maxY) {
                            maxY = y;
                        }

                        if (cell.real) {
                            colSpan = cell.colspan - 1;
                            rowSpan = cell.rowspan - 1;

                            if (colSpan) {
                                if (x + colSpan > maxX) {
                                    maxX = x + colSpan;
                                }
                            }

                            if (rowSpan) {
                                if (y + rowSpan > maxY) {
                                    maxY = y + rowSpan;
                                }
                            }
                        }
                    }
                });
            });

            return {
                x: maxX,
                y: maxY
            };
        }

        function setEndCell(cell) {
            var startX, startY, endX, endY, maxX, maxY, colSpan, rowSpan;

            endPos = getPos(cell);

            if (startPos && endPos) {
                // Get start/end positions
                startX = Math.min(startPos.x, endPos.x);
                startY = Math.min(startPos.y, endPos.y);
                endX = Math.max(startPos.x, endPos.x);
                endY = Math.max(startPos.y, endPos.y);

                // Expand end positon to include spans
                maxX = endX;
                maxY = endY;

                // Expand startX
                for (var y = startY; y <= maxY; y++) {
                    cell = grid[y][startX];

                    if (!cell.real) {
                        if (startX - (cell.colspan - 1) < startX) {
                            startX -= cell.colspan - 1;
                        }
                    }
                }

                // Expand startY
                for (var x = startX; x <= maxX; x++) {
                    cell = grid[startY][x];

                    if (!cell.real) {
                        if (startY - (cell.rowspan - 1) < startY) {
                            startY -= cell.rowspan - 1;
                        }
                    }
                }

                // Find max X, Y
                for (y = startY; y <= endY; y++) {
                    for (x = startX; x <= endX; x++) {
                        cell = grid[y][x];

                        if (cell.real) {
                            colSpan = cell.colspan - 1;
                            rowSpan = cell.rowspan - 1;

                            if (colSpan) {
                                if (x + colSpan > maxX) {
                                    maxX = x + colSpan;
                                }
                            }

                            if (rowSpan) {
                                if (y + rowSpan > maxY) {
                                    maxY = y + rowSpan;
                                }
                            }
                        }
                    }
                }

                // Remove current selection
                dom.removeClass(dom.select('td.mceSelected,th.mceSelected'), 'mceSelected');

                // Add new selection
                for (y = startY; y <= maxY; y++) {
                    for (x = startX; x <= maxX; x++) {
                        if (grid[y][x]) {
                            dom.addClass(grid[y][x].elm, 'mceSelected');
                        }
                    }
                }
            }
        }

        function moveRelIdx(cellElm, delta) {
            var pos, index, cell;

            pos = getPos(cellElm);
            index = pos.y * gridWidth + pos.x;

            do {
                index += delta;
                cell = getCell(index % gridWidth, Math.floor(index / gridWidth));

                if (!cell) {
                    break;
                }

                if (cell.elm != cellElm) {
                    selection.select(cell.elm, true);

                    if (dom.isEmpty(cell.elm)) {
                        selection.collapse(true);
                    }

                    return true;
                }
            } while (cell.elm == cellElm);

            return false;
        }

        // Expose to public
        tinymce.extend(this, {
            deleteTable: deleteTable,
            split: split,
            merge: merge,
            insertRow: insertRow,
            insertCol: insertCol,
            deleteCols: deleteCols,
            deleteRows: deleteRows,
            cutRows: cutRows,
            copyRows: copyRows,
            pasteRows: pasteRows,
            getPos: getPos,
            setStartCell: setStartCell,
            setEndCell: setEndCell,
            moveRelIdx: moveRelIdx,
            refresh: buildGrid
        });
    }

    function mergeTableCells(ed, startCell, table) {
        var dom = ed.dom;
        var existingTable = dom.getParent(startCell, 'table');

        var startRowIndex = startCell.parentNode.rowIndex;
        var startColIndex = Array.prototype.indexOf.call(startCell.parentNode.cells, startCell);

        var maxCellsInNewContent = 0;

        // Determine the maximum number of cells in the pasted content
        for (var i = 0; i < table.rows.length; i++) {
            maxCellsInNewContent = Math.max(maxCellsInNewContent, table.rows[i].cells.length);
        }

        // Calculate the required number of cells for the target row
        var requiredCellCount = startColIndex + maxCellsInNewContent;

        // Determine how many extra cells the target row needs
        var extraCellsNeeded = 0;
        var targetRow = existingTable.rows[startRowIndex];
        if (targetRow) {
            extraCellsNeeded = Math.max(0, requiredCellCount - targetRow.cells.length);
        }

        // Adjust rows in the table (before, including, and after the target row)
        for (var i = 0; i < existingTable.rows.length; i++) {
            var currentRow = existingTable.rows[i];

            // Skip header rows (rows in <thead> or containing <th>)
            if (currentRow.parentNode.tagName === 'THEAD' || currentRow.cells[0].tagName === 'TH') {
                continue;
            }

            // Expand the current row by the same number of extra cells as added to the target row
            for (var j = 0; j < extraCellsNeeded; j++) {
                currentRow.insertCell(-1).innerHTML = '<br data-mce-bogus="1" />';
            }
        }

        // Expand header rows in the <thead> section
        if (extraCellsNeeded > 0) {
            var headerRows = existingTable.querySelectorAll('thead > tr');
            headerRows.forEach(function (headerRow) {
                for (var i = 0; i < extraCellsNeeded; i++) {
                    var newCell = dom.create('th'); // Create <th> for header rows
                    newCell.innerHTML = '<br data-mce-bogus="1" />';
                    headerRow.appendChild(newCell);
                }
            });
        }

        // Add new rows if the pasted content exceeds the table's current size
        var totalRowsNeeded = startRowIndex + table.rows.length;
        while (existingTable.rows.length < totalRowsNeeded) {
            var newRow = existingTable.insertRow(-1);
            // Add the same number of extra cells to newly created rows
            for (var i = 0; i < requiredCellCount; i++) {
                newRow.insertCell(-1).innerHTML = '<br data-mce-bogus="1" />';
            }
        }

        // Merge the pasted table content into the target table
        for (var i = 0; i < table.rows.length; i++) {
            var currentRow = existingTable.rows[startRowIndex + i] || existingTable.insertRow(startRowIndex + i);

            for (var j = 0; j < table.rows[i].cells.length; j++) {
                var targetCellIndex = startColIndex + j;

                // Ensure targetCellIndex is within the currentRow's cell length
                while (currentRow.cells.length <= targetCellIndex) {
                    currentRow.insertCell(-1).innerHTML = '<br data-mce-bogus="1" />';
                }

                // Ensure the cell has content
                var cell = table.rows[i].cells[j];

                if (cell.innerHTML.trim() === '') {
                    cell.innerHTML = '<br data-mce-bogus="1" />';
                }

                var currentCell = currentRow.cells[targetCellIndex];
                currentCell.innerHTML = cell.innerHTML;
            }
        }

        return true;
    }

    function updateCell(ed, td, data) {
        var doc = ed.getDoc();

        var curCellType = td.nodeName.toLowerCase();

        ed.dom.setAttrib(td, 'style', data.style);
        ed.dom.setAttrib(td, 'class', data['class']);

        if (curCellType != data.celltype) {
            // changing to a different node type
            var newCell = doc.createElement(data.celltype);

            for (var c = 0; c < td.childNodes.length; c++) {
                newCell.appendChild(td.childNodes[c].cloneNode(1));
            }

            for (var a = 0; a < td.attributes.length; a++) {
                ed.dom.setAttrib(newCell, td.attributes[a].name, ed.dom.getAttrib(td, td.attributes[a].name));
            }

            td.parentNode.replaceChild(newCell, td);
            td = newCell;
        }

        return td;
    }

    function updateCells(ed, data) {
        var elm = ed.selection.getStart(), tdElm = ed.dom.getParent(elm, "td,th"), tableElm = ed.dom.getParent(elm, "table");

        var cells = ed.dom.select('td.mceSelected,th.mceSelected', tableElm);

        if (!cells.length) {
            cells.push(tdElm);
        }

        // Update all selected sells
        each(cells, function (td) {
            updateCell(ed, td, data);
        });

        ed.addVisual();
        ed.nodeChanged();
        ed.undoManager.add();
    }

    function updateRow(ed, tr, data) {
        var dom = ed.dom,
            doc = ed.getDoc();

        var curRowType = tr.parentNode.nodeName.toLowerCase();
        var rowtype = data.rowtype;

        var tableElm = dom.getParent(ed.selection.getStart(), "table");
        var rows = tableElm.rows;

        if (!rows.length) {
            rows.push(tr);
        }

        dom.setAttrib(tr, 'style', data.style);
        dom.setAttrib(tr, 'class', data['class']);

        // Setup new rowtype
        if (curRowType != rowtype && !data.skip_parent) {
            // first, clone the node we are working on
            var newRow = tr.cloneNode(1);

            // next, find the parent of its new destination (creating it if necessary)
            var theTable = dom.getParent(tr, "table");
            var dest = rowtype;
            var newParent = null;

            for (var i = 0; i < theTable.childNodes.length; i++) {
                if (theTable.childNodes[i].nodeName.toLowerCase() == dest) {
                    newParent = theTable.childNodes[i];
                }
            }

            if (newParent == null) {
                newParent = doc.createElement(dest);

                if (dest == "thead") {
                    if (theTable.firstChild.nodeName == 'CAPTION') {
                        ed.dom.insertAfter(newParent, theTable.firstChild);
                    } else {
                        theTable.insertBefore(newParent, theTable.firstChild);
                    }
                } else {
                    theTable.appendChild(newParent);
                }
            }

            // append the row to the new parent
            newParent.appendChild(newRow);

            // remove the original
            tr.parentNode.removeChild(tr);

            // set tr to the new node
            tr = newRow;

            // update all td cells in the header to th
            var cells = ed.dom.select('td', tr);

            each(cells, function (cell) {
                ed.dom.rename(cell, 'th');
            });
        }
    }

    function updateRows(ed, data) {
        var dom = ed.dom, trElm, tableElm;

        trElm = dom.getParent(ed.selection.getStart(), "tr");
        tableElm = dom.getParent(ed.selection.getStart(), "table");

        var rows = [], selectedCells = dom.select('td.mceSelected,th.mceSelected', trElm);

        // only the current row
        if (!selectedCells.length) {
            rows.push(trElm);
        } else {
            data.skip_parent = true;

            // all rows
            each(tableElm.rows, function (tr) {
                var i;

                for (i = 0; i < tr.cells.length; i++) {
                    if (dom.hasClass(tr.cells[i], 'mceSelected')) {
                        rows.push(tr);
                        return;
                    }
                }
            });
        }

        each(rows, function (tr) {
            updateRow(ed, tr, data);
        });

        ed.addVisual();
        ed.nodeChanged();
        ed.undoManager.add();
    }

    function insertTableHtml(ed, tableHtml) {
        // Move table
        if (ed.settings.fix_table_elements) {
            var patt = '';

            ed.focus();
            ed.selection.setContent('<br class="_mce_marker" />');

            tinymce.each('h1,h2,h3,h4,h5,h6,p'.split(','), function (n) {
                if (patt) {
                    patt += ',';
                }
                patt += n + ' ._mce_marker';
            });

            each(ed.dom.select(patt), function (n) {
                ed.dom.split(ed.dom.getParent(n, 'h1,h2,h3,h4,h5,h6,p'), n);
            });

            ed.dom.setOuterHTML(ed.dom.select('br._mce_marker')[0], tableHtml);
        } else {
            ed.execCommand('mceInsertContent', false, tableHtml);
        }
    }

    tinymce.PluginManager.add('table', function (ed, url) {
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

                ed.onSetContent.add(function (ed, e) {
                    cleanup(true);

                    each(ed.dom.select('table'), function (table) {
                        ed.dom.addClass(table, 'mce-item-table');
                        
                        // Ensure empty cells have a <br> to avoid empty cell issues
                        each(ed.dom.select('td,th', table), function (cell) {
                            if (!cell.hasChildNodes()) {
                                cell.innerHTML = '<br data-mce-bogus="1" />';
                            }
                        });
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

            //ed.selection.onGetContent.add(function (sel, o) {
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

            basicDialog();
            mergeDialog(ed);
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
            var p;

            n = ed.selection.getStart();
            p = ed.dom.getParent(n, 'td,th,caption');
            cm.setActive('table', n.nodeName === 'TABLE' || !!p);

            // Disable table tools if we are in caption
            if (p && p.nodeName === 'CAPTION') {
                p = 0;
            }

            if (ed.getParam('table_buttons', 1)) {
                cm.setDisabled('delete_table', !p);
                cm.setDisabled('delete_col', !p);
                cm.setDisabled('delete_table', !p);
                cm.setDisabled('delete_row', !p);
                cm.setDisabled('col_after', !p);
                cm.setDisabled('col_before', !p);
                cm.setDisabled('row_after', !p);
                cm.setDisabled('row_before', !p);
                cm.setDisabled('row_props', !p);
                cm.setDisabled('cell_props', !p);
                cm.setDisabled('split_cells', !p);
                cm.setDisabled('merge_cells', !p);

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
                tinymce.each('left,center,right,full'.split(','), function (name) {
                    var fmts = ed.formatter.get('align' + name);

                    tinymce.each(fmts, function (fmt) {
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
                            selectedTableCells = tinymce.grep(tableCells, function (cell) {
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
                                tinymce.each(selectedTableCells, clearCell);
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
                    if (tinymce.isIE) {
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

            if (tinymce.isWebKit) {
                moveWebKitSelection();
                fixTableCellSelection();
            }

            if (tinymce.isGecko) {
                fixBeforeTableCaretBug();
                fixTableCaretPos();
            }

            if (tinymce.isIE > 9 || tinymce.isIE12) {
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

        function showTableDialog(ed) {
            var cm = ed.controlManager, form = cm.createForm('table_form');

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

            form.add(colsCtrl);

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

            form.add(rowCtrl);

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

            form.add(cellspacingCtrl);

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

            form.add(cellpaddingCtrl);

            var widthCtrl = cm.createTextBox('table_width', {
                label: ed.getLang('table.width', 'Width'),
                name: 'width',
                value: ed.getParam('table_default_width', '')
            });

            form.add(widthCtrl);

            var heightCtrl = cm.createTextBox('table_height', {
                label: ed.getLang('table.height', 'Height'),
                name: 'height',
                value: ed.getParam('table_default_height', '')
            });

            form.add(heightCtrl);

            var stylesList = cm.createStylesBox('table_classes', {
                label: ed.getLang('table.classes', 'Classes'),
                onselect: function (v) { },
                name: 'classes',
                styles: ed.getParam('table_classes_custom', [])
            });

            form.add(stylesList);

            var captionCtrl = cm.createCheckBox('table_caption', {
                label: ed.getLang('table.caption', 'Caption'),
                name: 'caption'
            });

            form.add(captionCtrl);

            function setValue(key, value) {
                var ctrl = cm.get(ed.id + '_table_' + key);

                if (ctrl) {
                    ctrl.value(value);
                }
            }

            // Register commands
            ed.addCommand('mceInsertTable', function () {
                ed.windowManager.open({
                    title: ed.getLang('table.desc', 'Table'),
                    items: [form],
                    size: 'mce-modal-landscape-small',
                    open: function () {
                        var label = ed.getLang('insert', 'Insert'), elm = ed.dom.getParent(ed.selection.getNode(), "table");

                        var width, height, rows, cols, caption;

                        var classes = ed.getParam('table_classes', '');

                        classes.trim().split(' ').filter(function (cls) {
                            return cls.trim() !== '';
                        });

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

                            setValue('caption', caption);

                            rowCtrl.setDisabled(true);
                            colsCtrl.setDisabled(true);

                            setValue('cellspacing', elm.cellSpacing || '');
                            setValue('cellpadding', elm.cellPadding || '');

                            var styles = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                            width = styles.width || elm.width || '';
                            height = styles.height || elm.height || '';

                            // remove px value from width and height
                            width = width.replace('px', '');
                            height = height.replace('px', '');

                            setValue('width', width);
                            setValue('height', height);

                            classes = ed.dom.getAttrib(elm, 'class');

                            // clean
                            classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                                return cls.trim() !== '';
                            });
                        }

                        setValue('classes', classes);

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
                                var data = form.submit();

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

        function showRowDialog(ed) {
            var cm = ed.controlManager, form = cm.createForm('table_row_form');

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

            // Register commands
            ed.addCommand('mceTableRowProps', function () {
                ed.windowManager.open({
                    title: ed.getLang('table.row_desc', 'Table Rows'),
                    items: [form],
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

                        heightCtrl.value(height);
                        rowtypeCtrl.value(rowtype);

                        var classes = ed.dom.getAttrib(elm, 'class');

                        // clean
                        classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                            return cls.trim() !== '';
                        });

                        stylesList.value(classes);

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
                                var data = form.submit();

                                var elm = ed.dom.getParent(ed.selection.getStart(), "tr");
                                var selected = ed.dom.select('td.mceSelected,th.mceSelected', elm);

                                data.action = selected.length ? 'all' : 'insert';

                                data.style = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                                // add px to height if it is an integer
                                if (data.height && !isNaN(data.height)) {
                                    data.height += 'px';
                                }

                                data.style.height = data.height;

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

        function showCellDialog(ed) {
            var cm = ed.controlManager, form = cm.createForm('table_cell_form');

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

            // Register commands
            ed.addCommand('mceTableCellProps', function () {
                ed.windowManager.open({
                    title: ed.getLang('table.row_desc', 'Table Cells'),
                    items: [form],
                    size: 'mce-modal-landscape-small',
                    open: function () {
                        var label = ed.getLang('insert', 'Insert'), elm = ed.dom.getParent(ed.selection.getStart(), "td,th");

                        // Get table row data
                        var celltype = elm.nodeName.toLowerCase(), width = '', height = '';

                        if (elm) {
                            label = ed.getLang('update', 'Update');
                            width = elm.width || '';
                            height = elm.height || '';

                            var styles = ed.dom.parseStyle(ed.dom.getAttrib(elm, 'style'));

                            width = styles.width || '';
                            height = styles.height || '';
                        }

                        // remove px from width
                        width = width.replace('px', '');

                        // remove px from height
                        height = height.replace('px', '');

                        widthCtrl.value(width);
                        heightCtrl.value(height);
                        celltypeCtrl.value(celltype);

                        var classes = ed.dom.getAttrib(elm, 'class');

                        // clean
                        classes = classes.replace(/mce-[\w\-]+/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(function (cls) {
                            return cls.trim() !== '';
                        });

                        stylesList.value(classes);

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
                                var data = form.submit();

                                var elm = ed.dom.getParent(ed.selection.getStart(), "tr");

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
                var grid = createTableGrid();

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
                        var cell = ed.dom.getParent(ed.selection.getNode(), 'th,td'), rowSpan = 1, colSpan = 1;

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
                                var data = form.submit(), grid = createTableGrid(), node = ed.selection.getNode(), cell = ed.dom.getParent(node, 'th,td');

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

        function basicDialog() {
            var basic_dialog = ed.getParam('table_basic_dialog');

            var isMobile = window.matchMedia("(max-width: 600px)").matches;

            // use basic dialog if set in param or device screen size < 768px
            var isBasicDialog = basic_dialog || isMobile;

            if (!isBasicDialog) {
                return;
            }

            showTableDialog(ed);
            showRowDialog(ed);
            showCellDialog(ed);
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
                var x = tinymce.inArray(row.childNodes, el),
                    y = tinymce.inArray(rows, row);

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

                var rows = tinymce.grep(DOM.select('tr', table), function (row) {
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

                return Event.cancel(e); // Prevent IE auto save warning
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

                        tinymce.walk(m, function (o) {
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
})(tinymce);