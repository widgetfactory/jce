(function (win) {
    // check for tinyMCEPopup
    if (win.tinyMCEPopup) {
        var each = tinymce.each, filtered = {};

        function isAllowedStylesheet(href) {
            var styleselect = tinyMCEPopup.editor.getParam('styleselect_stylesheet');

            if (!styleselect) {
                return true;
            }

            if (typeof filtered[href] !== 'undefined') {
                return filtered[href];
            }

            filtered[href] = (href.indexOf(styleselect) !== -1);

            return filtered[href];
        }

        function isEditorContentCss(url) {
            return url.indexOf('/tiny_mce/') !== -1 && url.indexOf('content.css') !== -1;
        }

        var TinyMCE_Utils = {

            options: [],

            classes: [],

            /**
             * Returns a array of all single CSS classes in the document. A single CSS class is a simple
             * rule like ".class" complex ones like "div td.class" will not be added to output.
             *
             * @method getClasses
             * @return {Array} Array with class objects each object has a class field might be other fields in the future.
             */
            getClasses: function () {
                var self = this,
                    ed = tinyMCEPopup.editor,
                    cl = [],
                    i, lo = {},
                    f = ed.settings.class_filter,
                    ov;

                if (self.classes.length) {
                    return self.classes;
                }

                function addClasses(s) {
                    // IE style imports
                    each(s.imports, function (r) {
                        addClasses(r);
                    });

                    var href = s.href;

                    if (!href) {
                        return;
                    }

                    if (isEditorContentCss(href)) {
                        return;
                    }

                    each(s.cssRules || s.rules, function (r) {
                        // Real type or fake it on IE
                        switch (r.type || 1) {
                            // Rule
                            case 1:
                                if (!isAllowedStylesheet(s.href)) {
                                    return true;
                                }

                                if (r.selectorText) {
                                    each(r.selectorText.split(','), function (v) {
                                        v = v.replace(/^\s*|\s*$|^\s\./g, "");

                                        // Is internal or it doesn't contain a class
                                        if (/\.mce/.test(v) || !/\.[\w\-]+$/.test(v)) {
                                            return;
                                        }

                                        // Remove everything but class name
                                        ov = v;
                                        v = v.replace(/.*\.([a-z0-9_\-]+).*/i, '$1')

                                        // Filter classes
                                        if (f && !(v = f(v, ov))) {
                                            return;
                                        }

                                        if (!lo[v]) {
                                            cl.push({
                                                'class': v
                                            });
                                            lo[v] = 1;
                                        }
                                    });
                                }
                                break;

                            // Import
                            case 3:
                                try {
                                    addClasses(r.styleSheet);
                                } catch (ex) {
                                    // Ignore
                                }

                                break;
                        }
                    });
                };

                try {
                    each(ed.getDoc().styleSheets, addClasses);
                } catch (ex) {
                    // Ignore
                }

                if (cl.length > 0) {
                    self.classes = cl;
                }

                return cl;
            },

            fillClassList: function (id) {
                var self = this, ed = tinyMCEPopup.editor,
                    lst = document.getElementById(id), values = [], filter = ed.settings.class_filter;

                if (!lst) {
                    return;
                }

                // datalist element
                lst = lst.list || lst;

                if (!self.options.length) {                    
                    if (ed.getParam('styleselect_custom_classes')) {
                        var custom = ed.getParam('styleselect_custom_classes');

                        if (custom) {
                            values = values.concat(custom.split(','));
                        }
                    }

                    if (ed.getParam('styleselect_stylesheet') !== false) {
                        var importcss_classes = ed.settings.importcss_classes, classes = [];

                        // try extraction
                        if (Array.isArray(importcss_classes)) {
                            each(importcss_classes, function (item) {
                                var val = item.class, ov = val;

                                // Filter classes
                                if (filter && !(val = filter(val, ov))) {
                                    return true;
                                }

                                classes.push(item);
                            });
                        } else {
                            classes = this.getClasses();
                        }

                        if (classes.length) {
                            values = values.concat(classes);
                        }

                        // remove duplicates
                        values.filter(function (val, index, self) {
                            return self.indexOf(val) === index;
                        });
                    }

                    each(values, function (item) {
                        // convert custom class to object
                        if (typeof item === "string" && item) {
                            item = { 'selector': item, 'class': '', 'style': '' };
                        }

                        if (item.class) {
                            var val = item.class;
                            var opt = {title : item.title || val, value : val, style : ''}
   
                            var styles = item.style || '';

                            if (styles) {
                                opt.style = ed.dom.serializeStyle(ed.dom.parseStyle(styles));
                            }

                            self.options.push(opt);
                        }
                    });
                }

                // add to select list
                each(self.options, function (opt) {
                    var node = new Option(opt.title, opt.value);

                    if (opt.style) {
                        node.setAttribute('style', opt.style);
                    }
                    
                    lst.appendChild(node);
                });
            },

            updateColor: function (parent) {
                if (typeof parent == 'string') {
                    parent = document.getElementById(parent);
                }
                document.getElementById(parent.id + '_pick').style.backgroundColor = parent.value;
            }
        }
        win.TinyMCE_Utils = TinyMCE_Utils;
    }
})(window);