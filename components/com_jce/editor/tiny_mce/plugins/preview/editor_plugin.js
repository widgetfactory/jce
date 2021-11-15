(function () {
    var DOM = tinymce.DOM;

    var counter = 0;

    /**
      Generates an unique ID.
      @method uid
      @return {String} Virtually unique id.
    */
    function uid() {
        var guid = new Date().getTime().toString(32),
            i;

        for (i = 0; i < 5; i++) {
            guid += Math.floor(Math.random() * 65535).toString(32);
        }

        return 'wf_' + guid + (counter++).toString(32);
    }

    tinymce.create('tinymce.plugins.PreviewPlugin', {
        init: function (ed, url) {
            this.editor = ed;

            var self = this;

            ed.onInit.add(function (ed) {
                // get the stored active tab
                var activeTab = sessionStorage.getItem('wf-editor-tabs-' + ed.id) || ed.settings.active_tab || '';

                if (activeTab === "wf-editor-preview") {
                    // hide editor
                    ed.hide();
                    // hide textarea
                    DOM.hide(ed.getElement());

                    self.toggle();
                }
            });
        },

        hide: function () {
            DOM.hide(this.editor.id + '_editor_preview');
        },

        toggle: function () {
            var ed = this.editor;

            var s = ed.settings;

            var element = ed.getElement();
            var container = element.parentNode;
            // get tabs header
            var header = DOM.getPrev(element, '.wf-editor-header');

            // get editor iframe height
            var ifrHeight = parseInt(DOM.get(ed.id + '_ifr').style.height, 10) || s.height;
            var preview = DOM.get(ed.id + '_editor_preview');
            var iframe = DOM.get(ed.id + '_editor_preview_iframe');

            var o = tinymce.util.Storage.getHash("TinyMCE_" + ed.id + "_size");

            if (o && o.height) {
                ifrHeight = o.height;
            }

            if (!preview) {
                // create the container
                var preview = DOM.add(container, 'div', {
                    role: 'textbox',
                    id: ed.id + '_editor_preview',
                    'class': 'wf-editor-preview'
                });

                // create iframe
                iframe = DOM.add(preview, 'iframe', {
                    frameborder: 0,
                    src: 'javascript:""',
                    id: ed.id + '_editor_preview_iframe'
                });
            }

            // get height from setting or session data or editor textarea
            var height = ed.settings.container_height || sessionStorage.getItem('wf-editor-container-height') || ifrHeight;

            if (DOM.hasClass(container, 'mce-fullscreen')) {
                var vp = DOM.getViewPort();
                height = vp.h - header.offsetHeight;
            }

            DOM.setStyle(preview, 'height', height);
            DOM.setStyle(preview, 'max-width', '100%');

            var width = ed.settings.container_width || sessionStorage.getItem('wf-editor-container-width');

            if (width && !DOM.hasClass(container, 'mce-fullscreen')) {
                DOM.setStyle(preview, 'max-width', width);
            }

            // show preview
            DOM.show(preview);

            var query = '',
                args = {};

            tinymce.extend(args, {
                'data': ed.getContent(),
                'id': uid()
            });

            // create query
            for (var k in args) {
                query += '&' + k + '=' + encodeURIComponent(args[k]);
            }

            function update(text) {
                var doc = iframe.contentWindow.document, css = [];

                // find scripts in content
                var scripts = /<script[^>]+>[\s\S]*<\/script>/.exec(text);

                // remove script tags
                text = text.replace(/<script[^>]+>[\s\S]*<\/script>/gi, '');

                var html = '<!DOCTYPE html>';
                html += '<head xmlns="http://www.w3.org/1999/xhtml">';
                html += '<base href="' + s.document_base_url + '" />';
                html += '<meta http-equiv="X-UA-Compatible" content="IE=7" />';
                html += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';

                if (s.compress.css) {
                    css = [s.site_url + 'index.php?option=com_jce&task=editor.pack&type=css&slot=preview&' + s.query];
                } else {
                    css = tinymce.explode(s.content_css);
                }

                tinymce.each(css, function (url) {
                    html += '<link href="' + url + '" rel="stylesheet" type="text/css" />';
                });

                // append found scripts to body
                if (scripts) {
                    tinymce.each(scripts, function (script) {
                        html += '' + script + '';
                    });
                }

                html += '</head><body style="margin:5px;">';
                html += '' + text + '';
                html += '</body></html>';

                doc.open();
                doc.write(html);
                doc.close();

                DOM.removeClass(container, 'mce-loading');
            }

            // load preview data
            tinymce.util.XHR.send({
                url: s.site_url + 'index.php?option=com_jce&task=plugin.display&plugin=preview&' + tinymce.query,
                data: 'json=' + JSON.stringify({
                    'method': 'showPreview'
                }) + '&' + query,
                content_type: 'application/x-www-form-urlencoded',
                success: function (x) {
                    var o = {};

                    try {
                        o = JSON.parse(x);
                    } catch (e) {
                        o.error = /[{}]/.test(o) ? 'The server returned an invalid JSON response' : x;
                    }

                    var r = o.result;

                    // revert to unprocessed content on error
                    if (!x || o.error) {
                        r = ed.getContent();
                    }

                    update(r);
                },
                error: function (e, x) {
                    update(ed.getContent());
                }
            });
        }
    });

    // Register plugin
    tinymce.PluginManager.add('preview', tinymce.plugins.PreviewPlugin);
})();