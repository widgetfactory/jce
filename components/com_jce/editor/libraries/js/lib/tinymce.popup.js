(function (win) {
    // check for tinyMCEPopup
    if (win.tinyMCEPopup) {
        var each = tinymce.each, filtered = {}, PreviewCss = tinymce.util.PreviewCss;

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
                                        v = tinymce._replace(/.*\.([a-z0-9_\-]+).*/i, '$1', v);

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
                var ed = tinyMCEPopup.editor,
                    lst = document.getElementById(id),
                    v, cl = [''];

                if (!lst) {
                    return;
                }

                if (ed.getParam('styleselect_custom_classes')) {
                    var custom = ed.getParam('styleselect_custom_classes');

                    if (custom) {
                        cl = cl.concat(custom.split(','));
                    }
                }

                if (ed.getParam('styleselect_stylesheet') !== false) {
                    var classes = ed.settings.importcss_classes;
                    
                    // try extraction
                    if (!Array.isArray(classes)) {
                        classes = this.getClasses();
                    }

                    if (classes.length) {
                        cl = cl.concat(classes);
                    }
                }

                if (cl.length > 0) {
                    tinymce.each(cl, function (o) {
                        if (typeof o === "string" && o) {
                            o = { "class": o };
                        }

                        if (o['class']) {
                            var cls = o['class'];
                            
                            var opt = new Option(o.title || cls, cls);
                            var styles = PreviewCss(ed, {styles: [], attributes: [], classes: cls.split(' ')});

                            opt.setAttribute('style', ed.dom.serializeStyle(ed.dom.parseStyle(styles)));
                            
                            lst.options[lst.options.length] = opt;
                        }
                    });
                }
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