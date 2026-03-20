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

(function () {
    var each = tinymce.each,
        PreviewCss = tinymce.util.PreviewCss,
        NodeType = tinymce.dom.NodeType,
        DOM = tinymce.DOM,
        Event = tinymce.dom.Event;

    /**
     * Compile a filter regex or string into a function
     * From - https://github.com/tinymce/tinymce/blob/4.5.x/js/tinymce/plugins/importcss/plugin.js
     * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
     * @param {*} filter 
     * @returns
     */
    function compileFilter(filter) {
        if (Array.isArray(filter)) {
            var filters = filter.map(compileFilter);

            return function (value) {
                return filters.every(function (filterFunc) {
                    return filterFunc(value);
                });
            };
        }

        if (typeof filter == "string" && filter) {
            return function (value) {
                return value.indexOf(filter) !== -1;
            };
        } else if (filter instanceof RegExp) {
            return function (value) {
                return filter.test(value);
            };
        }

        return filter;
    }

    // Function to parse the value
    function parseCustomValue(value) {
        // Remove leading period if any
        value = value.replace(/^\./, '');

        // Split the value into element and class name
        var parts = value.split('.');
        var element, className;

        if (parts.length > 1) {
            element = parts[0] || '*'; // Use the specified element or * if it's empty
            className = parts.slice(1).join('.'); // Join the rest as class name
        } else {
            element = '*';
            className = parts[0]; // Only class name provided
        }

        return { element, className };
    }

    tinymce.PluginManager.add('styleselect', function (ed, url) {
        this.createControl = function (n, cf) {

            if (n !== 'styleselect') {
                return null;
            }

            // only create the control if we are using it!
            if (ed.getParam('styleselect_stylesheets') !== false || ed.getParam('style_formats') || ed.getParam('styleselect_custom_classes')) {
                return createStyleSelect();
            }
        };

        function convertSelectorToFormat(selectorText) {
            var format;

            // empty value
            if (!selectorText) {
                return;
            }

            // process filters
            if (ed.settings.styleselect_selector_filter) {
                var selectorFilter = compileFilter(ed.settings.styleselect_selector_filter);

                if (selectorFilter(selectorText)) {
                    return;
                }
            }

            // Parse simple element.class1, .class1
            var selector = /^(?:([a-z0-9\-_]+))?(\.[a-z0-9_\-\.]+)$/i.exec(selectorText);

            // no match
            if (!selector) {
                return;
            }

            var elementName = selector[1];

            if (elementName === "body") {
                return;
            }

            var classes = selector[2].substr(1).split('.').join(' ');
            var inlineSelectorElements = tinymce.makeMap('a,img');

            // element.class - Produce block formats
            if (elementName) {
                format = {
                    title: selectorText
                };

                if (ed.schema.getTextBlockElements()[elementName]) {
                    // Text block format ex: h1.class1
                    format.block = elementName;
                } else if (ed.schema.getBlockElements()[elementName] || inlineSelectorElements[elementName.toLowerCase()]) {
                    // Block elements such as table.class and special inline elements such as a.class or img.class
                    format.selector = elementName;
                } else {
                    // Inline format strong.class1
                    format.inline = elementName;
                }
            } else if (selector[2]) {
                // .class - apply to any element
                format = {
                    inline: "span",
                    selector: '*',
                    title: selectorText.substr(1),
                    split: false,
                    expand: false,
                    deep: true
                };
            }

            // Append to or override class attribute
            if (ed.settings.importcss_merge_classes !== false) {
                format.classes = classes;
            } else {
                format.attributes = {
                    "class": classes
                };
            }

            format.ceFalseOverride = true;

            return format;
        }

        function createStyleSelect(n) {
            var ctrl;

            function removeFilterTags() {
                var filter = DOM.get('menu_' + ctrl.id + '_menu_filter');

                if (!filter) {
                    return;
                }

                DOM.remove(DOM.select('button.mceButton', filter));
            }

            function removeFilterTag(tag, item) {
                DOM.remove(tag);

                if (!item) {
                    each(ctrl.items, function (n) {
                        if (n.value == tag.value) {
                            item = n;
                            return false;
                        }
                    });
                }

                if (item) {
                    item.onAction && item.onAction();
                }
            }

            function addFilterTag(item) {
                if (!ctrl.menu) {
                    return;
                }

                var filter = DOM.get('menu_' + ctrl.id + '_menu_filter'),
                    btn = DOM.create('button', {
                        'class': 'mceButton',
                        'value': item.value
                    }, '<label>' + item.title + '</label>');

                if (!filter) {
                    return;
                }

                DOM.insertBefore(btn, filter.lastChild);

                Event.add(btn, 'click', function (evt) {
                    evt.preventDefault();

                    if (evt.target.nodeName === 'LABEL') {
                        return;
                    }

                    removeFilterTag(btn, item);
                });
            }

            // Setup style select box
            ctrl = ed.controlManager.createListBox('styleselect', {
                title: 'advanced.style_select',
                max_height: 384,
                filter: true,
                keepopen: true,
                menu_class: 'mceStylesListMenu',
                onselect: function (name) {
                    var matches = [], fmt,
                        removedFormat, selection = ed.selection,
                        node = selection.getNode();

                    var collectNodesInRange = function (rng, predicate) {
                        if (rng.collapsed) {
                            return [];
                        } else {
                            var contents = rng.cloneContents();

                            var walker = new tinymce.dom.TreeWalker(contents.firstChild, contents);
                            var elements = [];
                            var current = contents.firstChild;
                            do {
                                if (predicate(current)) {
                                    elements.push(current);
                                }
                            } while ((current = walker.next()));
                            return elements;
                        }
                    };

                    // get list of inline text elements
                    var inlineTextElements = ed.schema.getTextInlineElements();

                    // check if valid text selection element
                    var isElement = function (elm) {
                        return NodeType.isElement(elm) && !NodeType.isInternal(elm) && !inlineTextElements[elm.nodeName.toLowerCase()];
                    };

                    var isOnlyTextSelected = function () {
                        // Collect all non inline text elements in the range and make sure no elements were found
                        var elements = collectNodesInRange(ed.selection.getRng(), isElement);

                        return elements.length === 0;
                    };

                    var isRoot = function (node) {
                        return node === ed.dom.getRoot();
                    };

                    /*var nodes = tinymce.grep(selection.getSelectedBlocks(), function (n) {
                        return NodeType.isElement(n) && !NodeType.isInternal(n);
                    });

                    if (!nodes.length || (isRoot(node))) {
                        nodes = [node];
                    }*/

                    ed.focus();
                    ed.undoManager.add();

                    var nodes = [node];
                    var isCollapsed = selection.isCollapsed();

                    // special consideration for fake root
                    if (isRoot(node)) {

                        // avoid applying style to fake root element
                        if (isCollapsed) {
                            return false;
                        }

                        // apply to children as Formatter can't deal with fake root
                        var blocks = selection.getSelectedBlocks();

                        if (blocks.length) {
                            nodes = blocks;
                        }
                    }

                    each(nodes, function (node) {
                        var bookmark = selection.getBookmark();

                        /*if (node == ed.getBody() && !isOnlyTextSelected()) {
                            return false;
                        }*/

                        // Toggle off the current format(s)
                        each(ctrl.items, function (item) {                            
                            if ((fmt = ed.formatter.matchNode(node, item.value))) {
                                matches.push(fmt);
                            }
                        });

                        //node = nodes.length > 1 || selection.isCollapsed() ? node : null;
                        //node = isCollapsed ? node : null;

                        // reset node if there is a text only selection
                        if (!isCollapsed && isOnlyTextSelected()) {
                            node = null;
                        }

                        // reset if root
                        if (isRoot(node)) {
                            node = null;
                        }

                        // reset to bookmark
                        selection.moveToBookmark(bookmark);

                        // reset selection on inline elements
                        if (!node && isCollapsed) {
                            var sel = selection.getSel();

                            if (sel.anchorNode && NodeType.isElement(sel.anchorNode) && !ed.dom.isBlock(sel.anchorNode) && !isRoot(sel.anchorNode)) {
                                node = sel.anchorNode;
                            }
                        }

                        each(matches, function (match) {
                            if (!name || match.name == name) {
                                ed.execCommand('RemoveFormat', false, {
                                    name: match.name,
                                    node: match.block ? null : node
                                });

                                removedFormat = true;
                            }
                        });

                        if (!removedFormat) {
                            // registered style format
                            if (ed.formatter.get(name)) {
                                // apply or remove
                                ed.execCommand('ToggleFormat', false, {
                                    name: name,
                                    node: node
                                });
                            // custom class
                            } else {
                                node = selection.getNode();

                                ed.execCommand('ToggleFormat', false, {
                                    name: 'classname',
                                    node: node
                                });

                                // add it to the list
                                ctrl.add(name, name);
                            }
                        }

                        // restore bookmark
                        selection.moveToBookmark(bookmark);

                        if (selection.isCollapsed()) {
                            // if the format is on a valid node, select
                            if (node && node.parentNode) {
                                // manual selection to prevent error using selection.select when a block element has been renamed
                                var rng = ed.dom.createRng();
                                rng.setStart(node, 0);
                                rng.setEnd(node, 0);
                                rng.collapse();
                                ed.selection.setRng(rng);

                                ed.nodeChanged();
                            }
                        }
                    });

                    return false; // No auto select
                }
            });

            ctrl.onBeforeRenderMenu.add(function (ctrl, menu) {
                loadClasses();

                menu.onShowMenu.add(function () {
                    // remove all tags
                    removeFilterTags();

                    each(ctrl.items, function (item) {
                        if (item.selected) {
                            // add new tag
                            addFilterTag(item);
                        }
                    });
                });
            });

            ctrl.onRenderMenu.add(function (ctrl, menu) {
                menu.onFilterInput.add(function (menu, evt) {
                    // backspace
                    if (evt.keyCode == 8) {
                        var elm = evt.target,
                            value = elm.value;

                        // keep normal behaviour while input has a value
                        if (value) {
                            return;
                        }

                        var tags = DOM.select('button', elm.parentNode.parentNode);

                        if (tags.length) {
                            var tag = tags.pop(),
                                val = tag.textContent;

                            // remove tag
                            removeFilterTag(tag);

                            evt.preventDefault();

                            // update value with tag value and focus
                            elm.value = val;
                            elm.focus();
                        }
                    }
                });
            });

            if (ed.settings.styleselect_stylesheets === false) {
                ctrl.hasClasses = true;
            }

            var counter = 0;

            function loadClasses() {
                if (!ed.settings.importcss_classes) {
                    ed.onImportCSS.dispatch();
                }

                if (!Array.isArray(ed.settings.importcss_classes)) {
                    return;
                }

                if (ctrl.hasClasses) {
                    return;
                }

                var preview_styles = ed.getParam('styleselect_preview_styles', true);

                each(ed.settings.importcss_classes, function (item, idx) {
                    var name = 'style_import_' + (counter + idx);

                    if (typeof item === 'string') {
                        item = {
                            'selector': item,
                            'class': '',
                            'style': ''
                        };
                    }

                    var fmt = convertSelectorToFormat(item.selector);

                    if (fmt) {
                        ed.formatter.register(name, fmt);

                        ctrl.add(fmt.title, name, {
                            style: function () {
                                return preview_styles ? (item.style || '') : '';
                            }
                        });
                    }
                });

                if (Array.isArray(ed.settings.importcss_classes)) {
                    ctrl.hasClasses = true;
                }
            }

            ed.onNodeChange.add(function (ed, cm, node) {
                var ctrl = cm.get('styleselect');

                if (ctrl) {
                    loadClasses(ed, ctrl);

                    var matches = [];

                    // remove all tags
                    removeFilterTags();

                    each(ctrl.items, function (item) {
                        if (ed.formatter.matchNode(node, item.value)) {                            
                            matches.push(item.value);

                            // add new tag
                            addFilterTag(item);
                        }
                    });

                    ctrl.select(matches);
                }
            });

            // Handle specified format
            ed.onPreInit.add(function () {
                var formats = ed.getParam('style_formats'),
                    styles = ed.getParam('styleselect_custom_classes', '', 'hash');

                var preview_styles = ed.getParam('styleselect_preview_styles', true);

                // generic class format
                ed.formatter.register('classname', {
                    attributes: {
                        'class': '%value'
                    },
                    'selector': '*',
                    ceFalseOverride: true
                });

                function isValidAttribute(name) {
                    var isvalid = true,
                        invalid = ed.settings.invalid_attributes;

                    if (!invalid) {
                        return true;
                    }

                    each(invalid.split(','), function (val) {
                        if (name === val) {
                            isvalid = false;
                        }
                    });

                    return isvalid;
                }

                if (formats) {
                    if (typeof formats === "string") {
                        try {
                            formats = JSON.parse(formats);
                        } catch (e) {
                            formats = [];
                        }
                    }
                    
                    each(formats, function (fmt) {
                        var name, keys = 0;

                        each(fmt, function () {
                            keys++;
                        });

                        if (keys > 1) {
                            name = fmt.name = fmt.name || 'style_format_' + (counter++);

                            // make sure all attribute values are strings and decoded
                            if (tinymce.is(fmt.attributes, 'string')) {
                                fmt.attributes = ed.dom.decode(fmt.attributes);

                                var frag = ed.dom.createFragment('<div ' + tinymce.trim(fmt.attributes) + '></div>');
                                var attribs = ed.dom.getAttribs(frag.firstChild);

                                fmt.attributes = {};

                                each(attribs, function (node) {
                                    var key = node.name,
                                        value = '' + node.value;

                                    if (!isValidAttribute(key)) {
                                        return true;
                                    }

                                    if (key === 'onclick' || key === 'ondblclick') {
                                        fmt.attributes[key] = 'return false;';
                                        key = 'data-mce-' + key;
                                    }

                                    fmt.attributes[key] = ed.dom.decode(value);
                                });
                            }

                            if (tinymce.is(fmt.styles, 'string')) {
                                // parse to style object
                                fmt.styles = ed.dom.parseStyle(fmt.styles);

                                each(fmt.styles, function (value, key) {
                                    value = '' + value;
                                    fmt.styles[key] = ed.dom.decode(value);
                                });
                            }

                            // set as true if not defined
                            if (!tinymce.is(fmt.ceFalseOverride)) {
                                fmt.ceFalseOverride = true;
                            }

                            ed.formatter.register(name, fmt);

                            ctrl.add(fmt.title, name, {
                                style: function () {
                                    return preview_styles ? PreviewCss.getCssText(ed, fmt, true) : '';
                                }
                            });
                        } else {
                            ctrl.add(fmt.title);
                        }
                    });
                }

                // custom styles
                if (styles) {
                    each(styles, function (val, key) {
                        if (val) {                            
                            var fmt, name;

                            var parsed = parseCustomValue(val);

                            name = 'style_custom_' + (counter++);

                            fmt = {
                                classes : parsed.className,
                                selector: parsed.element,
                                ceFalseOverride: true
                            };

                            if (parsed.element == '*') {
                                fmt.inline = 'span';
                            }

                            ed.formatter.register(name, fmt);

                            if (key) {
                                // remove leading period if any
                                key = key.replace(/^\./, '');
                            }

                            ctrl.add(ed.translate(key), name, {
                                style: function () {
                                    return preview_styles ? PreviewCss.getCssText(ed, fmt, true) : '';
                                }
                            });
                        }
                    });
                }
            });

            return ctrl;
        }
    });
})();