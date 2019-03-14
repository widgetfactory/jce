(function () {
    var DOM = tinymce.DOM;
    
    tinymce.create('tinymce.plugins.BrandingPlugin', {

        init: function (ed, url) {
            ed.onPostRender.add(function () {
                var container = ed.getContentAreaContainer();
                DOM.insertAfter(DOM.create('div', {'class' : 'mceBranding'}, 'Powered by JCE Core. <span id="mceBrandingMessage"></span><a href="https://www.joomlacontenteditor.net/purchase" target="_blank" title="Get JCE Pro">JCE Pro</a>'), container);
            });

            ed.onNodeChange.add(function (ed, cm, n, co) {
                var container = ed.getContentAreaContainer(), msg = 'Get more features with ';
                
                if (n.nodeName === "IMG") {
                    msg = 'Image resizing, thumbnails and editing in '
                }

                if (ed.dom.is(n, '.mce-item-media')) {
                    msg = 'Upload and manage audio and video with '
                }

                DOM.setHTML(DOM.get('mceBrandingMessage', container), msg);
            });
        }
    });

    // Register plugin
    tinymce.PluginManager.add('branding', tinymce.plugins.BrandingPlugin);
})();