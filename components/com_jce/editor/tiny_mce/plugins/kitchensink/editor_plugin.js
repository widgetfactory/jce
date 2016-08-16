/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function() {
    var each = tinymce.each, cookie = tinymce.util.Cookie, DOM = tinymce.DOM;

    tinymce.create('tinymce.plugins.KitchenSink', {
        init: function(ed, url) {

            var self = this, state = false, h = 0, el = ed.getElement(), s = ed.settings;

            function toggle() {
                var row = DOM.getParents(ed.id + '_kitchensink', 'table.mceToolbar');

                if (!row) {
                    return;
                }

                var n = DOM.getNext(row[0], 'table.mceToolbar');

                while (n) {
                    if (DOM.isHidden(n)) {
                        DOM.setStyle(n, 'display', '');
                        state = true;

                    } else {
                        DOM.hide(n);
                        state = false;
                    }

                    n = DOM.getNext(n, 'table.mceToolbar');
                }
                
                // get height of container
                h = s.height || el.style.height || el.offsetHeight;
                
                if (h) {
                    DOM.setStyle(ed.id + '_ifr', 'height', h);
                }

                ed.controlManager.setActive('kitchensink', state);
            }

            ed.addCommand('mceKitchenSink', toggle);

            ed.addButton('kitchensink', {
                title: 'kitchensink.desc',
                cmd: 'mceKitchenSink'
            });
            
            ed.onPostRender.add(function(ed, cm) {
                if (DOM.get('mce_fullscreen')) {
                    state = true;
                    return;
                }

                toggle();
            });

            ed.onInit.add(function(ed) {
                ed.controlManager.setActive('kitchensink', state);
            });
        },
        getInfo: function() {
            return {
                longname: 'Kitchen Sink',
                author: 'Ryan Demmer',
                authorurl: 'http://www.joomlacontenteditor.net/',
                infourl: 'http://www.joomlacontenteditor.net/',
                version: '@@version@@'
            };
        }
    });

    // Register plugin
    tinymce.PluginManager.add('kitchensink', tinymce.plugins.KitchenSink);
})();