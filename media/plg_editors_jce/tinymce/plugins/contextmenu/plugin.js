/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @copyright   Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    var Event = tinymce.dom.Event,
        DOM = tinymce.DOM;

    /**
     * This plugin a context menu to TinyMCE editor instances.
     *
     * @class tinymce.plugins.ContextMenu
     */
    tinymce.PluginManager.add('contextmenu', function (ed) {
        var self = this,
            showMenu, contextmenuNeverUseNative, hideMenu;

        contextmenuNeverUseNative = ed.settings.contextmenu_never_use_native;

        function isContentEditable(elm) {
            return ed.dom.getContentEditableParent(elm) !== "false";
        }

        var isNativeOverrideKeyEvent = function (e) {
            return e.ctrlKey && !contextmenuNeverUseNative;
        };

        var isMacWebKit = function () {
            return tinymce.isMac && tinymce.isWebKit;
        };

        var isImage = function (elm) {
            return elm && elm.nodeName === 'IMG' && isContentEditable(elm);
        };

        var isLink = function (elm) {
            return elm && elm.nodeName === 'A' && isContentEditable(elm);
        };

        /**
         * This event gets fired when the context menu is shown.
         *
         * @event onContextMenu
         * @param {tinymce.plugins.ContextMenu} sender Plugin instance sending the event.
         * @param {tinymce.ui.DropMenu} menu Drop down menu to fill with more items if needed.
         */
        self.onContextMenu = new tinymce.util.Dispatcher(this);

        // disable on Android and iOS as it prevents selection
        if (tinymce.isAndroid || tinymce.isIOS) {
            return false;
        }

        hideMenu = function (e) {
            hide(ed, e);
        };

        showMenu = ed.onContextMenu.add(function (ed, e) {
            if (isNativeOverrideKeyEvent(e)) {
                return;
            }

            Event.cancel(e);

            /**
             * This takes care of a os x native issue where it expands the selection
             * to the word at the caret position to do "lookups". Since we are overriding
             * the context menu we also need to override this expanding so the behavior becomes
             * normalized. Firefox on os x doesn't expand to the word when using the context menu.
             */
            if (isMacWebKit() && e.button === 2 && !isNativeOverrideKeyEvent(e) && ed.selection.isCollapsed()) {
                if (!isImage(e.target)) {
                    ed.selection.placeCaretAt(e.clientX, e.clientY);
                }
            }

            // Select the image if it's clicked. WebKit would other wise expand the selection
            if (isImage(e.target) || isLink(e.target)) {
                ed.selection.select(e.target);
            }

            getMenu(ed, e).showMenu(e.clientX || e.pageX, e.clientY || e.pageY);

            Event.add(ed.getDoc(), 'click', hideMenu);

            ed.nodeChanged();
        });

        ed.onRemove.add(function () {
            if (self._menu) {
                self._menu.removeAll();
            }
        });

        function hide(ed, e) {
            // Since the contextmenu event moves
            // the selection we need to store it away
            if (e && e.button == 2) {
                return;
            }

            if (self._menu) {
                self._menu.removeAll();
                self._menu.destroy();
                Event.remove(ed.getDoc(), 'click', hideMenu);
                self._menu = null;
            }
        }

        ed.onMouseDown.add(hide);
        ed.onKeyDown.add(hide);
        ed.onKeyDown.add(function (ed, e) {
            if (e.shiftKey && !e.ctrlKey && !e.altKey && e.keyCode === 121) {
                Event.cancel(e);
                showMenu(ed, e);
            }
        });

        function getMenu(ed, e) {
            var m = self._menu,
                se = ed.selection,
                col = se.isCollapsed(),
                am, p;

            var el = e.target;

            if (!el || el.nodeName === "BODY") {
                el = se.getNode() || ed.getBody();
            }

            if (m) {
                m.removeAll();
                m.destroy();
            }

            p = DOM.getPos(ed.getContentAreaContainer());

            m = ed.controlManager.createDropMenu('contextmenu', {
                offset_x: p.x + ed.getParam('contextmenu_offset_x', 0),
                offset_y: p.y + ed.getParam('contextmenu_offset_y', 0),
                constrain: true,
                keyboard_focus: true
            });

            self._menu = m;

            am = m.addMenu({
                title: 'contextmenu.align'
            });

            am.add({
                title: 'contextmenu.left',
                icon: 'justifyleft',
                cmd: 'JustifyLeft'
            });

            am.add({
                title: 'contextmenu.center',
                icon: 'justifycenter',
                cmd: 'JustifyCenter'
            });

            am.add({
                title: 'contextmenu.right',
                icon: 'justifyright',
                cmd: 'JustifyRight'
            });

            am.add({
                title: 'contextmenu.full',
                icon: 'justifyfull',
                cmd: 'JustifyFull'
            });

            self.onContextMenu.dispatch(self, m, el, col);

            return m;
        }
    });
})();