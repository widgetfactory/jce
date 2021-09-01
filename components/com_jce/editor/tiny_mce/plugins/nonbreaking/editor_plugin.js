/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function () {
    tinymce.create('tinymce.plugins.Nonbreaking', {
        init: function (ed, url) {
            // Register commands
            ed.addCommand('mceNonBreaking', function () {
                ed.execCommand('mceInsertContent', false, (ed.plugins.visualchars && ed.plugins.visualchars.state) ? '<span data-mce-bogus="1" class="mce-item-hidden mce-item-nbsp">&nbsp;</span>' : '&nbsp;');
            });

            // Register buttons
            ed.addButton('nonbreaking', { title: 'nonbreaking.desc', cmd: 'mceNonBreaking' });

            if (ed.getParam('nonbreaking_force_tab')) {
                ed.onKeyDown.add(function (ed, e) {
                    if (e.keyCode == 9) {
                        e.preventDefault();

                        ed.execCommand('mceNonBreaking');
                        ed.execCommand('mceNonBreaking');
                        ed.execCommand('mceNonBreaking');
                    }
                });
            }

            ed.addShortcut('ctrl+shift+' + 32, 'nonbreaking.desc', 'mceNonBreaking');
        }
    });

    // Register plugin
    tinymce.PluginManager.add('nonbreaking', tinymce.plugins.Nonbreaking);
})();