(function (tinymce, tinyMCEPopup, $) {
    function convertRGBToHex(col) {
        var re = new RegExp("rgb\\s*\\(\\s*([0-9]+).*,\\s*([0-9]+).*,\\s*([0-9]+).*\\)", "gi");

        var rgb = col.replace(re, "$1,$2,$3").split(',');
        if (rgb.length == 3) {
            r = parseInt(rgb[0]).toString(16);
            g = parseInt(rgb[1]).toString(16);
            b = parseInt(rgb[2]).toString(16);

            r = r.length == 1 ? '0' + r : r;
            g = g.length == 1 ? '0' + g : g;
            b = b.length == 1 ? '0' + b : b;

            return "#" + r + g + b;
        }

        return col;
    }

    function convertHexToRGB(col) {
        if (col.indexOf('#') != -1) {
            col = col.replace(new RegExp('[^0-9A-F]', 'gi'), '');

            r = parseInt(col.substring(0, 2), 16);
            g = parseInt(col.substring(2, 4), 16);
            b = parseInt(col.substring(4, 6), 16);

            return "rgb(" + r + "," + g + "," + b + ")";
        }

        return col;
    }

    function trimSize(size) {
        size = size.replace(/([0-9\.]+)(px|%|in|cm|mm|em|ex|pt|pc)/i, '$1$2');
        return size ? size.replace(/px$/, '') : "";
    }

    function getStyle(elm, attrib, style) {
        var val = tinyMCEPopup.editor.dom.getAttrib(elm, attrib);

        if (val != '') {
            return '' + val;
        }

        if (typeof (style) == 'undefined') {
            style = attrib;
        }

        return tinyMCEPopup.editor.dom.getStyle(elm, style);
    }

    function getCSSSize(size) {
        size = trimSize(size);

        if (size == "")
            return "";

        // Add px
        if (/^[0-9]+$/.test(size))
            size += 'px';
        // Sanity check, IE doesn't like broken values
        else if (!(/^[0-9\.]+(px|%|in|cm|mm|em|ex|pt|pc)$/i.test(size)))
            return "";

        return size;
    }

    /* Override setStyles function for tables */
    Wf.setStyles = function () {
        var ed = tinyMCEPopup.editor;
        // create proxy element to extract styles from
        var $proxy = $('<div />'),
            proxy = $proxy.get(0);
        // update with table styles
        $proxy.attr('style', $('#style').val());

        var map = {
            "background-image": "backgroundimage",
            "border-spacing": "cellspacing",
            "border-collapse": "cellspacing",
            "vertical-align": "valign",
            "background-color": "bgcolor",
            "float": "align",
            "text-align": "align"
        };

        var legacy = ['align', 'valign'];

        $.each(['background-image', 'width', 'height', 'border-spacing', 'border-collapse', 'vertical-align', 'background-color', 'text-align', 'float'], function (i, k) {
            var v = ed.dom.getStyle(proxy, k);

            // delete all values
            $proxy.css(k, "");

            if (k === "width" || k === "height") {
                v = trimSize(v);

                if (!v) {
                    return true;
                }
            }

            if (k === "background-image") {
                v = v.replace(new RegExp("url\\(['\"]?([^'\"]*)['\"]?\\)", 'gi'), "$1");
            }

            if (k === "background-color") {
                v = convertRGBToHex(v);
            }

            if (k === "border-spacing") {
                v = trimSize(v);
            }

            if (k === "border-collapse" && v === "collapse") {
                v = 0;
            }

            // align already set
            if (k === "float" && $('#align').val() !== "") {
                return true;
            }

            // get mapped attribute name
            k = map[k] || k;

            if (isHTML4 && $.inArray(k, legacy) !== -1) {
                return true;
            }

            // update form
            $('#' + k).val(v).change();
        });

        // table center-align
        if (proxy.style.marginLeft === "auto" && proxy.style.marginRight === "auto" && $('#align').val() === "") {
            $('#align').val('center');

            $proxy.css({
                "margin-left": "",
                "margin-right": ""
            });
        }

        var border = false;

        // Handle border
        $.each(['width', 'color', 'style'], function (i, k) {
            var v = ed.dom.getStyle($proxy.get(0), 'border-' + k);

            if (v === "") {
                $.each(['top', 'right', 'bottom', 'left'], function (i, n) {
                    var sv = ed.dom.getStyle($proxy.get(0), 'border-' + n + '-' + k);

                    // False or not the same as prev
                    if (sv !== '' || (sv != v && v !== '')) {
                        v = '';
                    }
                    if (sv) {
                        v = sv;
                    }
                });
            } else {
                border = true;
                // remove style
                $proxy.css('border-' + k, "");
            }

            if (k == 'width') {
                v = /[0-9][a-z]/.test(v) ? parseInt(v) : v;
            }

            if (k == 'color' && v) {
                v = Wf.String.toHex(v);

                if (v.charAt(0) === "#") {
                    v = v.substr(1);
                }
            }

            if (border) {
                $('#border').attr('checked', 'checked').change();

                // add new option for border width
                if (k === "width") {
                    if ($('option[value="' + v + '"]', '#border_width').length == 0) {
                        $('#border_width').append(new Option(v, v));
                    }
                }

                // set border value and trigger change
                $('#border_' + k).val(v).change();
            }
        });

        var styles = ed.dom.parseStyle($proxy.attr('style'));

        // remove -moz and -webkit styles
        for (k in styles) {
            if (k.indexOf('-moz-') >= 0 || k.indexOf('-webkit-') >= 0) {
                delete styles[k];
            }
        }

        // Merge
        $('#style').val(ed.dom.serializeStyle(styles));
    };

    var isHTML4 = tinyMCEPopup.editor.settings.schema === "html4";
    var isHTML5 = tinyMCEPopup.editor.settings.schema === "html5-strict";

    var TableDialog = {
        settings: {},
        init: function () {
            var self = this,
                ed = tinyMCEPopup.editor,
                layout = tinyMCEPopup.getWindowArg('layout', 'table');

            if (!this.settings.file_browser) {
                $('input.browser').removeClass('browser');
            }

            Wf.init();

            if (layout == 'merge') {
                return this.initMerge();
            }

            if (isHTML5) {
                // hide HTML4 only attributes (tframe = frame)
                $('#axis, #abbr, #scope, #summary, #char, #charoff, #tframe, #nowrap, #rules, #cellpadding, #cellspacing').each(function () {
                    $(this).add('label[for="' + this.id + '"]').hide();
                });
            }

            switch (layout) {
                case 'table':
                    this.initTable();
                    break;
                case 'cell':
                    this.initCell();
                    break;
                case 'row':
                    this.initRow();
                    break;
            }
        },
        insert: function () {
            var layout = tinyMCEPopup.getWindowArg('layout', 'table');

            switch (layout) {
                case 'table':
                    this.insertTable();
                    break;
                case 'cell':
                    this.updateCells();
                    break;
                case 'row':
                    this.updateRows();
                    break;
                case 'merge':
                    this.merge();
                    break;
            }
        },
        initMerge: function () {
            $('#numcols').val(tinyMCEPopup.getWindowArg('cols', 1));
            $('#numrows').val(tinyMCEPopup.getWindowArg('rows', 1));

            $('#insert').button('option', 'label', tinyMCEPopup.getLang('update', 'Update', true));
        },
        updateClassList: function (values) {
            if (!values) {
                return;
            }

            values = values.replace(/(?:^|\s)mce-item-(\w+)(?!\S)/g, '');

            $('#classes').val(function () {
                var elm = this;

                // trim
                values = $.trim(values);
                // create array
                values = values.split(' ');

                $.each(values, function (i, value) {
                    value = $.trim(value);

                    if (!value || value === ' ') {
                        return true;
                    }

                    if ($('option[value="' + value + '"]', elm).length == 0) {
                        $(elm).append(new Option(value, value));
                    }
                });

                return values;

            }).change();
        },
        initTable: function () {
            var self = this,
                ed = tinyMCEPopup.editor;

            var elm = ed.dom.getParent(ed.selection.getNode(), "table");
            var action = tinyMCEPopup.getWindowArg('action');

            if (!action) {
                action = elm ? "update" : "insert";
            }

            if (isHTML4) {
                // replace border field with checkbox
                $('#table_border').replaceWith('<input type="checkbox" id="table_border" value="" />');

                $('#table_border').click(function () {
                    this.value = this.checked ? 1 : '';
                });
            }

            if (elm && action != "insert") {
                var rowsAr = elm.rows;
                var cols = 0;

                for (var i = 0; i < rowsAr.length; i++) {
                    if (rowsAr[i].cells.length > cols) {
                        cols = rowsAr[i].cells.length;
                    }
                }

                $('#cols').val(cols);
                $('#rows').val(rowsAr.length);

                $('#caption').prop('checked', elm.getElementsByTagName('caption').length > 0);

                $.each(['align', 'width', 'height', 'cellpadding', 'cellspacing', 'id', 'summary', 'dir', 'lang', 'bgcolor', 'background', 'frame', 'rules', 'border'], function (i, k) {
                    var v = ed.dom.getAttrib(elm, k);

                    if (k === "background" && v !== "") {
                        v = v.replace(new RegExp("url\\(['\"]?([^'\"]*)['\"]?\\)", 'gi'), "$1");
                    }

                    // legacy border
                    if (k === "border" && v !== "") {
                        $('#table_border').val(function () {
                            v = parseInt(v);

                            if (this.type === "checkbox") {
                                this.checked = !!v;
                            }

                            return v;
                        });

                        return true;
                    }

                    $('#' + k).val(v);
                });

                this.updateClassList(ed.dom.getAttrib(elm, 'class'));

                // update style field
                $('#style').val(ed.dom.getAttrib(elm, 'style')).change();

                this.orgTableWidth = $('#width').val();
                this.orgTableHeight = $('#height').val();

                $('#insert .uk-button-text').text(tinyMCEPopup.getLang('update', 'Update', true));
            } else {
                Wf.setDefaults(this.settings.defaults);
            }

            // Disable some fields in update mode
            if (action == "update") {
                $('#cols, #rows').prop('disabled', true);
            }
        },
        initRow: function () {
            var self = this,
                ed = tinyMCEPopup.editor,
                dom = tinyMCEPopup.dom;

            var elm = dom.getParent(ed.selection.getStart(), "tr");
            var selected = dom.select('td.mceSelected,th.mceSelected', elm);

            // Get table row data
            var rowtype = elm.parentNode.nodeName.toLowerCase();

            // update style field
            $('#style').val(ed.dom.getAttrib(elm, 'style')).change();

            // update form values
            $.each(['align', 'width', 'height', 'cellpadding', 'cellspacing', 'id', 'summary', 'dir', 'lang', 'bgcolor', 'background'], function (i, k) {
                var v = ed.dom.getAttrib(elm, k),
                    dv = $('#' + k).val();

                if (k === "background" && v !== "") {
                    v = v.replace(new RegExp("url\\(['\"]?([^'\"]*)['\"]?\\)", 'gi'), "$1");
                }

                // value already set by style
                if (dv !== "") {
                    v = dv;
                }

                // only allow some values
                if (selected.length && $.inArray(k, ['bgcolor', 'background', 'height', 'id', 'lang', 'align']) !== -1) {
                    v = isHTML4 ? v : "";
                }

                $('#' + k).val(v);
            });

            this.updateClassList(ed.dom.getAttrib(elm, 'class'));

            $('#rowtype').change(function () {
                self.setActionforRowType();
            }).val(rowtype).change();

            // single cell update only
            if (selected.length === 0) {
                $('#insert .uk-button-text').text(tinyMCEPopup.getLang('update', 'Update', true));
            } else {
                $('#action').hide();
            }
        },
        initCell: function () {
            var self = this,
                ed = tinyMCEPopup.editor,
                dom = ed.dom;

            var elm = dom.getParent(ed.selection.getStart(), "td,th");

            // only update single cells
            if (!dom.hasClass(elm, 'mceSelected')) {
                // update style field
                $('#style').val(ed.dom.getAttrib(elm, 'style')).change();

                // update form values
                $.each(['align', 'valign', 'width', 'height', 'cellpadding', 'cellspacing', 'id', 'summary', 'dir', 'lang', 'bgcolor', 'background', 'scope'], function (i, k) {
                    var v = ed.dom.getAttrib(elm, k),
                        dv = $('#' + k).val();

                    if (k === "background" && v !== "") {
                        v = v.replace(new RegExp("url\\(['\"]?([^'\"]*)['\"]?\\)", 'gi'), "$1");
                    }

                    // value already set by style
                    if (dv !== "") {
                        v = dv;
                    }

                    $('#' + k).val(v);
                });

                this.updateClassList(ed.dom.getAttrib(elm, 'class'));

                $('#celltype').val(elm.nodeName.toLowerCase());

                $('#insert .uk-button-text').text(tinyMCEPopup.getLang('update', 'Update', true));
            } else {
                $('#action').hide();
            }
        },
        merge: function () {
            var func;

            tinyMCEPopup.restoreSelection();
            func = tinyMCEPopup.getWindowArg('onaction');

            func({
                cols: $('#numcols').val(),
                rows: $('#numrows').val()
            });

            tinyMCEPopup.close();
        },

        getStyles: function () {
            var dom = tinyMCEPopup.editor.dom;

            var style = $('#style').val();

            if (isHTML4) {
                return style;
            }

            var styles = {
                "vertical-align": "",
                "float": ""
            };

            // values as styles
            $.each(['width', 'height', 'backgroundimage', 'border', 'bgcolor'], function (i, k) {
                var v = $('#' + k).val();

                if (k === "backgroundimage") {
                    if (v !== "") {
                        v = 'url("' + v + '")';
                    }

                    k = 'background-image';
                }

                if (k === "bgcolor" && v) {
                    if (v !== "") {
                        v = v.charAt(0) === "#" ? v : '#' + v;
                    }

                    k = 'background-color';
                }

                if (k === "width" || k === "height") {
                    if (v && !/\D/.test(v)) {
                        v = parseInt(v) + 'px';
                    }
                }

                if (k === "border") {
                    if ($('#border').is(':checked')) {
                        $.each(['width', 'style', 'color'], function (i, n) {
                            var s = $('#border_' + n).val();

                            if (n === "width" && s !== "" && !/\D/.test(s)) {
                                s = parseInt(s) + 'px';
                            }

                            if (n === "color" && s.charAt(0) !== "#") {
                                s = '#' + s;
                            }

                            styles['border-' + n] = s;
                        });
                    }
                    return true;
                }

                styles[k] = v;
            });

            // combine styles
            style = dom.serializeStyle($.extend(dom.parseStyle(style), styles));
            // serialize again to compress
            style = dom.serializeStyle(dom.parseStyle(style));

            return style;
        },

        insertTable: function () {
            var ed = tinyMCEPopup.editor,
                dom = ed.dom;

            tinyMCEPopup.restoreSelection();

            var elm = ed.dom.getParent(ed.selection.getNode(), "table");
            var action = tinyMCEPopup.getWindowArg('action');

            if (!action) {
                action = elm ? "update" : "insert";
            }

            var cols = 2,
                rows = 2,
                border = 0,
                cellpadding = -1,
                cellspacing = -1,
                align, width, height, className, caption, frame, rules;
            var html = '',
                capEl, elm;
            var cellLimit, rowLimit, colLimit;

            if (!AutoValidator.validate($('form').get(0))) {
                tinyMCEPopup.alert(ed.getLang('invalid_data'));
                return false;
            }

            // Get form data
            width = $('#width').val();
            height = $('#height').val();
            align = $('#align').val();
            cols = $('#cols').val();
            rows = $('#rows').val();
            cellpadding = $('#cellpadding').val();
            cellspacing = $('#cellspacing').val();
            frame = $("#tframe").val();
            rules = $("#rules").val();
            className = $("#classes").val();
            id = $('#id').val();
            summary = $('#summary').val();
            dir = $('#dir').val();
            lang = $('#lang').val();
            caption = $('#caption').is(':checked');

            borderColor = $('#border_color').val();
            bgColor = $('#bgcolor').val();
            background = $('#backgroundimage').val();

            // get compile styles attribute value
            style = this.getStyles();

            // get border attribute
            border = $('#table_border').val();

            // get checkbox state, checked=1, otherwise no border
            if ($('#table_border').is(':checkbox')) {
                border = $('#table_border').is(':checked') ? '1' : '';
            }

            // update classNames
            if ($.type(className) === 'array') {
                className = className.join(' ');
            }

            // remove values for html5
            if (!isHTML4) {
                align = "";
                width = "";
                height = "";
                bgColor = "";
            }

            // Update table
            if (action == "update") {
                ed.execCommand('mceBeginUndoLevel');

                if (!isHTML5) {
                    dom.setAttrib(elm, 'cellPadding', cellpadding, true);
                    dom.setAttrib(elm, 'cellSpacing', cellspacing, true);
                }

                // set or remove width, height, align, border
                dom.setAttribs(elm, {
                    "width": width,
                    "height": height,
                    "align": align,
                    "border": border,
                    "bgColor": bgColor
                });

                dom.setAttrib(elm, 'frame', frame);
                dom.setAttrib(elm, 'rules', rules);
                dom.setAttrib(elm, 'class', className);
                dom.setAttrib(elm, 'style', style);
                dom.setAttrib(elm, 'id', id);
                dom.setAttrib(elm, 'summary', summary);
                dom.setAttrib(elm, 'dir', dir);
                dom.setAttrib(elm, 'lang', lang);

                capEl = ed.dom.select('caption', elm)[0];

                if (capEl && !caption) {
                    capEl.parentNode.removeChild(capEl);
                }

                if (!capEl && caption) {
                    capEl = elm.ownerDocument.createElement('caption');

                    if (!tinymce.isIE || tinymce.isIE11) {
                        capEl.innerHTML = '<br data-mce-bogus="1"/>';
                    }

                    elm.insertBefore(capEl, elm.firstChild);
                }

                // set align by format
                if (!isHTML4) {
                    if ($('#align').val()) {
                        ed.formatter.apply('align' + $('#align').val(), {}, elm);
                    }
                }

                ed.addVisual();

                ed.nodeChanged();
                ed.execCommand('mceEndUndoLevel', false, {}, {
                    skip_undo: true
                });

                // Repaint
                ed.execCommand('mceRepaint');

                tinyMCEPopup.close();
                return true;
            }

            // Create new table
            html += '<table';
            html += this.makeAttrib('id', id);

            // add border attribute
            if (border) {
                html += this.makeAttrib('border', border);
            }

            html += this.makeAttrib('cellpadding', cellpadding);
            html += this.makeAttrib('cellspacing', cellspacing);
            html += this.makeAttrib('data-mce-new', '1');

            html += this.makeAttrib('width', width);
            html += this.makeAttrib('height', height);

            html += this.makeAttrib('align', align);
            html += this.makeAttrib('frame', frame);
            html += this.makeAttrib('rules', rules);
            html += this.makeAttrib('class', className);
            html += this.makeAttrib('style', style);
            html += this.makeAttrib('summary', summary);
            html += this.makeAttrib('dir', dir);
            html += this.makeAttrib('lang', lang);

            html += this.makeAttrib('bgcolor', bgColor);

            html += '>';

            if (caption) {
                if (!tinymce.isIE || tinymce.isIE11) {
                    html += '<caption><br data-mce-bogus="1" /></caption>';
                } else {
                    html += '<caption></caption>';
                }
            }

            for (var y = 0; y < rows; y++) {
                html += "<tr>";

                for (var x = 0; x < cols; x++) {
                    if (!tinymce.isIE || tinymce.isIE11) {
                        html += '<td><br data-mce-bogus="1" /></td>';
                    } else {
                        html += '<td></td>';
                    }
                }
                html += "</tr>";
            }
            html += "</table>";

            ed.execCommand('mceBeginUndoLevel');

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


                tinymce.each(ed.dom.select(patt), function (n) {
                    ed.dom.split(ed.dom.getParent(n, 'h1,h2,h3,h4,h5,h6,p'), n);
                });


                dom.setOuterHTML(dom.select('br._mce_marker')[0], html);
            } else {
                ed.execCommand('mceInsertContent', false, html);
            }

            tinymce.each(dom.select('table[data-mce-new]'), function (node) {
                var tdorth = dom.select('td,th', node);

                // Fixes a bug in IE where the caret cannot be placed after the table if the table is at the end of the document
                if (tinymce.isIE && !tinymce.isIE11 && node.nextSibling == null) {
                    if (ed.settings.forced_root_block)
                        dom.insertAfter(dom.create(ed.settings.forced_root_block), node);
                    else
                        dom.insertAfter(dom.create('br', {
                            'data-mce-bogus': '1'
                        }), node);
                }

                try {
                    // IE9 might fail to do this selection
                    ed.selection.setCursorLocation(tdorth[0], 0);
                } catch (ex) {
                    // Ignore
                }

                dom.setAttrib(node, 'data-mce-new', '');
            });

            ed.addVisual();
            ed.execCommand('mceEndUndoLevel', false, {}, {
                skip_undo: true
            });

            tinyMCEPopup.close();
        },
        updateCell: function (td, skip_id) {
            var self = this,
                ed = tinyMCEPopup.editor,
                dom = ed.dom,
                doc = ed.getDoc(),
                v;

            var curCellType = td.nodeName.toLowerCase();
            var celltype = $('#celltype').val();

            var cells = ed.dom.select('td.mceSelected,th.mceSelected');

            if (!cells.length) {
                cells.push(td);
            }

            function setAttrib(elm, name, value) {
                if (cells.length === 1 || value) {
                    dom.setAttrib(elm, name, value);
                }
            }

            function setStyle(elm, name, value) {
                if (cells.length === 1 || value) {
                    dom.setStyle(elm, name, value);
                }
            }

            // Get form data
            width = $('#width').val();
            height = $('#height').val();
            align = $('#align').val();
            valign = $('#valign').val();
            bgColor = $('#bgcolor').val();

            // remove values for html5
            if (!isHTML4) {
                align = "";
                valign = "";
                width = "";
                height = "";
                bgColor = "";
            }

            // update values
            dom.setAttribs(td, {
                "width": width,
                "height": height,
                "bgColor": bgColor,
                "align": align,
                "valign": valign
            });

            $.each(['id', 'lang', 'dir', 'classes', 'scope', 'style'], function (i, k) {
                v = $('#' + k).val();

                if (k === "id" && skip_id) {
                    return true;
                }

                // get compile styles attribute value
                if (k === "style") {
                    v = self.getStyles();
                }

                if (k === "classes") {
                    k = 'class';

                    if ($.type(v) === 'array') {
                        v = v.join(' ');
                    }
                }

                setAttrib(td, k, v);
            });

            if (!isHTML4) {
                if ($('#align').val()) {
                    ed.formatter.apply('align' + $('#align').val(), {}, td);
                }

                if ($('#valign').val()) {
                    ed.formatter.apply('valign' + $('#valign').val(), {}, td);
                }
            }

            if (curCellType != celltype) {
                // changing to a different node type
                var newCell = doc.createElement(celltype);

                for (var c = 0; c < td.childNodes.length; c++)
                    newCell.appendChild(td.childNodes[c].cloneNode(1));

                for (var a = 0; a < td.attributes.length; a++)
                    ed.dom.setAttrib(newCell, td.attributes[a].name, ed.dom.getAttrib(td, td.attributes[a].name));

                td.parentNode.replaceChild(newCell, td);
                td = newCell;
            }

            return td;
        },
        updateCells: function () {
            var self = this,
                el, ed = tinyMCEPopup.editor,
                inst = ed,
                tdElm, trElm, tableElm;

            tinyMCEPopup.restoreSelection();
            el = ed.selection.getStart();
            tdElm = ed.dom.getParent(el, "td,th");
            trElm = ed.dom.getParent(el, "tr");
            tableElm = ed.dom.getParent(el, "table");

            // Cell is selected
            if (ed.dom.hasClass(tdElm, 'mceSelected')) {
                // Update all selected sells
                tinymce.each(ed.dom.select('td.mceSelected,th.mceSelected'), function (td) {
                    self.updateCell(td);
                });

                ed.addVisual();
                ed.nodeChanged();
                inst.execCommand('mceEndUndoLevel');
                tinyMCEPopup.close();
                return;
            }

            ed.execCommand('mceBeginUndoLevel');

            switch ($('#action').val()) {
                case "cell":
                    var celltype = $('#celltype').val();
                    var scope = $('#scope').val();

                    function doUpdate(s) {
                        if (s) {
                            self.updateCell(tdElm);

                            ed.addVisual();
                            ed.nodeChanged();
                            inst.execCommand('mceEndUndoLevel');
                            tinyMCEPopup.close();
                        }
                    };

                    if (ed.getParam("accessibility_warnings", 1)) {
                        if (celltype == "th" && scope == "") {
                            tinyMCEPopup.confirm(ed.getLang('table_dlg.missing_scope', 'Missing Scope', true), doUpdate);
                        } else {
                            doUpdate(1);
                        }

                        return;
                    }

                    this.updateCell(tdElm);
                    break;

                case "row":
                    var cell = trElm.firstChild;

                    if (cell.nodeName != "TD" && cell.nodeName != "TH") {
                        cell = this.nextCell(cell);
                    }

                    do {
                        cell = this.updateCell(cell, true);
                    } while ((cell = this.nextCell(cell)) != null);

                    break;

                case "all":
                    var rows = tableElm.getElementsByTagName("tr");

                    for (var i = 0; i < rows.length; i++) {
                        var cell = rows[i].firstChild;

                        if (cell.nodeName != "TD" && cell.nodeName != "TH") {
                            cell = this.nextCell(cell);
                        }

                        do {
                            cell = this.updateCell(cell, true);
                        } while ((cell = this.nextCell(cell)) != null);
                    }

                    break;
            }

            ed.addVisual();
            ed.nodeChanged();
            inst.execCommand('mceEndUndoLevel');
            tinyMCEPopup.close();
        },
        updateRow: function (tr, skip_id, skip_parent) {
            var self = this,
                ed = tinyMCEPopup.editor,
                dom = ed.dom,
                doc = ed.getDoc(),
                v;

            var curRowType = tr.parentNode.nodeName.toLowerCase();
            var rowtype = $('#rowtype').val();

            var tableElm = dom.getParent(ed.selection.getStart(), "table");
            var rows = tableElm.rows;

            if (!rows.length) {
                rows.push(tr);
            }

            function setAttrib(elm, name, value) {
                if (rows.length === 1 || value) {
                    dom.setAttrib(elm, name, value);
                }
            }

            function setStyle(elm, name, value) {
                if (rows.length === 1 || value) {
                    dom.setStyle(elm, name, value);
                }
            }

            // Get form data
            height = $('#height').val();
            align = $('#align').val();
            valign = $('#valign').val();
            bgColor = $('#bgcolor').val();

            // remove values for html5
            if (!isHTML4) {
                height = "";
                bgColor = "";
                align = "";
                valign = "";
            }

            // update values
            dom.setAttribs(tr, {
                "height": "",
                "align": "",
                "valign": "",
                "bgColor": ""
            });

            $.each(['id', 'lang', 'dir', 'classes', 'scope', 'style'], function (i, k) {
                v = $('#' + k).val();

                if (k === "id" && skip_id) {
                    return true;
                }

                // get compile styles attribute value
                if (k === "style") {
                    v = self.getStyles();
                }

                if (k === "classes") {
                    k = 'class';

                    if ($.type(v) === 'array') {
                        v = v.join(' ');
                    }
                }

                setAttrib(tr, k, v);
            });

            if (!isHTML4) {
                if ($('#align').val()) {
                    ed.formatter.apply('align' + $('#align').val(), {}, tr);
                }
            }

            // Setup new rowtype
            if (curRowType != rowtype && !skip_parent) {
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
            }
        },

        updateRows: function () {
            var self = this,
                ed = tinyMCEPopup.editor,
                dom = ed.dom,
                trElm, tableElm;
            var action = $('#action').val();

            tinyMCEPopup.restoreSelection();
            trElm = dom.getParent(ed.selection.getStart(), "tr");
            tableElm = dom.getParent(ed.selection.getStart(), "table");

            // Update all selected rows
            if (dom.select('td.mceSelected,th.mceSelected', trElm).length > 0) {
                tinymce.each(tableElm.rows, function (tr) {
                    var i;

                    for (i = 0; i < tr.cells.length; i++) {
                        if (dom.hasClass(tr.cells[i], 'mceSelected')) {
                            self.updateRow(tr, true);
                            return;
                        }
                    }
                });

                ed.addVisual();
                ed.nodeChanged();
                ed.execCommand('mceEndUndoLevel');
                tinyMCEPopup.close();
                return;
            }

            ed.execCommand('mceBeginUndoLevel');

            switch (action) {
                case "row":
                    this.updateRow(trElm);
                    break;

                case "all":
                    var rows = tableElm.getElementsByTagName("tr");

                    for (var i = 0; i < rows.length; i++) {
                        this.updateRow(rows[i], true);
                    }

                    break;

                case "odd":
                case "even":
                    var rows = tableElm.getElementsByTagName("tr");

                    for (var i = 0; i < rows.length; i++) {
                        if ((i % 2 == 0 && action == "odd") || (i % 2 != 0 && action == "even"))
                            this.updateRow(rows[i], true, true);
                    }

                    break;
            }

            ed.addVisual();
            ed.nodeChanged();
            ed.execCommand('mceEndUndoLevel');
            tinyMCEPopup.close();
        },

        makeAttrib: function (attrib, value) {
            if (typeof (value) == "undefined" || value == null) {
                value = $('#' + attrib).val();
            }

            if (value == "") {
                return "";
            }

            // XML encode it
            value = value.replace(/&/g, '&amp;');
            value = value.replace(/\"/g, '&quot;');
            value = value.replace(/</g, '&lt;');
            value = value.replace(/>/g, '&gt;');

            return ' ' + attrib + '="' + value + '"';
        },

        nextCell: function (elm) {
            while ((elm = elm.nextSibling) != null) {
                if (elm.nodeName == "TD" || elm.nodeName == "TH") {
                    return elm;
                }
            }

            return null;
        },

        isCssSize: function (value) {
            return /^[0-9.]+(%|in|cm|mm|em|ex|pt|pc|px)$/.test(value);
        },

        cssSize: function (value, def) {
            value = tinymce.trim(value || def);

            if (!this.isCssSize(value)) {
                return parseInt(value, 10) + 'px';
            }

            return value;
        },

        setActionforRowType: function () {
            var rowtype = $('#rowtype').val();

            if (rowtype === "tbody") {
                $('#action').prop('disabled', false);
            } else {
                $('#action').val('row').prop('disabled', true);
            }
        }

    };

    tinyMCEPopup.onInit.add(TableDialog.init, TableDialog);

    window.TableDialog = TableDialog;
})(tinymce, tinyMCEPopup, jQuery);