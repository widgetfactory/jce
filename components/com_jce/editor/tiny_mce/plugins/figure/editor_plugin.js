/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2021 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var VK = tinymce.VK,
        Node = tinymce.html.Node,
        each = tinymce.each,
        map = tinymce.map;
    var blocks = [];

    tinymce.create('tinymce.plugins.Figure', {
        init: function (ed, url) {
            var self = this;
            this.editor = ed;

            ed.onPreInit.add(function (ed) {
                ed.parser.addNodeFilter('figure', function (nodes, name) {
                    var i = nodes.length,
                        node;

                    while (i--) {
                        node = nodes[i];

                        if (node.getAll('figcaption').length === 0) {
                            var figcaption = new Node('figcaption', 1);
                            figcaption.attr('data-mce-empty', ed.getLang('figcaption.default', 'Write a caption...'));
                            figcaption.attr('contenteditable', true);

                            node.append(figcaption);
                        }

                        if (node.getAll('img').length) {
                            node.attr('data-mce-image', '1');
                            node.attr('contenteditable', 'false');
                        }
                    }
                });

                ed.parser.addNodeFilter('figcaption', function (nodes, name) {
                    var i = nodes.length,
                        node;

                    while (i--) {
                        node = nodes[i];
                        // Add identifying attribute to create dummy text
                        if (!node.firstChild) {
                            node.attr('data-mce-empty', ed.getLang('figcaption.default', 'Write a caption...'));
                        }
                        // make editable
                        node.attr('contenteditable', 'true');
                    }
                });

                ed.serializer.addNodeFilter('figure', function (nodes, name) {
                    var i = nodes.length,
                        node;

                    while (i--) {
                        node = nodes[i];

                        node.attr('contenteditable', null);
                    }
                });

                ed.serializer.addNodeFilter('figcaption', function (nodes, name) {
                    var i = nodes.length,
                        node;

                    while (i--) {
                        node = nodes[i];
                        // remove empty figcaption
                        if (!node.firstChild) {
                            node.remove();
                        } else {
                            node.attr('contenteditable', null);
                        }
                    }
                });

                ed.serializer.addAttributeFilter('data-mce-image', function (nodes, name) {
                    var i = nodes.length,
                        node, k;

                    while (i--) {
                        node = nodes[i];

                        node.attr(name, null);
                    }
                });

                each(ed.schema.getBlockElements(), function (v, k) {
                    if (/\W/.test(k)) {
                        return true;
                    }

                    blocks.push(k.toLowerCase());
                });

                ed.formatter.register('figure', {
                    block: 'figure',
                    remove: 'all',
                    wrapper: true,
                    onformat: function (elm, fmt, vars, node) {
                        var node = ed.selection.getNode(),
                            parent = ed.dom.getParent(node, blocks.join(','));

                        vars = vars || {};

                        if (node.nodeName === "IMG") {
                            // replace parent paragraph with figure
                            if (parent && parent.nodeName === 'P' && parent.childNodes.length === 1) {
                                ed.dom.replace(elm, parent, 1);
                            }

                            ed.dom.add(node.parentNode, 'figcaption', {
                                'data-mce-empty': ed.getLang('figcaption.default', 'Write a caption...'),
                                'contenteditable': 'true'
                            }, vars.caption || '');

                            ed.dom.setAttribs(elm, {
                                'data-mce-image': 1,
                                'contenteditable': false
                            });
                        }
                    }
                });

                ed.onBeforeExecCommand.add(function (ed, cmd, ui, v, o) {
                    var se = ed.selection,
                        n = se.getNode();

                    switch (cmd) {
                        case 'FormatBlock':
                            if (v === 'figure') {
                                var fig = ed.dom.getParent(n, 'figure');

                                if (fig) {
                                    ed.dom.remove(ed.dom.select('figcaption', fig));
                                    ed.dom.remove(fig, 1);
                                }
                            }

                            break;

                        case 'mceToggleFormat':
                            if (v === 'figure') {
                                var fig = ed.dom.getParent(n, 'figure');

                                if (fig) {
                                    ed.dom.remove(ed.dom.select('figcaption', fig));
                                }
                            }
                            break;

                        case 'JustifyRight':
                        case 'JustifyLeft':
                        case 'JustifyCenter':
                            if (n && n.nodeName === "IMG") {
                                var parent = ed.dom.getParent(n, 'FIGURE');

                                if (parent) {
                                    se.select(parent);
                                    ed.execCommand(cmd, false);
                                    o.terminate = true;
                                }
                            }
                            break;
                    }
                });

                ed.onExecCommand.add(function (ed, cmd, ui, v, o) {
                    var se = ed.selection,
                        n = se.getNode();

                    switch (cmd) {
                        case 'JustifyRight':
                        case 'JustifyLeft':
                        case 'JustifyCenter':
                            if (n && n.nodeName === "FIGURE") {
                                var img = ed.dom.select('IMG', n);

                                if (img.length) {
                                    se.select(img[0]);
                                }
                            }
                            break;
                    }
                });

                ed.onKeyDown.add(function (ed, e) {
                    var isDelete, rng, container;

                    isDelete = e.keyCode == VK.DELETE;

                    if (!e.isDefaultPrevented() && (isDelete || e.keyCode == VK.BACKSPACE) && !VK.modifierPressed(e)) {
                        rng = ed.selection.getRng();
                        container = rng.startContainer;
                        offset = rng.startOffset;
                        collapsed = rng.collapsed;

                        if (container.nodeName === 'FIGURE') {
                            var node = ed.selection.getNode();

                            if (node.nodeName === 'IMG') {
                                ed.dom.remove(container);
                                ed.nodeChanged();
                                e.preventDefault();
                                return;
                            }
                        }

                        // override delete if the figcaption is empty
                        if (container.nodeName == 'FIGCAPTION' && (!container.nodeValue || container.nodeValue.length === 0)) {
                            e.preventDefault();
                        }

                        if (container.nodeType === 3 && (!collapsed && !offset)) {
                            var figcaption = ed.dom.getParent(container, 'FIGCAPTION');

                            if (figcaption) {
                                while (figcaption.firstChild) {
                                    figcaption.removeChild(figcaption.firstChild);
                                }

                                e.preventDefault();
                            }
                        }
                    }
                });
            });
        }

    });

    // Register plugin
    tinymce.PluginManager.add('figure', tinymce.plugins.Figure);
})();