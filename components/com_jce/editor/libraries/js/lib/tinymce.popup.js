/* eslint-disable consistent-this */
/* global tinyMCEPopup */

(function (win) {
    // check for tinyMCEPopup
    if (win.tinyMCEPopup) {
        var each = tinymce.each, PreviewCss = tinymce.util.PreviewCss;

        var TinyMCE_Utils = {

            options: [],

            classes: [],

            fillClassList: function (id) {
                var self = this, ed = tinyMCEPopup.editor,
                    lst = document.getElementById(id), values = [], filter = ed.settings.class_filter;

                if (!lst) {
                    return;
                }

                // datalist element
                lst = lst.list || lst;

                if (!self.options.length) {
                    var classes = [];
                    
                    if (ed.getParam('styleselect_custom_classes')) {
                        var custom = ed.getParam('styleselect_custom_classes');

                        if (custom) {
                            values = values.concat(custom.split(','));
                        }
                    }

                    if (ed.getParam('styleselect_stylesheet') !== false) {
                        var importcss_classes = ed.settings.importcss_classes || ed.plugins.importcss.get();

                        // try extraction
                        if (Array.isArray(importcss_classes)) {
                            each(importcss_classes, function (item) {
                                var val = item["class"], ov = val;

                                // Filter classes
                                if (filter && !(val = filter(val, ov))) {
                                    return true;
                                }

                                classes.push(item);
                            });
                        }

                        if (classes.length) {
                            values = values.concat(classes);
                        }

                        // remove duplicates
                        values = values.filter(function (val, ind, arr) {
                            return arr.indexOf(val) === ind;
                        });
                    }

                    each(values, function (item) {
                        // convert custom class to object
                        if (typeof item === "string" && item) {
                            item = { 'selector': item, 'class': '', 'style': '' };
                        }

                        if (item["class"]) {
                            var val = item["class"];
                            var opt = { title: item.title || val, value: val, style: '' };

                            var styles = item.style || PreviewCss.getCssText(val);

                            if (styles) {
                                opt.style = ed.dom.serializeStyle(ed.dom.parseStyle(styles));
                            }

                            self.options.push(opt);
                        }
                    });

                    PreviewCss.reset();
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
        };

        win.TinyMCE_Utils = TinyMCE_Utils;
    }
})(window);