(function () {
    'use strict';

    /* eslint-disable */

    // https://stackoverflow.com/questions/15579702/split-an-array-into-n-arrays-php/53130329#53130329
    function partition(array, maxrows) {
        var size = array.length;
        var columns = Math.ceil(size / maxrows);

        var fullrows = size - (columns - 1) * maxrows;
        var result = [];

        for (var i = 0; i < maxrows; ++i) {
            var n = array.splice(0, (i < fullrows ? columns : columns - 1));
            result.push(n);
        }

        return result;
    }

    function flattenObjectToArray(obj) {
        var values = [];

        for (var key in obj) {
            var value = obj[key];
            
            if (!value) {
                return true;
            }

            if (tinymce.is(value, 'function')) {
                return true;
            }

            if (tinymce.is(value, 'object')) {
                value = flattenObjectToArray(value);
            }

            if (typeof value === 'string') {
                value = value.split(' ');
            }

            values = values.concat(value);
        }

        return values;
    }

    var Utils = {
        flattenObjectToArray : flattenObjectToArray,
        partition : partition
    };

    var each$3 = tinymce.each;

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
            each$3(['wf-columns-stack-small', 'wf-columns-stack-medium', 'wf-columns-stack-large'], function (cls) {
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
                each$3(nodes, function (node) {
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
                each$3(columns, function (column) {
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

    var Columns = {
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

    var TreeWalker$1 = tinymce.dom.TreeWalker;

    function setup(editor) {
        var dom = editor.dom,
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
                var walker = new TreeWalker$1(node, node);

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
                    walker = new TreeWalker$1(node, parent);

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

    var DragSelection = {
        setup : setup
    };

    var DOM$2 = tinymce.DOM,
        each$2 = tinymce.each;

    var mapLayout$1 = function (str) {
        var cls;

        switch (str) {
            case '1-2':
            case '2-1':
                cls = '8';
                break;
            case '1-3':
            case '3-1':
                cls = '9';
                break;
            case '2-1-1':
            case '1-1-2':
            case '1-2-1':
                cls = '6';
                break;
            case '4-1':
            case '1-4':
                cls = '10';
                break;
            case '2-1-1-1':
            case '1-1-1-2':
                cls = '5';
                break;
            case '3-2':
            case '1-1-3':
            case '3-1-1':
                cls = '7';
                break;
            case 'col-sm-8':
            case 'col-md-8':
            case 'col-lg-8':
            case 'col-xl-8':
                cls = ['2-1', '1-2'];
                break;
            case 'col-sm-9':
            case 'col-md-9':
            case 'col-lg-9':
            case 'col-xl-9':
                cls = ['3-1', '1-3'];
                break;
            case 'col-sm-6':
            case 'col-md-6':
            case 'col-lg-6':
            case 'col-xl-6':
                cls = ['2-1-1', '1-2-1', '1-1-2'];
                break;
            case 'col-sm-10':
            case 'col-md-10':
            case 'col-lg-10':
            case 'col-xl-10':
                cls = ['4-1', '1-4'];
                break;
            case 'col-sm-5':
            case 'col-md-5':
            case 'col-lg-5':
            case 'col-xl-5':
                cls = ['2-1-1-1', '1-1-1-2'];
                break;
            case 'col-sm-7':
            case 'col-md-7':
            case 'col-lg-7':
            case 'col-xl-7':
                cls = ['3-2', '1-1-3', '3-1-1', '2-3'];
                break;
        }

        return cls;
    };

    function apply$1(elm) {
        var classes = elm.getAttribute('class'),
            suffix = '',
            layout = '';

        //DOM.addClass(elm, 'd-flex');
        DOM$2.addClass(elm, 'row');

        var suffixMap = function (val) {
            var map = {
                'small': '-sm',
                'medium': '-md',
                'large': '-lg',
                'xlarge': '-xl'
            };
            return map[val] || '';
        };

        // stack width
        if (classes.indexOf('wf-columns-stack-') !== -1) {
            var stack = /wf-columns-stack-(small|medium|large|xlarge)/.exec(classes)[1];

            suffix = suffixMap(stack);

            DOM$2.addClass(DOM$2.select('.wf-column', elm), 'col' + suffix);
        }

        // layout
        if (classes.indexOf('wf-columns-layout-') !== -1) {
            layout = /wf-columns-layout-([0-9-]+|auto)/.exec(classes)[1];

            if (layout === 'auto') {
                DOM$2.addClass(DOM$2.select('.wf-column', elm), 'col' + suffix);
            } else {
                var pos = layout.split('-').shift(),
                    cls = 'col' + suffix + '-' + mapLayout$1(layout);
                // first-child
                if (parseInt(pos, 10) > 1) {
                    DOM$2.addClass(DOM$2.select('.wf-column:first-child', elm), cls);
                    // nth-child
                } else if (layout === '1-2-1') {
                    DOM$2.addClass(DOM$2.select('.wf-column:nth(2)', elm), cls);
                    // last child
                } else if (parseInt(pos, 10) === 1) {
                    DOM$2.addClass(DOM$2.select('.wf-column:last-child', elm), cls);
                }
            }
        }

        // gap
        if (classes.indexOf('wf-columns-gap-') !== -1) {
            var gap = /wf-columns-gap-(small|medium|large|none)/.exec(classes)[1];

            suffix = suffixMap(gap) || '-none';

            DOM$2.addClass(elm, 'flex-gap' + suffix);
        }
    }

    function remove$1(elm) {
        // check for identifying class
        if (!DOM$2.hasClass(elm, 'row')) {
            return;
        }

        // array of classes used for the layout
        var layoutClasses = [
            'col-sm', 'col-md', 'col-lg', 'col-xl',
            'col-sm-8', 'col-md-8', 'col-lg-8', 'col-xl-8',
            'col-sm-9', 'col-md-9', 'col-lg-9', 'col-xl-9',
            'col-sm-10', 'col-md-10', 'col-lg-10', 'col-xl-10',
            'col-sm-5', 'col-md-5', 'col-lg-5', 'col-xl-5',
            'col-sm-7', 'col-md-7', 'col-lg-7', 'col-xl-7'
        ];

        var classes = elm.getAttribute('class'),
            stack = '',
            layout = 'wf-columns-layout-auto';
        var nodes = DOM$2.select('div[class*="col"]', elm);

        var suffixMap = function (val) {
            var map = {
                'sm': 'small',
                'md': 'medium',
                'lg': 'large',
                'xl': 'xlarge'
            };
            return map[val] || '';
        };

        each$2(nodes, function (node, i) {
            var cls = node.getAttribute('class');

            // has a width class
            if (cls && cls.indexOf('col-') !== -1) {
                var match, values = [];

                // remove existing classes
                each$2(cls.split(' '), function (val) {
                    if (val && val.indexOf('col-') == 0) {
                        match = /col-(sm|md|lg|xl)(-[0-9]+)?/.exec(val);

                        if (match && tinymce.inArray(layoutClasses, match[0]) != -1) {
                            DOM$2.removeClass(node, match[0]);
                        }
                    }
                });

                if (match) {
                    values = mapLayout$1(match[0]);

                    var suffix = suffixMap(match[1]);

                    if (suffix) {
                        stack = 'wf-columns-stack-' + suffix;
                    }

                    if (values) {
                        // first child
                        if (i === 0) {
                            layout = 'wf-columns-layout-' + values[0];
                            // last child
                        } else if (i === nodes.length - 1) {
                            layout = 'wf-columns-layout-' + values[values.length - 1];
                            // middle...?
                        } else {
                            layout = 'wf-columns-layout-' + values[1];
                        }
                    }
                }
            }

            DOM$2.removeClass(node, 'col');
        });

        // get gap width
        if (classes.indexOf('flex-gap-') !== -1) {
            var gap = /flex-gap-(none|sm|md|lg)?/.exec(classes)[1];

            if (gap && gap !== 'md') {
                var suffix = suffixMap(gap) || 'none';

                DOM$2.addClass(elm, 'wf-columns-gap-' + suffix);

                // remove existing
                DOM$2.removeClass(elm, 'uk-flex-gap-' + gap);
            }
        }


        // add stack and layout classes
        DOM$2.addClass(elm, layout);
        DOM$2.addClass(elm, stack);

        // remove all classes
        each$2(['row', 'col', 'col-sm', 'col-md', 'col-lg', 'col-xl', 'flex-gap-sm', 'flex-gap-md', 'flex-gap-lg', 'flex-gap-none'], function (cls) {
            DOM$2.removeClass(elm, cls);
        });
    }

    var Bootstrap = {
        apply : apply$1,
        remove : remove$1
    };

    var DOM$1 = tinymce.DOM,
        each$1 = tinymce.each;

    var mapLayout = function (str) {
        var cls;

        switch (str) {
            case '1-2':
            case '2-1':
                cls = 'uk-width-2-3';
                break;
            case '1-3':
            case '3-1':
                cls = 'uk-width-3-4';
                break;
            case '2-1-1':
            case '1-1-2':
            case '1-2-1':
                cls = 'uk-width-1-2';
                break;
            case '4-1':
            case '1-4':
                cls = 'uk-width-1-5';
                break;
            case '2-1-1-1':
            case '1-1-1-2':
                cls = 'uk-width-2-5';
                break;
            case '1-1-3':
            case '2-3':
                cls = 'uk-width-3-5';
                break;
            case '3-1-1':
            case '3-2':
                cls = 'uk-width-3-5';
                break;
            case 'uk-width-2-3':
                cls = ['2-1', '1-2'];
                break;
            case 'uk-width-3-4':
                cls = ['3-1', '1-3'];
                break;
            case 'uk-width-1-2':
                cls = ['2-1-1', '1-2-1', '1-1-2'];
                break;
            case 'uk-width-1-5':
                cls = ['4-1', '1-4'];
                break;
            case 'uk-width-2-5':
                cls = ['2-1-1-1', '1-1-1-2'];
                break;
            case 'uk-width-3-5':
                cls = ['3-2', '1-1-3', '3-1-1', '2-3'];
                break;
        }

        return cls;
    };

    function apply(elm) {
        var classes = elm.getAttribute('class'),
            suffix = [],
            layout = '';

        DOM$1.addClass(elm, 'uk-flex');

        var suffixMap = function (val) {
            var map = {
                'small': '@s',
                'medium': '@m',
                'large': '@l',
                'xlarge': '@xl'
            };
            return map[val] || '';
        };

        // get stack width
        if (classes.indexOf('wf-columns-stack-') !== -1) {
            var stack = /wf-columns-stack-(small|medium|large|xlarge)/.exec(classes)[1];
            suffix = ['-' + stack, suffixMap(stack)]; // @s, @m, @l, @xl

            DOM$1.addClass(elm, 'uk-flex-wrap');
        }

        // get layout
        if (classes.indexOf('wf-columns-layout-') !== -1) {
            layout = /wf-columns-layout-([0-9-]+|auto)/.exec(classes)[1];

            if (layout === 'auto') {
                DOM$1.addClass(DOM$1.select('.wf-column', elm), 'uk-flex-auto uk-flex-item-auto');
            } else {
                var weights = layout.split('-'), first = parseInt(weights[0], 10), last = parseInt(weights[weights.length - 1], 10);
                var cls = '';

                each$1(suffix, function (sfx) {
                    cls += ' ' + mapLayout(layout) + sfx;
                });

                cls = tinymce.trim(cls);

                // first-child
                if (first > last) {
                    DOM$1.addClass(DOM$1.select('.wf-column:first-child', elm), cls);
                    // nth-child
                } else if (layout === '1-2-1') {
                    DOM$1.addClass(DOM$1.select('.wf-column:nth(2)', elm), cls);
                    // last child
                } else {
                    DOM$1.addClass(DOM$1.select('.wf-column:last-child', elm), cls);
                }
            }
        }

        // uikit default
        var gap = 'medium';

        // gap
        if (classes.indexOf('wf-columns-gap-') !== -1) {
            gap = /wf-columns-gap-(small|medium|large|none)/.exec(classes)[1];
        }

        DOM$1.addClass(elm, 'uk-flex-gap-' + gap);

        each$1(suffix, function (sfx) {
            DOM$1.addClass(elm, 'uk-child-width-expand' + sfx);
        });
    }

    function remove(elm) {
        // check for identifying class
        if (!DOM$1.hasClass(elm, 'uk-flex')) {
            return;
        }

        var suffixMap = function (val) {
            var map = {
                '@s': 'small',
                '@m': 'medium',
                '@l': 'large',
                '@xl': 'xlarge'
            };
            return map[val] || '';
        };

        var classes = elm.getAttribute('class');

        // get stack width
        if (classes.indexOf('uk-child-width-expand@') !== -1) {
            var stack = /uk-child-width-expand(@s|@m|@l|@xl)/.exec(classes);

            if (stack) {
                var suffix = suffixMap(stack[1]);

                if (suffix) {
                    DOM$1.addClass(elm, 'wf-columns-stack-' + suffix);
                }

                DOM$1.removeClass(elm, stack[0]);
            }

            // remove wrap class
            DOM$1.removeClass(elm, 'uk-flex-wrap');
        }

        // get gap width
        if (classes.indexOf('uk-flex-gap-') !== -1) {
            var gap = /uk-flex-gap-(none|small|medium|large)/.exec(classes)[1];

            if (gap) {
                DOM$1.addClass(elm, 'wf-columns-gap-' + gap);

                // remove existing
                DOM$1.removeClass(elm, 'uk-flex-gap-' + gap);
            }
        }

        // get child columns
        var nodes = tinymce.grep(elm.childNodes, function (node) {
            if (node.nodeName === "DIV") {
                return node;
            }
        });

        var layout = 'wf-columns-layout-auto';

        each$1(nodes, function (node, i) {
            var cls = node.getAttribute('class');

            // has a width class
            if (cls && cls.indexOf('uk-width-') !== -1) {
                var rx = /uk-width-([0-9-]+)(?:@s|@m|@l|@xl|-small|-medium|-large|-xlarge)/g,
                    match = rx.exec(cls),
                    values = [];

                // extract layout
                if (match) {
                    values = mapLayout('uk-width-' + match[1]);
                }

                // remove all matching classes
                each$1(cls.match(rx), function (str) {
                    DOM$1.removeClass(node, str);
                });

                if (!values.length) {
                    return true;
                }

                // first child
                if (i === 0) {
                    layout = 'wf-columns-layout-' + values[0];
                    // last child
                } else if (i === nodes.length - 1) {
                    layout = 'wf-columns-layout-' + values[values.length - 1];
                    // middle...?
                } else {
                    layout = 'wf-columns-layout-' + values[1];
                }
            }

            DOM$1.removeClass(node, 'uk-flex-auto');
            DOM$1.removeClass(node, 'uk-flex-item-auto');
        });

        DOM$1.removeClass(elm, 'uk-flex');

        DOM$1.addClass(elm, layout);

        // remove all classes
        each$1(['uk-flex', 'uk-child-width-expand', 'uk-flex-wrap', 'uk-child-width-expand@s', 'uk-child-width-expand@m', 'uk-child-width-expand@l', 'uk-child-width-expand@xl', 'uk-child-width-expand-small', 'uk-child-width-expand-medium', 'uk-child-width-expand-large', 'uk-child-width-expand-xlarge', 'uk-flex-auto', 'uk-flex-item-auto', 'uk-width-2-3', 'uk-width-3-4', 'uk-width-1-2'], function (cls) {
            DOM$1.removeClass(elm, cls);
        });
    }

    var UIKit = {
        apply : apply,
        remove : remove
    };

    var DOM = tinymce.DOM,
        each = tinymce.each,
        VK = tinymce.VK,
        Event = tinymce.dom.Event,
        TreeWalker = tinymce.dom.TreeWalker;

    tinymce.create('tinymce.plugins.Columns', {
        init: function (editor, url) {
            this.editor = editor;
            this.url = url;

            var framework = editor.getParam('columns_framework', '');

            function onSetContent(editor, o) {                        
                var columns = editor.dom.select('[data-wf-columns], .wf-columns');

                each(columns, function (column) {
                    editor.dom.addClass(column, 'wf-columns');

                    if (framework) {
                        editor.dom.addClass(column, 'wf-columns-' + framework);
                    }

                    each(column.childNodes, function (node) {
                        if (node.nodeName !== "DIV") {
                            return true;
                        }

                        editor.dom.addClass(node, 'wf-column');

                        node.setAttribute('data-mce-type', 'column');
                    });

                    // uikit
                    UIKit.remove(column);

                    // bootstrap
                    Bootstrap.remove(column);

                    each(editor.dom.select('div,p', column), function (block) {
                        if (block.innerHTML == '&nbsp;' || !block.hasChildNodes()) {
                            block.innerHTML = '<br data-mce-bogus="1" />';
                        }
                    });
                });
            }

            editor.onPreProcess.add(function (editor, o) {
                var nodes = editor.dom.select('.wf-columns', o.node);

                each(nodes, function (elm) {
                    // set identifier
                    elm.setAttribute('data-wf-columns', 1);
                    // remove internal class
                    //elm.removeAttribute('data-mce-type');

                    // remove child classes
                    each(editor.dom.select('.wf-column', elm), function (node) {
                        // remove internal class
                        //node.removeAttribute('data-mce-type');
                    });

                    // generic framework, leave classes intact
                    if (!framework) {
                        return true;
                    }

                    // uikit
                    if (framework === "uikit") {
                        UIKit.apply(elm);
                    }

                    // bootstrap
                    if (framework === "bootstrap") {
                        Bootstrap.apply(elm);
                    }

                    var classes = elm.getAttribute('class');

                    // clean up classes
                    each(classes.split(' '), function (val) {
                        if (val.indexOf('wf-columns') !== -1) {
                            editor.dom.removeClass(elm, val);
                        }
                    });

                    // remove child classes
                    editor.dom.removeClass(editor.dom.select('.wf-column', elm), 'wf-column');
                });
            });

            editor.onSetContent.add(onSetContent);

            editor.addButton('columns_add', {
                title: 'columns.add',
                onclick: function () {
                    var node = editor.selection.getNode();
                    Columns.addColumn(editor, node);
                }
            });

            editor.addButton('columns_delete', {
                title: 'columns.delete',
                onclick: function () {
                    var node = editor.selection.getNode();
                    Columns.removeColumn(editor, node);
                }
            });

            editor.onPreInit.add(function (ed) {
                editor.selection.onGetContent.add(function (sel, o) {
                    if (!o.contextual) {
                        return true;
                    }

                    var container = editor.dom.create('body', {}, o.content),
                        columns = editor.dom.select('.wf-column', container);

                    if (columns.length) {
                        var node = editor.selection.getNode(),
                            parent = editor.dom.getParent(node, 'div[data-wf-columns]');

                        if (parent) {
                            // wrap orphan columns in cloned parent
                            editor.dom.wrap(columns, editor.dom.clone(parent), true);
                            // return serialized content
                            o.content = sel.serializer.serialize(container, o);
                        }
                    }
                });
            });

            function handleDeleteInColumn(e) {

                // delete whole column using shift+delete
                if (e.ctrlKey && e.keyCode === VK.DELETE) {
                    if (Columns.getColumnNode(editor)) {
                        Columns.removeColumn(editor);

                        e.preventDefault();
                        e.stopPropagation();

                        editor.undoManager.add();
                    }

                    return;
                }

                // clear all selected columns of content, but don't delete
                var selectedColumns = editor.dom.select('div.wf-column.mceSelected', editor.dom.getRoot());

                if (selectedColumns.length) {
                    e.preventDefault();
                    e.stopPropagation();

                    each(selectedColumns, function (node) {
                        editor.dom.empty(node);
                        node.innerHTML = '';
                        Columns.padColumn(editor, node);

                        editor.selection.select(node.firstChild, true);
                        editor.selection.collapse(true);
                    });

                    editor.undoManager.add();
                }

                function isWithinColumn(node) {
                    return editor.dom.getParent(node, 'div.wf-column');
                }

                function getLastChild(parent) {
                    var lastChild = parent.lastChild, node, walker = new TreeWalker(lastChild, parent);

                    while ((node = walker.next())) {
                        // get textNode that has a value
                        if (node.nodeType == 3 && node.nodeValue) {
                            lastChild = node;
                        }

                        // get parent block (eg: p) of any non-block element (eg: img)
                        if (node.nodeType == 1) {
                            lastChild = !Columns.isColumn(node.parentNode) ? node.parentNode : node;
                        }
                    }

                    return lastChild;
                }

                // prevent deletion of column when deleting all content
                var rng = editor.selection.getRng(), container = rng.commonAncestorContainer;

                // if selection is outside the column, try and re-adjust
                if (!Columns.isColumn(rng.commonAncestorContainer)) {
                    if (!isWithinColumn(rng.startContainer) && !isWithinColumn(rng.endContainer)) {
                        return;
                    }

                    if (!isWithinColumn(rng.startContainer) && rng.startOffset == 0) {
                        var col = editor.dom.getParent(rng.endContainer, '.wf-column');
                        rng.setStart(col.firstChild, 0);
                    }

                    if (!isWithinColumn(rng.endContainer) && rng.endOffset == 0) {
                        var col = editor.dom.getParent(rng.startContainer, '.wf-column');

                        var lastChild = getLastChild(col);

                        if (lastChild.nodeType == 3) {
                            rng.setEnd(lastChild, lastChild.nodeValue.length);
                        } else {
                            rng.setEndAfter(lastChild, lastChild);
                        }
                    }
                }

                if (rng.collapsed && rng.startOffset == 0) {
                    var col = editor.dom.getParent(container, '.wf-column');

                    // don't backspace delete only column child, eg: paragraph
                    if (col && col.firstChild && col.firstChild == col.lastChild && rng.startContainer == col.firstChild) {
                        e.preventDefault();
                    }

                    return;
                }

                var col = editor.dom.getParent(editor.selection.getStart(), '.wf-column');

                if (!col) {
                    return;
                }

                var node = editor.dom.getParent(col.firstChild, function (n) {
                    return !Columns.isColumn(n) && editor.dom.isBlock(n);
                });

                function getSelectionStart() {
                    var start = editor.dom.getParent(rng.startContainer, editor.dom.isBlock);

                    if (Columns.isColumn(start)) {
                        start = start.firstChild;
                    }

                    return start;
                }

                function getSelectionEnd() {
                    var end = editor.dom.getParent(rng.endContainer, editor.dom.isBlock);

                    if (Columns.isColumn(end)) {
                        end = end.lastChild;
                    }

                    return end;
                }

                if (node) {
                    if (Columns.isColumn(node.parentNode) && (!node.previousSibling || !node.nextSibling)) {
                        var col = node.parentNode;

                        var start = getSelectionStart(), end = getSelectionEnd();

                        if (col.firstChild == start && getLastChild(col) == end) {
                            // parital selection
                            if (!rng.endContainer) {
                                return;
                            }

                            var endContainer = Columns.isColumn(rng.endContainer) ? rng.endContainer.lastChild : rng.endContainer;

                            if (endContainer != getLastChild(col)) {
                                return;
                            }

                            if (rng.endOffset < rng.endContainer.length) {
                                return;
                            }

                            // empty column
                            while (col.firstChild) {
                                col.removeChild(col.firstChild);
                            }

                            // padd column
                            Columns.padColumn(editor, col);

                            editor.undoManager.add();
                            e.preventDefault();
                        }
                    }
                }

            }

            editor.onInit.add(function () {
                if (!editor.settings.compress.css) {
                    editor.dom.loadCSS(url + "/css/content.css");
                }

                editor.onBeforeExecCommand.add(function (ed, cmd, ui, values, o) {
                    // FormatBlock
                    if (cmd && (cmd == 'FormatBlock')) {
                        var node = ed.selection.getNode();

                        if (Columns.isColumn(node)) {
                            o.terminate = true;
                            return;
                        }
                    }

                });

                editor.selection.onSetContent.add(onSetContent);

                editor.onKeyDown.addToTop(function (editor, e) {

                    if ((e.keyCode === VK.BACKSPACE || e.keyCode === VK.DELETE)) {
                        handleDeleteInColumn(e);
                    }
                });

                editor.formatter.register('column', {
                    block: 'div',
                    classes: 'wf-column',
                    attributes: {
                        'id': '__tmp',
                        'data-mce-type': 'column'
                    },
                    wrapper: true
                });

                if (editor.theme && editor.theme.onResolveName) {
                    editor.theme.onResolveName.add(function (theme, o) {
                        var n = o.node;

                        if (n) {
                            if (editor.dom.hasClass(n, 'wf-columns')) {
                                o.name = 'columns';
                            }

                            if (editor.dom.hasClass(n, 'wf-column')) {
                                o.name = 'column';
                            }
                        }
                    });
                }

                DragSelection.setup(editor);
            });

            editor.onNodeChange.add(function (ed, cm, n, co) {
                if (n.nodeName !== "DIV") {
                    n = ed.dom.getParent(n, "DIV");
                }

                // get node state
                var state = Columns.isColumn(n);

                if (state) {
                    if (n.childNodes.length === 0) {
                        if (n.previousSibling) {
                            var col = n.previousSibling.lastChild;

                            if (col) {
                                if (ed.dom.remove(n)) {
                                    editor.selection.select(col);
                                    editor.selection.collapse(0);
                                }
                            }
                        }
                    }
                }

                // set active
                cm.setActive('columns', state);
                // set columns_add active
                cm.setDisabled('columns_add', !state);
                // set columns_delete active
                cm.setDisabled('columns_delete', !state);
            });
        },

        /**
         * Create Grid Control
         */
        createControl: function (n, cm) {
            var self = this,
                ed = self.editor;

            //var framework = ed.getParam('columns_framework', '');

            function createMenuGrid(cols, rows) {
                var html = '';

                html += '<div class="mceToolbarRow">';
                html += '   <div class="mceToolbarItem">';
                html += '       <table role="presentation" class="mceTableSplitMenu"><tbody>';

                for (var i = 0; i < rows; i++) {
                    html += '<tr>';

                    for (var x = 0; x < cols; x++) {
                        html += '<td><a href="#"></a></td>';
                    }

                    html += '</tr>';
                }

                html += '       </tbody></table>';

                html += '   </div>';
                html += '</div>';

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
            }

            function menuGridClick(e) {
                var el = e.target;

                if (el.nodeName !== "TD") {
                    el = el.parentNode;
                }

                var table = DOM.getParent(el, 'table');

                var cls = ['wf-columns'];

                var stack = ed.getParam('columns_stack', 'medium');

                if (stack) {
                    //cls.push('wf-columns-stack');
                    cls.push('wf-columns-stack-' + stack);
                }

                var align = ed.getParam('columns_align', '');

                if (align) {
                    cls.push('wf-columns-align-' + align);
                }

                var gap = ed.getParam('columns_gap', 'small');

                if (gap && gap !== 'small') {
                    cls.push('wf-columns-gap-' + gap);
                }

                var html = '<div class="' + cls.join(' ') + '">';

                var rows = tinymce.grep(DOM.select('tr', table), function (row) {
                    return DOM.select('td.selected', row).length;
                });

                var block = ed.settings.forced_root_block || '';

                for (var y = 0; y < rows.length; y++) {
                    var cols = DOM.select('td.selected', rows[y]).length;

                    for (var x = 0; x < cols; x++) {
                        html += '<div class="wf-column">';

                        if (block) {
                            html += ed.dom.createHTML(block, {}, '&nbsp;');
                        } else {
                            html += '<br data-mce-bogus="1" />';
                        }

                        html += "</div>";
                    }
                }

                html += "</div>";

                ed.undoManager.add();

                ed.execCommand('mceInsertRawHTML', false, html);

                Event.cancel(e); // Prevent IE auto save warning
                return false;
            }

            if (n == 'columns') {
                var num = 1,
                    form = cm.createForm('columns_form');

                var columnsNum = cm.createTextBox('columns_num', {
                    label: ed.getLang('columns.columns', 'Columns'),
                    name: 'columns',
                    subtype: 'number',
                    attributes: {
                        step: 1,
                        min: 1
                    },
                    value: num,
                    onchange: function () {
                        num = columnsNum.value();
                    }
                });

                form.add(columnsNum);

                function updateColumnValue(val, num) {
                    columnsNum.setDisabled(false);

                    var layoutNum = 1;

                    if (val && val.indexOf('-') !== -1) {
                        layoutNum = val.split('-').length;
                    }

                    num = num > layoutNum ? num : layoutNum;

                    columnsNum.value(num);
                }

                var layoutList = cm.createListBox('columns_layout', {
                    label: ed.getLang('columns.layout', 'Layout'),
                    onselect: function (val) {
                        updateColumnValue(val, columnsNum.value());
                    },
                    name: 'layout',
                    max_height: 'auto'
                });

                var layoutValues = ['', '2-1', '1-2', '3-1', '1-3', '2-1-1', '1-2-1', '1-1-2', '2-3', '3-2', '1-4', '4-1', '3-1-1', '1-3-1', '1-1-3', '2-1-1-1', '1-1-1-2'];

                each(layoutValues, function (val) {
                    var key;

                    if (!val) {
                        key = ed.getLang('columns.layout_auto', 'Auto');
                    } else {
                        key = ed.getLang('columns.layout_' + val, val);
                    }

                    layoutList.add(key, val, {
                        'icon': 'columns_layout_' + val.replace(/-/g, '_')
                    });
                });

                var stackList = cm.createListBox('columns_stack', {
                    label: ed.getLang('columns.stack', 'Stack Width'),
                    onselect: function (v) { },
                    name: 'stack',
                    max_height: 'auto'
                });

                each(['', 'small', 'medium', 'large', 'xlarge'], function (val) {
                    var key;

                    if (!val) {
                        key = ed.getLang('columns.stack_none', 'None');
                    } else {
                        key = ed.getLang('columns.stack_' + val, val);
                    }

                    stackList.add(key, val);
                });

                var gapList = cm.createListBox('columns_gap', {
                    label: ed.getLang('columns.gap', 'Gap Size'),
                    onselect: function (v) { },
                    name: 'gap',
                    max_height: 'auto'
                });

                each(['none', 'small', 'medium', 'large'], function (val) {
                    var key = ed.getLang('columns.stack_' + val, val);
                    gapList.add(key, val);
                });

                var stylesList = cm.createStylesBox('columns_class', {
                    label: ed.getLang('columns.class', 'Classes'),
                    onselect: function (v) { },
                    name: 'classes'
                });

                form.add(stackList);
                form.add(gapList);
                form.add(layoutList);

                form.add(stylesList);

                var ctrl = cm.createSplitButton('columns', {
                    title: 'columns.desc',
                    onclick: function () {
                        ed.windowManager.open({
                            title: ed.getLang('columns.desc', 'Create Columns'),
                            items: [form],
                            size: 'mce-modal-landscape-small',
                            open: function () {
                                var nodes = Columns.getSelectedBlocks(ed);

                                var stack = ed.getParam('columns_stack', 'medium');
                                var gap = ed.getParam('columns_gap', 'medium');
                                var num = ed.getParam('columns_num', 1);
                                var layout = ed.getParam('columns_layout', '');

                                if (nodes.length) {
                                    num = nodes.length;

                                    var col = ed.dom.getParent(nodes[0], '.wf-columns');

                                    if (col) {
                                        var cols = ed.dom.select('.wf-column', col),
                                            cls = col.getAttribute('class');

                                        if (cols.length) {
                                            num = cols.length;
                                        }

                                        if (cls && cls.indexOf('wf-columns-stack-') !== -1) {
                                            stack = /wf-columns-stack-(small|medium|large|xlarge)/.exec(col.className)[1];
                                        }

                                        if (cls && cls.indexOf('wf-columns-gap-') !== -1) {
                                            gap = /wf-columns-gap-(none|small|medium|large)/.exec(col.className)[1];
                                        }

                                        if (cls && cls.indexOf('wf-columns-layout-') !== -1) {
                                            layout = /wf-columns-layout-([0-9-]+|auto)/.exec(cls)[1];

                                            if (layout === 'auto') {
                                                layout = '';
                                            }
                                        }

                                        cls = cls.replace(/wf-([a-z0-9-]+)/g, '').trim();

                                        // set button text to "Update"
                                        DOM.setHTML(this.id + '_insert', ed.getLang('update', 'Update'));
                                    }
                                }

                                stackList.value(stack);
                                gapList.value(gap);
                                layoutList.value(layout);
                                stylesList.value(cls);

                                updateColumnValue(layout, num);
                            },
                            buttons: [{
                                title: ed.getLang('common.cancel', 'Cancel'),
                                id: 'cancel'
                            },
                            {
                                title: ed.getLang('common.insert', 'Insert'),
                                id: 'insert',
                                onsubmit: function (e) {
                                    var data = form.submit();

                                    Event.cancel(e);
                                    Columns.insertColumn(ed, data);
                                },
                                classes: 'primary',
                                autofocus: true
                            }
                            ]
                        });
                    },
                    class: 'mce_columns'
                });

                ctrl.onRenderMenu.add(function (c, m) {
                    var sb = m.add({
                        onmouseover: menuGridMouseOver,
                        onclick: function (e) {
                            sb.setSelected(false);

                            menuGridClick(e);
                        },
                        html: createMenuGrid(5, 1),
                        class: 'mceColumns'
                    });

                    m.onShowMenu.add(function () {
                        if ((n = DOM.get(sb.id))) {
                            DOM.removeClass(DOM.select('.mceTableSplitMenu td', n), 'selected');
                        }
                    });
                });

                return ctrl;
            }
        }
    });

    tinymce.PluginManager.add('columns', tinymce.plugins.Columns);

})();
