var TreeWalker = tinymce.dom.TreeWalker;

function setup(editor) {
    var resizing, dragging, dom = editor.dom,
        startColumn, startContainer, lastMouseOverTarget, hasSelection, selected = [];

    function cleanup(force) {
        // Restore selection possibilities
        editor.getBody().style.webkitUserSelect = '';

        if (force || hasSelection) {
            dom.removeClass(dom.select('div.wf-column.mceSelected'), 'mceSelected');
            hasSelection = false;
        }

        selected = [];
    }

    function isColumnInContainer(container, column) {
        if (!container || !column) {
            return false;
        }

        return container === dom.getParent(column, '.wf-columns');
    }

    editor.onSetContent.add(function () {
        cleanup(true);
    });

    editor.onKeyUp.add(function () {
        cleanup();
    });

    // Add cell selection logic
    editor.onMouseDown.add(function (ed, e) {
        if (e.button != 2) {
            cleanup();

            startColumn = dom.getParent(e.target, '.wf-column');
            startContainer = dom.getParent(startColumn, '.wf-columns');

            selected.push(startColumn);
        }
    });

    dom.bind(editor.getDoc(), 'mouseover', function (e) {
        var sel, target = e.target,
            currentColumn;

        if (resizing || dragging) {
            return;
        }

        // Fake mouse enter by keeping track of last mouse over
        if (target === lastMouseOverTarget) {
            return;
        }

        lastMouseOverTarget = target;

        if (startContainer && startColumn) {
            currentColumn = dom.getParent(target, '.wf-column');

            if (!isColumnInContainer(startContainer, currentColumn)) {
                currentColumn = dom.getParent(startContainer, '.wf-column');
            }

            // Selection inside first column is normal until we have expanded
            if (startColumn === currentColumn && !hasSelection) {
                return;
            }

            if (isColumnInContainer(startContainer, currentColumn)) {
                e.preventDefault();

                editor.getBody().style.webkitUserSelect = 'none';

                selected.push(currentColumn);

                dom.removeClass(dom.select('.wf-column'), 'mceSelected');

                dom.addClass(selected, 'mceSelected');

                hasSelection = true;

                // Remove current selection
                sel = editor.selection.getSel();

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

    editor.onMouseUp.add(function () {
        var rng, sel = editor.selection,
            selectedColumns, walker, node, lastNode;

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

        // Move selection to startColumn
        if (startColumn) {
            // Eexpand text selection
            selectedColumns = dom.select('div.wf-column.mceSelected');

            if (selectedColumns.length > 0) {
                var parent = dom.getParent(selectedColumns[0], '.wf-columns');

                rng = dom.createRng();
                node = selectedColumns[0];
                rng.setStartBefore(node);
                rng.setEndAfter(node);

                setPoint(node, 1);
                walker = new TreeWalker(node, parent);

                do {
                    if (node.nodeName == 'DIV') {
                        if (!dom.hasClass(node, 'mceSelected')) {
                            break;
                        }

                        lastNode = node;
                    }
                } while ((node = walker.next()));

                setPoint(lastNode);

                sel.setRng(rng);
            }

            selected = [];

            editor.nodeChanged();
            startColumn = startContainer = lastMouseOverTarget = null;
        }
    });
}

export default {
    setup : setup
};