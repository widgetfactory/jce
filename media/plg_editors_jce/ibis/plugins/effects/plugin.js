/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = ibis.each;

    // Register plugin
    ibis.PluginManager.add('effects', function (ed, url) {
        function cleanEventAttribute(val) {
            val = ibis.trim(val);

            if (!val) {
                return '';
            }

            // unwrap to the url, trimming any space inside the quotes
            val = ibis.trim(val.replace(/^this\.src\s*=\s*'([^']+)';?$/, '$1'));

            // the value is written back into an event attribute, so it must not be able to break out of it
            if (/['"<>\\]/.test(val)) {
                return '';
            }

            return val;
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

        // a src swap, the value is trimmed by the caller
        function isSrcSwap(val) {
            return /^this\.src\s*=/.test(val);
        }

        // convert an image mouseover / mouseout event attribute pair to data attributes
        function convertEventAttributes(attr) {
            var mouseover = ibis.trim(attr('onmouseover')), mouseout = ibis.trim(attr('onmouseout'));

            if (!isSrcSwap(mouseover)) {
                return;
            }

            mouseover = cleanEventAttribute(mouseover);

            attr('onmouseover', null);

            if (!mouseover) {
                return;
            }

            attr('data-mouseover', mouseover);

            if (!isSrcSwap(mouseout)) {
                return;
            }

            mouseout = cleanEventAttribute(mouseout);

            attr('onmouseout', null);

            if (mouseout) {
                attr('data-mouseout', mouseout);
            }
        }

        ed.onPreInit.add(function () {
            ed.onBeforeSetContent.add(function (ed, o) {
                var hasData = /data-mouse(over|out)=/i.test(o.content);
                var hasEvent = /onmouseover\s*=/i.test(o.content);

                if (!hasData && !hasEvent) {
                    return;
                }

                var doc = document.implementation.createHTMLDocument('');
                var div = doc.createElement('div');
                div.innerHTML = o.content;

                if (hasData) {
                    each(div.querySelectorAll('[data-mouseover],[data-mouseout]'), function (node) {
                        node.removeAttribute('data-mouseover');
                        node.removeAttribute('data-mouseout');
                    });
                }

                if (hasEvent) {
                    each(div.querySelectorAll('img[onmouseover]'), function (node) {
                        convertEventAttributes(domAttr(node));
                    });
                }

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

            ed.serializer.addAttributeFilter('data-mouseover', function (nodes) {
                var i = nodes.length;

                while (i--) {
                    var node = nodes[i];

                    if (node.name !== 'img') {
                        continue;
                    }

                    var mouseover = node.attr('data-mouseover'), mouseout = node.attr('data-mouseout');

                    // cleanEventAttribute discards a value that could break out of the event attribute
                    mouseover = cleanEventAttribute(mouseover);

                    node.attr('data-mouseover', null);
                    node.attr('data-mouseout', null);

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

            // update events when content is inserted
            /*ed.selection.onSetContent.add(function () {
                bindMouseoverEvent(ed);
            });*/

            // update events when content is set
            ed.onSetContent.add(function () {
                bindMouseoverEvent(ed);
            });

            ed.onUpdateMedia.add(function (ed, o) {
                bindMouseoverEvent(ed);

                if (!o.before || !o.after) {
                    return;
                }

                each(ed.dom.select('img[data-mouseover]'), function (elm) {
                    var mouseover = elm.getAttribute('data-mouseover'), mouseout = elm.getAttribute('data-mouseout');

                    if (!mouseover) {
                        return true;
                    }

                    if (mouseover == o.before) {
                        elm.setAttribute('data-mouseover', o.after);
                    }

                    if (mouseout == o.before) {
                        elm.setAttribute('data-mouseout', o.after);
                    }
                });
            });
        });

        function bindMouseoverEvent(ed) {
            each(ed.dom.select('img'), function (elm) {
                var src = elm.getAttribute('src'), mouseover = elm.getAttribute('data-mouseover');

                elm.onmouseover = elm.onmouseout = null;

                if (!src || !mouseover) {
                    return true;
                }

                elm.onmouseover = function () {
                    elm.setAttribute('src', elm.getAttribute('data-mouseover'));
                };

                elm.onmouseout = function () {
                    elm.setAttribute('src', elm.getAttribute('data-mouseout') || src);
                };
            });
        }
    });
})();