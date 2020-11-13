/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var Entities = tinymce.html.Entities;

    tinymce.create('tinymce.plugins.CorePLugin', {
        init: function (ed, url) {
            var contentLoaded = false;

            function insertContent(value) {
                value = Entities.decode(value);

                if (value) {                    
                    ed.getElement().value = value;
                }

                return true;
            }

            var startup_content_html = ed.settings.startup_content_html || '';

            ed.onBeforeRenderUI.add(function() {
                // load content on first startup
                if (startup_content_html) {
                    if (!contentLoaded && !ed.getElement().value) {
                        contentLoaded = true;
                        return insertContent(startup_content_html);
                    }
                }
            });
        }
    });

    tinymce.PluginManager.add('core', tinymce.plugins.CorePLugin);
})();