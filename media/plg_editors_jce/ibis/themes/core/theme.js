/**
 * @package    JCE
 * @copyright    Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license    GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    var DOM = ibis.DOM,
        Event = ibis.dom.Event,
        extend = ibis.extend,
        each = ibis.each,
        Storage = ibis.util.Storage,
        Delay = ibis.util.Delay,
        explode = ibis.explode;

    ibis.create('ibis.themes.CoreTheme', {

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

        // Initialise the theme, set up settings, event listeners, and content CSS
        init: function (ed, url) {
            var self = this;

            self.editor = ed;
            self.url = url;
            self.onResolveName = new ibis.util.Dispatcher(this);
            self.onResize = new ibis.util.Dispatcher(this);

            var settings = ed.settings;

            // Default settings
            self.settings = settings = extend({
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
            }, settings);

            var pathLocation = settings.theme_path_location;
            if (pathLocation && pathLocation != 'none') {
                settings.theme_statusbar_location = settings.theme_path_location;
            }

            if (settings.theme_statusbar_location == 'none') {
                settings.theme_statusbar_location = 0;
            }

            ed.onInit.add(function () {
                if (!ed.settings.readonly) {
                    ed.onNodeChange.add(self.nodeChanged, self);
                    ed.onKeyUp.add(self.updateUndoStatus, self);
                    ed.onMouseUp.add(self.updateUndoStatus, self);
                    ed.dom.bind(ed.dom.getRoot(), 'dragend', function () {
                        self.updateUndoStatus(ed);
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

                var containerEl = DOM.get(ed.id + '_parent'),
                    iframeEl = DOM.get(ed.id + '_ifr');

                // get dimensions from settings or textarea
                var width = settings.width || el.style.width;
                var height = settings.height || el.style.height;

                if (height) {
                    DOM.setStyle(iframeEl, 'height', height);
                }

                if (width) {
                    DOM.setStyle(containerEl.parentNode, 'max-width', width);

                    // only apply max-width if it's a pixel value
                    if (!/%/.test(width)) {
                        DOM.setStyle(iframeEl, 'max-width', width);
                    }
                }
            });

            ed.onSetProgressState.add(function (ed, active, delay) {
                var id = ed.id, tableEl;

                if (active) {
                    self.progressTimer = setTimeout(function () {
                        var container = ed.getContainer();
                        var wrapper = DOM.create('DIV', {
                            id: id + '_progress_wrap',
                            style: 'position:relative'
                        });
                        container.insertBefore(wrapper, container.firstChild);
                        tableEl = DOM.get(id + '_tbl');

                        DOM.add(wrapper, 'div', {
                            id: id + '_blocker',
                            'class': 'mceBlocker',
                            style: {
                                width: tableEl.clientWidth + 2,
                                height: tableEl.clientHeight + 2
                            }
                        });
                        DOM.add(wrapper, 'div', {
                            id: id + '_progress',
                            'class': 'mceProgress',
                            style: {
                                left: tableEl.clientWidth / 2,
                                top: tableEl.clientHeight / 2
                            }
                        });
                    }, delay || 0);
                } else {
                    DOM.remove(id + '_progress_wrap');
                    clearTimeout(self.progressTimer);
                }
            });

            if (ed.settings.content_css !== false) {
                ed.contentCSS.push(ed.baseURI.toAbsolute(url + "/skins/" + ed.settings.skin + "/content.css"));
            }
        },

        // Create a toolbar control by name, falling back to a button if no plugin control matches
        createControl: function (name, controlManager) {
            var control = controlManager.createControl(name);

            if (control) {
                return control;
            }

            var controlDef = this.controls[name];

            if (controlDef) {
                return controlManager.createButton(name, {
                    title: "advanced." + controlDef[0],
                    cmd: controlDef[1],
                    ui: controlDef[2],
                    value: controlDef[3]
                });
            }
        },

        // Dispatch a theme command to its handler method if one exists
        execCommand: function (cmd, ui, val) {
            var handler = this[cmd];

            if (handler) {
                handler.call(this, ui, val);
                return true;
            }

            return false;
        },

        // Build the editor chrome and return container references
        renderUI: function (renderArgs) {
            var self = this,
                ed = self.editor,
                settings = self.settings;

            if (ed.settings) {
                ed.settings.aria_label = settings.aria_label + ed.getLang('advanced.help_shortcut');
            }

            // swap "mobile" for default variant
            if (ed.settings.skin === 'mobile') {
                ed.settings.skin = 'default';
                settings.skin_variant = 'touch';
            }

            var skinClass = 'mce' + self.ufirst(ed.settings.skin) + 'Skin';

            if (settings.skin_variant) {
                // eg: mceDefaultSkinTouch
                skinClass += ' ' + skinClass + self.ufirst(settings.skin_variant);
            }

            // prefix with 'mceDefaultSkin' if not default
            if (ed.settings.skin !== "default") {
                skinClass = 'mceDefaultSkin ' + skinClass;
            }

            // add direction
            if (ed.settings.skin_directionality == "rtl") {
                skinClass += ' mceRtl';
            }

            // store for other uses
            ed.settings.skin_class = skinClass;

            var editorEl = DOM.create('div', {
                role: 'application',
                'aria-label': settings.aria_label,
                id: ed.id + '_parent',
                'class': 'mceEditor ' + skinClass
            });

            var sizeContainer = DOM.add(editorEl, 'div', {
                role: "presentation",
                id: ed.id + '_tbl',
                'class': 'mceLayout'
            });

            var iframeContainer = self.createLayout(settings, sizeContainer, renderArgs, editorEl);

            var targetNode = renderArgs.targetNode;
            DOM.insertAfter(editorEl, targetNode);

            Event.add(ed.id + '_path_row', 'click', function (evt) {
                var anchor = DOM.getParent(evt.target, 'a');

                if (anchor && anchor.nodeName == 'A') {
                    ed.execCommand('mceSelectNodeDepth', false, anchor.getAttribute('data-index') || 0);
                    return false;
                }
            });

            if (settings.theme_toolbar_location == 'external') {
                renderArgs.deltaHeight = 0;
            }

            self.deltaHeight = renderArgs.deltaHeight;
            renderArgs.targetNode = null;

            return {
                iframeContainer: iframeContainer,
                editorContainer: ed.id + '_parent',
                sizeContainer: sizeContainer,
                deltaHeight: renderArgs.deltaHeight
            };
        },

        // Resize the editor by a delta from its current size
        resizeBy: function (dw, dh) {
            var iframeEl = DOM.get(this.editor.id + '_ifr');

            this.resizeTo(iframeEl.clientWidth + dw, iframeEl.clientHeight + dh);
        },

        // Resize the editor to an absolute size, optionally persisting it to storage
        resizeTo: function (width, height, store) {
            var ed = this.editor,
                settings = this.settings,
                editorEl = DOM.get(ed.id + '_parent'),
                iframeEl = DOM.get(ed.id + '_ifr');

            var MAX_DIMENSION = 65535;

            width = Math.max(settings.theme_resizing_min_width || 100, width);
            height = Math.max(settings.theme_resizing_min_height || 100, height);
            width = Math.min(settings.theme_resizing_max_width || MAX_DIMENSION, width);
            height = Math.min(settings.theme_resizing_max_height || MAX_DIMENSION, height);

            DOM.setStyle(iframeEl, 'height', height);

            if (settings.theme_resize_horizontal) {
                DOM.setStyle(editorEl.parentNode, 'max-width', width + 'px');
                DOM.setStyle(iframeEl, 'max-width', width + 'px');
            }

            // Store away the size
            if (store && settings.use_state_cookies !== false) {
                Storage.setHash("wf_editor_size_" + ed.id, {
                    cw: width,
                    ch: height
                });
            }

            this.onResize.dispatch();
        },

        // Remove event listeners when the editor is torn down
        destroy: function () {
            var id = this.editor.id;

            Event.clear(id + '_resize');
            Event.clear(id + '_path_row');
            Event.clear(id + '_external_close');
        },

        // Arrange toolbar, iframe, and statusbar regions according to location settings
        createLayout: function (settings, container, layout, editorEl) {
            var self = this,
                toolbarLocation = settings.theme_toolbar_location,
                statusbarLocation = settings.theme_statusbar_location,
                iframeContainer;

            if (settings.readonly) {
                iframeContainer = DOM.add(container, 'div', {
                    'class': 'mceIframeContainer'
                });

                return iframeContainer;
            }

            if (toolbarLocation == 'top') {
                self.addToolbars(container, layout);
            }

            if (statusbarLocation == 'top') {
                self.addStatusBar(container, layout);
            }

            iframeContainer = DOM.add(container, 'div', {
                'class': 'mceIframeContainer'
            });

            if (toolbarLocation == 'bottom') {
                self.addToolbars(container, layout);
            }

            if (statusbarLocation == 'bottom') {
                self.addStatusBar(container, layout);
            }

            return iframeContainer;
        },

        // Add individual controls to a toolbar, respecting the disabled list
        addControls: function (buttons, toolbar) {
            var self = this,
                settings = self.settings,
                disabled, controlManager = self.editor.controlManager;

            if (settings.theme_disable && !self._disabled) {
                disabled = {};

                each(explode(settings.theme_disable), function (name) {
                    disabled[name] = 1;
                });

                self._disabled = disabled;
            } else {
                disabled = self._disabled;
            }

            each(explode(buttons), function (name) {
                if (disabled && disabled[name]) {
                    return;
                }

                var control = self.createControl(name, controlManager);

                if (control) {
                    toolbar.add(control);
                }
            });
        },

        // Build toolbar rows from theme_buttons settings and inject them into the layout
        addToolbars: function (container, layout) {
            var self = this,
                ed = self.editor,
                settings = self.settings,
                controlManager = ed.controlManager,
                toolbarGroup, toolbarsExist = false;

            toolbarGroup = controlManager.createToolbarGroup('toolbargroup', {
                'name': ed.getLang('advanced.toolbar'),
                'tab_focus_toolbar': ed.getParam('theme_tab_focus_toolbar'),
                class: 'ToolbarGroup'
            });

            self.toolbarGroup = toolbarGroup;

            var alignClass = controlManager.classPrefix + self.ufirst(settings.theme_toolbar_align.toLowerCase());

            var toolbarEl = DOM.add(container, 'div', {
                'class': controlManager.classPrefix + 'Toolbar ' + alignClass,
                "role": "toolbar",
                id: ed.id + '_toolbar'
            });

            for (var i = 1; ; i++) {
                var buttons = settings['theme_buttons' + i];
                if (!buttons) {
                    break;
                }

                toolbarsExist = true;

                var toolbar = controlManager.createToolbar("toolbar" + i, {
                    'class': 'mceToolbarRow' + i,
                    'aria-label': 'Toolbar Row ' + i
                });

                if (settings['theme_buttons' + i + '_add']) {
                    buttons += ',' + settings['theme_buttons' + i + '_add'];
                }

                if (settings['theme_buttons' + i + '_add_before']) {
                    buttons = settings['theme_buttons' + i + '_add_before'] + ',' + buttons;
                }

                self.addControls(buttons, toolbar);

                toolbarGroup.add(toolbar);

                layout.deltaHeight -= settings.theme_row_height;
            }

            // Handle case when there are no toolbar buttons and ensure editor height is adjusted accordingly
            if (!toolbarsExist) {
                layout.deltaHeight -= settings.theme_row_height;
            }

            DOM.setHTML(toolbarEl, toolbarGroup.renderHTML());
        },

        // Render the path breadcrumb row and optional resize handle into the statusbar
        addStatusBar: function (container, layout) {
            var self = this,
                ed = self.editor,
                settings = self.settings;

            var statusbarEl = DOM.add(container, 'div', {
                'class': 'mceStatusbar'
            });

            if (settings.theme_path) {
                var pathRowEl = DOM.add(statusbarEl, 'div', {
                    id: ed.id + '_path_row',
                    'role': 'group',
                    'aria-labelledby': ed.id + '_path_voice',
                    'class': 'mcePathRow'
                });

                DOM.add(pathRowEl, 'span', {
                    id: ed.id + '_path_voice',
                    'class': 'mcePathLabel'
                }, ed.translate('advanced.path') + ': ');
            }

            if (settings.theme_resizing) {
                DOM.add(statusbarEl, 'div', {
                    id: ed.id + '_resize',
                    'class': 'mceResize',
                    tabIndex: "-1"
                }, '<span class="mceIcon mce_resize"></span>');

                if (settings.use_state_cookies !== false) {
                    ed.onPostRender.add(function () {
                        var savedSize = Storage.getHash("wf_editor_size_" + ed.id);

                        if (!savedSize) {
                            return;
                        }

                        self.resizeTo(savedSize.cw, savedSize.ch, false);
                    });
                }

                ed.onPostRender.add(function () {
                    Event.add(ed.id + '_resize', 'click', function (evt) {
                        evt.preventDefault();
                    });

                    Event.add(ed.id + '_resize', 'mousedown', function (evt) {
                        var mouseMoveHandler1, mouseMoveHandler2,
                            mouseUpHandler1, mouseUpHandler2,
                            startX, startY, startWidth, startHeight, width, height, iframeEl;

                        function resizeOnMove(evt) {
                            evt.preventDefault();

                            width = startWidth + (evt.screenX - startX);
                            height = startHeight + (evt.screenY - startY);

                            self.resizeTo(width, height);
                        }

                        function endResize(evt) {
                            // Stop listening
                            Event.remove(DOM.doc, 'mousemove', mouseMoveHandler1);
                            Event.remove(ed.getDoc(), 'mousemove', mouseMoveHandler2);
                            Event.remove(DOM.doc, 'mouseup', mouseUpHandler1);
                            Event.remove(ed.getDoc(), 'mouseup', mouseUpHandler2);

                            width = startWidth + (evt.screenX - startX);
                            height = startHeight + (evt.screenY - startY);
                            self.resizeTo(width, height, true);

                            ed.nodeChanged();
                        }

                        evt.preventDefault();

                        // Get the current rect size
                        startX = evt.screenX;
                        startY = evt.screenY;
                        iframeEl = DOM.get(self.editor.id + '_ifr');
                        startWidth = width = iframeEl.clientWidth;
                        startHeight = height = iframeEl.clientHeight;

                        // Register event handlers
                        mouseMoveHandler1 = Event.add(DOM.doc, 'mousemove', resizeOnMove);
                        mouseMoveHandler2 = Event.add(ed.getDoc(), 'mousemove', resizeOnMove);
                        mouseUpHandler1 = Event.add(DOM.doc, 'mouseup', endResize);
                        mouseUpHandler2 = Event.add(ed.getDoc(), 'mouseup', endResize);
                    });

                    if (ed.settings.floating_toolbar) {
                        var editorContainer = ed.getContainer(),
                            editorParent = editorContainer.parentNode;

                        Event.add(window, 'scroll', Delay.debounce(function () {
                            if (ed.settings.fullscreen_enabled) {
                                return;
                            }

                            if (window.pageYOffset > editorParent.offsetTop) {
                                DOM.addClass(editorContainer, 'mceToolbarFixed');
                            } else {
                                DOM.removeClass(editorContainer, 'mceToolbarFixed');
                            }
                        }, 128));
                    }
                });
            }

            layout.deltaHeight -= 21;
        },

        // Sync undo/redo button disabled state with the undo manager
        updateUndoStatus: function (ed) {
            var controlManager = ed.controlManager,
                undoManager = ed.undoManager;

            controlManager.setDisabled('undo', !undoManager.hasUndo() && !undoManager.typing);
            controlManager.setDisabled('redo', !undoManager.hasRedo());
        },

        // Update toolbar state and path breadcrumb on node selection change
        nodeChanged: function (ed, controlManager, node, collapsed, nodeChangeArgs) {
            var self = this,
                settings = self.settings;

            ibis.each(self.stateControls, function (controlName) {
                controlManager.setActive(controlName, ed.queryCommandState(self.controls[controlName][1]));
            });

            function isBogusOrBookmarkOrCaret(node) {
                return node.hasAttribute('data-mce-bogus') || node.getAttribute('data-mce-type') == 'bookmark' || node.getAttribute('data-mce-type') == 'caret' || node.id == '_mce_caret';
            }

            function getParents(node) {
                var outParents = [], parents = node.parents;

                for (var i = 0, len = parents.length; i < len; i++) {
                    var parent = parents[i];

                    if (parent.nodeType != 1) {
                        continue;
                    }

                    if (isBogusOrBookmarkOrCaret(parent)) {
                        continue;
                    }

                    if (parent.nodeName == 'BR') {
                        continue;
                    }

                    if (parent.hasAttribute('data-mce-root') || parent.hasAttribute('data-mce-internal')) {
                        continue;
                    }

                    outParents.push(parent);
                }

                return outParents;
            }

            controlManager.setActive('visualaid', ed.hasVisual);
            self.updateUndoStatus(ed);
            controlManager.setDisabled('outdent', !ed.queryCommandState('Outdent'));

            if (settings.theme_path && settings.theme_statusbar_location) {
                var pathEl = DOM.get(ed.id + '_path') || DOM.add(ed.id + '_path_row', 'span', {
                    id: ed.id + '_path',
                    'class': 'mcePathPath'
                });

                if (self.statusKeyboardNavigation) {
                    self.statusKeyboardNavigation.destroy();
                    self.statusKeyboardNavigation = null;
                }

                DOM.setHTML(pathEl, '');

                var parents = getParents(nodeChangeArgs), html = '';

                for (var i = 0, len = parents.length; i < len; i++) {
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

                DOM.setHTML(pathEl, html);

                if (DOM.select('a', pathEl).length > 0) {
                    self.statusKeyboardNavigation = new ibis.ui.KeyboardNavigation({
                        root: ed.id + "_path_row",
                        items: DOM.select('a', pathEl),
                        excludeFromTabOrder: true,
                        onCancel: function () {
                            ed.focus();
                        }
                    }, DOM);
                }

                var pathRow = DOM.get(ed.id + "_path_row"),
                    statusBar = pathRow.parentNode,
                    offset = 20;

                ibis.each(statusBar.childNodes, function (child) {
                    if (DOM.hasClass(child, 'mcePathRow')) {
                        return true;
                    }

                    offset += child.offsetWidth;
                });

                ibis.each(DOM.select('a', pathEl), function (anchor) {
                    DOM.removeClass(anchor, 'mcePathHidden');

                    if ((pathEl.offsetWidth + offset + DOM.getPrev(pathEl, '.mcePathLabel').offsetWidth) > statusBar.offsetWidth) {
                        DOM.addClass(anchor, 'mcePathHidden');
                    }
                });
            }
        },

        // Prompt the user to confirm clearing the editor content
        mceNewDocument: function () {
            var ed = this.editor;

            ed.windowManager.confirm({
                title: 'advanced.newdocument_desc',
                text: 'advanced.newdocument'
            }, function (confirmed) {
                if (confirmed) {
                    ed.execCommand('mceSetContent', false, '');
                }
            });
        },

        // Uppercase the first character of a string
        ufirst: function (str) {
            return str.substring(0, 1).toUpperCase() + str.substring(1);
        }
    });

    ibis.ThemeManager.add('core', ibis.themes.CoreTheme);
})();
