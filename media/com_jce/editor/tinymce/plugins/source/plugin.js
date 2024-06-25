/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var DOM = tinymce.DOM,
        Event = tinymce.dom.Event;

    function debounce(callback, time) {
        var timer, func;

        func = function () {
            var args = arguments;

            clearTimeout(timer);

            timer = setTimeout(function () {
                callback.apply(this, args);
            }, time);
        };

        func.stop = function () {
            clearTimeout(timer);
        };

        return func;
    }

    /**
     * Clean content of system elements
     * @param {Object} ed 
     * @param {String} content 
     */
    function cleanContent(ed, content) {
        return content.replace(/<br data-mce-bogus="1"([^>]+)>/gi, '');
    }

    function hasCustomEditorInit(ed) {

        // widgetkit
        if (window.widgetkit && ed.id.indexOf('wk_') !== -1) {
            return true;
        }

        // sp page builder
        if (ed.id.indexOf('sppb-editor-') !== -1) {
            return true;
        }

        return false;
    }

    tinymce.PluginManager.add('source', function (ed, url) {
        var self = this;

        ed.onSetContent.add(function (ed, o) {
            self.setContent(ed.getContent(), true);
        });

        function isEditorActive() {
            return DOM.hasClass(ed.getElement(), 'wf-no-editor') == false;
        }

        ed.onInit.add(function (ed) {
            if (isEditorActive() == false) {
                return;
            }

            // get the stored active tab
            var activeTab = ed.settings.active_tab || "";

            if (activeTab === "wf-editor-source") {
                // hide editor
                DOM.hide(ed.getContainer());

                // hide textarea
                DOM.hide(ed.getElement());

                // toggle source with delay (this seems to be necessary in SP Page Builder to prevent text block cloning...?)
                window.setTimeout(function () {
                    self.toggle();
                }, 10);
            }
        });

        this.ControlManager = new tinymce.ControlManager(ed);

        function getSourceEditor() {
            var textarea = DOM.get(ed.id + '_editor_source_textarea');

            return textarea || null;
        }

        this.setContent = function (v) {
            var editor = getSourceEditor();

            if (editor) {
                return editor.value = v;
            }

            return false;
        };

        this.insertContent = function (v) {
            var editor = getSourceEditor();

            if (editor) {
                editor.focus();

                // IE
                if (document.selection) {
                    var rng = document.selection.createRange();
                    rng.text = v;
                    // Mozilla / Netscape
                } else {
                    editor.setRangeText(v, editor.selectionStart, editor.selectionEnd, "end");
                }
            }

            return false;
        };

        this.getContent = function () {
            var editor = getSourceEditor();

            // iframe has been created and source editor is visible
            if (editor) {
                return editor.value;
            }

            return null;
        };

        this.hide = function () {
            var ed = this.editor;
            DOM.hide(ed.id + '_editor_source');
        };

        this.save = function (content, debounced) {
            var ed = this.editor,
                el = ed.getElement();

            if (!el) {
                return content;
            }

            // get content from source editor if not passed in
            content = tinymce.is(content) ? content : this.getContent();

            var args = {
                content: content,
                no_events: true,
                format: 'raw'
            };

            ed.onWfEditorSave.dispatch(ed, args);

            // pass to textarea
            if (!/TEXTAREA|INPUT/i.test(el.nodeName)) {
                el.innerHTML = args.content;
            } else {
                el.value = args.content;
            }

            // save is triggered on debounced keyup
            if (debounced) {
                // trigger custom change event
                ed.onWfEditorChange.dispatch(ed, args);
            }

            return args.content;
        };

        this.toggle = function () {
            var ed = this.editor;
            var self = this,
                s = ed.settings;

            var element = ed.getElement();
            var container = element.parentNode;

            // get tabs header
            var header = DOM.getPrev(element, '.wf-editor-header');

            var div = DOM.get(ed.id + '_editor_source');
            var textarea = DOM.get(ed.id + '_editor_source_textarea');

            // get editor iframe height
            var ifrHeight = parseInt(DOM.get(ed.id + '_ifr').style.height, 10) || s.height;

            var o = tinymce.util.Storage.getHash("TinyMCE_" + ed.id + "_size");

            if (o && o.height) {
                ifrHeight = o.height;
            }

            // get content from textarea / div
            var content = tinymce.is(element.value) ? element.value : element.innerHTML;

            // remove system stuff
            content = cleanContent(ed, content);

            if (!div) {
                // create the container
                div = DOM.add(container, 'div', {
                    role: 'textbox',
                    id: ed.id + '_editor_source',
                    'class': 'wf-editor-source'
                });

                var skin = s.skin_class || 'defaultSkin';

                DOM.addClass(div, skin);

                textarea = DOM.create('textarea', {
                    'id': ed.id + '_editor_source_textarea'
                });

                DOM.add(div, textarea);

                // set content
                textarea.value = content;

                // create statusbar
                var statusbar = DOM.add(div, 'div', {
                    'id': ed.id + '_editor_source_statusbar',
                    'class': 'mceStatusbar mceLast'
                }, '<div class="mcePathRow"></div><div tabindex="-1" class="mceResize" id="' + ed.id + '_editor_source_resize"><span class="mceIcon mce_resize"></span></div>');

                var resize = DOM.get(ed.id + '_editor_source_resize');

                // cancel default click
                Event.add(resize, 'click', function (e) {
                    e.preventDefault();
                });

                // Resize source editor
                Event.add(resize, 'mousedown', function (e) {
                    var mm1, mu1, sx, sy, sw, sh, w, h;

                    e.preventDefault();

                    function resizeTo(w, h) {
                        w = Math.max(w, 300);
                        h = Math.max(h, 200);

                        textarea.style.height = h + 'px';
                        container.style.maxWidth = w + 'px';

                        // pass through values
                        ed.settings.container_width = w;
                        ed.settings.container_height = h + statusbar.offsetHeight;

                        // remove interface height if set                        
                        h = h - (ed.settings.interface_height || 0);

                        // resize editor
                        ed.theme.resizeTo(w, h);
                    }

                    function resizeOnMove(e) {
                        e.preventDefault();

                        w = sw + (e.screenX - sx);
                        h = sh + (e.screenY - sy);

                        resizeTo(w, h);

                        DOM.addClass(resize, 'wf-editor-source-resizing');
                    }

                    function endResize(e) {
                        e.preventDefault();

                        // Stop listening
                        Event.remove(DOM.doc, 'mousemove', mm1);
                        Event.remove(DOM.doc, 'mouseup', mu1);

                        w = sw + (e.screenX - sx);
                        h = sh + (e.screenY - sy);

                        resizeTo(w, h);

                        DOM.removeClass(resize, 'wf-editor-source-resizing');
                    }

                    if (DOM.hasClass(resize, 'wf-editor-source-resizing')) {
                        endResize(e);
                        return false;
                    }

                    // Get the current rect size
                    sx = e.screenX;
                    sy = e.screenY;

                    sw = w = container.offsetWidth;
                    sh = h = textarea.clientHeight;

                    // Register envent handlers
                    mm1 = Event.add(DOM.doc, 'mousemove', resizeOnMove);
                    mu1 = Event.add(DOM.doc, 'mouseup', endResize);
                });

                // ugly hack to detect WidgetKit and SpPageBuilder extensions
                if (hasCustomEditorInit(ed)) {
                    // Debounce keyup function
                    var keyup = debounce(function (e) {

                        var value = textarea.value;

                        // trim value
                        value = value.replace(/^\s*|\s*$/g, '');

                        // pass to the textarea
                        self.save(value, true);
                    }, 300);

                    DOM.bind(textarea, 'input blur', function () {
                        keyup();
                    });
                }
            } else {
                DOM.show(div);

                // set content
                textarea.value = content;
            }

            DOM.removeClass(container, 'mce-loading');

            // get height from setting or session data or editor textarea
            var height = ed.settings.container_height || sessionStorage.getItem('wf-editor-container-height') || (ifrHeight + statusbar.offsetHeight);

            if (DOM.hasClass(container, 'mce-fullscreen')) {
                var vp = DOM.getViewPort();
                height = vp.h - header.offsetHeight - statusbar.offsetHeight - 4;
            }

            DOM.setStyles(textarea, { height: height });
        };

        this.getSelection = function () {
            return document.getSelection().toString();
        };

        this.getCursorPos = function () {
            return 0;
        };
    });
})();