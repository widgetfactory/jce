/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2019 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

(function (win) {
    var doc = win.document,
        body = doc.body,
        domLoaded = false;

    function ready() {
        if (doc.readyState != 'loading') {
            self.preinit();
        } else if (doc.addEventListener) {
            doc.addEventListener('DOMContentLoaded', self.preinit);
        } else {
            doc.attachEvent('onreadystatechange', function () {
                if (doc.readyState != 'loading') {
                    self.preinit();
                }
            });
        }
    }

    function resize(width, height) {
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

        win.resizeBy(vw - width, vh - (height + oh));

        center();
    }

    function center() {
        var vw = win.innerWidth || doc.documentElement.clientWidth || body.clientWidth || 0;
        var vh = win.innerHeight || doc.documentElement.clientHeight || body.clientHeight || 0;

        var x = (screen.width - vw) / 2;
        var y = (screen.height - vh) / 2;

        win.moveTo(x, y);
    }

    var self = {
        preinit: function (width, height, click) {
            this.width = parseInt(width);
            this.height = parseInt(height);
            this.click = !!click;

            if (!this.width && !this.height) {
                return;
            }

            if (!domLoaded) {
                return ready();
            }

            this.init();
        },
        init: function () {
            resize();

            if (this.click) {
                doc.onmousedown = function (e) {
                    return win.close();
                };
            }
        }
    };

    // expose
    win.WfWindowPopup = {
        init: self.preinit
    };
})(window);