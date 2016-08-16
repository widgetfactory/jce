/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2015 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
var WFExtensions = {
    types: {},
    add: function (n, o) {
        this[n] = o;

        return this[n];
    },
    /**
     * Add an extension type eg: popups
     * 
     * @param {Object}
     *            n extenions type key
     */
    addType: function (n) {
        this.types[n] = {};
    },
    /**
     * Add an extension
     * 
     * @param {String}
     *            n Extension type eg: popups
     * @param {Object}
     *            o Extension Object
     */
    addExtension: function (type, n, o) {
        if (typeof this.types[type] == 'undefined') {
            this.addType(type);
        }

        this.types[type][n] = o;
    },
    /**
     * Get an Extension Type Object
     * 
     * @param {String}
     *            type Extension type eg: popups
     */
    getType: function (type) {
        return this.types[type] || false;
    },
    /**
     * Get an Extension Object
     * 
     * @param {String}
     *            type Extension type eg: popups
     * @param {Object}
     *            ext Extension Object key eg: jcemediabox
     */
    getExtension: function (type, ext) {
        var s = this.getType(type);

        return s[ext];
    }
};