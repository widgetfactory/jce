/**
 * @package     JCE
 * @copyright   Copyright (c) 2009       Moxiecode Systems AB. All rights reserved.
 * @copyright   Copyright (c) 1999–2015  Ephox Corp. All rights reserved.
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 * @note        Forked or includes code from TinyMCE 3.x/4.x/5.x (originally LGPL 2.1) and relicensed under GPL 2+ per LGPL 2.1 §3.
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function () {
    var DOM = tinymce.DOM,
        Event = tinymce.dom.Event;

    tinymce.PluginManager.add('fullscreen', function (ed, url) {
        var width, height, bookmark, resize, de = DOM.doc.documentElement,
            overflow;

        // create dispatcher
        ed.onFullScreen = new tinymce.util.Dispatcher();
        ed.onFullScreenResize = new tinymce.util.Dispatcher();

        var element = ed.getElement();
        var container = element.parentNode;

        // Get toolbar and path height
        function getInterfaceHeight() {
            var h = 0,
                ca = ed.getContentAreaContainer(),
                p = ca.parentNode;

            tinymce.each(p.childNodes, function (n) {
                if (n === ca) {
                    return;
                }

                h += n.offsetHeight;
            });

            return h;
        }

        // Register commands
        ed.addCommand('mceFullScreen', function () {
            var iframe = DOM.get(ed.id + '_ifr'),
                s = ed.settings;

            // might generate an error if the first element cannot contain a node, eg: style
            try {
                bookmark = ed.selection.getBookmark();
            } catch (e) {
                //error
            }

            var vp = DOM.getViewPort();
            var header = DOM.getPrev(element, '.wf-editor-header');

            // Fullscreen enabled, revert
            if (ed.getParam('fullscreen_enabled')) {
                DOM.removeClass(container, 'mce-fullscreen');

                DOM.setStyle(container, 'max-width', width + 'px');
                DOM.setStyle(iframe, 'height', height);

                // restore overflow
                de.style.overflow = overflow;

                // restore bookmark
                if (bookmark) {
                    ed.selection.moveToBookmark(bookmark);
                }

                // set textarea height
                DOM.setStyle(element, 'height', height);

                // set fullscreen flag
                s.fullscreen_enabled = false;

                // remove resize event
                if (resize) {
                    Event.remove(DOM.win, 'resize', resize);
                }
                // Enable fullscreen
            } else {
                width = container.clientWidth;
                // get the current iframe height from the style
                height = parseInt(iframe.style.height, 10);

                // store overflow
                overflow = de.style.overflow;

                //DOM.setStyle(container, 'max-width', vp.w + 'px');
                DOM.setStyle(container, 'max-width', '100%');
                DOM.setStyle(iframe, 'max-width', '100%');

                // reset window scroll
                DOM.win.scrollTo(0, 0);

                // get interface height (includes footer/path)
                var ih = ed.settings.interface_height || getInterfaceHeight();

                // store container height before fullscreen
                if (!ed.isHidden()) {
                    ed.settings.container_height = ed.getContainer().offsetHeight;
                    sessionStorage.setItem('wf-editor-container-height', ed.settings.container_height);
                }

                // add fullscreen class
                DOM.addClass(container, 'mce-fullscreen');

                // wait to update...
                window.setTimeout(function () {
                    // set iframe height
                    DOM.setStyle(iframe, 'height', vp.h - ih - header.offsetHeight);

                    // set textarea height
                    DOM.setStyle(element, 'height', vp.h - header.offsetHeight - 10);

                    // set textarea width
                    DOM.setStyle(element, 'width', '100%');
                }, 0);

                // restore bookmark
                if (bookmark) {
                    ed.selection.moveToBookmark(bookmark);
                }

                // add window resize event
                resize = Event.add(DOM.win, 'resize', function () {
                    vp = DOM.getViewPort();
                    DOM.setStyles(iframe, { 'height': vp.h - ih, 'max-width': vp.w + 'px' });

                    // trigger event with viewport
                    ed.onFullScreenResize.dispatch(ed, vp);
                });

                // remove overflow
                de.style.overflow = 'hidden';

                // allow for modals on smaller screens
                if (vp.h < 640) {
                    de.style.overflow = 'scroll';
                }
                // set fullscreen flag
                s.fullscreen_enabled = true;
            }

            ed.onFullScreen.dispatch(ed, s.fullscreen_enabled);
        });

        // Register buttons
        ed.addButton('fullscreen', { title: 'fullscreen.desc', cmd: 'mceFullScreen' });

        ed.addShortcut('meta+shift+f', 'fullscreen.desc', 'mceFullScreen');

        ed.onNodeChange.add(function (ed, cm) {
            cm.setActive('fullscreen', ed.getParam('fullscreen_enabled'));
        });
    });
})();