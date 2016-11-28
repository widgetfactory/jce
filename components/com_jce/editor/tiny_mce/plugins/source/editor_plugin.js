(function() {
    var DOM = tinymce.DOM,
        Event = tinymce.dom.Event;

    tinymce.create('tinymce.plugins.SourcePlugin', {
        init: function(ed, url) {
            var self = this;
            self.editor = ed;

            if (ed.plugins.fullscreen) {
                ed.onFullScreen.add(function(ed, state) {
                    var element = ed.getElement();
                    var container = element.parentNode;

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

                ed.onFullScreenResize.add(function(ed, vp) {
                    var element = ed.getElement();
                    DOM.setStyle(element, 'height', vp.h);
                });
            }

            ed.onInit.add(function(ed) {
                // get the stored active tab
                var activeTab = sessionStorage.getItem('wf-editor-tabs');

                if (activeTab === "wf-editor-source") {
                    // hide editor
                    ed.hide();
                    // show textarea
                    DOM.show(ed.getElement());
                }
            });
        },
        insertContent: function(v) {
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
        getContent: function() {
            var ed = this.editor;
            return ed.getElement().value;
        },
        save: function() {
            return this.getContent();
        },
        hide: function() {
            var ed = this.editor;
            DOM.hide(ed.getElement());
        },
        toggle: function() {
            var ed = this.editor;
            var element = ed.getElement(),
                container = element.parentNode;

            // get tabs header
            var header = DOM.getPrev(element, '.wf-editor-header');

            // get editor iframe height
            var ifrHeight = parseInt(DOM.get(ed.id + '_ifr').style.height) || s.height;

            var o = tinymce.util.Cookie.getHash("TinyMCE_" + ed.id + "_size");

            if (o && o.height) {
                ifrHeight = o.height;
            }

            if (DOM.isHidden(element)) {
                DOM.show(element);

                DOM.removeClass(container, 'mce-loading');

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
        }
    });

    // Register plugin
    tinymce.PluginManager.add('source', tinymce.plugins.SourcePlugin);
})();
