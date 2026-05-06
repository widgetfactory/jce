/* global Joomla, WfEditor, JceDecorator, JoomlaEditor, ibis */

/**
 * Get editor settings from Joomla options storage
 * @param {string} key Settings key
 * @returns {object|null}
 */
function getScriptOptions(key) {
    // Balbooa Gridbox compatibility - for some reason it resets the Joomla object
    if (!Joomla.optionsStorage) {
        Joomla.optionsStorage = {};

        const scripts = document.querySelectorAll('script.joomla-script-options.new');

        if (!scripts) {
            throw new Error('No Joomla options found');
        }

        scripts.forEach(element => {
            const text = element.text || element.textContent;

            try {
                const data = JSON.parse(text);

                if (data) {
                    Joomla.optionsStorage = data;
                }
            } catch (e) {
                // do nothing
            }
        });
    }

    var settings = Joomla.getOptions ? Joomla.getOptions('plg_editor_jce', {}) : (Joomla.optionsStorage.plg_editor_jce || {});

    if (!settings || !settings[key]) {
        return null;
    }

    settings = settings[key];

    if (Array.isArray(settings)) {
        settings = settings[0];
    }

    return settings;
}

/**
 * Get the site url from a base url
 * @param {string} base
 * @returns {string}
 */
function getSite(base) {
    var site, host,
        u = document.location.href;

    if (base.indexOf('http') !== -1) {
        host = base.substring(base.indexOf('://') + 3);
        site = host.substring(host.indexOf('/'));
    } else {
        site = u.substring(0, u.indexOf(base) + base.length);
    }

    if (u.indexOf('/administrator/') !== -1) {
        site = site + 'administrator/';
    }

    return site;
}

/**
 * Handles registration of the editor with Joomla's editor API
 */
var PlatformEditor = {
    register: function (editor) {
        var instance = {
            getValue: function () {
                return WfEditor.getContent(editor.id);
            },
            setValue: function (value) {
                WfEditor.setContent(editor.id, value);
            },
            getSelection: function () {
                return WfEditor.getSelection(editor.id, { format: 'text' });
            },
            replaceSelection: function (value) {
                return WfEditor.insert(editor.id, value);
            },
            // Required by Joomla's API for Mail Component Integration
            disable: function (disabled) {
                return editor.setMode(disabled ? 'readonly' : 'design');
            },
            id: editor.id,
            instance: editor,
            onSave: function () { }
        };

        // Joomla 5+ registration is done via the decorator
        if (typeof JceDecorator !== "undefined") {
            return true;
        }

        if (Joomla.editors) {
            Joomla.editors.instances[editor.id] = instance;
        }
    },

    unregister: function (editor) {
        var elm = editor.getElement();

        // Joomla 5+
        if (typeof JceDecorator !== "undefined") {
            var instance = JoomlaEditor.get(elm.id);

            if (instance && instance instanceof JceDecorator) {
                return JoomlaEditor.unregister(instance);
            }

            return true;
        }

        if (Joomla.editors) {
            delete Joomla.editors.instances[elm.id];
        }
    }
};

// Hikashop compatibility - relies on the removed addScriptDeclaration method
function setupHikashopFix() {
    Joomla.Joomlaibis = {
        setupEditors: function (form) {
            if (!ibis.DOM.get(form)) {
                return;
            }

            var elms = ibis.DOM.select('.wf-editor', form);

            if (!elms.length) {
                return;
            }

            WfEditor.init();
        }
    };
}

/**
 * Bind native DOM events for subform row add/remove/sort
 */
function initSubformEvents() {
    var DOM = ibis.DOM,
        each = ibis.each;

    function removeEditor(el) {
        var ed = ibis.EditorManager.get(el.id);

        if (ed) {
            ed.remove();
            ed.destroy(true);
            PlatformEditor.unregister(ed);
        }
    }

    function createEditor(el) {
        var ed = ibis.EditorManager.get(el.id);

        if (!ed) {
            WfEditor.createInstance(el);
            ed = new ibis.Editor(el.id, ibis.settings);
        }

        ed.render();
    }

    function rebuildEditor(row) {
        var elements = DOM.select('.wf-editor-container > textarea[id]', row);

        each(elements, function (el) {
            removeEditor(el);
            createEditor(el);
        });
    }

    // re-build editors on reinit event
    DOM.bind(document, 'editor-reinit', function (e) {
        var row = e.detail ? e.detail.row : null;

        if (!row) {
            return;
        }

        rebuildEditor(row);
    });

    DOM.bind(document, 'subform-row-add', function (e) {
        var row = e.detail ? e.detail.row : null;

        if (!row) {
            return;
        }

        var elements = DOM.select('.wf-editor', row);

        each(elements, function (el) {
            createEditor(el);
        });
    });

    DOM.bind(document, 'subform-row-remove', function (e) {
        var row = e.detail ? e.detail.row : null;

        if (!row) {
            return;
        }

        var elements = DOM.select('.wf-editor', row);

        each(elements, function (el) {
            removeEditor(el);
        });
    });

    DOM.bind(document, 'sortstop', function (e) {
        var row = e.detail ? e.detail.row : null;

        if (!row) {
            return;
        }

        rebuildEditor(row);
    });

    // use dragend to try and guess when sortable is finished
    DOM.bind(DOM.select('joomla-field-subform.subform-repeatable'), 'dragend', function (e) {
        rebuildEditor(e.target);
    });
}

document.addEventListener('DOMContentLoaded', function handler() {
    WfEditor.init();
    this.removeEventListener('DOMContentLoaded', handler);
    setupHikashopFix();
});

export default {
    getScriptOptions,
    getSite,
    PlatformEditor,
    initSubformEvents
};
