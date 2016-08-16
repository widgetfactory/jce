/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2013 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*
 * Depends: jquery.ui.core.js jquery.ui.widget.js
 */
(function ($) {

    var Tree = function (element, options) {
        this.element = element;

        this.options = $.extend({
            collapseTree: false,
            charLength: false
        }, options);

        this._init();
    };

    Tree.prototype = {
        /**
         * Shortcut function for event triggering
         * @param {string} ev Event name
         * @param {Mixed} args Arguments
         * @returns {void}
         */
        _trigger: function (ev, args) {
            $(this.element).trigger('tree:' + ev, args);
        },
        _init: function () {
            var self = this;

            if (!this.element) {
                return;
            }

            self._nodeEvents();

            this._trigger('init', function() {
              self._nodeEvents();
            });
        },
        /**
         * Add events to nodes
         * @param {objec} parent object
         * @returns {void}
         */
        _nodeEvents: function (parent) {
            var self = this;

            if (!parent) {
                parent = this.element;
            }

            // Add ARIA role and tabindex to root and ARIA level to children
            $('ul:first', parent).attr({'role': 'tree'}).addClass('ui-tree').children('li').attr('aria-level', 1);

            // Add ARIA role and tabindex to tree items
            $('li', parent).attr({'role': 'treeitem'}).attr('aria-expanded', function () {
                return $(this).hasClass('ui-tree-open') ? true : false;
            }).attr('aria-level', function (i, v) {
                if (!v) {
                    return parseFloat($(this.parentNode.parentNode).attr('aria-level')) + 1;
                }
            }).click(function(e) {
                var n = e.target, p = $(n).parents('li').get(0);

                e.preventDefault();
                e.stopPropagation();

                if (n.nodeName === "I") {
                    n = n.parentNode;
                }

                if ($(n).hasClass('ui-tree-toggle')) {
                    self.toggleNode(e, p);
                } else {
                    self._trigger('nodeclick', p);
                }
            });

            // add toggle icons
            $('li', parent).find('.ui-tree-row').attr('role', 'presentation').prepend('<span class="ui-tree-toggle" role="presentation"><i class="ui-icon ui-icon-plus-square-o"></i><i class="ui-icon ui-icon-minus-square-o"></i></span>');

            // add icons
            $('li', parent).not('.ui-tree-root').find('.ui-tree-icon').attr('role', 'presentation').append('<i class="ui-icon ui-icon-folder"></i><i class="ui-icon ui-icon-folder-open"></i>');
        },
        /**
         * Does a parent (ul) have childnodes
         *
         * @param {String}
         *            The parent
         * @return {Boolean}.
         */
        _hasNodes: function (parent) {
            if ($.type(parent) == 'string') {
                parent = this._findParent(parent);
            }
            var c = $('li', parent);
            return c.length > 1 || (c.length == 1 && !$(c).is(':empty'));
        },
        /**
         * Does the node exist?
         *
         * @param {String}
         *            The node title
         * @param {String
         *            or Element} The parent node
         * @return {Boolean}.
         */
        _isNode: function (id, parent) {
            var n = this._findNode(id, parent);

            return n.length ? true : false;
        },
        /**
         * Does a parent have subnodes?
         *
         * @param {String
         *            or Element} The parent node
         * @return {Boolean}.
         */
        _getNode: function (parent) {
            if ($.type(parent) === "string") {
                parent = this._findParent(parent);
            }

            return $('.ui-tree-node', parent);
        },
        /**
         * Reset all nodes. Set to closed
         */
        _resetNodes: function () {
            $('li', this.element).removeClass('ui-tree-open');
        },
        /**
         * Rename a node
         *
         * @param {String}
         *            The node title
         * @param {String}
         *            The new title
         */
        renameNode: function (id, name) {
            var parent = $.String.dirname(id);

            var node = this._findNode(id, parent);

            // Rename the node
            $(node).attr('id', name);

            // Rename the span
            $('a:first', node).html($.String.basename(name));

            // Rename each of the child nodes
            $('li[id^="' + this._escape(encodeURI(id)) + '"]', node).each(function (n) {
                var nt = $(n).attr('id');
                $(n).attr('id', nt.replace(id, name));
            });

        },
        /**
         * Remove a node
         *
         * @param {String}
         *            The node title
         */
        removeNode: function (id) {
            var parent = $.String.dirname(id);

            var node = this._findNode(id, parent);
            var ul = $(node).parent('ul');

            // Remove the node
            $(node).remove();

            // Remove it if it is now empty
            if (ul && !this._hasNodes(ul)) {
                $(ul).remove();
            }
        },
        /**
         * Create a node
         *
         * @param {Stringor Element} The parent node
         * @return {Array} An array of nodes to create.
         */
        createNode: function (nodes, parent) {
            var self = this;
            var e, p, h, l, np, i;

            // no nodes to create!
            if (!nodes.length) {
                return;
            }

            // If parent is not an element, find the parent element
            if (!parent) {
                parent = $.String.dirname($(nodes[0]).attr('id'));
            }

            if ($.type(parent) == 'string') {
                parent = this._findParent(parent);
            }

            /*
             * Create the nodes from the array <li><div class="tree-row"><div
             * class="tree-image"></div><span><a>node</a></span><div></li>
             */
            if (nodes && nodes.length) {
                // Get parent ul
                var ul = $('.ui-tree-node:first', parent) || null;

                // Create it if it doesn't exist
                if (!ul.length) {
                    ul = document.createElement('ul');
                    $(ul).attr({'role': 'group'}).addClass('ui-tree-node').append('<li role="treeitem" aria-expanded="false"></li>');

                    $(parent).append(ul);
                }

                // Iterate through nodes array
                $.each(nodes, function (i, node) {

                    if (!self._isNode(node.id, parent)) {
                        // title and link html
                        var title = node.name || node.id;
                        // decode
                        title = $.String.decode(title);
                        name = title;
                        len = self.options.charLength;

                        // shorten
                        if (len && name.length > len) {
                            name = name.substring(0, len) + '...';
                        }

                        var url = node.url || '#';
                        var li  = document.createElement('li');

                        if (!node['class']) {
                            node['class'] = 'folder';
                        }

                        $(li).addClass(node['class']);

                        var html = '<div class="ui-tree-row">';

                        if (node['class'].indexOf('folder') >= 0) {
                            html += '<span class="ui-tree-toggle" role="presentation">'
                            + ' <i class="ui-icon ui-icon-plus-square-o"></i>'
                            + ' <i class="ui-icon ui-icon-minus-square-o"></i>'
                            + '</span>';
                        }

                        html += '<a href="' + url + '" title="' + title + '"><span class="ui-tree-icon">';

                        if (node['class'].indexOf('folder') >= 0) {
                            html += '<i role="presentation" class="ui-icon ui-icon-folder"></i><i role="presentation" class="ui-icon ui-icon-folder-open"></i>';
                        } else {
                            html += '<i role="presentation" class="ui-icon ui-icon-file-text-o"></i>';
                        }

                        html += '</span>';

                        html += '<span class="ui-tree-text ui-margin-small-left">' + name + '</span>';
                        html += '</a></div>';

                        $(li).attr({'id': self._escape(encodeURI(node.id))}).append(html).attr('aria-level', parseFloat($(parent).attr('aria-level')) + 1);

                        $(ul).append(li);

                        $(li).click(function(e) {
                            var n = e.target;

                            e.preventDefault();
                            e.stopPropagation();

                            if (n.nodeName === "I") {
                                n = n.parentNode;
                            }

                            if ($(n).hasClass('ui-tree-toggle')) {
                                self.toggleNode(e, this);
                            } else {
                                self._trigger('nodeclick', this);
                            }
                        });

                        self.toggleNodeState(parent, 1);
                        self._trigger('nodecreate');
                    } else {
                        // Node exists, set as open
                        self.toggleNodeState(parent, 1);
                    }
                });

            } else {
                // No new nodes, set as open
                this.toggleNodeState(parent, 1);
            }
        },
        /**
         * Find the parent node
         *
         * @param {String}
         *            The child node id
         * @return {Element} The parent node.
         */
        _findParent: function (el) {
            if ($.type(el) === "string") {
                return $('li[id="' + this._encode(el) + '"]:first', this.element);
            } else {
                return $(el).parents('li:first');
            }
        },
        /**
         * Find a node by id
         *
         * @param {String}
         *            The child node title
         * @param {String /
         *            Element} The parent node
         * @return {Element} The node.
         */
        _findNode: function (id, parent) {
            if (!parent || parent === "/") {
                parent = this.element;
            }

            if ($.type(parent) === "string") {
                parent = this._findParent(parent);
            }

            return $('li[id="' + this._escape(this._encode(id)) + '"]:first', parent);
        },
        /**
         * Toggle the loader class on the node span element
         *
         * @param {Element}
         *            The target node
         */
        toggleLoader: function (node) {
            $(node).toggleClass('ui-tree-loading');
        },
        /**
         * Collapse all tree nodes except one excluded
         *
         * @param {Element}
         *            The excluded node
         */
        _collapseNodes: function (ex) {
            var self = this;

            if (!ex) {
                this._resetNodes();
            }

            var parent = $(ex).parent();

            $('li', parent).each(function () {
                var el = this;

                if (el !== ex && $(el).parent() !== parent) {
                  self.toggleNodeState(el, 0);

                  var child = self._getNode(el);
                  // hide if found
                  $(child).addClass('ui-tree-hide');
                }
            });
        },
        /**
         * Toggle a node's state, open or closed
         *
         * @param {Element}
         * The node
         */
        toggleNodeState: function (node, state) {
            if (state) {
                $(node).addClass('ui-tree-open').attr('aria-expanded', true);
            } else {
                $(node).removeClass('ui-tree-open').attr('aria-expanded', false);
            }

            if (state) {
                if ($(node).hasClass('ui-tree-root')) {
                    return;
                }

                var c = $('.ui-tree-node', node);

                if ($(node).hasClass('ui-tree-open')) {
                    $(c).removeClass('ui-tree-hide');
                } else {
                    $(c).addClass('ui-tree-hide');
                }
            }
        },
        /**
         * Toggle a node
         *
         * @param {Element}
         *            The node
         */
        toggleNode: function (e, node) {
            // Force reload
            if (e.shiftKey) {
                return this._trigger('nodeload', node);
            }

            var child = this._getNode(node);

            // No children load or close
            if (!child.length) {
                if ($(node).hasClass('ui-tree-open')) {
                    this.toggleNodeState(node, 0);
                } else {
                    this._trigger('nodeload', node);
                }
            // Hide children, toggle node
            } else {
                $(child).toggleClass('ui-tree-hide');
                this.toggleNodeState(node, !$(child).hasClass('ui-tree-hide'));
            }

            // Collpase the all other tree nodes
            if (this.options.collapseTree) {
                this._collapseNodes(node);
            }
        },
        _encode: function (s) {
            // decode first in case already encoded
            s = decodeURIComponent(s);
            // encode but decode backspace
            return encodeURIComponent(s).replace(/%2F/gi, '\/');
        },
        /**
         * Private function Escape a string
         *
         * @param {String}
         *            The string
         * @return {String} The escaped string
         */
        _escape: function (s) {
            return s.replace(/'/, '%27');
        }
    };

    // jQuery hook
    $.fn.tree = function (options) {
        var inst = new Tree(this, options);

        $(this).on('tree:createnode', function (e, items, node) {
            inst.createNode(items, node);
        });

        $(this).on('tree:togglenode', function (e, ev, node) {
            inst.toggleNode(ev, node);
        });

        $(this).on('tree:togglenodestate', function (e, node, state) {
            inst.toggleNodeState(node, state);
        });

        $(this).on('tree:toggleloader', function (e, node) {
            inst.toggleLoader(node);
        });

        return this;
    };
})(jQuery);
