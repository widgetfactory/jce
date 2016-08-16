/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function(tinymce) {
    var DOM = tinymce.DOM, Event = tinymce.dom.Event, is = tinymce.is, each = tinymce.each, VK = tinymce.VK;

    tinyMCE.onAddEditor.add(function(mgr, ed) {
        /**
         * Firefox on Mac OS will move the browser back to the previous page if you press CMD+Left arrow.
         * You might then loose all your work so we need to block that behavior and replace it with our own.
         */
        if (tinymce.isMac && tinymce.isGecko && !tinymce.isIE11) {
            ed.onKeyDown.add(function(ed, e) {
                if (VK.metaKeyPressed(e) && !e.shiftKey && (e.keyCode == 37 || e.keyCode == 39)) {
                    ed.selection.getSel().modify('move', e.keyCode == 37 ? 'backward' : 'forward', 'word');
                    e.preventDefault();
                }
            });
        }
    });

    tinymce.util.PreviewCss = function(ed, fmt) {
        var name, previewElm, dom = ed.dom, previewCss = '', parentFontSize, previewStylesName;

        var previewStyles = ed.settings.preview_styles;

        // No preview forced
        if (previewStyles === false)
            return '';

        // Default preview
        if (!previewStyles)
            previewStyles = 'font-family font-size font-weight text-decoration text-transform color background-color';

        // Removes any variables since these can't be previewed
        function removeVars(val) {
            return val.replace(/%(\w+)/g, '');
        }

        // Create block/inline element to use for preview
        name = fmt.block || fmt.inline || 'span';
        previewElm = dom.create(name);

        // Add format styles to preview element
        each(fmt.styles, function(value, name) {
            value = removeVars(value);

            if (value)
                dom.setStyle(previewElm, name, value);
        });

        // Add attributes to preview element
        each(fmt.attributes, function(value, name) {
            value = removeVars(value);

            if (value)
                dom.setAttrib(previewElm, name, value);
        });

        // Add classes to preview element
        each(fmt.classes, function(value) {
            value = removeVars(value);

            if (!dom.hasClass(previewElm, value))
                dom.addClass(previewElm, value);
        });

        // Add the previewElm outside the visual area
        dom.setStyles(previewElm, {
            position: 'absolute',
            left: -0xFFFF
        });
        ed.getBody().appendChild(previewElm);

        // Get parent container font size so we can compute px values out of em/% for older IE:s
        parentFontSize = dom.getStyle(ed.getBody(), 'fontSize', true);
        parentFontSize = /px$/.test(parentFontSize) ? parseInt(parentFontSize, 10) : 0;

        each(previewStyles.split(' '), function(name) {
            var value = dom.getStyle(previewElm, name, true);

            // If background is transparent then check if the body has a background color we can use
            if (name == 'background-color' && /transparent|rgba\s*\([^)]+,\s*0\)/.test(value)) {
                value = dom.getStyle(ed.getBody(), name, true);

                // Ignore white since it's the default color, not the nicest fix
                if (dom.toHex(value).toLowerCase() == '#ffffff') {
                    return;
                }
            }

            // Old IE won't calculate the font size so we need to do that manually
            if (name == 'font-size') {
                if (/em|%$/.test(value)) {
                    if (parentFontSize === 0) {
                        return;
                    }

                    // Convert font size from em/% to px
                    value = parseFloat(value, 10) / (/%$/.test(value) ? 100 : 1);
                    value = (value * parentFontSize) + 'px';
                }
            }

            previewCss += name + ':' + value + ';';
        });

        dom.remove(previewElm);

        return previewCss;
    };

    tinymce.create('tinymce.ui.ButtonDialog:tinymce.ui.Button', {
        /**
         * Constructs a new split button control instance.
         *
         * @constructor
         * @method MenuButton
         * @param {String} id Control id for the split button.
         * @param {Object} s Optional name/value settings object.
         * @param {Editor} ed Optional the editor instance this button is for.
         */
        ButtonDialog: function(id, s, ed) {
            this.parent(id, s, ed);

            this.settings = s = tinymce.extend({
                content: '',
                buttons: []
            }, this.settings);

            this.editor = ed;

            /**
             * Fires when the menu is rendered.
             *
             * @event onRenderMenu
             */
            this.onRenderDialog = new tinymce.util.Dispatcher(this);

            this.onShowDialog = new tinymce.util.Dispatcher(this);

            this.onHideDialog = new tinymce.util.Dispatcher(this);

            s.dialog_container = s.dialog_container || DOM.doc.body;
        },
        /**
         * Shows the menu.
         *
         * @method showMenu
         */
        showDialog: function() {
            var t = this, ed = this.editor, s = this.settings, p1, p2, e = DOM.get(t.id), m;

            if (t.isDisabled())
                return;

            this.storeSelection();

            if (!t.isDialogRendered) {
                t.renderDialog();
            }

            if (t.isDialogVisible)
                return t.hideDialog();

            DOM.show(t.id + '_dialog');

            if (s.url) {
                var iframe = DOM.get(t.id + '_iframe');
                iframe.src = s.url;
            }

            p2 = DOM.getPos(e);
            DOM.setStyles(t.id + '_dialog', {
                left: p2.x,
                top: p2.y + e.clientHeight + 5,
                zIndex: 200000
            });
            e = 0;

            if (this.isActive()) {
                DOM.addClass(t.id + '_dialog', this.classPrefix + 'DialogActive');
            } else {
                DOM.removeClass(t.id + '_dialog', this.classPrefix + 'DialogActive');
            }

            Event.add(ed.getDoc(), 'mousedown', t.hideDialog, t);

            Event.add(DOM.doc, 'mousedown', function(e) {
                var n = e.target;

                while (n) {
                    if (n == DOM.getRoot() || !n.nodeType || n.nodeType === 9) {
                        break;
                    }

                    if (n == DOM.get(t.id + '_dialog')) {
                        return;
                    }

                    n = n.parentNode;
                }

                t.hideDialog();
            });

            t.onShowDialog.dispatch(t);

            if (t._focused) {
                t._keyHandler = Event.add(t.id + '_dialog', 'keydown', function(e) {
                    if (e.keyCode == 27)
                        t.hideDialog();
                });
            }

            t.isDialogVisible = 1;
        },
        storeSelection: function() {
            // Store bookmark
            if (tinymce.isIE) {
                this.editor.focus();
                this.bookmark = this.editor.selection.getBookmark(1);
            }
        },
        restoreSelection: function() {
            if (this.bookmark) {
                this.editor.selection.moveToBookmark(this.bookmark);
                this.editor.focus();
            }

            this.bookmark = 0;
        },
        /**
         * Renders the menu to the DOM.
         *
         * @method renderMenu
         */
        renderDialog: function() {
            var t = this, m, s = this.settings, w, v, ed = this.editor;

            s['class'] += ' defaultSkin';

            if (ed.getParam('skin') !== "default") {
              s['class'] += ' ' + ed.getParam('skin') + 'Skin';
            }

            if (v = ed.getParam('skin_variant')) {
                s['class'] += ' ' + ed.getParam('skin') + 'Skin' + v.substring(0, 1).toUpperCase() + v.substring(1);
            }

            s['class'] += ed.settings.directionality == "rtl" ? ' mceRtl' : '';

            w = DOM.add(s.dialog_container, 'div', {
                role: 'presentation',
                id: t.id + '_dialog',
                'class': s['class'],
                style: 'position:absolute;left:0;top:-1000px;'
            });

            w = DOM.add(w, 'div', {
                'class': this.classPrefix + 'Dialog'
            });

            m = DOM.add(w, 'div', {
                'class': this.classPrefix + 'DialogContent'
            });

            if (s.width) {
                DOM.setStyle(w, 'width', s.width);
            }

            if (tinymce.is(s.content, 'string')) {
                DOM.setHTML(m, s.content);
            } else {
                DOM.add(m, s.content);
            }

            if (s.url) {
                DOM.add(m, 'iframe', {
                    'id': t.id + '_iframe',
                    'src': s.url,
                    style: {
                        'border': 0,
                        'width': '100%',
                        'height': '100%'
                    },
                    onload: function() {
                        t.isDialogRendered = true;
                        t.onRenderDialog.dispatch(t);
                    }
                });
            }

            m = DOM.add(w, 'div', {
                'class': this.classPrefix + 'DialogButtons'
            });

            each(s.buttons, function(o) {
                var btn = DOM.add(m, 'button', {
                    'type': 'button',
                    'class': 'mceDialogButton',
                    'id': t.id + '_button_' + o.id
                }, o.title || '');

                if (o.click) {
                    Event.add(btn, 'click', function(e) {
                        e.preventDefault();

                        t.restoreSelection();

                        var s = o.click.call(o.scope || t, e);

                        if (s) {
                            t.hideDialog();
                        }
                    });
                }
                ;
            });

            if (!s.url) {
                t.isDialogRendered = true;
                t.onRenderDialog.dispatch(t);
            }

            return w;
        },
        setButtonDisabled: function(button, state) {
            var id = this.id + '_button_' + button;

            if (state) {
                DOM.addClass(id, 'disabled');
            } else {
                DOM.removeClass(id, 'disabled');
            }
        },
        setButtonLabel: function(button, label) {
            DOM.setHTML(this.id + '_button_' + button, label);
        },
        /**
         * Hides the menu. The optional event parameter is used to check where the event occured so it
         * doesn't close them menu if it was a event inside the menu.
         *
         * @method hideMenu
         * @param {Event} e Optional event object.
         */
        hideDialog: function(e) {
            var t = this;

            // Prevent double toogles by canceling the mouse click event to the button
            if (e && e.type == "mousedown" && DOM.getParent(e.target, function(e) {
                return e.id === t.id || e.id === t.id + '_open';
            }))
                return;

            if (!e || !DOM.getParent(e.target, '.mceDialog')) {
                t.setState('Selected', 0);
                Event.remove(DOM.doc, 'mousedown', t.hideDialog, t);

                DOM.hide(t.id + '_dialog');
            }

            t.isDialogVisible = 0;

            t.onHideDialog.dispatch(t);
        },
        /**
         * Post render handler. This function will be called after the UI has been
         * rendered so that events can be added.
         *
         * @method postRender
         */
        postRender: function() {
            var t = this, s = t.settings, bm, ed = this.editor;

            Event.add(t.id, 'click', function() {
                if (!t.isDisabled()) {

                    if (s.onclick)
                        s.onclick(t.value);

                    t.showDialog();
                }
            });
        },
        destroy: function() {
            this.parent();

            Event.clear(this.id + '_dialog');
            DOM.remove(this.id + '_dialog');
        }
    });
})(tinymce);
