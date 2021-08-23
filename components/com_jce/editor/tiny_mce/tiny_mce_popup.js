(function (window) {
    var win = (!window.frameElement && window.dialogArguments) || opener || parent || top;

    var tinymce = win.tinymce;

    var tinyMCEPopup = {
        editor: tinymce.activeEditor,

        listeners : [],

        onInit : {
			add: function (fn, scope) {
				tinyMCEPopup.listeners.push({
					func: fn,
					scope: scope
				});
			},

            ready: function() {
                
                
                function readyHandler() {
                    tinymce.each(tinyMCEPopup.listeners, function (o) {
                        o.func.call(o.scope, tinyMCEPopup.editor);
                    });

                    document.removeEventListener('DOMContentLoaded', readyHandler);

                    tinyMCEPopup.editor.windowManager.setTitle(window, document.title);
                }
            
                document.addEventListener('DOMContentLoaded', readyHandler);
            }
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
            var params = this.editor.windowManager.params;
            var value = params[name];

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
        resizeToInnerSize: function () { },

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
            if (tinymce.isIE) {
                this.editor.selection.moveToBookmark(this.editor.windowManager.bookmark);
            }
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

                wfe = tinymce = tinyMCE = null; // Cleanup
            }
        }
    }

    // execute domready functions
    tinyMCEPopup.onInit.ready();

    window.tinyMCEPopup = tinyMCEPopup;
    window.tinymce = window.tinyMCE = tinymce;

})(window);