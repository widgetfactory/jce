/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2023 Ryan Demmer. All rights reserved.
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
                var ed = ctrl.editor, vp = ed.dom.getViewPort();

                each(plugins, function (plg) {
                    var href = plg.href || '';

                    if (href) {
                        href = ed.dom.decode(href);

                        // replace variable with editor id
                        href = href.replace(/(__jce__)/gi, ed.id);

                        // try direct replacement
                        href = href.replace(/(e_name|editor)=([\w_]+)/gi, '$1=' + ed.id);
                    }

                    var item = menu.add({
                        id: ed.dom.uniqueId(),
                        title: plg.title,
                        icon: plg.icon,
                        svg: plg.svg || '',
                        onclick: function (e) {
                            var buttons = [
                                {
                                    id: 'cancel',
                                    title: ed.getLang('cancel', 'Cancel')
                                }
                            ];

                            // store bookmark
                            ed.lastSelectionBookmark = ed.selection.getBookmark(1);

                            if (href) {

                                if (plg.options && plg.options.confirmCallback) {
                                    buttons.unshift({
                                        id: 'confirm',
                                        title: plg.options.confirmText || ed.getLang('insert', 'Insert'),
                                        classes: 'primary',
                                        onsubmit: function (e) {
                                            new Function(plg.options.confirmCallback).apply();
                                        }
                                    });
                                }

                                ed.windowManager.open({
                                    file: href,
                                    title: plg.title,
                                    width: Math.max(vp.w - 40, 896),
                                    height: Math.max(vp.h - 40, 707),
                                    size: 'mce-modal-landscape-full',
                                    addver: false,
                                    buttons: buttons
                                });

                                // pass the windowManager object as the current Joomla Modal window
                                if (window.Joomla && window.Joomla.Modal) {
                                    window.Joomla.Modal.setCurrent(ed.windowManager);
                                }
                            }

                            if (plg.onclick) {
                                new Function(plg.onclick).apply();
                            }

                            item.setSelected(false);

                            return false;
                        }
                    });
                });

                var jModalCloseCore = function () { };

                if (window.jModalClose) {
                    jModalCloseCore = window.jModalClose;
                }

                // Joomla modal override
                window.jModalClose = function () {
                    var wm = ed.windowManager;

                    // if a windowManager window is open...
                    if (wm.count) {
                        return wm.close();
                    }

                    // otherwise treat as a Joomla modal
                    return jModalCloseCore();
                };

                var SBoxClose = function () { };

                if (window.SqueezeBox) {
                    SBoxClose = window.SqueezeBox.close;
                } else {
                    window.SqueezeBox = {};
                }

                window.SqueezeBox.close = function () {
                    var wm = ed.windowManager;

                    // if a windowManager window is open...
                    if (wm.count) {
                        return wm.close();
                    }

                    // otherwise treat as a SqueezeBox modal
                    return SBoxClose();
                };

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