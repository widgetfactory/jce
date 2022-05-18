/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2022 Ryan Demmer. All rights reserved.
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
            if (!val) {
                return '';
            }

            return val.replace(/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/, '$1').replace(/^\s*|\s*$/g, '');
        }

        ed.onPreInit.add(function () {
            ed.onBeforeSetContent.add(function (ed, o) {

                if (o.content.indexOf('onmouseover=') === -1) {
                    return;
                }

                var div = ed.dom.create('div', {}, o.content);

                each(ed.dom.select('img[onmouseover]', div), function (node) {
                    var mouseover = node.getAttribute('onmouseover'), mouseout = node.getAttribute('onmouseout');

                    if (!mouseover || mouseover.indexOf('this.src') !== 0) {
                        return true;
                    }

                    mouseover = cleanEventAttribute(mouseover);

                    // remove attribute
                    node.removeAttribute('onmouseover');

                    // if cleaned value is blank, move on
                    if (!mouseover) {
                        return true;
                    }

                    node.setAttribute('data-mouseover', mouseover);

                    if (mouseout && mouseout.indexOf('this.src') === 0) {

                        mouseout = cleanEventAttribute(mouseout);

                        // remove attribute
                        node.removeAttribute('onmouseout');

                        if (!mouseout) {
                            return;
                        }

                        node.setAttribute('data-mouseout', mouseout);
                    }
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

                    var mouseover = node.attr('onmouseover'), mouseout = node.attr('onmouseout');

                    if (!mouseover || mouseover.indexOf('this.src') !== 0) {
                        continue;
                    }

                    mouseover = cleanEventAttribute(mouseover);

                    node.attr('data-mouseover', mouseover);
                    node.attr('onmouseover', null);

                    if (mouseout && mouseout.indexOf('this.src') === 0) {
                        mouseout = cleanEventAttribute(mouseout);

                        node.attr('data-mouseout', mouseout);
                        node.attr('onmouseout', null);
                    }
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
            ed.selection.onSetContent.add(function () {
                bindMouseoverEvent(ed);
            });

            // update events when content is set
            ed.onSetContent.add(function () {
                bindMouseoverEvent(ed);
            });

            ed.onUpdateMedia.add(function (ed, o) {
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
            each(ed.dom.select('img[data-mouseover]'), function (elm) {
                var src = elm.getAttribute('src'), mouseover = elm.getAttribute('data-mouseover');

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