/**
 * @package    JCE
 * @copyright  Copyright (c) 2009-2026 Ryan Demmer. All rights reserved.
 * @copyright  Copyright 2009, Moxiecode Systems AB
 * @license    GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * JCE is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */

// Some global instances
var ibis;

// Helper class providing easy access to the parent editor instance from within a popup/dialog
var ibisPopup = {

    // Initialise the popup — find the parent window, wire up the editor reference and DOM listeners
    init: function () {
        var self = this;

        var win = this.getWin();
        ibis = win.ibis;

        this.editor = ibis.EditorManager.activeEditor;
        this.params = this.editor.windowManager.params;
        this.features = this.editor.windowManager.features;

        this.dom = this.editor.windowManager.createInstance('ibis.dom.DOMUtils', document, {
            ownEvents: true,
            proxy: ibisPopup.eventProxy
        });

        this.dom.bind(window, 'ready', this.onDOMLoaded, this);

        this.listeners = [];

        // Fires when the popup is initialised — add handlers via ibisPopup.onInit.add(fn, scope)
        this.onInit = {
            add: function (fn, scope) {
                self.listeners.push({
                    func: fn,
                    scope: scope
                });
            }
        };

        this.isWindow = false;
        this.id = this.getWindowArg('mce_window_id');
        this.editor.windowManager.onOpen.dispatch(this.editor.windowManager, window);
    },

    // Return the parent window that opened this dialog
    getWin: function () {
        // frameElement check fixes bug #2817583
        return (!window.frameElement && window.dialogArguments) || opener || parent || top;
    },

    // Return a window argument by name, with an optional default value
    getWindowArg: function (name, defaultValue) {
        var value = this.params[name];
        return ibis.is(value) ? value : defaultValue;
    },

    // Return an editor config option by name, with an optional default value
    getParam: function (name, defaultValue) {
        return this.editor.getParam(name, defaultValue);
    },

    // Return a language string by key, with an optional default value
    getLang: function (name, defaultValue) {
        return this.editor.getLang(name, defaultValue);
    },

    // Execute a command on the parent editor, restoring selection first
    execCommand: function (cmd, ui, val, args) {
        args = args || {};
        args.skip_focus = 1;

        this.restoreSelection();
        return this.editor.execCommand(cmd, ui, val, args);
    },

    // Bookmark the current editor selection so it can be restored after focus leaves the editor
    storeSelection: function () {
        this.editor.windowManager.bookmark = ibisPopup.editor.selection.getBookmark(1);
    },

    // Restore a previously stored editor selection
    restoreSelection: function () {
        if (!this.isWindow) {
            this.editor.selection.moveToBookmark(this.editor.windowManager.bookmark);
        }
    },

    // Open the colour picker and write the chosen value back to the given element
    pickColor: function (elementId) {
        var elm = document.getElementById(elementId);

        this.execCommand('mceColorPicker', true, {
            color: elm.value,
            callback: function (color) {
                elm.value = color;

                try {
                    elm.onchange();
                } catch (ex) {
                    // ignore — onchange may not be defined
                }
            }
        });
    },

    // Open the file browser and write the selected value back via the callback
    openBrowser: function (args) {
        ibisPopup.restoreSelection();
        this.editor.execCallback('file_browser_callback', args, window);
    },

    // Show a confirm dialog via the editor window manager
    confirm: function (title, callback, scope) {
        this.editor.windowManager.confirm(title, callback, scope, window);
    },

    // Show an alert dialog via the editor window manager
    alert: function (title, callback, scope) {
        this.editor.windowManager.alert(title, callback, scope, window);
    },

    // Close the popup and null all references to avoid leaks
    close: function () {
        if (this.editor) {
            this.editor.windowManager.close(window);
            ibis = this.editor = this.params = this.dom = this.dom.doc = null;
        }
    },

    // Restore selection when a submit/button input is clicked
    restoreSelectionOnClick: function (evt) {
        var target = evt && evt.target;

        if (target.nodeName == 'INPUT' && (target.type == 'submit' || target.type == 'button')) {
            ibisPopup.restoreSelection();
        }
    },

    // Set up the document body, title, focus, and fire onInit listeners once the DOM is ready
    onDOMLoaded: function () {
        var editor = this.editor,
            title = document.title;

        document.body.style.display = '';

        this.restoreSelection();

        if (!this.isWindow) {
            editor.windowManager.setTitle(window, title);
        } else {
            window.focus();
        }

        if (!this.isWindow) {
            this.dom.bind(document, 'focus', function () {
                editor.windowManager.focus(this.id);
            });
        }

        // Fire onInit listeners before focus so selection is not lost
        ibis.each(this.listeners, function (listener) {
            listener.func.call(listener.scope, editor);
        });

        window.focus();
    },

    // Return a native event proxy function for the given element id
    eventProxy: function (id) {
        return function (evt) {
            ibisPopup.dom.events.callNativeHandler(id, evt);
        };
    }
};

ibisPopup.init();

// Compatibility alias for plugins that reference the old TinyMCE name
window.tinyMCEPopup = ibisPopup;
