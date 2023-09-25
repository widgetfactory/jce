/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2023 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license    GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    var DOM = tinymce.DOM;

    tinymce.create('tinymce.themes.NoSkin', {
        init: function (ed, url) {
            var self = this,
                s = ed.settings;

            self.editor = ed;

            function grabContent() {
                var n, or, r, se = ed.selection;

                // Add new hidden div and store away selection
                n = ed.dom.add(ed.getBody(), 'div', { id: '_mcePaste', style: 'position:absolute;left:-1000px;top:-1000px' }, '<br mce_bogus="1" />').firstChild;
                or = ed.selection.getRng();

                // Move caret into hidden div
                r = ed.getDoc().createRange();
                r.setStart(n, 0);
                r.setEnd(n, 0);
                se.setRng(r);

                // Wait a while and grab the pasted contents
                window.setTimeout(function () {
                    var n = ed.dom.get('_mcePaste');

                    // Grab the HTML contents
                    var h = n.innerHTML;

                    // Remove hidden div and restore selection
                    ed.dom.remove(n);
                    se.setRng(or);

                    h = h.replace(/<\/?\w+[^>]*>/gi, '');

                    // Post process (DOM)
                    var el = ed.dom.create('div', 0, h);

                    // Remove empty spans
                    tinymce.each(ed.dom.select('span', el).reverse(), function (n) {
                        // If the element doesn't have any attributes remove it
                        if (ed.dom.getAttribs(n).length <= 1 && n.className === '') {
                            return ed.dom.remove(n, 1);
                        }
                    });

                    // Insert new trimmed hs into editor, serialize it first to remove any unwanted elements/attributes
                    ed.execCommand('mceInsertContent', false, ed.serializer.serialize(el, { getInner: 1 }));
                }, 0);
            }

            ed.onInit.add(function () {
                ed.onBeforeExecCommand.add(function (ed, cmd, ui, val, o) {
                    o.terminate = true;

                    return false;
                });

                ed.dom.loadCSS(url + "/skins/default/content.css");
            });

            ed.onKeyDown.add(function (ed, e) {
                if ((e.ctrlKey && e.keyCode == 86) || (e.shiftKey && e.keyCode == 45)) {
                    grabContent();
                }
            });

            ed.onKeyDown.add(function (ed, e) {
                if ((e.ctrlKey && e.keyCode == 66) || (e.ctrlKey && e.keyCode == 73) || (e.ctrlKey && e.keyCode == 85)) {
                    return tinymce.dom.Event.cancel(e);
                }
            });

            // Load CSS
            if (!ed.settings.compress.css) {
                DOM.loadCSS(s.editor_css ? ed.documentBaseURI.toAbsolute(s.editor_css) : url + "/skins/default/ui.css");
            }
        },

        renderUI: function (o) {
            var self = this,
                n = o.targetNode,
                ic, ed = self.editor,
                sc, p;

            n = p = DOM.create('div', {
                role: 'application',
                'aria-labelledby': ed.id + '_voice',
                id: ed.id + '_parent',
                'class': 'mceEditor mceDefaultSkin' + (ed.settings.directionality == "rtl" ? ' mceRtl' : '')
            });

            DOM.add(n, 'span', {
                'class': 'mceVoiceLabel',
                'style': 'display:none;',
                id: ed.id + '_voice'
            }, ed.settings.aria_label);

            n = sc = DOM.add(n, 'div', {
                role: "presentation",
                id: ed.id + '_tbl',
                'class': 'mceLayout'
            });

            ic = DOM.add(n, 'div', { 'class': 'mceIframeContainer' });

            n = o.targetNode;

            DOM.insertAfter(p, n);

            return {
                iframeContainer: ic,
                editorContainer: ed.id + '_parent',
                sizeContainer: sc,
                deltaHeight: -20
            };
        }
    });

    tinymce.ThemeManager.add('none', tinymce.themes.NoSkin);
})();