/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
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
            var contentLoaded = false, elm = ed.getElement();

            function isEmpty() {
                if (elm.nodeName === 'TEXTAREA') {
                    return elm.value == '';
                } else {
                    return elm.innerHTML == '';
                }
            }

            function insertContent(value) {
                value = Entities.decode(value);

                if (value) {                    
                    if (elm.nodeName === 'TEXTAREA') {
                        elm.value = value;
                    } else {
                        elm.innerHTML = value;
                    }
                }

                return true;
            }

            var startup_content_html = ed.settings.startup_content_html || '';

            ed.onBeforeRenderUI.add(function() {
                // load content on first startup
                if (startup_content_html && elm) {
                    if (!contentLoaded && isEmpty()) {
                        contentLoaded = true;
                        return insertContent(startup_content_html);
                    }
                }
            });

            // special quotes shortcute
            ed.onKeyUp.add(function(ed, e) {
                // default is CTRL + SHIFT + ' and “text”
                var quoted = '&ldquo;{$selection}&rdquo;';
                
                // use different keyCode for German quotes, eg: „text“
                if (ed.settings.language == 'de') {
                    quoted = '&bdquo;{$selection}&ldquo;';
                }

                if ((e.key === '\u0027' || e.key == '\u0022') &&e.shiftKey && e.ctrlKey) {
                    ed.undoManager.add();
                    ed.execCommand('mceReplaceContent', false, quoted);
                }
            });
        }
    });

    tinymce.PluginManager.add('core', tinymce.plugins.CorePLugin);
})();