/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */

// Internal unload handler will be called before the page is unloaded
// Needs to be outside the plugin since it would otherwise keep
// a reference to editor in closue scope
/*eslint no-func-assign:0 */

(function (tinymce) {
    var Dispatcher = tinymce.util.Dispatcher, Storage = window.sessionStorage;
    
    if (!Storage) {
        return;
    }
    
    tinymce._beforeUnloadHandler = function () {
        var msg;

        tinymce.each(tinymce.editors, function (editor) {
            // Store a draft for each editor instance
            if (editor.plugins.autosave) {
                editor.plugins.autosave.storeDraft();
            }

            // Setup a return message if the editor is dirty
            if (!msg && editor.isDirty() && editor.getParam("autosave_ask_before_unload", true)) {
                msg = editor.translate("You have unsaved changes are you sure you want to navigate away?");
            }
        });

        return msg;
    };

    tinymce.create('tinymce.plugins.AutosavePlugin', {
        init: function (ed) {
            var self = this, settings = ed.settings, prefix, started;

            /**
             * This event gets fired when a draft is stored to local storage.
             *
             * @event onStoreDraft
             * @param {tinymce.plugins.AutoSave} sender Plugin instance sending the event.
             * @param {Object} draft Draft object containing the HTML contents of the editor.
             */
            self.onStoreDraft = new Dispatcher(self);

            /**
             * This event gets fired when a draft is restored from local storage.
             *
             * @event onStoreDraft
             * @param {tinymce.plugins.AutoSave} sender Plugin instance sending the event.
             * @param {Object} draft Draft object containing the HTML contents of the editor.
             */
            self.onRestoreDraft = new Dispatcher(self);

            /**
             * This event gets fired when a draft removed/expired.
             *
             * @event onRemoveDraft
             * @param {tinymce.plugins.AutoSave} sender Plugin instance sending the event.
             * @param {Object} draft Draft object containing the HTML contents of the editor.
             */
            self.onRemoveDraft = new Dispatcher(self);

            prefix = settings.autosave_prefix || 'tinymce-autosave-{path}{query}-{id}-';
            prefix = prefix.replace(/\{path\}/g, document.location.pathname);
            prefix = prefix.replace(/\{query\}/g, document.location.search);
            prefix = prefix.replace(/\{id\}/g, ed.id);

            function parseTime(time, defaultTime) {
                var multipels = {
                    s: 1000,
                    m: 60000
                };

                time = /^(\d+)([ms]?)$/.exec('' + (time || defaultTime));

                return (time[2] ? multipels[time[2]] : 1) * parseInt(time, 10);
            }

            function hasDraft() {
                var time = parseInt(localStorage.getItem(prefix + "time"), 10) || 0;

                if (new Date().getTime() - time > settings.autosave_retention) {
                    removeDraft(false);
                    return false;
                }

                return true;
            }

            function removeDraft(fire) {
                var content = Storage.getItem(prefix + "draft");

                Storage.removeItem(prefix + "draft");
                Storage.removeItem(prefix + "time");

                // Dispatch remove event if we had any contents
                if (fire !== false && content) {
                    self.onRemoveDraft.dispatch(self, {
                        content: content
                    });
                }
            }

            function storeDraft() {
                if (!isEmpty() && ed.isDirty()) {
                    var content = ed.getContent({format: 'raw', no_events: true});
                    var expires = new Date().getTime();

                    Storage.setItem(prefix + "draft", content);
                    Storage.setItem(prefix + "time", expires);

                    self.onStoreDraft.dispatch(self, {
                        expires: expires,
                        content: content
                    });
                }
            }

            function restoreDraft() {
                if (hasDraft()) {
                    var content = Storage.getItem(prefix + "draft");

                    ed.setContent(content, {format: 'raw'});

                    self.onRestoreDraft.dispatch(self, {
                        content: content
                    });
                }
            }

            function startStoreDraft() {
                if (!started) {
                    setInterval(function () {
                        if (!ed.removed) {
                            storeDraft();
                        }
                    }, settings.autosave_interval);

                    started = true;
                }
            }

            settings.autosave_interval  = parseTime(settings.autosave_interval, '30s');
            settings.autosave_retention = parseTime(settings.autosave_retention, '20m');

            function restoreLastDraft() {
                ed.undoManager.beforeChange();
                restoreDraft();
                removeDraft();
                ed.undoManager.add();
            }

            ed.addButton('autosave', {
                title: "autosave.restore_content",
                onclick: restoreLastDraft
            });

            // Enable/disable restoredraft button depending on if there is a draft stored or not
            ed.onNodeChange.add(function () {
                var controlManager = ed.controlManager;

                if (controlManager.get('autosave')) {
                    controlManager.setDisabled('autosave', !hasDraft());
                }
            });

            ed.onInit.add(function () {
                // Check if the user added the restore button, then setup auto storage logic
                if (ed.controlManager.get('autosave')) {
                    startStoreDraft();
                }
            });

            function isEmpty(html) {
                var forcedRootBlockName = ed.settings.forced_root_block;

                html = tinymce.trim(typeof html == "undefined" ? ed.getBody().innerHTML : html);

                return html === '' || new RegExp(
                        '^<' + forcedRootBlockName + '[^>]*>((\u00a0|&nbsp;|[ \t]|<br[^>]*>)+?|)<\/' + forcedRootBlockName + '>|<br>$', 'i'
                        ).test(html);
            }

            if (ed.settings.autosave_restore_when_empty !== false) {
                ed.onInit.add(function () {
                    if (hasDraft() && isEmpty()) {
                        restoreDraft();
                    }
                });

                ed.onSaveContent.add(function () {
                    removeDraft();
                });
            }
            
            self.storeDraft = storeDraft;

            window.onbeforeunload = tinymce._beforeUnloadHandler;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('autosave', tinymce.plugins.AutosavePlugin);
})(tinymce);