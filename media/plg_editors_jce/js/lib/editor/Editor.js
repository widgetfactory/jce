/* global ibis */

var DOM = ibis.DOM;

/**
 * Get the stored editor toggle state (on/off)
 * @param {node} el Textarea element
 * @param {object} settings Editor settings
 * @returns {number} 1 if on, 0 if off
 */
function getEditorState(el, settings) {
    var state;

    if (settings && settings.use_state_cookies !== false) {
        state = ibis.util.Storage.get('wf_editor_state_' + el.id);
    }

    if (state === null || typeof state === "undefined") {
        state = settings && ibis.is(settings.toggle_state) ? settings.toggle_state : 1;
    }

    return parseInt(state, 10);
}

/**
 * Check if the editor is active (not toggled off)
 * @param {node} elm The textarea element
 * @returns {boolean}
 */
function isActive(elm) {
    return DOM.hasClass(elm, 'wf-no-editor') == false;
}

/**
 * Check if an element is hidden
 * @param {string|node} el Element id or node
 * @returns {boolean}
 */
function isHidden(el) {
    if (typeof el === "string") {
        el = document.getElementById(el);
    }

    return el && el.style.display === "none";
}

/**
 * Check if the toggle button is enabled
 * @param {object} settings Editor settings
 * @returns {number} 1 if enabled, 0 if not
 */
function canToggle(settings) {
    return ibis.is(settings.toggle) ? parseInt(settings.toggle, 10) : 0;
}

/**
 * Get the currently active tab name from the editor UI
 * @param {ibis.Editor} ed
 * @returns {string} 'wysiwyg', 'source', or 'preview'
 */
function getActiveTab(ed) {
    var parent = ed.getElement().parentNode,
        activeTab = parent.querySelector('.wf-editor-tabs > button.active');

    if (!activeTab) {
        return 'wysiwyg';
    }

    var ctrl = activeTab.getAttribute('aria-controls');

    if (!ctrl) {
        return 'wysiwyg';
    }

    // strip 'wf-editor-' prefix
    return ctrl.substring(10);
}

/**
 * Get a reference to the active editor or source plugin
 * @param {string|node} el Editor id or textarea element
 * @returns {ibis.Editor|object|false}
 */
function get(el) {
    var ed, win = window;

    if (!win.ibis && window.parent.ibis) {
        win = window.parent;
    }

    if (el) {
        if (typeof el === 'string') {
            el = document.getElementById(el);
        }

        if (el && el.id) {
            ed = win.ibis.get(el.id);
        }
    }

    if (!ed) {
        ed = win.ibis.activeEditor;
    }

    if (!ed || !ed.getElement()) {
        return false;
    }

    // editor toggled off
    if (DOM.hasClass(ed.getElement(), 'wf-no-editor')) {
        return false;
    }

    var tab = getActiveTab(ed);

    if (tab == 'wysiwyg') {
        return ed;
    }

    if (tab == 'source') {
        return ed.plugins.source;
    }

    return false;
}

export default {
    get,
    getEditorState,
    isActive,
    isHidden,
    canToggle,
    getActiveTab
};
