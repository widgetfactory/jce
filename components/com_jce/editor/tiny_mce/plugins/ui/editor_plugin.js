(function () {
    tinymce.create('tinymce.plugins.UiPlugin', {
        init: function (ed, url) {}
    });

    // Register plugin
    tinymce.PluginManager.add('ui', tinymce.plugins.UiPlugin);
})();