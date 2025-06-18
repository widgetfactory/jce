/**
 * @package     JCE
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
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

    tinymce.PluginManager.add('preview', function (ed, url) {
        var self = this;

        function isEditorActive() {
            return DOM.hasClass(ed.getElement(), 'wf-no-editor') == false;
        }

        ed.onInit.add(function (ed) {
            if (isEditorActive() == false) {
                return;
            }

            // get the stored active tab
            var activeTab = ed.settings.active_tab || '';

            if (activeTab === "wf-editor-preview") {
                // hide editor
                ed.hide();
                // hide textarea
                DOM.hide(ed.getElement());

                self.toggle();
            }
        });

        this.hide = function () {
            DOM.hide(ed.id + '_editor_preview');
        };

        this.isHidden = function () {
            return DOM.isHidden(ed.id + '_editor_preview');
        };

        this.toggle = function () {
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
                args = {},
                content = ed.getContent();

            tinymce.extend(args, {
                'data': content,
                'id': uid()
            });

            // create query
            for (var k in args) {
                query += '&' + k + '=' + encodeURIComponent(args[k]);
            }

            function update(text) {
                var doc = iframe.contentWindow.document, css = [];

                var html = '<!DOCTYPE html>';
                html += '<head xmlns="http://www.w3.org/1999/xhtml">';
                html += '<base href="' + s.document_base_url + '" />';
                html += '<meta http-equiv="X-UA-Compatible" content="IE=7" />';
                html += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';

                if (s.compress.css) {
                    css = [s.site_url + 'index.php?option=com_jce&task=editor.pack&type=css&slot=preview&' + s.query];
                } else {
                    css = ed.contentCSS;
                }

                tinymce.each(css, function (url) {
                    html += '<link href="' + url + '" rel="stylesheet" type="text/css" />';
                });

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
                        r = content;
                    }

                    update(r);
                },
                error: function (e, x) {
                    update(content);
                }
            });
        };
    });
})();