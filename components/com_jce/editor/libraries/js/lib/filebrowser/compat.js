/**
 * @package   	JCE
 * @copyright 	Copyright (c) 2009-2016 Ryan Demmer. All rights reserved.
 * @license   	GNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
var WFFileBrowser = {

    settings 	: {},

    element 	: '',

    /**
	 * Initialize FileBrowser
	 * @param element Mixed Element or Element Selector
	 * @params options Object
	 */
    init : function(element, options) {
				var self = this;

				$.extend(true, this.settings, options);

				this.element = element;
				$(this.element).filebrowser(this.settings);
    },

    /**
	 * Get the base directory
	 */
    getBaseDir : function() {
        return $.fn.filebrowser.getbasedir();
    },

    /**
	 * Get current directory
	 */
    getCurrentDir : function() {
        return $.fn.filebrowser.getcurrentdir();
    },

    /**
	 * Get a list of selected items optionally fitlered by key
	 */
    getSelectedItems : function(key) {
        return $.fn.filebrowser.getselected(key);
    },

    /**
	 * Set a list of selected items
	 */
    setSelectedItems : function(items) {
				return $.fn.filebrowser.setselected(items);
    },

    /**
	 * Refresh the browser
	 */
    refresh : function() {
        return $.fn.filebrowser.refresh();
    },

    status : function(message, state) {
				return $.fn.filebrowser.status(message, state);
    },

    /**
	 * Load the browser and set optional return items to select
	 */
    load : function(items) {
				$(this.element).trigger('filebrowser:load', items);
    },

    /**
	 * Compatability function
	 */
    get : function(fn, args) {
        return WFFileBrowser[fn](args);
    }
};
