/**
 * @package     JCE
 * @copyright   Copyright (c) 2009–2025  Ryan Demmer. All rights reserved.
 * @license     GNU General Public License version 2 or later (GPL v2+) – https://www.gnu.org/licenses/gpl-2.0.html
 *
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
(function () {
    var DOM = tinymce.DOM,
        each = tinymce.each;
    var VK = tinymce.VK;

    tinymce.PluginManager.add('anchor', function (ed, url) {
        var self = this;

        function isAnchor(n) {
            return ed.dom.getParent(n, 'a.mce-item-anchor');
        }

        function removeAnchor(e) {
            var s = ed.selection,
                n = s.getNode();

            if (!s.isCollapsed() && ed.dom.getParent(n, 'a.mce-item-anchor')) {
                ed.undoManager.add();

                ed.formatter.remove('link');

                if (e) {
                    e.preventDefault();
                }
            }
        }

        function getAnchor() {
            var n = ed.selection.getNode(),
                v;

            n = ed.dom.getParent(n, 'a.mce-item-anchor');
            v = ed.dom.getAttrib(n, 'name') || ed.dom.getAttrib(n, 'id');

            return v;
        }

        function insertAnchor(v) {
            var attrib;

            if (!v) {
                ed.windowManager.alert('anchor.invalid');
                return false;
            }

            if (!/^[a-z][a-z0-9\-\_:\.]*$/i.test(v)) {
                ed.windowManager.alert('anchor.invalid');
                return false;
            }

            attrib = 'name';

            // set as id for html5
            if (ed.settings.schema !== 'html4') {
                attrib = 'id';
            }

            var n = ed.selection.getNode();

            var at = {
                'class': 'mce-item-anchor'
            };

            n = ed.dom.getParent(n, 'A');

            if (n) {
                at[attrib] = v;
                ed.dom.setAttribs(n, at);
            } else {
                if (ed.dom.select('a[' + attrib + '="' + v + '"], img[data-mce-name="' + v + '"], img[id="' + v + '"]', ed.getBody()).length) {
                    ed.windowManager.alert('anchor.exists');
                    return false;
                }

                if (ed.selection.isCollapsed()) {
                    at[attrib] = v;

                    ed.execCommand('mceInsertContent', 0, ed.dom.createHTML('a', {
                        id: '__mce_tmp'
                    }, '\uFEFF'), { skip_undo: 1 });

                    n = ed.dom.get('__mce_tmp');

                    at.id = at.id || null;

                    ed.dom.setAttribs(n, at);
                    ed.selection.select(n);

                } else {
                    at[attrib] = v;

                    ed.execCommand('mceInsertLink', false, '#mce_temp_url#', {
                        skip_undo: 1
                    });

                    at.href = at['data-mce-href'] = null;

                    each(ed.dom.select('a[href="#mce_temp_url#"]'), function (link) {
                        ed.dom.setAttribs(link, at);
                    });
                }
            }

            ed.execCommand("mceEndUndoLevel");
            ed.nodeChanged();

            return true;
        }

        ed.settings.allow_html_in_named_anchor = true;

        // Register commands
        ed.addCommand('mceInsertAnchor', function (ui, value) {
            return insertAnchor(value);
        });

        ed.onBeforeExecCommand.add(function (ed, cmd, ui, v, o) {
            var se = ed.selection,
                n = se.getNode();

            // remove empty Definition List
            switch (cmd) {
                case 'unlink':
                    if (isAnchor(n)) {
                        var id = n.id || n.name || '';

                        if (!id) {
                            return;
                        }

                        // find the associated anchor and remove
                        each(ed.dom.select('a[href]', ed.getBody()), function (node) {
                            var href = ed.dom.getAttrib(node, 'href');

                            if (href === '#' + id) {
                                ed.dom.remove(node, 1);
                            }
                        });
                    }

                    var href = ed.dom.getAttrib(n, 'href');

                    if (href && href.charAt(0) === "#") {
                        each(ed.dom.select('a[id],a[name]', ed.getBody()), function (node) {
                            var id = node.id || node.name;

                            if (id && href === '#' + id) {
                                ed.dom.remove(node, 1);
                            }
                        });
                    }

                    break;
            }
        });

        ed.onNodeChange.add(function (ed, cm, n, co) {
            var s = isAnchor(n);

            // clear any existing anchor selections
            ed.dom.removeClass(ed.dom.select('.mce-item-anchor.mce-item-selected'), 'mce-item-selected');

            // set active
            cm.setActive('anchor', s);

            if (s) {
                ed.dom.addClass(n, 'mce-item-selected');
            }
        });

        // Remove anchor on backspace or delete
        ed.onKeyDown.add(function (ed, e) {
            if (e.keyCode === VK.BACKSPACE || e.keyCode === VK.DELETE) {
                removeAnchor(e);
            }
        });

        ed.onInit.add(function () {
            // Display "a#name" instead of "img" in element path
            if (ed.theme && ed.theme.onResolveName) {
                ed.theme.onResolveName.add(function (theme, o) {
                    var n = o.node,
                        v, href = n.href;

                    if (o.name === 'a' && (!href || href.charAt(0) == '#') && (n.name || n.id)) {
                        v = n.name || n.id;
                    }

                    if (v) {
                        o.name = 'a#' + v;
                    }
                });
            }
        });

        // Pre-init
        ed.onPreInit.add(function () {
            function isAnchorLink(node) {
                var href = node.attr('href'),
                    name = node.attr('name') || node.attr('id');

                // must have a name or id attribute set
                if (!name) {
                    return false;
                }
                // no href, and name set
                if (!href) {
                    return true;
                }

                // a valid anchor link, eg: #test
                if (href.charAt(0) === "#" && href.length > 1) {
                    return true;
                }

                return false;
            }

            // Convert anchor elements to image placeholder
            ed.parser.addNodeFilter('a', function (nodes) {
                for (var i = 0, len = nodes.length; i < len; i++) {
                    var node = nodes[i],
                        cls = node.attr('class') || '';

                    if (isAnchorLink(node)) {
                        if (!cls || /mce-item-anchor/.test(cls) === false) {
                            cls += ' mce-item-anchor';
                            node.attr('class', tinymce.trim(cls));
                        }
                    }
                }
            });
        });

        // prevent anchor from collapsing
        ed.onBeforeSetContent.add(function (ed, o) {
            o.content = o.content.replace(/<a id="([^"]+)"><\/a>/gi, '<a id="$1">\uFEFF</a>');
        });


        ed.addButton('anchor', {
            title: 'anchor.desc',
            onclick: function () {
                var html = '' +
                    '<div class="mceModalRow">' +
                    '   <label for="' + ed.id + '_anchor_input">' + ed.getLang('anchor.name', 'Name') + '</label>' +
                    '   <div class="mceModalControl">' +
                    '       <input type="text" id="' + ed.id + '_anchor_input" autofocus />' +
                    '   </div>' +
                    '</div>';

                ed.windowManager.open({
                    title: ed.getLang('anchor.desc', 'Anchor'),
                    content: html,
                    size: 'mce-modal-landscape-small',
                    open: function () {
                        var input = DOM.get(ed.id + '_anchor_input');

                        input.value = '';

                        var label = ed.getLang('insert', 'Insert');
                        var v = getAnchor();

                        if (v) {
                            input.value = v;
                            label = ed.getLang('update', 'Update');
                        }

                        DOM.setHTML(this.id + '_insert', label);

                        window.setTimeout(function () {
                            input.focus();
                        }, 10);
                    },
                    buttons: [
                        {
                            title: ed.getLang('anchor.remove', 'Remove'),
                            id: 'remove',
                            onsubmit: function (e) {
                                if (!e.target.disabled) {
                                    removeAnchor();
                                }
                            },
                            scope: self
                        },
                        {
                            title: ed.getLang('insert', 'Insert'),
                            id: 'insert',
                            onsubmit: function (e) {
                                var value = DOM.getValue(ed.id + '_anchor_input');

                                // remove invalid characters
                                value = value.replace(/[^\w\:\.-]/g, '');

                                if (!value) {
                                    e.cancelSubmit = true;
                                }

                                insertAnchor(value);
                            },
                            classes: 'primary',
                            scope: self
                        }
                    ]
                });
            }
        });
    });
})();