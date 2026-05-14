/**
* Copyright (c) 2009–2026 Ryan Demmer. All rights reserved.
 * Copyright (c) Moxiecode Systems AB. All rights reserved.
 * Copyright (c) 1999–2015 Ephox Corp. All rights reserved.
 * @note    Forked or includes code from TinyMCE 3.x/4.x/5.x (originally under LGPL 2.1) and relicensed under GPL v2+ per LGPL 2.1 § 3.
 * Licensed under the GNU General Public License version 2 or later (GPL v2+):
 * https://www.gnu.org/licenses/gpl-2.0.html
 */

var each = ibis.each;

export function mergeTableCells(ed, startCell, table) {
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

export function updateCell(ed, td, data) {
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

export function updateCells(ed, data) {
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

export function updateRow(ed, tr, data) {
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

export function updateRows(ed, data) {
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

export function insertTableHtml(ed, tableHtml) {
    // Move table
    if (ed.settings.fix_table_elements) {
        var patt = '';

        ed.focus();
        ed.selection.setContent('<br class="_mce_marker" />');

        ibis.each('h1,h2,h3,h4,h5,h6,p'.split(','), function (n) {
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
