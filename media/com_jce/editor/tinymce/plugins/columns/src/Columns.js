import Utils from "./Utils";

var each = tinymce.each;

function moveCaret(editor, node) {
    var rng = editor.dom.createRng();
    rng.setStart(node, 0);
    rng.setEnd(node, 0);
    rng.collapse();
    editor.selection.setRng(rng);
}

function isColumn(elm) {
    return elm && elm.nodeName == 'DIV' && elm.getAttribute('data-mce-type') == 'column';
}

function stackColumn(editor, value) {
    var node = getColumnNode(editor);

    if (node) {
        var parent = editor.dom.getParent(node, '.wf-columns');

        // remove existing stack classes
        each(['wf-columns-stack-small', 'wf-columns-stack-medium', 'wf-columns-stack-large'], function (cls) {
            editor.dom.removeClass(parent, cls);
        });

        // remove all stack classes
        if (!value) {
            return;
        }

        editor.dom.addClass(parent, 'wf-columns-stack-' + value);
    }
}

function removeColumn(editor) {
    var node = getColumnNode(editor);

    if (node) {
        var parent = editor.dom.getParent(node, '.wf-columns'),
            child;

        while ((child = node.firstChild)) {
            // remove empty element nodes
            if (editor.dom.isEmpty(child) && child.nodeType === 1) {
                editor.dom.remove(child);
            } else {
                // get the number of child columns, and the index of the current column
                var num = parent.childNodes.length,
                    idx = editor.dom.nodeIndex(node) + 1;
                // if in the first half of children, move contents before
                if (idx <= Math.ceil(num / 2)) {
                    editor.dom.insertBefore(child, parent);
                    // else move after
                } else {
                    editor.dom.insertAfter(child, parent);
                }
            }
        }

        editor.dom.remove(node);

        // find columns
        var cols = editor.dom.select('.wf-column', parent);

        if (!cols.length) {
            editor.dom.remove(parent, 1);
        } else {
            var col = cols[cols.length - 1];

            if (col) {
                moveCaret(editor, col.firstChild);
            }
        }

        editor.nodeChanged();
    }

    editor.undoManager.add();
}

function padColumn(editor, column) {
    var childBlock = (editor.settings.force_p_newlines ? 'p' : '') || editor.settings.forced_root_block;
    var columnContent = editor.dom.doc.createTextNode('\u00a0');

    if (childBlock) {
        columnContent = editor.dom.create(childBlock);

        if (!tinymce.isIE) {
            columnContent.innerHTML = '<br data-mce-bogus="1" />';
        }
    }

    editor.dom.add(column, columnContent);
}

function createColumn(editor) {
    /*var settings = editor.settings;

        var childBlock = (settings.force_p_newlines ? 'p' : '') || settings.forced_root_block;
        var columnContent = '&nbsp;';//'<br data-mce-bogus="1" />';

        if (childBlock) {
            columnContent = editor.dom.create(childBlock);

            if (!tinymce.isIE) {
                columnContent.innerHTML = '&nbsp;';//'<br data-mce-bogus="1" />';
            }
        }*/

    var col = editor.dom.create('div', {
        'class': 'wf-column',
        'data-mce-type': 'column'
    });

    padColumn(editor, col);

    return col;
}

function addColumn(editor, node, parentCol) {
    var node = getColumnNode(editor, node),
        col = createColumn(editor);

    if (node) {
        editor.dom.insertAfter(col, node);
    } else {
        editor.formatter.apply('column');
        col = editor.dom.get('__tmp');

        if (col) {
            col.parentNode.insertBefore(parentCol, col);
            parentCol.appendChild(col);
            // remove tmp id
            editor.dom.setAttrib(col, 'id', '');
        }
    }

    if (col && col.childNodes.length) {
        editor.selection.select(col.firstChild);
        editor.selection.collapse(1);

        editor.nodeChanged();
    }
}

function getColumnNode(editor, node) {
    node = node || editor.selection.getNode();

    if (node === editor.dom.getRoot()) {
        return null;
    }

    if (isColumn(node)) {
        return node;
    }

    return editor.dom.getParent(node, ".wf-column");
}

function getSelectedBlocks(editor) {
    var blocks = editor.selection.getSelectedBlocks();

    var nodes = tinymce.map(blocks, function (node) {
        if (node.nodeName === "LI") {
            return node.parentNode;
        }

        return node;
    });

    return nodes;
}

/*function createParent(editor, data) {
    var cls = ['wf-columns'];

    var stack = data.stack;
    var align = data.align;
    var num = data.columns;
    var layout = data.layout || 'auto';
    var gap = data.gap;

    if (stack) {
        cls.push('wf-columns-stack-' + stack);
    }

    if (align) {
        cls.push('wf-columns-align-' + align);
    }

    if (gap && gap !== 'medium') {
        cls.push('wf-columns-gap-' + gap);
    }

    // layout is always set
    cls.push('wf-columns-layout-' + layout);

    var parent = editor.dom.create('div', { 'class': cls.join(' '), 'data-mce-type': 'column });

    return parent;
}*/

