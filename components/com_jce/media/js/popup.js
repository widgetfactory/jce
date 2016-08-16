/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
// JCE Popup Javascript
(function(win) {
    var doc = win.document, body = doc.body, domLoaded = false;

    /**
     * Function to determine if DOM is ready.
     * Based on JQuery 'bindReady' function - http://jquery.com/
     * Copyright (c) 2009 John Resig
     */
    function ready() {
        // Mozilla, Opera and webkit nightlies currently support this event
        if (doc.addEventListener) {
            // Use the handy event callback
            doc.addEventListener("DOMContentLoaded", function() {
                doc.removeEventListener("DOMContentLoaded", arguments.callee, false);
                return WFWindowPopup._init();
            }, false);

            // If IE event model is used
        } else if (doc.attachEvent) {
            // ensure firing before onload,
            // maybe late but safe also for iframes
            doc.attachEvent("onreadystatechange", function() {
                if (doc.readyState === "complete") {
                    doc.detachEvent("onreadystatechange", arguments.callee);
                    return WFWindowPopup._init();
                }
            });

            // If IE and not an iframe
            // continually check to see if the document is ready
            if (doc.documentElement.doScroll && win == win.top) {
                (function() {
                    if (domLoaded)
                        return;

                    try {
                        // If IE is used, use the trick by Diego Perini
                        // http://javascript.nwbox.com/IEContentLoaded/
                        doc.documentElement.doScroll("left");
                    } catch (error) {
                        setTimeout(arguments.callee, 0);
                        return;
                    }

                    // and execute any waiting functions
                    return WFWindowPopup._init();
                })();

            }
        }
        // older browsers
        if (win.attachEvent) {
            win.attachEvent('onload', function() {
                return WFWindowPopup._init();
            });
        }
    }

    var WFWindowPopup = {
        init: function(width, height, click) {
            this.width  = parseInt(width);
            this.height = parseInt(height);
            this.click = !!click;

            if (!this.width && !this.height) {
                return;
            }

            if (!domLoaded) {
                return ready();
            }

            this._init();
        },
        _init: function() {
            this.resize();

            if (this.click) {
                this.noclick();
            }
        },
        // Based on a similar TinyMCE function : http://tinymce.moxiecode.com
        resize: function() {
            var x, oh = 0;

            var vw = win.innerWidth || doc.documentElement.clientWidth || body.clientWidth || 0;
            var vh = win.innerHeight || doc.documentElement.clientHeight || body.clientHeight || 0;

            // Add a little if title
            var divs = doc.getElementsByTagName('div');

            for (x = 0; x < divs.length; x++) {
                if (divs[x].className == 'contentheading') {
                    oh = divs[x].offsetHeight;
                }
            }

            win.resizeBy(vw - this.width, vh - (this.height + oh));

            this.center();
        },
        // Center Window
        center: function() {
            var vw = win.innerWidth || doc.documentElement.clientWidth || body.clientWidth || 0;
            var vh = win.innerHeight || doc.documentElement.clientHeight || body.clientHeight || 0;

            var x = (screen.width - vw) / 2;
            var y = (screen.height - vh) / 2;

            win.moveTo(x, y);
        },
        // Close window on mouse click
        noclick: function() {
            doc.onmousedown = function(e) {
                return win.close();
            };
        }
    };

    win.WFWindowPopup = WFWindowPopup;
})(window);