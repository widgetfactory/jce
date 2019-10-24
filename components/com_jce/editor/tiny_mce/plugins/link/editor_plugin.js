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
    var DOM = tinymce.DOM, Event = tinymce.dom.Event;

    tinymce.create('tinymce.plugins.LinkPlugin', {
        init: function (ed, url) {
            this.editor = ed;
            this.url = url;

            function isLink(n) {
                // no node specified
                if (!n) {
                    return false;
                }

                // get link
                n = ed.dom.getParent(n, 'A');

                // is a link but not an anchor
                return n && isAnchor(n) === false;
            }

            function isAnchor(n) {
                return ed.dom.hasClass(n, 'mce-item-anchor');
            }

            // Register commands
            ed.addCommand('mceLink', function () {
                var se = ed.selection, n = se.getNode();

                if (n.nodeName == 'A' && !isAnchor(n)) {
                    se.select(n);
                }

                ed.windowManager.open({
                    file: ed.getParam('site_url') + 'index.php?option=com_jce&task=plugin.display&plugin=link',
                    width: 600 + ed.getLang('link.delta_width', 0),
                    height: 600 + ed.getLang('link.delta_height', 0),
                    inline: 1,
                    popup_css: false,
                    size: 'mce-modal-portrait-large'
                }, {
                    plugin_url: url
                });
            });

            ed.addShortcut('ctrl+k', 'link.desc', 'mceLink');

            ed.onInit.add(function () {
                if (ed && ed.plugins.contextmenu) {
                    ed.plugins.contextmenu.onContextMenu.add(function (th, m, e) {
                        m.addSeparator();
                        m.add({ title: 'link.desc', icon: 'link', cmd: 'mceLink', ui: true });
                        if ((e.nodeName == 'A' && !ed.dom.getAttrib(e, 'name'))) {
                            m.add({ title: 'advanced.unlink_desc', icon: 'unlink', cmd: 'UnLink' });
                        }
                    });
                }
            });

            ed.onNodeChange.add(function (ed, cm, n, co) {
                var link = isLink(n), anchor = isAnchor(n);
                
                // set active if link
                cm.setActive('unlink', link);
                cm.setActive('link', link);
                // set disabled if anchor
                cm.setDisabled('link', anchor);
                cm.setDisabled('unlink', !link);
            });
        },
        createControl: function (n, cm) {
            var self = this,
                ed = this.editor;

            if (n !== 'link') {
                return null;
            }

            var html = '' +
                '<div class="mceToolbarRow">' +
                '   <div class="mceToolbarItem mceFlexAuto">' +
                '       <input type="text" id="' + ed.id + '_link_input" aria-label="' + ed.getLang('link.href', 'URL') + '" />' +
                '   </div>' +
                '   <div class="mceToolbarItem">' +
                '       <button type="button" id="' + ed.id + '_link_submit" class="mceButton mceButtonLink" title="' + ed.getLang('link.insert', 'Insert Link') + '" aria-label="' + ed.getLang('link.insert', 'Insert Link') + '">' +
                '           <span class="mceIcon mce_link"></span>' +
                '       </button>' +
                '   </div>' +
                '   <div class="mceToolbarItem">' +
                '       <button type="button" id="' + ed.id + '_link_unlink" class="mceButton mceButtonUnlink" disabled="disabled" title="' + ed.getLang('link.unlink', 'Remove Link') + '" aria-label="' + ed.getLang('link.unlink', 'Remove Link') + '">' +
                '           <span class="mceIcon mce_unlink"></span>' +
                '       </button>' +
                '   </div>' +
                '</div>';

            var ctrl = cm.createSplitButton('link', {
                title: 'link.desc',
                cmd: 'mceLink',
                max_width: 264,
                onselect: function (elm) {
                    insertLink(elm.value);
                }
            });

            function insertLink(value) {
                if (!value) {
                    ed.execCommand('unlink', false);
                    return;
                }

                var args = {
                    'href': value
                };

                // get parameter defaults
                var params = ed.getParam('link', {});

                // extended args with parameter defaults
                args = tinymce.extend(args, params);

                // no selection, so create a link from the url
                if (ed.selection.isCollapsed()) {
                    ed.execCommand('mceInsertContent', false, ed.dom.createHTML('a', args, value));
                    // apply link to selection
                } else {
                    ed.execCommand('mceInsertLink', false, args);
                }

                ed.undoManager.add();
                ed.nodeChanged();
            }

            ctrl.onRenderMenu.add(function (c, m) {
                m.add({
                    onclick: function (e) {
                        e.preventDefault();

                        var n = ed.dom.getParent(e.target, '.mceButton');

                        if (n.disabled) {
                            return;
                        }

                        if (ed.dom.hasClass(n, 'mceButtonLink')) {
                            var value = DOM.getValue(ed.id + '_link_input');
                            insertLink(value);
                        }

                        if (ed.dom.hasClass(n, 'mceButtonUnlink')) {
                            ed.execCommand('unlink', false);
                        }

                        m.hideMenu();
                    },
                    html: html
                });

                m.onShowMenu.add(function () {
                    var selection = ed.selection, value = '';

                    DOM.setAttrib(ed.id + '_link_unlink', 'disabled', 'disabled');

                    if (!selection.isCollapsed()) {
                        var node = selection.getNode();
                        node = ed.dom.getParent(node, 'A') || node;

                        if (node.nodeName === 'A') {
                            value = node.getAttribute('href');
                            DOM.setAttrib(ed.id + '_link_unlink', 'disabled', null);
                        }
                    }

                    // focus input after short timeout
                    window.setTimeout(function () {
                        DOM.get(ed.id + '_link_input').focus();
                    }, 10);

                    // set value
                    DOM.setValue(ed.id + '_link_input', value);
                });
            });

            return ctrl;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('link', tinymce.plugins.LinkPlugin);
})();
