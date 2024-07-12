/* global Joomla, WfEditor, jQuery */

function getOptions(key) {
    // Balbooa Gridbox compatibility - for some reason it resets the Joomla object...
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

    // Get the editor settings from Joomla's options
    var settings = Joomla.getOptions ? Joomla.getOptions('plg_editor_jce', {}) : (Joomla.optionsStorage.plg_editor_jce || {});

    // Check if settings or settings.editor is not defined. Might be a legacy scriptDeclaration init
    if (!settings || !settings[key]) {
        return;
    }

    settings = settings[key];

    // If settings.editor is an array, use the first element
    if (Array.isArray(settings)) {
        settings = settings[0];
    }

    return settings;
}

function init() {
    function removeEditor(el) {
        const ed = tinymce.EditorManager.get(el.id);

        if (ed) {
            ed.remove();
            ed.destroy(true);

            if (Joomla.editors) {
                delete Joomla.editors.instances[el.id];
            }
        }
    }

    function createEditor(el) {
        return WfEditor.create(el);
    }

    function rebuildEditor(row) {
        const elements = row.querySelectorAll('.wf-editor-container > textarea[id]');

        elements.forEach(function (elm) {
            removeEditor(elm);
            createEditor(elm);
        });
    }

    if (window.jQuery) {
        jQuery('div.subform-repeatable').on('subform-row-add', function (event, row) {
            jQuery('.wf-editor', row).each(function (el) {
                createEditor(el);
            });
        }).on('subform-row-remove', function (event, row) {
            jQuery('.wf-editor', row).each(function (el) {
                removeEditor(el);
            });
        });

        // re-build editors on reinit event
        jQuery(document).on('editor-reinit', function (e, row) {
            rebuildEditor(row);
        });

        // re-build editors when a subform is sorted
        jQuery(document).on('sortstop', function (e, ui) {
            if (ui.item[0]) {
                rebuildEditor(ui.item[0]);
            }
        });
    }

    document.addEventListener('subform-row-add', function (e, row) {
        row = e.detail ? e.detail.row : null;

        if (!row) {
            return;
        }

        row.querySelectorAll('.wf-editor').forEach(function (elm) {
            createEditor(elm);
        });
    });

    document.addEventListener('subform-row-remove', function (e, row) {
        row = e.detail ? e.detail.row : null;

        if (!row) {
            return;
        }

        row.querySelectorAll('.wf-editor').forEach(function (elm) {
            removeEditor(elm);
        });
    });

    document.addEventListener('sortstop', function (e, row) {
        row = e.detail ? e.detail.row : null;

        if (!row) {
            return;
        }

        rebuildEditor(row);
    });

    document.addEventListener('sortstop', function (e, row) {
        row = e.detail ? e.detail.row : null;

        if (!row) {
            return;
        }

        rebuildEditor(row);
    });

    // use dragend to try and guess when sortable is finished
    document.querySelectorAll('joomla-field-subform.subform-repeatable').forEach(function (elm) {
        elm.addEventListener('dragend', function (e) {
            rebuildEditor(e.target);
        });
    });

    if (Joomla && Joomla.editors) {
        tinyMCE.onAddEditor.add(function (mgr, ed) {
            const el = ed.getElement();

            if (!el.classList.contains('wf-editor')) {
                return;
            }

            if (Joomla.getOptions) {
                ed.settings = tinymce.extend(ed.settings, Joomla.getOptions('plg_editor_jce', {}));
            }

            Joomla.editors.instances[ed.id] = {
                getValue: function () {
                    return WfEditor.getContent(ed.id);
                },
                setValue: function (value) {
                    WfEditor.insertContent(ed.id, value);
                },
                replaceSelection: function (value) {
                    WfEditor.insertContent(ed.id, value);
                }
            };
        });
    }

    // Get the editor options
    let options = getOptions('editor');

    if (!options) {
        throw new Error('Unable to initialize editor. No settings found');
    }

    options.site_url = getSiteUrl(options.base_url);

    // Initialize the editor
    WfEditor.init(options);

    // this is a bit of a hack for Hikashop, which relies on the removed addScriptDeclaration method to initialize the JCE Editor, but calls the setupEditors method for Tinymce
    Joomla.JoomlaTinyMCE = {
        setupEditors: function (form) {
            if (!form) {
                return;
            }

            var elms = form.querySelectorAll('.wf-editor', form);

            if (!elms.length) {
                return;
            }

            WfEditor.init(options);
        }
    };
}

/**
 * Get the site url from the platform
 * @param {String} Site URL
 */
function getSiteUrl(base) {
    var site, host;
    // get url from browser
    var u = document.location.href;

    // if base is a full url
    if (base.indexOf('http') !== -1) {
        // get the host part of the url eg: www.mysite.com
        host = base.substr(base.indexOf('://') + 3);
        // get the
        site = host.substr(host.indexOf('/'));
    } else {
        site = u.substr(0, u.indexOf(base) + base.length);
    }

    if (u.indexOf('/administrator/') !== -1) {
        site = site + 'administrator/';
    }

    return site;
}

// this is a bit of a hack for Hikashop, which relies on the removed addScriptDeclaration method to initialize the JCE Editor, but calls the setupEditors method for Tinymce
var HikashopFix = function () {
    Joomla.JoomlaTinyMCE = {
        setupEditors: function (form) {
            if (!form || !document.getElementById(form)) {
                return;
            }

            var elms = form.querySelectorAll('.wf-editor');

            if (!elms.length) {
                return;
            }

            WfEditor.init();
        }
    };
};

document.addEventListener('DOMContentLoaded', function handler() {
    init();
    // reset
    this.removeEventListener('DOMContentLoaded', handler);

    HikashopFix();
});