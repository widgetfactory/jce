/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2026 Ryan Demmer. All rights reserved
 * @license   	GNU General Public License version 2 or later; see LICENSE.txt
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

/* eslint-disable no-var */
(function (window) {
    'use strict';

    // Plain-object registry with safe maps
    var WfAdapters = {
        /** type -> { name: adapter } */
        types: {},

        /**
         * Attach a top-level object (e.g., Lightbox, Media).
         * @param {string} name
         * @param {object} obj
         * @returns {object}
         */
        add: function (name, obj) {
            this[name] = obj;
            return this[name];
        },

        /**
         * Ensure a bucket exists for a type (e.g., "lightbox", "media").
         * @param {string} type
         */
        addType: function (type) {
            if (!this.types[type]) {
                this.types[type] = {};
            }
        },

        /**
         * Register an adapter under a type.
         * @param {string} type
         * @param {string} name
         * @param {object} adapter
         */
        addAdapter: function (type, name, adapter) {
            if (!this.types[type]) {
                this.addType(type);
            }
            this.types[type][name] = adapter;
        },

        /**
         * Get all adapters for a type.
         * @param {string} type
         * @returns {object|null}
         */
        getType: function (type) {
            return this.types[type] || null;
        },

        /**
         * Get a specific adapter by type and name.
         * @param {string} type
         * @param {string} name
         * @returns {object|null}
         */
        getAdapter: function (type, name) {
            var bucket = this.getType(type);
            return bucket && bucket[name] ? bucket[name] : null;
        }
    };

    window.WfAdapters = WfAdapters;
}(window));