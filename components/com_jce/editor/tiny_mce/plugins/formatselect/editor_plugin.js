/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each;

    var fmts = {
        'p': 'advanced.paragraph',
        'address': 'advanced.address',
        'pre': 'advanced.pre',
        'h1': 'advanced.h1',
        'h2': 'advanced.h2',
        'h3': 'advanced.h3',
        'h4': 'advanced.h4',
        'h5': 'advanced.h5',
        'h6': 'advanced.h6',
        'div': 'advanced.div',
        'div_container': 'advanced.div_container',
        'blockquote': 'advanced.blockquote',
        'code': 'advanced.code',
        'samp': 'advanced.samp',
        'span': 'advanced.span',
        'section' : 'advanced.section',
        'article' : 'advanced.article',
        'aside' : 'advanced.aside',
        'header' : 'advanced.header',
        'footer' : 'advanced.footer',
        'nav' : 'advanced.nav',
        'figure': 'advanced.figure',
        'dt': 'advanced.dt',
        'dd': 'advanced.dd'
    };

    tinymce.create('tinymce.plugins.FormatSelectPlugin', {
        init: function (ed, url) {
            this.editor = ed;

            var nodes = [];

            // map format options to array of node names
            each(ed.getParam('formatselect_blockformats', fmts, 'hash'), function (value, key) {
                if (key === 'span') {
                    return;
                }
                
                nodes.push(key.toUpperCase());
            });

            function isFormat(n) {
                if (n.getAttribute('data-mce-bogus')) {
                    return false;
                }
                
                // is a block element
                if (tinymce.inArray(nodes, n.nodeName) !== -1) {
                    // not a system element
                    if (n.className) {
                        return n.className.indexOf('mce-item-') === -1;
                    }

                    return true;
                }

                return false;
            }

            ed.onNodeChange.add(function (ed, cm, n) {
                var c = cm.get('formatselect'),
                    p, value = "";

                // select format
                if (c) {
                    // find block parents or self
                    p = ed.dom.getParent(n, isFormat, ed.getBody());

                    if (p && p.nodeName) {
                        value = p.nodeName.toLowerCase();

                        if (value === 'pre') {
                            value = p.getAttribute('data-mce-code') || p.getAttribute('data-mce-type') || value;
                        }
                    }

                    // select value
                    c.select(value);
                }
            });
        },

        createControl: function (n, cf) {
            if (n === "formatselect") {
                return this._createBlockFormats();
            }
        },

        _createBlockFormats: function () {
            var ed = this.editor,
                ctrl, PreviewCss = tinymce.util.PreviewCss;

                ctrl = ed.controlManager.createListBox('formatselect', {
                title: 'advanced.block',
                max_height: 384,
                onselect: function (v) {
                    ed.execCommand('FormatBlock', false, v);
                }
            });

            if (ctrl) {
                each(ed.getParam('formatselect_blockformats', fmts, 'hash'), function (value, key) {
                    ctrl.add(ed.getLang(value, key), key, {
                        'class': 'mce_formatPreview mce_' + key,
                        style: function () {
                            return PreviewCss.getCssText(ed, {
                                'block': key
                            });
                        }
                    });
                });

                PreviewCss.reset();
            }

            return ctrl;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('formatselect', tinymce.plugins.FormatSelectPlugin);
})();