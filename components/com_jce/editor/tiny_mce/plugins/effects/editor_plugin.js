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
    var each = tinymce.each, DomParser = tinymce.html.DomParser,
        Serializer = tinymce.html.Serializer;

    tinymce.create('tinymce.plugins.EffectsPlugin', {
        init: function (ed, url) {
            var self = this;
            this.editor = ed;

            if (ed.settings.allow_event_attributes || ed.settings.code_script) {
                return;
            }

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

                    var parser = new DomParser({ validate: false }, ed.schema);

                    parser.addAttributeFilter('onmouseover', function (nodes) {
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

                            // remove attribute
                            node.attr('onmouseover', null);

                            // if cleaned value is blank, move on
                            if (!mouseover) {
                                continue;
                            }

                            node.attr('data-mouseover', mouseover);

                            if (mouseout && mouseout.indexOf('this.src') === 0) {

                                mouseout = cleanEventAttribute(mouseout);

                                // remove attribute
                                node.attr('onmouseout', null);

                                if (!mouseout) {
                                    return;
                                }

                                node.attr('data-mouseout', mouseout);
                            }
                        }
                    });

                    var fragment = parser.parse(o.content, { forced_root_block: false, isRootContent: true });

                    o.content = new Serializer({ validate: false }, ed.schema).serialize(fragment);
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
            });

            function bindMouseoverEvent(ed) {
                // bind rollover event
                function bindEvent(elm, name, value) {                    
                    ed.dom.bind(elm, name, function () {
                        value = value || elm.getAttribute('data-' + name);
                        elm.setAttribute('src', value);
                    });
                }

                each(ed.dom.select('img[data-mouseover]'), function (elm) {
                    var src = elm.getAttribute('src'), mouseover = elm.getAttribute('data-mouseover'), mouseout = elm.getAttribute('data-mouseout');

                    if (!src || !mouseover) {
                        return true;
                    }

                    // add events
                    bindEvent(elm, 'mouseover');

                    if (mouseout) {
                        bindEvent(elm, 'mouseout');
                    } else {
                        bindEvent(elm, 'mouseout', src);
                    }
                });
            }
        }
    });

    // Register plugin
    tinymce.PluginManager.add('effects', tinymce.plugins.EffectsPlugin);
})();