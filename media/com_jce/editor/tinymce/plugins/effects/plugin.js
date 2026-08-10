/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2024 Ryan Demmer. All rights reserved.
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
        function cleanEventAttribute(val) {
            val = tinymce.trim(val);

            if (!val) {
                return '';
            }

            // unwrap to the url, trimming any space inside the quotes
            val = tinymce.trim(val.replace(/^this\.src\s*=\s*'([^']+)';?$/, '$1'));

            if (/['"<>\\]/.test(val)) {
                return '';
            }

            return val;
        }

        // a src swap, the value is trimmed by the caller
        function isSrcSwap(val) {
            return /^this\.src\s*=/.test(val);
        }

        // read / write an attribute on a dom node
        function domAttr(node) {
            return function (name, value) {
                if (arguments.length === 1) {
                    return node.getAttribute(name);
                }

                if (value === null) {
                    node.removeAttribute(name);
                } else {
                    node.setAttribute(name, value);
                }
            };
        }

        // read / write an attribute on a parser node
        function parserAttr(node) {
            return function (name, value) {
                return arguments.length === 1 ? node.attr(name) : node.attr(name, value);
            };
        }

        // convert an image mouseover / mouseout event attribute pair to data attributes
        function convertEventAttributes(attr) {
            var mouseover = tinymce.trim(attr('onmouseover')), mouseout = tinymce.trim(attr('onmouseout'));

            if (!isSrcSwap(mouseover)) {
                return;
            }

            mouseover = cleanEventAttribute(mouseover);

            attr('onmouseover', null);

            if (!mouseover) {
                return;
            }

            attr('data-mce-mouseover', mouseover);

            if (!isSrcSwap(mouseout)) {
                return;
            }

            mouseout = cleanEventAttribute(mouseout);

            attr('onmouseout', null);

            if (mouseout) {
                attr('data-mce-mouseout', mouseout);
            }
        }

        ed.onPreInit.add(function () {
            // stale data-mce-* attributes in loaded content are removed by the cleanup plugin
            ed.onBeforeSetContent.add(function (ed, o) {
                if (!/onmouseover\s*=/i.test(o.content)) {
                    return;
                }

                var doc = document.implementation.createHTMLDocument('');
                var div = doc.createElement('div');
                div.innerHTML = o.content;

                each(div.querySelectorAll('img[onmouseover]'), function (node) {
                    convertEventAttributes(domAttr(node));
                });

                o.content = div.innerHTML;
            });

            // update event effects
            ed.parser.addAttributeFilter('onmouseover', function (nodes) {
                var i = nodes.length;

                while (i--) {
                    var node = nodes[i];

                    if (node.name !== 'img') {
                        continue;
                    }

                    convertEventAttributes(parserAttr(node));
                }
            });

            ed.serializer.addAttributeFilter('data-mce-mouseover', function (nodes) {
                var i = nodes.length;

                while (i--) {
                    var node = nodes[i];

                    if (node.name !== 'img') {
                        continue;
                    }

                    var mouseover = node.attr('data-mce-mouseover'), mouseout = node.attr('data-mce-mouseout');

                    mouseover = cleanEventAttribute(mouseover);

                    node.attr('data-mce-mouseover', null);
                    node.attr('data-mce-mouseout', null);

                    if (!mouseover) {
                        continue;
                    }

                    node.attr('onmouseover', "this.src='" + mouseover + "';");

                    mouseout = cleanEventAttribute(mouseout);

                    if (mouseout) {
                        node.attr('onmouseout', "this.src='" + mouseout + "';");
                    }
                }
            });

            // update events when content is set
            ed.onSetContent.add(function () {
                bindMouseoverEvent(ed);
            });

            ed.onUpdateMedia.add(function (ed, o) {
                bindMouseoverEvent(ed);

                if (!o.before || !o.after) {
                    return;
                }

                each(ed.dom.select('img[data-mce-mouseover]'), function (elm) {
                    var mouseover = elm.getAttribute('data-mce-mouseover'), mouseout = elm.getAttribute('data-mce-mouseout');

                    if (!mouseover) {
                        return true;
                    }

                    if (mouseover == o.before) {
                        elm.setAttribute('data-mce-mouseover', o.after);
                    }

                    if (mouseout == o.before) {
                        elm.setAttribute('data-mce-mouseout', o.after);
                    }
                });
            });
        });

        function bindMouseoverEvent(ed) {
            each(ed.dom.select('img'), function (elm) {
                var src = elm.getAttribute('src'), mouseover = elm.getAttribute('data-mce-mouseover');

                elm.onmouseover = elm.onmouseout = null;

                if (!src || !mouseover) {
                    return true;
                }

                elm.onmouseover = function () {
                    elm.setAttribute('src', elm.getAttribute('data-mce-mouseover'));
                };

                elm.onmouseout = function () {
                    elm.setAttribute('src', elm.getAttribute('data-mce-mouseout') || src);
                };
            });
        }
    });
})();