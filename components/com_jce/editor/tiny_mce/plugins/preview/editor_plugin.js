(function() {
    var DOM = tinymce.DOM,
        Event = tinymce.dom.Event;

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
        init: function(ed, url) {
            this.editor = ed;
        },

        hide: function() {
          DOM.hide(this.editor.id + '_editor_preview');
        },

        toggle: function() {
            var ed = this.editor;

            var self = this,
                s = ed.settings;

            var element   = ed.getElement();
            var container = element.parentNode;
            // get tabs header
            var header = DOM.getPrev(element, '.wf-editor-header');

            // get editor iframe height
            var ifrHeight = parseInt(DOM.get(ed.id + '_ifr').style.height) || s.height;
            var preview   = DOM.get(ed.id + '_editor_preview');
            var iframe    = DOM.get(ed.id + '_editor_preview_iframe');

            var o = tinymce.util.Cookie.getHash("TinyMCE_" + ed.id + "_size");

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

                var html = '<!DOCTYPE html>';
                html += '<head xmlns="http://www.w3.org/1999/xhtml">';
                html += '<base href="' + s.document_base_url + '" />';
                html += '<meta http-equiv="X-UA-Compatible" content="IE=7" />';
                html += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';

                // insert css
                html += '';

                var css = [self.url + '/css/preview.css'];

                if (ed.settings.compress.css) {
                    css = [s.site_url + 'index.php?option=com_jce&view=editor&layout=editor&task=pack&type=css&context=preview&component_id=' + s.component_id + '&' + s.token + '=1'];
                } else {
                    css = tinymce.explode(ed.settings.content_css);
                }

                tinymce.each(css, function(url) {
                    html += '<link href="' + url + '" rel="stylesheet" type="text/css" />';
                });

                html += '</head><body style="margin:5px;">';
                html += '</body></html>';

                var doc = iframe.contentWindow.document;

                doc.open();
                doc.write(html);
                doc.close();
            }

            // get height from setting or session data or editor textarea
            var height = ed.settings.container_height || sessionStorage.getItem('wf-editor-container-height') || ifrHeight;

            if (DOM.hasClass(container, 'mce-fullscreen')) {
              var vp = DOM.getViewPort();
              height = vp.h - header.offsetHeight;
            }

            DOM.setStyle(preview, 'height', height);

            var width = ed.settings.container_width || sessionStorage.getItem('wf-editor-container-width');

            if (width && !DOM.hasClass(container, 'mce-fullscreen')) {
                DOM.setStyle(preview, 'width', width);
            }

            // show preview
            DOM.show(preview);

            var query = '',
                args = {
                    'format': 'raw'
                };

            // set token
            args[ed.settings.token] = 1;

            tinymce.extend(args, {
                'data': ed.getContent(),
                'id': uid()
            });

            // create query
            for (k in args) {
                query += '&' + k + '=' + encodeURIComponent(args[k]);
            }

            function update(text) {
                DOM.removeClass(container, 'mce-loading');
                iframe.contentWindow.document.body.innerHTML = text;
            }

            // load preview data
            tinymce.util.XHR.send({
                url: s['site_url'] + 'index.php?option=com_jce&view=editor&layout=plugin&plugin=preview&component_id=' + s['component_id'],
                data: 'json=' + JSON.stringify({
                    'method': 'showPreview'
                }) + '&' + query,
                content_type: 'application/x-www-form-urlencoded',
                success: function(x) {
                    var o = {},
                        msg = "";

                    try {
                        o = JSON.parse(x);
                    } catch (e) {
                        o.error = /[{}]/.test(o) ? 'The server returned an invalid JSON response' : x;
                    }

                    r = o.result;

                    // revert to unprocessed content on error
                    if (!x || o.error) {
                        r = ed.getContent();
                    }

                    update(r);
                },
                error: function(e, x) {
                    update(ed.getContent());
                }
            });
        }

    });

    // Register plugin
    tinymce.PluginManager.add('preview', tinymce.plugins.PreviewPlugin);
})();
