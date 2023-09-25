import Columns from './Columns';
import DragSelection from './DragSelection';
import Bootstrap from './Framework/Bootstrap';
import UIKit from './Framework/UIKit';

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