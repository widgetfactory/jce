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
    var each = tinymce.each,
        DOM = tinymce.DOM,
        PreviewCss = tinymce.util.PreviewCss;

    /* Make a css url absolute
     * @param u URL string
     * @param p URL of the css file
     */
    function toAbsolute(u, p) {
        return u.replace(/url\(["']?(.+?)["']?\)/gi, function (a, b) {

            if (b.indexOf('://') < 0) {
                return 'url("' + p + b + '")';
            }

            return a;
        });
    }

    function isEditorContentCss(url) {
        return url.indexOf('/tiny_mce/') !== -1 && url.indexOf('content.css') !== -1;
    }

    function cleanSelectorText(selectorText) {
        // Parse simple element.class1, .class1
        var selector = /^(?:([a-z0-9\-_]+))?(\.[a-z0-9_\-\.]+)$/i.exec(selectorText);

        // no match
        if (!selector) {
            return '';
        }

        var elementName = selector[1];

        if (elementName !== "body") {
            return selector[2].substr(1).split('.').join(' ');
        }

        return '';
    }

    tinymce.create('tinymce.plugins.ImportCSS', {
        init: function (ed, url) {
            this.editor = ed;
            var self = this;

            // create an event to use externally
            ed.onImportCSS = new tinymce.util.Dispatcher();

            ed.onImportCSS.add(function() {
                if (ed.settings.importcss_classes) {
                    return;
                }
                
                self._import();
            });

            // attempt to import when the editor is initialised
            ed.onInit.add(function() {
                ed.onImportCSS.dispatch();
            });
        },

        _import: function () {
            var self = this,
                ed = this.editor,
                doc = ed.getDoc(), href = '',
                rules = [],
                fonts = false;

            var fontface = [], filtered = {}, classes = [];

            function isAllowedStylesheet(href) {
                var styleselect = ed.getParam('styleselect_stylesheets');

                if (!styleselect) {
                    return true;
                }

                if (typeof filtered[href] !== 'undefined') {
                    return filtered[href];
                }

                filtered[href] = (href.indexOf(styleselect) !== -1);

                return filtered[href];
            }

            function parseCSS(stylesheet) {                
                // IE style imports
                each(stylesheet.imports, function (r) {                    
                    if (r.href.indexOf('://fonts.googleapis.com') > 0) {
                        var v = '@import url(' + r.href + ');';

                        if (self.fontface.indexOf(v) === -1) {
                            self.fontface.unshift(v);
                        }

                        return;
                    }

                    parseCSS(r);
                });

                try {
                    rules = stylesheet.cssRules || stylesheet.rules;
                    href = stylesheet.href;

                    if (!href) {
                        return;
                    }

                    if (isEditorContentCss(href)) {
                        return;
                    }

                    // get stylesheet href
                    if (stylesheet.href) {
                        href = stylesheet.href.substr(0, stylesheet.href.lastIndexOf('/') + 1);
                    }
                } catch (e) {
                    // Firefox fails on rules to remote domain for example: 
                    // @import url(//fonts.googleapis.com/css?family=Pathway+Gothic+One);
                }

                each(rules, function (r) {
                    // Real type or fake it on IE
                    switch (r.type || 1) {
                        // Rule
                        case 1:                        
                            if (!isAllowedStylesheet(stylesheet.href)) {
                                return true;
                            }

                            // IE8
                            if (!r.type) { }

                            if (r.selectorText) {
                                each(r.selectorText.split(','), function (v) {
                                    v = v.replace(/^\s*|\s*$|^\s\./g, "");

                                    // Is internal or it doesn't contain a class
                                    if (/\.mce/.test(v) || !/\.[\w\-]+$/.test(v)) {
                                        return;
                                    }

                                    if (v && classes.indexOf(v) === -1) {
                                        classes.push(v);
                                    }
                                });
                            }

                            break;

                        // Import
                        case 3:                        
                            if (r.href.indexOf('//fonts.googleapis.com') > 0) {
                                var v = '@import url(' + r.href + ');';

                                if (fontface.indexOf(v) === -1) {
                                    fontface.unshift(v);
                                }
                            }

                            // only local imports
                            if (r.href.indexOf('//') === -1) {
                                parseCSS(r.styleSheet);
                            }
                            break;
                        // font-face
                        case 5:
                            // check for text and skip popular font icons
                            if (r.cssText && /(fontawesome|glyphicons|icomoon)/i.test(r.cssText) === false) {
                                var v = toAbsolute(r.cssText, href);

                                if (fontface.indexOf(v) === -1) {
                                    fontface.push(v);
                                }
                            }
                            break;
                    }
                });
            }

            // parse stylesheets
            if (!classes.length) {
                try {
                    each(doc.styleSheets, function (styleSheet) {
                        parseCSS(styleSheet);
                    });
                } catch (ex) { }
            }

            // add font-face rules
            if (!fontface.length && !fonts) {
                try {
                    // get document head
                    var head = DOM.doc.getElementsByTagName('head')[0];
                    // create style element
                    var style = DOM.create('style', {
                        type: 'text/css'
                    });

                    var css = self.fontface.join("\n");

                    if (style.styleSheet) {
                        var setCss = function () {
                            try {
                                style.styleSheet.cssText = css;
                            } catch (e) { }
                        };
                        if (style.styleSheet.disabled) {
                            setTimeout(setCss, 10);
                        } else {
                            setCss();
                        }
                    } else {
                        style.appendChild(DOM.doc.createTextNode(css));
                    }

                    // add to head
                    head.appendChild(style);

                    // set fonts flag so we only do this once
                    fonts = true;

                } catch (e) { }
            }

            // sort and expose if classes have been set
            if (classes.length) {
                // sort alphabetically
                if (ed.getParam('styleselect_sort', 1)) {
                    classes.sort();
                }

                ed.settings.importcss_classes = tinymce.map(classes, function(val) {
                    var cls = cleanSelectorText(val);
                    
                    var style = PreviewCss(ed, { styles: [], attributes: [], classes: cls.split(' ') });
                    return {'selector' : val, 'class' : cls, 'style' : style};
                });
            }
        }
    });
    // Register plugin
    tinymce.PluginManager.add('importcss', tinymce.plugins.ImportCSS);
})();