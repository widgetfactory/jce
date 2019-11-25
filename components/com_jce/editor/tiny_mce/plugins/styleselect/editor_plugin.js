/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each;

    tinymce.create('tinymce.plugins.StyleSelectPlugin', {
        init: function (ed, url) {
            var self = this;
            this.editor = ed;

            ed.onNodeChange.add(function (ed, cm) {
                var c = cm.get('styleselect'),
                    formatNames = [],
                    matches;

                if (c) {
                    formatNames = [];

                    each(c.items, function (item) {
                        formatNames.push(item.value);
                    });

                    matches = ed.formatter.matchAll(formatNames);
                    c.select(matches[0]);

                    tinymce.each(matches, function (match, index) {
                        if (index > 0) {
                            c.mark(match);
                        }
                    });
                }
            });

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
                    title: selectorText.substr(1)
                };
            }

            // Append to or override class attribute
            if (ed.settings.importcss_merge_classes !== false) {
                format.classes = classes;
            } else {
                format.attributes = { "class": classes };
            }

            return format;
        },

        _createStyleSelect: function (n) {
            var self = this,
                ed = this.editor,
                ctrl, PreviewCss = tinymce.util.PreviewCss;

            // Setup style select box
            ctrl = ed.controlManager.createListBox('styleselect', {
                title: 'advanced.style_select',
                filter: true,
                max_height: 384,
                onselect: function (name) {
                    var matches, formatNames = [],
                        removedFormat, node;

                    each(ctrl.items, function (item) {
                        formatNames.push(item.value);
                    });

                    ed.focus();
                    ed.undoManager.add();

                    // if no selection, get the current node
                    if (ed.selection.isCollapsed()) {
                        node = ed.selection.getNode();
                    }

                    // Toggle off the current format(s)
                    matches = ed.formatter.matchAll(formatNames);

                    tinymce.each(matches, function (match) {
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
                            ed.formatter.apply(name, {}, node);
                        // custom class
                        } else {
                            ed.formatter.apply('classname', { 'value': name }, node);
                        }
                    }

                    ed.undoManager.add();
                    ed.nodeChanged();

                    return false; // No auto select
                }
            });

            // Handle specified format
            ed.onPreInit.add(function () {
                var counter = 0,
                    formats = ed.getParam('style_formats'),
                    styles = ed.getParam('styleselect_custom_classes', '', 'hash');

                // generic class format
                ed.formatter.register('classname', { attributes: { 'class': '%value' }, 'selector': '*' });

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
                                //inline: 'span',
                                classes: val,
                                selector: '*'
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

                ctrl.onBeforeRenderMenu.add(function () {
                    if (!ed.settings.importcss_classes) {
                        ed.onImportCSS.dispatch();
                    }
                    
                    // still nothing...
                    if (!Array.isArray(ed.settings.importcss_classes)) {
                        return;
                    }
                    
                    if (ctrl.hasClasses) {
                        return;
                    }
    
                    each(ed.settings.importcss_classes, function (s, idx) {
                        var name = 'style_' + (counter + idx);
    
                        var fmt = self.convertSelectorToFormat(s);
    
                        if (fmt) {
                            ed.formatter.register(name, fmt);
    
                            ctrl.add(fmt.title, name, {
                                style: function () {
                                    return PreviewCss(ed, fmt);
                                }
                            });
                        }
                    });
    
                    ctrl.hasClasses = true;
                });
            });

            return ctrl;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('styleselect', tinymce.plugins.StyleSelectPlugin);
})();
