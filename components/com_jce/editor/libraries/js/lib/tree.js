/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2018 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/*
 * Depends: jquery.ui.core.js jquery.ui.widget.js
 */
(function ($, Wf) {

    var Tree = function (element, options) {
        this.element = element;

        this.options = $.extend({
            collapseTree: false,
            charLength: false
        }, options);

        this._init();
    };

    // list of events to stop scoll animation on
    var scrollEvents = 'click.scroll mousedown.scroll wheel.scroll mousewheel.scroll keyup.scroll touchmove.scroll';

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

            this._trigger('init', function () {
                self.nodeEvents();
            });

            // cancel scrolling animation
            $(this.element).on(scrollEvents, function() {
                $(this).stop();
            });
        },
        /**
         * Add events to nodes
         * @param {objec} parent object
         * @returns {void}
         */
        nodeEvents: function (parent) {
            var self = this;

            if (!parent) {
                parent = this.element;
            }

            // Add ARIA role and tabindex to root and ARIA level to children
            $('ul:first', parent).attr({
                'role': 'tree'
            }).addClass('uk-tree').children('li').attr('aria-level', 1);

            $(parent).on('click', function (e) {
                var n = e.target,
                    p = $(n).parents('li').get(0);

                e.preventDefault();
                e.stopPropagation();

                if ($(n).hasClass('uk-icon')) {
                    n = n.parentNode;
                }

                if ($(n).hasClass('uk-tree-toggle')) {
                    self.toggleNode(e, p);
                } else {
                    self._trigger('nodeclick', p);
                }

                // remove all active classes from other tree nodes
                $(self.element).find('.uk-tree-active').removeClass('uk-tree-active');

                // add active class to tree node
                $(p).addClass('uk-tree-active');
            });

            // Add ARIA role and tabindex to tree items
            $('li', parent).attr({
                'role': 'treeitem'
            }).attr('aria-expanded', function () {
                return $(this).hasClass('uk-tree-open') ? true : false;
            }).attr('aria-level', function (i, v) {
                if (!v) {
                    return parseFloat($(this.parentNode.parentNode).attr('aria-level')) + 1;
                }
            });

            // add toggle icons
            $('li', parent).find('.uk-tree-row').attr('role', 'presentation').prepend('<span class="uk-tree-toggle" role="presentation"><i class="uk-icon uk-icon-caret-right"></i><i class="uk-icon uk-icon-caret-down"></i></span>');

            // add icons
            $('li', parent).not('.uk-tree-root').find('.uk-tree-icon').attr('role', 'presentation').append('<i class="uk-icon uk-icon-folder"></i><i class="uk-icon uk-icon-folder-open"></i>');
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

            return $('.uk-tree-node', parent);
        },
        /**
         * Reset all nodes. Set to closed
         */
        _resetNodes: function () {
            $('li', this.element).removeClass('uk-tree-open');
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
            var parent = Wf.String.dirname(id);

            var node = this._findNode(id, parent);

            // Rename the node
            $(node).attr('data-id', name);

            // Rename the span
            $('a:first .uk-tree-text', node).text(Wf.String.basename(name));

            // Rename each of the child nodes
            $('li[data-id^="' + this._escape(encodeURI(id)) + '"]', node).each(function (n) {
                var nt = $(n).attr('data-id');
                $(n).attr('data-id', nt.replace(id, name));
            });

        },
        /**
         * Remove a node
         *
         * @param {String}
         *            The node title
         */
        removeNode: function (id) {
            var parent = Wf.String.dirname(id);

            var node = this._findNode(id, parent);

            var ul = $(node).parent('ul');

            // Remove the node
            $(node).remove();

            // Remove it if it is now empty
            if (ul && !this._hasNodes(ul)) {
                $(ul).remove();
            }
        },

        sortNodes: function (parent) {
            var p = $(parent).parent();

            // detach parent
            parent = $(parent).detach();

            // create the list to sort
            var list = $('li', parent).map(function () {
                var v = $('.uk-tree-text', this).attr('title');

                return {
                    value: v,
                    element: this
                };
            }).get();

            // sort list
            list.sort(function (a, b) {
                if (a.value < b.value) {
                    return -1;
                }

                if (b.value < a.value) {
                    return 1;
                }

                return 0;
            });

            $.each(list, function (i, item) {
                $(parent).append(item.element);
            });

            $(p).append(parent);
        },

        /**
         * Create a node
         *
         * @param {Stringor Element} The parent node
         * @return {Array} An array of nodes to create.
         */
        createNode: function (nodes, parent, sortNodes) {
            var self = this;
            var e, p, h, l, np, i;

            // no nodes to create!
            if (!nodes.length) {
                return;
            }

            // If parent is not an element, find the parent element
            if (!parent) {
                parent = Wf.String.dirname($(nodes[0]).attr('data-id') || $(nodes[0]).attr('id'));
            }

            if ($.type(parent) == 'string') {
                parent = this._findParent(parent);
            }

            // filter nodes that already exist
            nodes = $.grep(nodes, function(node) {
                return self._findNode(node.id, parent).length === 0;
            });

            // remove active states
            $(this.element).find('.uk-tree-active').removeClass('uk-tree-active');

            /*
             * Create the nodes from the array <li><div class="tree-row"><div
             * class="tree-image"></div><span><a>node</a></span><div></li>
             */
            if (nodes && nodes.length) {
                // Get parent ul
                var ul = $('.uk-tree-node:first', parent) || null;

                // Create it if it doesn't exist
                if (!ul.length) {
                    ul = document.createElement('ul');
                    $(ul).attr({
                        'role': 'group'
                    }).addClass('uk-tree-node').append('<li role="treeitem" aria-expanded="false"></li>');

                    $(parent).append(ul);
                }

                // Iterate through nodes array
                $.each(nodes, function (i, node) {
                    if (!self._isNode(node.id, parent)) {
                        // title and link html
                        var title = node.name || node.id;
                        // decode
                        title = Wf.String.decode(title);
                        name = title;

                        var url = node.url || '#';

                        if (!node['class']) {
                            node['class'] = 'folder';
                        }

                        // create the node html
                        var html = '<li data-id="' + self._escape(encodeURI(node.id)) + '" class="' + node['class'] + '" aria-level="' + parseFloat($(parent).attr('aria-level')) + 1 + '">';

                        html += '<div class="uk-tree-row">';

                        if (node['class'].indexOf('folder') >= 0) {
                            html += '<span class="uk-tree-toggle" role="presentation">' + ' <i class="uk-icon uk-icon-caret-right"></i>' + ' <i class="uk-icon uk-icon-caret-down"></i>' + '</span>';
                        }

                        html += '<a href="' + url + '" title="' + title + '"><span class="uk-tree-icon">';

                        if (node['class'].indexOf('folder') >= 0) {
                            html += '<i role="presentation" class="uk-icon uk-icon-folder"></i><i role="presentation" class="uk-icon uk-icon-folder-open"></i>';
                        } else {
                            html += '<i role="presentation" class="uk-icon uk-icon-file-text"></i>';
                        }

                        html += '</span>';

                        html += '<span class="uk-tree-text uk-width-9-10 uk-margin-small-left uk-text-truncate" title="' + name + '">' + name + '</span>';
                        html += '</a></div>';
                        html += '</li>';

                        $(ul).append(html);

                        self.toggleNodeState(parent, 1);
                        self._trigger('nodecreate');
                    } else {
                        // Node exists, set as open
                        self.toggleNodeState(parent, 1);
                    }
                });

                // sort list nodes
                if (sortNodes !== false && $(ul).children().length > 1) {
                    self.sortNodes(ul);
                }

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
                return $('li[data-id="' + this._encode(el) + '"]:first', this.element);
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

            return $(parent).find('li[data-id="' + this._escape(this._encode(id)) + '"]:first');
        },
        /**
         * Toggle the loader class on the node span element
         *
         * @param {Element}
         *            The target node
         */
        toggleLoader: function (node) {
            $(node).toggleClass('uk-tree-loading');
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
                    $(child).addClass('uk-tree-hide');
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
                $(node).addClass('uk-tree-open').attr('aria-expanded', true);
            } else {
                $(node).removeClass('uk-tree-open').attr('aria-expanded', false);
            }

            if (state) {
                if ($(node).hasClass('uk-tree-root')) {
                    return;
                }

                var c = $('.uk-tree-node', node);

                if ($(node).hasClass('uk-tree-open')) {
                    $(c).removeClass('uk-tree-hide');
                } else {
                    $(c).addClass('uk-tree-hide');
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
                if ($(node).hasClass('uk-tree-open')) {
                    this.toggleNodeState(node, 0);
                } else {
                    this._trigger('nodeload', node);
                }
                // Hide children, toggle node
            } else {
                $(child).toggleClass('uk-tree-hide');
                this.toggleNodeState(node, !$(child).hasClass('uk-tree-hide'));
            }

            // Collpase the all other tree nodes
            if (this.options.collapseTree) {
                this._collapseNodes(node);
            }
        },
        refreshNode: function (node) {
            var parent = this._findParent(node);
            return this._trigger('nodeload', parent);
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
        },

        /**
         * Scroll to a node
         *
         * @param {String}
         *            The node id
         * @return void
         */
        scrollTo: function (id) {
            var el = this.element, node = this._findNode(id);

            if ($(node).length) {
                var padding = parseInt($(node).css('padding-left')) + parseInt($(this.element).css('padding-left'));

                var left = $(node).get(0).offsetLeft - padding;
                var top = $(node).get(0).offsetTop - ($(node).outerHeight() + 2);

                // remove active states
                $(el).find('.uk-tree-active').removeClass('uk-tree-active');

                $(el).animate({
                    scrollLeft: Math.round(left),
                }, 500).animate({
                    scrollTop: Math.round(top)
                }, 1500, function() {
                    $(this).off(scrollEvents);
                });

                // mark as active
                $(node).addClass('uk-tree-active');
            }
        }
    };

    // jQuery hook
    $.fn.tree = function (options) {
        var inst = new Tree(this, options);

        $(this).on('tree:createnode', function (e, node, parent, sortNodes) {
            if (typeof node === "string") {
                node = [node];
            }

            inst.createNode(node, parent, sortNodes);
        });

        $(this).on('tree:removenode', function (e, node) {
            inst.removeNode(node);
        });

        $(this).on('tree:renamenode', function (e, node, name) {
            inst.renameNode(node, name);
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

        $(this).on('tree:refreshnode', function (e, node) {
            inst.refreshNode(node);
        });

        $(this).on('tree:scroll', function (e, id) {
            inst.scrollTo(id);
        });

        $(this).on('tree:init', function (e) {
            inst.nodeEvents();
        });

        return this;
    };
})(jQuery, Wf);