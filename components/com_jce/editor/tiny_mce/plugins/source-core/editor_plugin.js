(function () {
    var DOM = tinymce.DOM,
        DomParser = tinymce.html.DomParser,
        HtmlSerializer = tinymce.html.Serializer;

    tinymce.create('tinymce.plugins.SourcePlugin', {
        init: function (ed, url) {
            var self = this;
            self.editor = ed;

            if (ed.plugins.fullscreen) {
                ed.onFullScreen.add(function (ed, state) {
                    var element = ed.getElement();

                    // get tabs header
                    var header = DOM.getPrev(element, '.wf-editor-header');

                    // store the containerHeight as we go into fullscreen mode
                    if (state) {
                        var vp = DOM.getViewPort();
                        // set height as viewport - header
                        DOM.setStyle(element, 'height', vp.h - header.offsetHeight);
                    } else {
                        DOM.setStyle(element, 'height', ed.settings.container_height);
                    }
                });

                ed.onFullScreenResize.add(function (ed, vp) {
                    var element = ed.getElement();
                    DOM.setStyle(element, 'height', vp.h);
                });
            }

            ed.onInit.add(function (ed) {
                // get the stored active tab
                var activeTab = sessionStorage.getItem('wf-editor-tabs-' + ed.id) || ed.settings.active_tab || '';

                if (activeTab === "wf-editor-source") {
                    // hide editor
                    ed.hide();
                    // show textarea
                    DOM.show(ed.getElement());

                    var element = ed.getElement(),
                        container = element.parentNode;

                    // get width from setting or session data or editor textarea
                    var width = ed.settings.container_width || sessionStorage.getItem('wf-editor-container-width');

                    if (!DOM.hasClass(container, 'mce-fullscreen')) {
                        DOM.setStyle(element, 'width', width);
                    }
                }
            });
        },

        validateContent: function (content) {
            var ed = this.editor;

            var args = {
                "no_events": true,
                "format": "raw"
            };

            // create new settings object
            var settings = {};

            // extend with editor settings
            tinymce.extend(settings, ed.settings);

            // set content    
            args.content = content;

            if (ed.settings.validate) {
                // trigger cleanup etc in editor
                args.format = "html";

                // set a load flag so code is processed as code blocks
                args.load = true;

                // onBeforeGetContent
                ed.onBeforeGetContent.dispatch(ed, args);

                // allow all tags
                settings.verify_html = false;

                // no root blocks
                settings.forced_root_block = false;

                // must validate
                settings.validate = true;

                // create dom parser
                var parser = new DomParser(settings, ed.schema);

                // create html serializer
                var serializer = new HtmlSerializer(settings, ed.schema);

                // clean content
                args.content = serializer.serialize(parser.parse(args.content), args);

                args.get = true;

                // onPostProcess
                ed.onPostProcess.dispatch(ed, args);

                // pass content
                content = args.content;
            }

            return content;
        },

        insertContent: function (v) {
            var ed = this.editor,
                el = ed.getElement();

            // IE
            if (document.selection) {
                el.focus();
                var s = document.selection.createRange();
                s.text = v;
                // Mozilla / Netscape
            } else {
                if (el.selectionStart || el.selectionStart == '0') {
                    var startPos = el.selectionStart;
                    var endPos = el.selectionEnd;
                    el.value = el.value.substring(0, startPos) + v + el.value.substring(endPos, el.value.length);
                    // Other
                } else {
                    el.value += v;
                }
            }
        },

        getContent: function () {
            var ed = this.editor, args = {};

            args.content = ed.getElement().value;

            ed.onWfEditorSave.dispatch(ed, args);

            return args.content;
        },

        save: function () {
            // get validated content
            var content = this.getContent();

            // pass to textarea
            this.editor.getElement().value = content;

            // return content
            return content;
        },

        hide: function () {
            var ed = this.editor;
            DOM.hide(ed.getElement());
        },

        toggle: function () {
            var ed = this.editor;
            var element = ed.getElement(),
                container = element.parentNode;

            // get tabs header
            var header = DOM.getPrev(element, '.wf-editor-header');

            // get editor iframe height
            var ifrHeight = parseInt(DOM.get(ed.id + '_ifr').style.height, 10) || ed.settings.height;

            var o = tinymce.util.Storage.getHash("TinyMCE_" + ed.id + "_size");

            if (o && o.height) {
                ifrHeight = o.height;
            }

            if (DOM.isHidden(element)) {
                DOM.show(element);

                DOM.removeClass(container, 'mce-loading');

                // dispatch on show to trigger event - SPPageBuilder
                ed.onChange.dispatch();

            } else {
                DOM.hide(element);
            }

            // get height from setting or session data or editor textarea
            var height = ed.settings.container_height || sessionStorage.getItem('wf-editor-container-height') || ifrHeight;

            if (DOM.hasClass(container, 'mce-fullscreen')) {
                var vp = DOM.getViewPort();
                height = vp.h - header.offsetHeight;
            }

            DOM.setStyle(element, 'height', height);

            // get width from setting or session data or editor textarea
            var width = ed.settings.container_width || sessionStorage.getItem('wf-editor-container-width');

            if (!DOM.hasClass(container, 'mce-fullscreen')) {
                DOM.setStyle(element, 'width', width);
            }
        },

        getSelection: function () {
            return document.getSelection();
        },

        getCursorPos: function () {
            return 0;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('source', tinymce.plugins.SourcePlugin);
})();