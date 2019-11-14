/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each;

    tinymce.create('tinymce.plugins.JoomlaPlugin', {
        init: function (ed, url) {
            var self = this;
            self.editor = ed;
        },

        createControl: function (n, cm) {
            var ed = this.editor;

            if (n !== 'joomla') {
                return null;
            }

            var plugins = ed.settings.joomla_xtd_buttons || [];

            if (!plugins.length) {
                return null;
            }

            var ctrl = cm.createSplitButton('joomla', {
                title: 'joomla.buttons',
                icon: 'joomla'
            });

            ctrl.onRenderMenu.add(function (ctrl, menu) {
                var vp = ed.dom.getViewPort();
                
                each(plugins, function (item) {
                    var href = item.href || '';

                    if (href) {
                        href = ed.dom.decode(href);
                        // replace variable with editor id
                        href = href.replace(/(\$jce)/gi, ed.id);
                    }

                    menu.add({
                        id: ed.dom.uniqueId(),
                        title: item.title,
                        icon: item.icon,
                        onclick: function () {
                            if (href) {                                
                                ed.windowManager.open({
                                    file: href,
                                    title: item.title,
                                    width: Math.max(vp.w - 40, 896),
                                    height: Math.max(vp.h - 40, 707),
                                    size: 'mce-modal-landscape-full',
                                    addver: false
                                });
                            }

                            if (item.onclick) {
                                new Function(item.onclick).apply();
                            }
                        }
                    });
                });
            });

            // Remove the menu element when the editor is removed
            ed.onRemove.add(function () {
                ctrl.destroy();
            });

            return ctrl;
        }
    });
    // Register plugin
    tinymce.PluginManager.add('joomla', tinymce.plugins.JoomlaPlugin);
})();