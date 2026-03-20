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
    var DOM = tinymce.DOM,
        each = tinymce.each,
        explode = tinymce.explode;

    tinymce.PluginManager.add('tabfocus', function (ed, url) {
        function tabCancel(e) {
            if (e.keyCode === 9 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
            }
        }

        function tabHandler(e) {
            var x, el, v, i;

            if (e.keyCode !== 9 || e.ctrlKey || e.altKey || e.metaKey || e.isDefaultPrevented()) {
                return;
            }

            function find(direction) {
                el = DOM.select(':input:enabled,*[tabindex]:not(iframe)');

                function canSelectRecursive(e) {
                    return e.nodeName === "BODY" || (e.type != 'hidden' &&
                        e.style.display != "none" &&
                        e.style.visibility != "hidden" && canSelectRecursive(e.parentNode));
                }

                function canSelect(el) {
                    return /INPUT|TEXTAREA|BUTTON/.test(el.tagName) && tinymce.get(e.id) && el.tabIndex != -1 && canSelectRecursive(el);
                }

                each(el, function (e, i) {
                    if (e.id == ed.id) {
                        x = i;
                        return false;
                    }
                });
                if (direction > 0) {
                    for (i = x + 1; i < el.length; i++) {
                        if (canSelect(el[i])) {
                            return el[i];
                        }
                    }
                } else {
                    for (i = x - 1; i >= 0; i--) {
                        if (canSelect(el[i])) {
                            return el[i];
                        }
                    }
                }

                return null;
            }

            v = explode(ed.getParam('tab_focus', ed.getParam('tabfocus_elements', ':prev,:next')));

            if (v.length == 1) {
                v[1] = v[0];
                v[0] = ':prev';
            }

            // Find element to focus
            if (e.shiftKey) {
                if (v[0] == ':prev') {
                    el = find(-1);
                } else {
                    el = DOM.get(v[0]);
                }
            } else {
                if (v[1] == ':next') {
                    el = find(1);
                } else {
                    el = DOM.get(v[1]);
                }
            }

            if (el) {
                var focusEditor = tinymce.get(el.id || el.name);

                if (el.id && focusEditor) {
                    focusEditor.focus();
                } else {
                    setTimeout(function () {
                        if (!tinymce.isWebkit) {
                            window.focus();
                        }

                        el.focus();
                    }, 10);
                }

                e.preventDefault();
            }
        }

        ed.onKeyUp.add(tabCancel);

        if (tinymce.isGecko) {
            ed.onKeyPress.add(tabHandler);
            ed.onKeyDown.add(tabCancel);
        } else {
            ed.onKeyDown.add(tabHandler);
        }
    });
})();