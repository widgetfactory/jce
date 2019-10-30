(function () {
    var each = tinymce.each, DOM = tinymce.DOM, PreviewCss = tinymce.util.PreviewCss;

    tinymce.create('tinymce.plugins.ClassPathPlugin', {

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

        init: function (ed, url) {
            var path, tags, combobox, self = this;

            this.editor = ed;

            ed.onPostRender.add(function () {
                var container = ed.getContentAreaContainer();

                path        = DOM.create('div', { 'class': 'mceClassPath'});
                tags        = DOM.create('div', { 'class': 'mceClassPathTags'});
                combobox    = DOM.create('div', { 'class': 'mceClassPathCombobox'});

                var ctrl = ed.controlManager.createListBox('classpath', {
                    combobox: true,
                    max_height: 384,
                    onselect: function (name) {
                        var matches, formatNames = [],
                            removedFormat;
    
                        each(ctrl.items, function (item) {
                            formatNames.push(item.value);
                        });
    
                        ed.focus();
                        ed.undoManager.add();
    
                        // Toggle off the current format(s)
                        matches = ed.formatter.matchAll(formatNames);
    
                        tinymce.each(matches, function (match) {
                            if (!name || match === name) {
    
                                if (match) {
                                    ed.formatter.remove(match);
                                }
    
                                removedFormat = true;
                            }
                        });
    
                        if (!removedFormat) {
                            // registered style format
                            if (ed.formatter.get(name)) {
                                ed.formatter.apply(name);
                                // custom class
                            } else {
                                ed.formatter.apply('classname', { 'value': name });
                            }
                        }
    
                        ed.undoManager.add();
                        ed.nodeChanged();
    
                        return false; // No auto select
                    }
                });

                var counter = 0;

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

                DOM.bind(tags, 'click', function (e) {
                    e.preventDefault();

                    var node = ed.selection.getNode();

                    if (node.getAttribute('data-mce-bogus')) {
                        node = node.parentNode;
                    }

                    if (e.target.nodeName === "BUTTON") {
                        DOM.remove(e.target);
                        ed.dom.removeClass(node, e.target.value);
                    }
                });

                DOM.add(path, tags);
                DOM.add(path, combobox);

                DOM.insertAfter(path, container);

                // render and initiate listbox control
                ctrl.renderTo(combobox);
            });

            ed.onNodeChange.add(function (ed, cm, n, co) {
                var value = n.getAttribute('class');

                // empty path
                tags.innerHTML = '';

                if (!value) {
                    return;
                }

                tinymce.each(value.split(' '), function (val, i) {
                    if (/^(mce|wf-)/.test(val)) {
                        return true;
                    }

                    DOM.add(tags, 'button', { 'class': 'mceButton', 'aria-label': '', 'value': val }, '<label>' + val + '</label>');
                });
            });
        }
    });

    // Register plugin
    tinymce.PluginManager.add('classpath', tinymce.plugins.ClassPathPlugin);
})();