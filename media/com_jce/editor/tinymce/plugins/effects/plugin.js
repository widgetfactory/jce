/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each;

    // Register plugin
    tinymce.PluginManager.add('effects', function (ed, url) {
        // a rollover is an onmouseover handler, so it only applies when the profile allows them
        if (!ed.settings.allow_event_attributes) {
            return;
        }

        // the editor stores an event attribute as data-mce-on* while editing and restores it on
        // save, so a rollover is held in that form and the plugin only has to read the url from it

        function getSrcSwapUrl(value) {
            var match = /^\s*this\.src\s*=\s*'([^']+)';?\s*$/.exec(tinymce.trim(value));

            return match ? tinymce.trim(match[1]) : '';
        }

        function bindMouseoverEvent(ed) {
            each(ed.dom.select('img'), function (elm) {
                var src = elm.getAttribute('src');

                // always clear, so an image that has lost its rollover stops swapping
                elm.onmouseover = elm.onmouseout = null;

                if (!src || !getSrcSwapUrl(elm.getAttribute('data-mce-onmouseover'))) {
                    return true;
                }

                // read at event time, so a value changed since binding is picked up
                elm.onmouseover = function () {
                    elm.setAttribute('src', getSrcSwapUrl(elm.getAttribute('data-mce-onmouseover')));
                };

                elm.onmouseout = function () {
                    elm.setAttribute('src', getSrcSwapUrl(elm.getAttribute('data-mce-onmouseout')) || src);
                };
            });
        }

        ed.onPreInit.add(function () {
            ed.onSetContent.add(function () {
                bindMouseoverEvent(ed);
            });

            ed.onUpdateMedia.add(function (ed, o) {
                bindMouseoverEvent(ed);

                if (!o.before || !o.after) {
                    return;
                }

                each(ed.dom.select('img[data-mce-onmouseover]'), function (elm) {
                    each(['data-mce-onmouseover', 'data-mce-onmouseout'], function (name) {
                        if (getSrcSwapUrl(elm.getAttribute(name)) === o.before) {
                            elm.setAttribute(name, "this.src='" + o.after + "';");
                        }
                    });
                });
            });
        });

        this.getSrcSwapUrl = getSrcSwapUrl;
    });
})();
