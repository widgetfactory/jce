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
    var DomParser = tinymce.html.DomParser, Serializer = tinymce.html.Serializer, XHR = tinymce.util.XHR;

    tinymce.create('tinymce.plugins.CorePLugin', {
        init: function (ed, url) {
            var self = this;

            self.contentLoaded = false;

            function isEmpty() {
                var content = ed.getContent();
                return content == '' || content == '<p>&nbsp;</p>';
            }

            function dataToHtml(data) {
                var frag = new DomParser({
                    validate: false,
                    root_name: '#document'
                }).parse(data);

                var body = frag.getAll('body')[0] || frag;

                var html = new Serializer({
                    validate: false
                }).serialize(body);

                return html;
            }

            var startup_content_url = ed.settings.startup_content_url || '';
            var startup_content_html = ed.settings.startup_content_html || '';

            // load content on first startup
            if (startup_content_html || startup_content_url) {

                function insertContent(value) {
                    var html = dataToHtml(value);

                    if (html) {
                        ed.execCommand('mceInsertContent', false, html);
                    }

                    return true;
                }

                ed.onInit.add(function () {
                    if (!self.contentLoaded && isEmpty()) {

                        if (startup_content_html) {
                            self.contentLoaded = true;

                            return insertContent(startup_content_html);
                        }

                        if (startup_content_url) {
                            // must be relative and local
                            if (!/http(s)?:\/\//.test(startup_content_url)) {
                                ed.setProgressState(true);

                                XHR.send({
                                    url: ed.settings.document_base_url + '/' + startup_content_url,
                                    success: function (value) {
                                        insertContent(value);

                                        ed.setProgressState(false);

                                        self.contentLoaded = true;
                                    },
                                    error: function (e) {
                                        ed.setProgressState(false);
                                        self.contentLoaded = true;
                                    }
                                });
                            }
                        }
                    }
                });
            }
        }
    });

    tinymce.PluginManager.add('core', tinymce.plugins.CorePLugin);
})();