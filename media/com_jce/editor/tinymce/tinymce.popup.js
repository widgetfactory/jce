/**
 * Popup.js
 *
 * Copyright, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license - Inactive
 * Licence: GNU/LGPL 2.1 or later - http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * Contributing: http://www.tinymce.com/contributing - Inactive
 */

// Some global instances
var tinymce;

/**
 * TinyMCE popup/dialog helper class. This gives you easy access to the
 * parent editor instance and a bunch of other things. It's higly recommended
 * that you load this script into your dialogs.
 *
 * @static
 * @class tinyMCEPopup
 */
var tinyMCEPopup = {
	/**
	 * Initializes the popup this will be called automatically.
	 *
	 * @method init
	 */
	init: function () {
		var self = this,
			win;

		// Find window & API
		win = this.getWin();
		tinymce = tinyMCE = win.tinymce;

		this.editor = tinymce.EditorManager.activeEditor;
		this.params = this.editor.windowManager.params;
		this.features = this.editor.windowManager.features;

		// Setup local DOM
		this.dom = this.editor.windowManager.createInstance('tinymce.dom.DOMUtils', document, {
			ownEvents: true,
			proxy: tinyMCEPopup._eventProxy
		});

		this.dom.bind(window, 'ready', this._onDOMLoaded, this);

		// Setup on init listeners
		this.listeners = [];

		/**
		 * Fires when the popup is initialized.
		 *
		 * @event onInit
		 * @param {tinymce.Editor} editor Editor instance.
		 * @example
		 * // Alerts the selected contents when the dialog is loaded
		 * tinyMCEPopup.onInit.add(function(ed) {
		 *     alert(ed.selection.getContent());
		 * });
		 *
		 * // Executes the init method on page load in some object using the SomeObject scope
		 * tinyMCEPopup.onInit.add(SomeObject.init, SomeObject);
		 */
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

	/**
	 * Returns the reference to the parent window that opened the dialog.
	 *
	 * @method getWin
	 * @return {Window} Reference to the parent window that opened the dialog.
	 */
	getWin: function () {
		// Added frameElement check to fix bug: #2817583
		return (!window.frameElement && window.dialogArguments) || opener || parent || top;
	},

	/**
	 * Returns a window argument/parameter by name.
	 *
	 * @method getWindowArg
	 * @param {String} name Name of the window argument to retrive.
	 * @param {String} defaultValue Optional default value to return.
	 * @return {String} Argument value or default value if it wasn't found.
	 */
	getWindowArg: function (name, defaultValue) {
		var value = this.params[name];
		return tinymce.is(value) ? value : defaultValue;
	},

	/**
	 * Returns a editor parameter/config option value.
	 *
	 * @method getParam
	 * @param {String} name Name of the editor config option to retrive.
	 * @param {String} defaultValue Optional default value to return.
	 * @return {String} Parameter value or default value if it wasn't found.
	 */
	getParam: function (name, defaultValue) {
		return this.editor.getParam(name, defaultValue);
	},

	/**
	 * Returns a language item by key.
	 *
	 * @method getLang
	 * @param {String} name Language item like mydialog.something.
	 * @param {String} defaultValue Optional default value to return.
	 * @return {String} Language value for the item like "my string" or the default value if it wasn't found.
	 */
	getLang: function (name, defaultValue) {
		return this.editor.getLang(name, defaultValue);
	},

	/**
	 * Executed a command on editor that opened the dialog/popup.
	 *
	 * @method execCommand
	 * @param {String} cmd Command to execute.
	 * @param {Boolean} ui Optional boolean value if the UI for the command should be presented or not.
	 * @param {Object} val Optional value to pass with the comman like an URL.
	 * @param {Object} a Optional arguments object.
	 */
	execCommand: function (cmd, ui, val, a) {
		a = a || {};
		a.skip_focus = 1;

		this.restoreSelection();
		return this.editor.execCommand(cmd, ui, val, a);
	},

	/**
	 * Resizes the dialog to the inner size of the window. This is needed since various browsers
	 * have different border sizes on windows.
	 *
	 * @method resizeToInnerSize
	 */
	resizeToInnerSize: function () {},

	/**
	 * Stores the current editor selection for later restoration. This can be useful since some browsers
	 * looses it's selection if a control element is selected/focused inside the dialogs.
	 *
	 * @method storeSelection
	 */
	storeSelection: function () {
		this.editor.windowManager.bookmark = tinyMCEPopup.editor.selection.getBookmark(1);
	},

	/**
	 * Restores any stored selection. This can be useful since some browsers
	 * looses it's selection if a control element is selected/focused inside the dialogs.
	 *
	 * @method restoreSelection
	 */
	restoreSelection: function () {
		if (!this.isWindow && tinymce.isIE) {
			this.editor.selection.moveToBookmark(this.editor.windowManager.bookmark);
		}
	},

	/**
	 * Executes a color picker on the specified element id. When the user
	 * then selects a color it will be set as the value of the specified element.
	 *
	 * @method pickColor
	 * @param {DOMEvent} e DOM event object.
	 * @param {string} element_id Element id to be filled with the color value from the picker.
	 */
	pickColor: function (e, element_id) {
		this.execCommand('mceColorPicker', true, {
			color: document.getElementById(element_id).value,
			func: function (color) {
				document.getElementById(element_id).value = color;

				try {
					document.getElementById(element_id).onchange();
				} catch (ex) {
					// Try fire event, ignore errors
				}
			}
		});
	},

	/**
	 * Opens a filebrowser/imagebrowser this will set the output value from
	 * the browser as a value on the specified element.
	 *
	 * @method openBrowser
	 * @param {string} element_id Id of the element to set value in.
	 * @param {string} type Type of browser to open image/file/flash.
	 * @param {string} option Option name to get the file_broswer_callback function name from.
	 */
	openBrowser: function (args) {
		tinyMCEPopup.restoreSelection();
		this.editor.execCallback('file_browser_callback', args, window);
	},

	/**
	 * Creates a confirm dialog. Please don't use the blocking behavior of this
	 * native version use the callback method instead then it can be extended.
	 *
	 * @method confirm
	 * @param {String} title Title for the new confirm dialog.
	 * @param {function} callback Callback function to be executed after the user has selected ok or cancel.
	 * @param {Object} scope Optional scope to execute the callback in.
	 */
	confirm: function (title, callback, scope) {
		this.editor.windowManager.confirm(title, callback, scope, window);
	},

	/**
	 * Creates a alert dialog. Please don't use the blocking behavior of this
	 * native version use the callback method instead then it can be extended.
	 *
	 * @method alert
	 * @param {String} title Title for the new alert dialog.
	 * @param {function} callback Callback function to be executed after the user has selected ok.
	 * @param {Object} scope Optional scope to execute the callback in.
	 */
	alert: function (title, callback, scope) {
		this.editor.windowManager.alert(title, callback, scope, window);
	},

	/**
	 * Closes the current window.
	 *
	 * @method close
	 */
	close: function () {
		if (this.editor) {
			this.editor.windowManager.close(window);

			tinymce = tinyMCE = this.editor = this.params = this.dom = this.dom.doc = null; // Cleanup
		}
	},

	// Internal functions

	_restoreSelection: function (e) {
		e = e && e.target;

		if (e.nodeName == 'INPUT' && (e.type == 'submit' || e.type == 'button')) {
			tinyMCEPopup.restoreSelection();
		}
	},

	_onDOMLoaded: function () {
		var editor = this.editor,
			dom = this.dom,
			title = document.title;

		document.body.style.display = '';

		this.restoreSelection();
		this.resizeToInnerSize();

		// Set inline title
		if (!this.isWindow) {
			editor.windowManager.setTitle(window, title);
		} else {
			window.focus();
		}

		if (!tinymce.isIE && !this.isWindow) {
			dom.bind(document, 'focus', function () {
				editor.windowManager.focus(this.id);
			});
		}

		// bind close on esc
		/*dom.bind(document, 'keyup', function (e) {
			if (e.keyCode == 27) {
				tinyMCEPopup.close();
			}
		});*/

		// Call onInit
		// Init must be called before focus so the selection won't get lost by the focus call
		tinymce.each(this.listeners, function (o) {
			o.func.call(o.scope, editor);
		});

		// Move focus to window
		window.focus();
	},

	_eventProxy: function (id) {
		return function (evt) {
			tinyMCEPopup.dom.events.callNativeHandler(id, evt);
		};
	}
};

tinyMCEPopup.init();