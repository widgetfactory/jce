/**
 * @package     JCE
 * @copyright   Copyright (c) 2009       Moxiecode Systems AB. All rights reserved.
 * @copyright   Copyright (c) 1999–2017  Ephox Corp. All rights reserved.
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 * @note        Forked or includes code from TinyMCE 3.x/4.x/5.x (originally LGPL 2.1) and relicensed under GPL 2+ per LGPL 2.1 §3.
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    var DOM = tinymce.DOM,
        Event = tinymce.dom.Event,
        extend = tinymce.extend,
        each = tinymce.each,
        Storage = tinymce.util.Storage,
        Delay = tinymce.util.Delay,
        explode = tinymce.explode;

    tinymce.create('tinymce.themes.AdvancedTheme', {

        // Control name lookup, format: title, command
        controls: {
            bold: ['bold_desc', 'Bold'],
            italic: ['italic_desc', 'Italic'],
            underline: ['underline_desc', 'Underline'],
            strikethrough: ['striketrough_desc', 'Strikethrough'],
            justifyleft: ['justifyleft_desc', 'JustifyLeft'],
            justifycenter: ['justifycenter_desc', 'JustifyCenter'],
            justifyright: ['justifyright_desc', 'JustifyRight'],
            justifyfull: ['justifyfull_desc', 'JustifyFull'],
            outdent: ['outdent_desc', 'Outdent'],
            indent: ['indent_desc', 'Indent'],
            undo: ['undo_desc', 'Undo'],
            redo: ['redo_desc', 'Redo'],
            unlink: ['unlink_desc', 'unlink'],
            cleanup: ['cleanup_desc', 'mceCleanup'],
            code: ['code_desc', 'mceCodeEditor'],
            removeformat: ['removeformat_desc', 'RemoveFormat'],
            sub: ['sub_desc', 'subscript'],
            sup: ['sup_desc', 'superscript'],
            forecolor: ['forecolor_desc', 'ForeColor'],
            forecolorpicker: ['forecolor_desc', 'mceForeColor'],
            backcolor: ['backcolor_desc', 'HiliteColor'],
            backcolorpicker: ['backcolor_desc', 'mceBackColor'],
            visualaid: ['visualaid_desc', 'mceToggleVisualAid'],
            newdocument: ['newdocument_desc', 'mceNewDocument'],
            blockquote: ['blockquote_desc', 'mceBlockQuote']
        },
        stateControls: ['bold', 'italic', 'underline', 'strikethrough', 'justifyleft', 'justifycenter', 'justifyright', 'justifyfull', 'sub', 'sup', 'blockquote'],

        init: function (ed, url) {
            var self = this,
                s, v;

            self.editor = ed;
            self.url = url;
            self.onResolveName = new tinymce.util.Dispatcher(this);
            // add resize dispatcher
            self.onResize = new tinymce.util.Dispatcher(this);

            s = ed.settings;

            // Default settings
            self.settings = s = extend({
                theme_path: true,
                theme_toolbar_location: 'top',
                theme_blockformats: "p,address,pre,h1,h2,h3,h4,h5,h6",
                theme_toolbar_align: "left",
                theme_statusbar_location: "bottom",
                theme_fonts: "Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats",
                theme_more_colors: 1,
                theme_row_height: 23,
                theme_resize_horizontal: 1,
                theme_font_sizes: "1,2,3,4,5,6,7",
                theme_font_selector: "span",
                theme_show_current_color: 0,
                readonly: ed.settings.readonly
            }, s);

            if ((v = s.theme_path_location) && v != 'none') {
                s.theme_statusbar_location = s.theme_path_location;
            }

            if (s.theme_statusbar_location == 'none') {
                s.theme_statusbar_location = 0;
            }

            // Init editor
            ed.onInit.add(function () {
                if (!ed.settings.readonly) {
                    ed.onNodeChange.add(self._nodeChanged, self);
                    ed.onKeyUp.add(self._updateUndoStatus, self);
                    ed.onMouseUp.add(self._updateUndoStatus, self);
                    ed.dom.bind(ed.dom.getRoot(), 'dragend', function () {
                        self._updateUndoStatus(ed);
                    });

                    ed.addShortcut('alt+F10,F10', '', function () {
                        self.toolbarGroup.focus();
                    });

                    ed.addShortcut('alt+F11', '', function () {
                        DOM.get(ed.id + '_path_row').focus();
                    });
                }
            });

            ed.onPostRender.add(function () {
                var el = ed.getElement();

                DOM.setStyle(ed.id + '_tbl', 'width', '');

                var e = DOM.get(ed.id + '_parent'),
                    ifr = DOM.get(ed.id + '_ifr');

                // get dimensions from settings or textarea
                var width = s.width || el.style.width;
                var height = s.height || el.style.height;

                // Resize iframe and container
                if (height) {
                    DOM.setStyle(ifr, 'height', height);
                }

                // Resize iframe and container
                if (width) {
                    DOM.setStyle(e.parentNode, 'max-width', width);
                    
                    // only apply max-width if it's a pixel value
                    if (!/%/.test(width)) {
                        DOM.setStyle(ifr, 'max-width', width);
                    }
                }
            });

            ed.onSetProgressState.add(function (ed, b, ti) {
                var co, id = ed.id,
                    tb;

                if (b) {
                    self.progressTimer = setTimeout(function () {
                        co = ed.getContainer();
                        co = co.insertBefore(DOM.create('DIV', {
                            style: 'position:relative'
                        }), co.firstChild);
                        tb = DOM.get(ed.id + '_tbl');

                        DOM.add(co, 'div', {
                            id: id + '_blocker',
                            'class': 'mceBlocker',
                            style: {
                                width: tb.clientWidth + 2,
                                height: tb.clientHeight + 2
                            }
                        });
                        DOM.add(co, 'div', {
                            id: id + '_progress',
                            'class': 'mceProgress',
                            style: {
                                left: tb.clientWidth / 2,
                                top: tb.clientHeight / 2
                            }
                        });
                    }, ti || 0);
                } else {
                    DOM.remove(id + '_blocker');
                    DOM.remove(id + '_progress');
                    clearTimeout(self.progressTimer);
                }
            });

            if (ed.settings.content_css !== false) {
                ed.contentCSS.push(ed.baseURI.toAbsolute(url + "/skins/" + ed.settings.skin + "/content.css"));
            }
        },

        createControl: function (n, cf) {
            var c = cf.createControl(n);

            if (c) {
                return c;
            }

            var cd = this.controls[n];

            if (cd) {
                return cf.createButton(n, {
                    title: "advanced." + cd[0],
                    cmd: cd[1],
                    ui: cd[2],
                    value: cd[3]
                });
            }
        },

        execCommand: function (cmd, ui, val) {
            var f = this['_' + cmd];

            if (f) {
                f.call(this, ui, val);
                return true;
            }

            return false;
        },

        renderUI: function (o) {
            var n, ic, self = this,
                ed = self.editor,
                s = self.settings,
                sc, p;

            if (ed.settings) {
                ed.settings.aria_label = s.aria_label + ed.getLang('advanced.help_shortcut');
            }

            // swap "mobile" for default variant
            if (ed.settings.skin === 'mobile') {
                ed.settings.skin = 'default';
                s.skin_variant = 'touch';
            }

            var skin = 'mce' + self._ufirst(ed.settings.skin) + 'Skin';

            if (s.skin_variant) {
                // eg: mceDefaultSkinTouch
                skin += ' ' + skin + self._ufirst(s.skin_variant);
            }

            // prefix with 'mceDefaultSkin' if not default
            if (ed.settings.skin !== "default") {
                skin = 'mceDefaultSkin ' + skin;
            }

            // add direction
            if (ed.settings.skin_directionality == "rtl") {
                skin += ' mceRtl';
            }

            // store for other uses
            ed.settings.skin_class = skin;

            n = p = DOM.create('div', {
                role: 'application',
                'aria-label': s.aria_label,
                id: ed.id + '_parent',
                'class': 'mceEditor ' + skin
            });

            n = sc = DOM.add(n, 'div', {
                role: "presentation",
                id: ed.id + '_tbl',
                'class': 'mceLayout'
            });

            ic = self._createLayout(s, n, o, p);

            n = o.targetNode;
            DOM.insertAfter(p, n);

            Event.add(ed.id + '_path_row', 'click', function (e) {
                e = DOM.getParent(e.target, 'a');

                if (e && e.nodeName == 'A') {
                    ed.execCommand('mceSelectNodeDepth', false, e.getAttribute('data-index') || 0);
                    return false;
                }
            });

            if (s.theme_toolbar_location == 'external') {
                o.deltaHeight = 0;
            }

            self.deltaHeight = o.deltaHeight;
            o.targetNode = null;

            return {
                iframeContainer: ic,
                editorContainer: ed.id + '_parent',
                sizeContainer: sc,
                deltaHeight: o.deltaHeight
            };
        },

        resizeBy: function (dw, dh) {
            var e = DOM.get(this.editor.id + '_ifr');

            this.resizeTo(e.clientWidth + dw, e.clientHeight + dh);
        },

        resizeTo: function (w, h, store) {
            var ed = this.editor,
                s = this.settings,
                e = DOM.get(ed.id + '_parent'),
                ifr = DOM.get(ed.id + '_ifr');

            // Boundery fix box
            w = Math.max(s.theme_resizing_min_width || 100, w);
            h = Math.max(s.theme_resizing_min_height || 100, h);
            w = Math.min(s.theme_resizing_max_width || 0xFFFF, w);
            h = Math.min(s.theme_resizing_max_height || 0xFFFF, h);

            // Resize iframe and container
            DOM.setStyle(ifr, 'height', h);

            if (s.theme_resize_horizontal) {
                DOM.setStyle(e.parentNode, 'max-width', w + 'px');
                DOM.setStyle(ifr, 'max-width', w + 'px');
            }

            // Store away the size
            if (store && s.use_state_cookies !== false) {
                Storage.setHash("wf_editor_size_" + ed.id, {
                    cw: w,
                    ch: h
                });
            }

            // dispatch
            this.onResize.dispatch();
        },

        destroy: function () {
            var id = this.editor.id;

            Event.clear(id + '_resize');
            Event.clear(id + '_path_row');
            Event.clear(id + '_external_close');
        },

        // Internal functions
        _createLayout: function (s, tb, o, p) {
            var self = this,
                lo = s.theme_toolbar_location,
                sl = s.theme_statusbar_location, ic;

            if (s.readonly) {
                ic = DOM.add(tb, 'div', {
                    'class': 'mceIframeContainer'
                });

                return ic;
            }

            // Create toolbar container at top
            if (lo == 'top') {
                self._addToolbars(tb, o);
            }

            if (sl == 'top') {
                self._addStatusBar(tb, o);
            }

            // Create iframe container
            ic = DOM.add(tb, 'div', {
                'class': 'mceIframeContainer'
            });

            // Create toolbar container at bottom
            if (lo == 'bottom') {
                self._addToolbars(tb, o);
            }

            if (sl == 'bottom') {
                self._addStatusBar(tb, o);
            }

            return ic;
        },

        _addControls: function (v, tb) {
            var self = this,
                s = self.settings,
                di, cf = self.editor.controlManager;

            if (s.theme_disable && !self._disabled) {
                di = {};

                each(explode(s.theme_disable), function (v) {
                    di[v] = 1;
                });

                self._disabled = di;
            } else {
                di = self._disabled;
            }

            each(explode(v), function (n) {
                var c;

                if (di && di[n]) {
                    return;
                }

                c = self.createControl(n, cf);

                if (c) {
                    tb.add(c);
                }
            });
        },

        _addToolbars: function (c, o) {
            var self = this,
                i, tb, ed = self.editor,
                s = self.settings,
                v, cf = ed.controlManager,
                n, h = [],
                a, toolbarGroup, toolbarsExist = false;

            toolbarGroup = cf.createToolbarGroup('toolbargroup', {
                'name': ed.getLang('advanced.toolbar'),
                'tab_focus_toolbar': ed.getParam('theme_tab_focus_toolbar'),
                class: 'ToolbarGroup'
            });

            self.toolbarGroup = toolbarGroup;

            a = s.theme_toolbar_align.toLowerCase();
            a = cf.classPrefix + self._ufirst(a);

            n = DOM.add(c, 'div', {
                'class': cf.classPrefix + 'Toolbar ' + a,
                "role": "toolbar",
                id: ed.id + '_toolbar'
            });

            // Create toolbar and add the controls
            for (i = 1;
                (v = s['theme_buttons' + i]); i++) {
                toolbarsExist = true;

                tb = cf.createToolbar("toolbar" + i, {
                    'class': 'mceToolbarRow' + i,
                    'aria-label': 'Toolbar Row ' + i
                });

                if (s['theme_buttons' + i + '_add']) {
                    v += ',' + s['theme_buttons' + i + '_add'];
                }

                if (s['theme_buttons' + i + '_add_before']) {
                    v = s['theme_buttons' + i + '_add_before'] + ',' + v;
                }

                self._addControls(v, tb);

                toolbarGroup.add(tb);

                o.deltaHeight -= s.theme_row_height;
            }

            // Handle case when there are no toolbar buttons and ensure editor height is adjusted accordingly
            if (!toolbarsExist) {
                o.deltaHeight -= s.theme_row_height;
            }

            h.push(toolbarGroup.renderHTML());

            DOM.setHTML(n, h.join(''));
        },

        _addStatusBar: function (tb, o) {
            var n, self = this,
                ed = self.editor,
                s = self.settings, td;

            n = td = DOM.add(tb, 'div', {
                'class': 'mceStatusbar'
            });

            if (s.theme_path) {
                n = DOM.add(n, 'div', {
                    id: ed.id + '_path_row',
                    'role': 'group',
                    'aria-labelledby': ed.id + '_path_voice',
                    'class': 'mcePathRow'
                });

                DOM.add(n, 'span', {
                    id: ed.id + '_path_voice',
                    'class': 'mcePathLabel'
                }, ed.translate('advanced.path') + ': ');
            }

            if (s.theme_resizing) {
                DOM.add(td, 'div', {
                    id: ed.id + '_resize',
                    'class': 'mceResize',
                    tabIndex: "-1"
                }, '<span class="mceIcon mce_resize"></span>');

                if (s.use_state_cookies !== false) {
                    ed.onPostRender.add(function () {
                        var o = Storage.getHash("wf_editor_size_" + ed.id);

                        if (!o) {
                            return;
                        }

                        self.resizeTo(o.cw, o.ch, false);
                    });
                }

                ed.onPostRender.add(function () {
                    Event.add(ed.id + '_resize', 'click', function (e) {
                        e.preventDefault();
                    });

                    Event.add(ed.id + '_resize', 'mousedown', function (e) {
                        var mouseMoveHandler1, mouseMoveHandler2,
                            mouseUpHandler1, mouseUpHandler2,
                            startX, startY, startWidth, startHeight, width, height, ifrElm;

                        function resizeOnMove(e) {
                            e.preventDefault();

                            width = startWidth + (e.screenX - startX);
                            height = startHeight + (e.screenY - startY);

                            self.resizeTo(width, height);
                        }

                        function endResize(e) {
                            // Stop listening
                            Event.remove(DOM.doc, 'mousemove', mouseMoveHandler1);
                            Event.remove(ed.getDoc(), 'mousemove', mouseMoveHandler2);
                            Event.remove(DOM.doc, 'mouseup', mouseUpHandler1);
                            Event.remove(ed.getDoc(), 'mouseup', mouseUpHandler2);

                            width = startWidth + (e.screenX - startX);
                            height = startHeight + (e.screenY - startY);
                            self.resizeTo(width, height, true);

                            ed.nodeChanged();
                        }

                        e.preventDefault();

                        // Get the current rect size
                        startX = e.screenX;
                        startY = e.screenY;
                        ifrElm = DOM.get(self.editor.id + '_ifr');
                        startWidth = width = ifrElm.clientWidth;
                        startHeight = height = ifrElm.clientHeight;

                        // Register envent handlers
                        mouseMoveHandler1 = Event.add(DOM.doc, 'mousemove', resizeOnMove);
                        mouseMoveHandler2 = Event.add(ed.getDoc(), 'mousemove', resizeOnMove);
                        mouseUpHandler1 = Event.add(DOM.doc, 'mouseup', endResize);
                        mouseUpHandler2 = Event.add(ed.getDoc(), 'mouseup', endResize);
                    });

                    if (ed.settings.floating_toolbar) {
                        var elm = ed.getContainer(), parent = elm.parentNode;

                        Event.add(window, 'scroll', Delay.debounce(function () {
                            if (ed.settings.fullscreen_enabled) {
                                return;
                            }

                            if (window.pageYOffset > parent.offsetTop) {
                                DOM.addClass(elm, 'mceToolbarFixed');
                            } else {
                                DOM.removeClass(elm, 'mceToolbarFixed');
                            }
                        }, 128));

                    }
                });
            }

            o.deltaHeight -= 21;
            n = tb = null;
        },

        _updateUndoStatus: function (ed) {
            var cm = ed.controlManager,
                um = ed.undoManager;

            cm.setDisabled('undo', !um.hasUndo() && !um.typing);
            cm.setDisabled('redo', !um.hasRedo());
        },

        _nodeChanged: function (ed, cm, n, co, ob) {
            var self = this,
                p, s = self.settings;

            tinymce.each(self.stateControls, function (c) {
                cm.setActive(c, ed.queryCommandState(self.controls[c][1]));
            });

            function getParents(node) {
                var outParents = [], parents = node.parents, i = parents.length;

                for (var i = 0, l = parents.length; i < l; i++) {
                    parent = parents[i];
                    
                    // Ignore non element 
                    if (parent.nodeType != 1) {
                        continue;
                    }

                    // Ignore bogus/hidden elements
                    if (isBogusOrBookmarkOrCaret(parent)) {
                        continue;
                    }

                    // ignore linebreaks
                    if (parent.nodeName == 'BR') {
                        continue;
                    }

                    if (parent.hasAttribute('data-mce-bogus') || parent.hasAttribute('data-mce-root') || parent.hasAttribute('data-mce-internal')) {
                        continue;
                    }

                    outParents.push(parent);
                }

                return outParents;
            }

            function isBogusOrBookmarkOrCaret(node) {
                return node.hasAttribute('data-mce-bogus') || node.getAttribute('data-mce-type') == 'bookmark' || node.getAttribute('data-mce-type') == 'caret' || node.id == '_mce_caret';
            }

            cm.setActive('visualaid', ed.hasVisual);
            self._updateUndoStatus(ed);
            cm.setDisabled('outdent', !ed.queryCommandState('Outdent'));

            if (s.theme_path && s.theme_statusbar_location) {
                p = DOM.get(ed.id + '_path') || DOM.add(ed.id + '_path_row', 'span', {
                    id: ed.id + '_path',
                    'class': 'mcePathPath'
                });

                if (self.statusKeyboardNavigation) {
                    self.statusKeyboardNavigation.destroy();
                    self.statusKeyboardNavigation = null;
                }

                DOM.setHTML(p, '');

                var parents = getParents(ob), html = '';

                for (var i = 0, l = parents.length; i < l; i++) {
                    var parent = parents[i];

                    var name = parent.nodeName.toLowerCase();

                    var args = {
                        name: name,
                        node: parent,
                        title: name
                    };

                    self.onResolveName.dispatch(self, args);

                    if (args.name) {
                        if (!args.disabled) {
                            html = '<a role="button" title="' + args.title + '" data-index="' + i + '"><span class="mceText">' + args.name + '</span></a>' + html;
                        } else {
                            html = '<span class="mceText">' + args.name + '</span>' + html;
                        }
                    }
                }

                DOM.setHTML(p, html);

                if (DOM.select('a', p).length > 0) {
                    self.statusKeyboardNavigation = new tinymce.ui.KeyboardNavigation({
                        root: ed.id + "_path_row",
                        items: DOM.select('a', p),
                        excludeFromTabOrder: true,
                        onCancel: function () {
                            ed.focus();
                        }
                    }, DOM);
                }

                var row = DOM.get(ed.id + "_path_row"),
                    status = row.parentNode,
                    mod = 20;

                tinymce.each(status.childNodes, function (n) {
                    if (DOM.hasClass(n, 'mcePathRow')) {
                        return true;
                    }

                    mod += n.offsetWidth;
                });

                tinymce.each(DOM.select('a', p), function (n) {
                    DOM.removeClass(n, 'mcePathHidden');

                    if ((p.offsetWidth + mod + DOM.getPrev(p, '.mcePathLabel').offsetWidth) > status.offsetWidth) {
                        DOM.addClass(n, 'mcePathHidden');
                    }
                });
            }
        },

        _mceNewDocument: function () {
            var ed = this.editor;

            ed.windowManager.confirm({
                title: 'advanced.newdocument_desc',
                text: 'advanced.newdocument'
            }, function (s) {
                if (s) {
                    ed.execCommand('mceSetContent', false, '');
                }
            });
        },

        _ufirst: function (s) {
            return s.substring(0, 1).toUpperCase() + s.substring(1);
        }
    });

    tinymce.ThemeManager.add('advanced', tinymce.themes.AdvancedTheme);
})();