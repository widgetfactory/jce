/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2020 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var each = tinymce.each;

    tinymce.create('tinymce.plugins.EffectsPlugin', {
        init: function (ed, url) {
            var self = this;
            this.editor = ed;

            function cleanEventAttribute(val) {
                val = tinymce.trim(val);

                if (val) {
                    val = val.replace(/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/, '$1');
                }

                return val;
            }

            ed.onPreInit.add(function () {
                // update event effects
                ed.serializer.addNodeFilter('img', function (nodes) {
                    var i = nodes.length;

                    while (i--) {
                        var node = nodes[i], mouseover = node.attr('onmouseover'), mouseout = node.attr('onmouseout');

                        if (!mouseover || mouseover.indexOf('this.src') !== 0) {
                            continue;
                        }

                        node.attr('data-mouseover', cleanEventAttribute(mouseover));
                        node.attr('onmouseover', null);

                        if (mouseout && mouseout.indexOf('this.src') === 0) {
                            node.attr('data-mouseout', cleanEventAttribute(mouseout));
                            node.attr('onmouseout', null);
                        }
                    }
                });

                ed.parser.addNodeFilter('img', function (nodes) {
                    var i = nodes.length;

                    while (i--) {
                        var node = nodes[i], mouseover = node.attr('data-mouseover'), mouseout = node.attr('data-mouseout');

                        if (!mouseover) {
                            continue;
                        }

                        node.attr('onmouseover', "this.src='" + ed.convertURL(mouseover) + "';");

                        if (mouseout) {
                            node.attr('onmouseout', "this.src='" + ed.convertURL(mouseout) + "';");
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
            });

            function bindMouseoverEvent(ed) {
                each(ed.dom.select('img[data-mouseover]'), function (elm) {
                    var src = elm.getAttribute('src'), mouseover = elm.getAttribute('data-mouseover'), mouseout = elm.getAttribute('data-mouseout') || src;

                    if (!src || !mouseover) {
                        return true;
                    }

                    // add events
                    ed.dom.bind(elm, 'mouseover', function () {
                        elm.setAttribute('src', mouseover);
                    });

                    ed.dom.bind(elm, 'mouseout', function () {
                        elm.setAttribute('src', mouseout);
                    });
                });
            }
        }
    });

    // Register plugin
    tinymce.PluginManager.add('effects', tinymce.plugins.EffectsPlugin);
})();