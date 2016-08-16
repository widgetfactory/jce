/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @copyright   Copyright 2009, Moxiecode Systems AB
 * @license   	GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function() {
    var DOM = tinymce.DOM, Event = tinymce.dom.Event;

    tinymce.create('tinymce.plugins.FullScreenPlugin', {
        init: function(ed, url) {
          var width, height, bookmark, resize, de = DOM.doc.documentElement, overflow;

          // create dispatcher
          ed.onFullScreen = new tinymce.util.Dispatcher();
          ed.onFullScreenResize = new tinymce.util.Dispatcher();

          var element   = ed.getElement();
          var container = element.parentNode;

          // Register commands
          ed.addCommand('mceFullScreen', function() {
              var iframe = DOM.get(ed.id + '_ifr'), s = ed.settings;

              // might generate an error if the first element cannot contain a node, eg: style
              try {
                  bookmark = ed.selection.getBookmark();
              } catch (e) {
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
                width   = container.clientWidth;
                // get the current iframe height from the style
                height  = parseInt(iframe.style.height);

                // store overflow
                overflow = de.style.overflow;

                DOM.setStyle(container, 'max-width', vp.w + 'px');
                DOM.setStyle(iframe, 'max-width', '100%');

                // reset window scroll
                DOM.win.scrollTo(0, 0);

                // get interface height
                var ih = (ed.settings.container_height || ed.getContainer().offsetHeight) - height;

                // store container height before fullscreen
                if (!ed.isHidden()) {
                    ed.settings.container_height = ed.getContainer().offsetHeight;
                    sessionStorage.setItem('wf-editor-container-height', ed.settings.container_height);
                }

                // add fullscreen class
                DOM.addClass(container, 'mce-fullscreen');

                // set iframe height
                DOM.setStyle(iframe, 'height', vp.h - ih - header.offsetHeight);

                // set textarea height
                DOM.setStyle(element, 'height', vp.h - header.offsetHeight - 10);

                // restore bookmark
                if (bookmark) {
                    ed.selection.moveToBookmark(bookmark);
                }

                // add window resize event
                resize = Event.add(DOM.win, 'resize', function() {
                  vp = DOM.getViewPort();
                  DOM.setStyles(iframe, {'height' : vp.h - ih, 'max-width' : vp.w + 'px'});

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
          ed.addButton('fullscreen', {title: 'fullscreen.desc', cmd: 'mceFullScreen'});

          ed.onNodeChange.add(function(ed, cm) {
              cm.setActive('fullscreen', ed.getParam('fullscreen_enabled'));
          });
        }
    });

    // Register plugin
    tinymce.PluginManager.add('fullscreen', tinymce.plugins.FullScreenPlugin);
})();