function insertColumn(editor, data) {
    var node = getColumnNode(editor),
        parentCol;

    var cls = ['wf-columns'];

    var stack = data.stack;
    var align = data.align;
    var num = data.columns;
    var layout = data.layout || 'auto';
    var gap = data.gap;

    if (stack) {
        cls.push('wf-columns-stack-' + stack);
    }

    if (align) {
        cls.push('wf-columns-align-' + align);
    }

    if (gap && gap !== 'medium') {
        cls.push('wf-columns-gap-' + gap);
    }

    // layout is always set
    cls.push('wf-columns-layout-' + layout);

    // add classes
    if (data.classes) {
        cls = cls.concat(data.classes.split(' '));
    }

    // update
    if (node) {
        parentCol = editor.dom.getParent(node, '.wf-columns');

        /*var classes = parentCol.getAttribute('class');

        // remove all columns classes
        classes = tinymce.grep(classes.split(' '), function (val) {
            if (val.indexOf('wf-columns') === -1) {
                return val;
            }
        });

        // add columns classes
        classes = classes.concat(cls);*/

        // update
        editor.dom.setAttrib(parentCol, 'class', tinymce.trim(cls.join(' ')));

        var cols = editor.dom.select('.wf-column', parentCol),
            lastNode = cols[cols.length - 1];

        num = Math.max(num - cols.length, 0);
    } else {
        var nodes = getSelectedBlocks(editor),
            lastNode;

        if (nodes.length) {
            // get the last node in the selection
            lastNode = nodes[nodes.length - 1];
        }

        var columns = [],
            parentCol, newCol = createColumn(editor);

        if (num == 1) {
            editor.formatter.apply('column');

            newCol = editor.dom.get('__tmp') || nodes[0].parentNode;
            editor.dom.setAttrib(newCol, 'id', null);

            columns.push(newCol);

            num = 0;
        } else if (num < nodes.length) {

            var groups = Utils.partition(nodes, num);

            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];

                editor.dom.wrap(group, newCol, true);
                columns.push(group[0].parentNode);
            }

            num = 0;
        } else if (nodes.length) {
            // wrap nodes in a child column div
            each(nodes, function (node) {
                num--;

                if (isColumn(node) || isColumn(node.parentNode)) {
                    // use the parentNode as the parent column if none already exists
                    if (!parentCol) {
                        parentCol = editor.dom.getParent(node, '.wf-columns');
                    }

                    node = editor.dom.getParent(node, '.wf-column');

                    if (node) {
                        columns.push(node);
                    }

                    editor.dom.empty(parentCol);

                    return true;
                }

                if (editor.dom.isEmpty(node)) {
                    var elementRule = editor.schema.getElementRule(node.nodeName.toLowerCase());

                    if (elementRule && elementRule.paddEmpty) {
                        node.innerHTML = '<br data-mce-bogus="1" />';
                    }
                }

                // new column candidates without an existing parent
                editor.dom.wrap(node, newCol);

                columns.push(node.parentNode);
            });
            // edge case for forced_root_block:false when inserting on an empty line
        } else {
            parentCol = editor.dom.create('div', {
                'class': cls.join(' '),
                'data-mce-type': 'column'
            });

            var content = editor.selection.getContent();

            while (num--) {
                parentCol.appendChild(newCol.cloneNode(true));
            }

            if (content) {
                parentCol.firstChild.innerHTML = content;
            }

            editor.execCommand('mceInsertRawHtml', false, editor.dom.getOuterHTML(parentCol));

            return;
        }

        // no parent column exists yet, so create one and wrap the columns in it
        if (!parentCol) {
            parentCol = editor.dom.create('div', {
                'class': cls.join(' '),
                'data-mce-type': 'column'
            });
            editor.dom.wrap(columns, parentCol, true);
            // otherwise, append the columns to the existing parent
        } else {
            each(columns, function (column) {
                parentCol.appendChild(column);
            });
        }
    }

    // add new empty columns, after the last selected node
    if (num) {
        while (num--) {
            addColumn(editor, lastNode, parentCol);
        }
    }

    editor.undoManager.add();
    editor.nodeChanged();
}

export default {
    stackColumn: stackColumn,
    removeColumn: removeColumn,
    addColumn: addColumn,
    isColumn: isColumn,
    insertColumn: insertColumn,
    getSelectedBlocks: getSelectedBlocks,
    getColumnNode: getColumnNode,
    createColumn: createColumn,
    padColumn: padColumn
};