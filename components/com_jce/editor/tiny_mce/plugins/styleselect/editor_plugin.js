/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each, PreviewCss = tinymce.util.PreviewCss, NodeType = tinymce.dom.NodeType, DOM = tinymce.DOM, Event = tinymce.dom.Event;

    function isInternalNode(node) {
        return NodeType.isBogus(node) || NodeType.isBookmark(node);
    }

    tinymce.create('tinymce.plugins.StyleSelectPlugin', {
        init: function (ed, url) {
            this.editor = ed;
        },

        createControl: function (n, cf) {
            var ed = this.editor;

            switch (n) {
                case "styleselect":
                    // only create the control if we are using it!
                    if (ed.getParam('styleselect_stylesheets') !== false || ed.getParam('style_formats') || ed.getParam('styleselect_custom_classes')) {
                        return this._createStyleSelect();
                    }

                    break;
            }
        },

        convertSelectorToFormat: function (selectorText) {
            var format, ed = this.editor;

            // empty value
            if (!selectorText) {
                return;
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
                format.attributes = { "class": classes };
            }

            format.ceFalseOverride = true;

            return format;
        },

        _createStyleSelect: function (n) {
            var self = this,
                ed = this.editor,
                ctrl;

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

                var filter = DOM.get('menu_' + ctrl.id + '_menu_filter'), btn = DOM.create('button', { 'class': 'mceButton', 'value': item.value }, '<label>' + item.title + '</label>');

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
                onselect: function (name) {
                    var matches = [], removedFormat, node = ed.selection.getNode(), bookmark = ed.selection.getBookmark();

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
                        return elm && elm.nodeType == 1 && !isInternalNode(elm) && !inlineTextElements[elm.nodeName.toLowerCase()];
                    };

                    var isOnlyTextSelected = function () {
                        // Collect all non inline text elements in the range and make sure no elements were found
                        var elements = collectNodesInRange(ed.selection.getRng(), isElement);

                        return elements.length === 0;
                    };

                    if (node === ed.getBody() && !isOnlyTextSelected()) {
                        return false;
                    }

                    ed.focus();
                    ed.undoManager.add();

                    // Toggle off the current format(s)
                    each(ctrl.items, function (item) {
                        if (ed.formatter.matchNode(node, item.value)) {
                            matches.push(item.value);
                        }
                    });

                    // reset node if there is a text only selection
                    if (!ed.selection.isCollapsed() && isOnlyTextSelected()) {
                        node = null;
                    }

                    each(matches, function (match) {
                        if (!name || match === name) {

                            if (match) {
                                ed.formatter.remove(match, {}, node);
                            }

                            removedFormat = true;
                        }
                    });

                    if (!removedFormat) {
                        // registered style format
                        if (ed.formatter.get(name)) {

                            // apply or remove
                            ed.formatter.toggle(name, {}, node);
                        // custom class
                        } else {
                            node = ed.selection.getNode();

                            if (ed.dom.hasClass(node, name)) {
                                ed.dom.removeClass(node, name);
                            } else {
                                ed.formatter.apply('classname', { 'value': name }, ed.selection.isCollapsed() ? node : null);
                            }

                            // add it to the list
                            ctrl.add(name, name);
                        }
                    }

                    // if the format is on a valid node, select
                    if (node) {
                        // manual selection to prevent error using selection.select when a block element has been renamed
                        var rng = ed.dom.createRng();
                        rng.setStart(node, 0);
                        rng.setEnd(node, 0);
                        rng.collapse();
                        ed.selection.setRng(rng);
                    }

                    ed.selection.moveToBookmark(bookmark);

                    ed.nodeChanged();

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
                        var elm = evt.target, value = elm.value;

                        // keep normal behaviour while input has a value
                        if (value) {
                            return;
                        }

                        var tags = DOM.select('button', elm.parentNode.parentNode);

                        if (tags.length) {
                            var tag = tags.pop(), val = tag.textContent;

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

                each(ed.settings.importcss_classes, function (item, idx) {
                    var name = 'style_' + (counter + idx);

                    if (typeof item === 'string') {
                        item = { 'selector': item, 'class': '', 'style': '' };
                    }

                    var fmt = self.convertSelectorToFormat(item.selector);

                    if (fmt) {
                        ed.formatter.register(name, fmt);

                        ctrl.add(fmt.title, name, {
                            style: function () {
                                return item.style || '';
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

                // generic class format
                ed.formatter.register('classname', { attributes: { 'class': '%value' }, 'selector': '*', ceFalseOverride: true });

                function isValidAttribute(name) {
                    var isvalid = true, invalid = ed.settings.invalid_attributes;

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
                            name = fmt.name = fmt.name || 'style_' + (counter++);

                            // make sure all attribute values are strings and decoded
                            if (tinymce.is(fmt.attributes, 'string')) {
                                fmt.attributes = ed.dom.decode(fmt.attributes);

                                var frag = ed.dom.createFragment('<div ' + tinymce.trim(fmt.attributes) + '></div>');
                                var attribs = ed.dom.getAttribs(frag.firstChild);

                                fmt.attributes = {};

                                each(attribs, function (node) {
                                    var key = node.name, value = '' + node.value;

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
                                    return PreviewCss(ed, fmt);
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
                        var name, fmt;

                        if (val) {
                            // remove leading period if any
                            val = val.replace(/^\./, '');

                            name = 'style_' + (counter++);

                            fmt = {
                                inline: 'span',
                                classes: val,
                                selector: '*',
                                ceFalseOverride: true
                            };

                            ed.formatter.register(name, fmt);

                            if (key) {
                                // remove leading period if any
                                key = key.replace(/^\./, '');
                            }

                            ctrl.add(ed.translate(key), name, {
                                style: function () {
                                    return PreviewCss(ed, fmt);
                                }
                            });
                        }
                    });
                }
            });

            return ctrl;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('styleselect', tinymce.plugins.StyleSelectPlugin);
})();
