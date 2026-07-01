/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* global ibisPopup, jQuery */

// eslint-disable-next-line no-unused-vars
/* eslint-disable no-var */

var WfLightboxAdapter = {
    /** @type {Object.<string, Object>} */
    items: Object.create(null),

    /** @type {String|null} current lightbox key */
    current: null,

    /** @type {Object} global config */
    config: {},

    /**
     * Register a lightbox adapter.
     * @param {String} name
     * @param {Object} obj
     */
    add: function (name, obj) {
        this.items[name] = obj;
    },

    /**
     * Get an adapter or all adapters.
     * @returns {object|null} - Returns the adapter object or null if not found.
     * If no name is provided, returns all adapters.
     * @param {string} [name] - Optional name of the adapter to retrieve.
     * If provided, returns the specific adapter; otherwise, returns all adapters.
     */
    get: function (name) {
        if (name) {
            return this.items[name] || null;
        }
        
        return this.items;
    },

    /**
     * Initialize UI bindings.
     * @param {Object} options
     *   - change(name)
     *   - remove(name)
     */
    setup: function (options) {
        var self = this;
        var ed = (window.ibisPopup && ibisPopup.editor) || null;
        var s = ed ? ed.selection : null;

        options = jQuery.extend({
            remove: jQuery.noop,
            change: jQuery.noop
        }, options || {});

        // Select list: change + remove events
        jQuery('#lightbox_list')
            .on('change', function () {
                self.selectLightbox(this.value);
                options.change(this.value);
            })
            .on('popup:remove', function (e, name) {
                options.remove(name);
            })
            .trigger('change');

        // Pre-fill text field from selection
        if (ed && s && !s.isCollapsed()) {
            var n = s.getNode();
            var valueText = s.getContent({ format: 'text' });
            var enableText = false;

            if (n) {
                // one text-node child only (excluding bogus br)
                var children = ibis.grep(n.childNodes, function (node) {
                    return ed.dom.is(node, 'br[data-mce-bogus]') === false;
                });
                enableText = children.length === 1 && children[0].nodeType === 3;
            }

            if (enableText && valueText) {
                jQuery('#lightbox_text').val(valueText).prop('disabled', false)
                    .removeClass('disabled');
            } else {
                jQuery('#lightbox_text')
                    .val(ibisPopup.getLang('dlg.element_selection', 'Element Selection'))
                    .prop('disabled', true)
                    .addClass('disabled');
            }
        }

        // Call adapter setup, if present
        jQuery.each(this.items, function (name, obj) {
            self._call('setup', [], name);
        });
    },

    /**
     * Is node a lightbox of adapter `name`?
     * @param {Node} n
     * @param {String} name
     */
    isLightbox: function (n, name) {
        return !!(n && n.nodeName === 'A' && this._call('check', [n], name));
    },

    /**
     * Detect lightbox on/above node, select it, and fetch attributes.
     * @param {Node} n
     * @param {Function} callback
     * @param {Number} index
     */
    getLightbox: function (n, callback, index) {
        var self = this;
        var ed = ibisPopup.editor;

        if (n && n.nodeName !== 'A') {
            n = ed.dom.getParent(n, 'a');
        }

        // detect which adapter matches
        self.current = null;

        jQuery.each(this.items, function (name) {
            if (!self.current && self.isLightbox(n, name)) {
                self.current = name;
            }
        });

        if (n && self.current) {
            this.selectLightbox(self.current);
            return this.getAttributes(n, callback, index);
        }

        return null;
    },

    /** Set current adapter name. */
    setLightbox: function (name) {
        this.current = name || null;
    },

    /** Merge global config. */
    setConfig: function (config) {
        jQuery.extend(this.config, config || {});
    },

    /** Merge params for a specific adapter. */
    setParams: function (name, params) {
        var item = this.items[name];
        if (item) {
            item.params = jQuery.extend({}, item.params || {}, params || {});
        }
    },

    /** Get params for a specific adapter. */
    getParams: function (name) {
        var item = this.items[name];
        return item ? (item.params || {}) : {};
    },

    /** Get one param from an adapter. */
    getParam: function (name, key) {
        var params = this.getParams(name);
        // eslint-disable-next-line no-prototype-builtins
        return params.hasOwnProperty(key) ? params[key] : null;
    },

    /**
     * Select adapter in UI and show its panel.
     * @param {String} name
     */
    selectLightbox: function (name) {
        var self = this;
        this.current = name || null;

        jQuery('#lightbox_list').val(name).children('option').each(function () {
            if (this.value) {
                jQuery('#lightbox_adapter_' + this.value).hide();
            }
        });

        if (name) {
            jQuery('#lightbox_adapter_' + name).show();
            self._call('onSelect', [], name);
        }
    },

    /**
     * Write adapter attributes to link.
     * @param {Node} n
     * @param {Object} args
     * @param {Number} index
     */
    setAttributes: function (n, args, index) {
        var ed = ibisPopup.editor;
        args = args || {};

        // map global config values first
        if (this.config && this.config.map) {
            jQuery.each(this.config.map, function (to, from) {
                var v = args[from] || jQuery('#' + from).val();
                ed.dom.setAttrib(n, to, v);

                delete args[from]; // consume
            });
        }

        return this._call('setAttributes', [n, args, index]);
    },

    /**
     * Read adapter attributes from link.
     * @param {Node} n
     * @param {Function} callback
     * @param {Number} index
     */
    getAttributes: function (n, callback, index) {
        var ed = ibisPopup.editor;
        var data;

        if (!n || n.nodeName !== 'A') {
            n = ed.dom.getParent(n, 'a');
        }

        if (typeof callback !== 'function') {
            callback = function (val) { 
                return val; 
            };
        }
        if (typeof index !== 'number') {
            index = 0;
        }

        if (n && this.isLightbox(n, this.current)) {
            data = this._call('getAttributes', [n, index, callback]);
        }

        return data || null;
    },

    /** Are popups enabled? */
    isEnabled: function () {
        return !!this.current;
    },

    /**
     * Create or update lightbox on a link.
     * @param {Node} n
     * @param {Object} args
     * @param {Number} index
     */
    createLightbox: function (n, args, index) {
        var self = this;
        var ed = ibisPopup.editor;
        args = args || {};

        if (!this.isEnabled()) {
            // If disabled and node has a lightbox, remove it
            n = ed.dom.getParent(n, 'A');

            if (n) {
                self.removeLightbox(n);
            }

            return;
        }

        if (n && (n.nodeName === 'A' || ed.dom.getParent(n, 'A'))) {
            if (n.nodeName !== 'A') {
                n = ed.dom.getParent(n, 'A');
            }

            this.removeLightbox(n, true);
            this.setAttributes(n, args, index);
        } else {
            var se = ed.selection;

            if (se.isCollapsed()) {
                ed.execCommand('mceInsertContent', false, '<a href="#" id="__mce_tmp">' + jQuery('#popup_text').val() + '</a>', { skip_undo: 1 });
            } else {
                var linkNode = se.getNode();
                ed.execCommand('mceInsertLink', false, { href: '#', id: '__mce_tmp' }, { skip_undo: 1 });
                // restore styles
                ed.dom.setAttrib(linkNode, 'style', ed.dom.getAttrib(linkNode, 'data-mce-style'));
            }

            n = ed.dom.get('__mce_tmp');

            if (n) {
                ed.dom.setAttrib(n, 'id', null);
                self.setAttributes(n, args, index);
            }
        }
    },

    /**
     * Remove all adapters from a link node.
     * @param {Node} n
     * @param {Boolean} noEvent
     */
    removeLightbox: function (n, noEvent) {
        var self = this;
        jQuery.each(this.items, function (name) {
            self._call('remove', [n], name);
        });
        if (!noEvent) {
            jQuery('#lightbox_list').trigger('popup:remove', n);
        }
    },

    /** Notify adapters when a file is selected. */
    onSelectFile: function (args) {
        this._call('onSelectFile', [args]);
    },

    /**
     * Internal: call a method on the current (or specified) adapter.
     * @param {String} fn
     * @param {Array|*} args
     * @param {String|Object} adapter
     */
    _call: function (fn, args, adapter) {
        var adp = adapter || this.current;

        if (typeof adp === 'string') {
            adp = this.items[adp] || null;
        }

        if (!adp) {
            return null;
        }

        var method = adp[fn];

        if (typeof method === 'function') {
            if (Array.isArray ? Array.isArray(args) : Object.prototype.toString.call(args) === '[object Array]') {
                return method.apply(adp, args);
            }
            return method.call(adp, args);
        }

        return null;
    }
};

window.WfLightboxAdapter = WfLightboxAdapter;