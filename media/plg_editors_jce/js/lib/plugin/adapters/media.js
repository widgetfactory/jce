/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
/* global  */

// eslint-disable-next-line no-unused-vars
/* eslint-disable no-var */
var WfMediaAdapter = {
    /** name -> adapter object */
    items: Object.create(null),

    /**
     * Register an adapter
     * @param {string} name
     * @param {object} o
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
     * Setup all adapters and apply shared params from options
     * @param {object} options
     */
    setup: function (options) {
        var self = this;
        var opts = options || {};

        var k;

        for (k in this.items) {
            if (!Object.prototype.hasOwnProperty.call(this.items, k)) {
                continue;
            }

            self.setParams(k, opts);
            self._call(self.items[k], 'setup');
        }
    },

    /**
     * Get display title for an adapter
     * @param {string} name
     * @returns {string}
     */
    getTitle: function (name) {
        var f = this.get(name);
        return (f && typeof f.title === 'string') ? f.title : name;
    },

    /**
     * Get media type from adapter
     * @param {string} name
     * @returns {string}
     */
    getType: function (name) {
        var f = this.get(name);

        if (f && typeof f.getType === 'function') {
            return f.getType() || '';
        }

        return '';
    },

    /**
     * Ask adapters for values (eg UI → data)
     * @param {string} name
     * @param {*} data
     * @returns {*|null}
     */
    getValues: function (name, data) {
        var f = this.get(name);

        return f ? this._call(f, 'getValues', data) : null;
    },

    /**
     * Send values to aggregator (eg data → UI)
     * @param {string} name
     * @param {*} data
     * @returns {*|null}
     */
    setValues: function (name, data) {
        var f = this.get(name);

        return f ? this._call(f, 'setValues', data) : null;
    },

    /**
     * Extract attributes from aggregator
     * @param {string} name
     * @param {*} args
     * @returns {*|null}
     */
    getAttributes: function (name, args) {
        var f = this.get(name);

        return f ? this._call(f, 'getAttributes', args) : null;
    },

    /**
     * Apply attributes via aggregator
     * @param {string} name
     * @param {*} args
     * @param {Function} callback
     * @returns {*|null}
     */
    setAttributes: function (name, args, callback) {
        var f = this.get(name);
        if (!f) {
            return null;
        }

        var data = this._call(f, 'setAttributes', args);
        if (typeof callback === 'function') {
            try {
                callback(data);
            } catch (e) { /* ignore */ }
        }
        return data;
    },

    /**
     * Check whether any aggregator supports the args
     * Returns the first truthy result from an aggregator.
     * @param {*} args
     * @returns {*|undefined}
     */
    isSupported: function (args) {
        var k, o, v;

        for (k in this.items) {
            if (!Object.prototype.hasOwnProperty.call(this.items, k)) {
                continue;
            }

            o = this.items[k];

            v = this._call(o, 'isSupported', args);

            if (v) {
                return v;
            }
        }

        return undefined;
    },

    /**
     * Get an aggregator parameter
     * @param {string} name
     * @param {string} param
     * @returns {*|''}
     */
    getParam: function (name, param) {
        var f = this.get(name);
        if (f && f.params && Object.prototype.hasOwnProperty.call(f.params, param)) {
            return f.params[param];
        }
        return '';
    },

    /**
     * Merge parameters into an aggregator
     * @param {string} name
     * @param {Object} o
     */
    setParams: function (name, o) {
        var f = this.get(name);
        if (f) {
            if (!f.params) {
                f.params = Object.create(null);
            }
            var src = o || {};
            var key;
            for (key in src) {
                if (Object.prototype.hasOwnProperty.call(src, key)) {
                    f.params[key] = src[key];
                }
            }
        }
    },

    /**
     * Notify aggregator when a file is selected
     * @param {string} name
     * @returns {*|null}
     */
    onSelectFile: function (name) {
        var f = this.get(name);
        return f ? this._call(f, 'onSelectFile') : null;
    },

    /**
     * Notify aggregator on insert
     * @param {string} name
     * @returns {*|null}
     */
    onInsert: function (name) {
        var f = this.get(name);
        return f ? this._call(f, 'onInsert') : null;
    },

    /**
     * Safe method caller
     * @param {Object} o
     * @param {string} fn
     * @param {*} vars
     * @returns {*|null}
     */
    _call: function (o, fn, vars) {
        var f = o && o[fn];
        if (typeof f === 'function') {
            return f.call(o, vars);
        }
        return null;
    }
};

window.WfMediaAdapter = WfMediaAdapter;